import { inject, Injectable } from '@angular/core';
import { Atendimento, imagemEstaNoGoogleDrive, Imagem } from '../models/atendimento.model';
import { AuthenticationService } from '../authentication.service';
import { DEFAULT_DRIVE_IMAGE_FOLDER } from '../models/user.model';
import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private readonly authService = inject(AuthenticationService);

  /** Cache de pastas Drive por sessão (invalidado quando muda o prefixo do token ou a pasta raiz configurada). */
  private folderCacheTokenPrefix = '';
  private rootConfigKeyCached: string | null = null;
  /** Pasta pai onde entram as subpastas `{ano}-{protocolo}` (ID fixo ou pasta criada/resolvida por nome na raiz). */
  private rootParentIdResolved: string | null = null;
  /** Pasta filha de `lawdo`: segmento `ano-protocolo` (ex.: `2026-18888`). */
  private readonly anoProtocoloFolderIds = new Map<string, string>();
  /**
   * Evita criar pastas duplicadas quando vários uploads rodam em paralelo:
   * todos aguardam a mesma promise de listar/criar pasta para o mesmo pai+nome.
   */
  private readonly folderCreationLocks = new Map<string, Promise<string>>();

  constructor() { }

  /** Caminho lógico: `lawdo/{ano-protocolo}/arquivo` — pasta raiz configurável (padrão `lawdo`). */
  async upload(atendimento: Atendimento, fileName: string, blobData: Blob): Promise<{ driveFileId: string }> {
    const token = await this.authService.getGoogleDriveAccessToken();
    this.invalidateFolderCacheIfNeeded(token);

    const anoProtocolo = this.pastaAnoProtocolo(atendimento);
    const parentId = await this.ensureAnoProtocoloFolder(token, anoProtocolo);
    const safeName = fileName.includes('/') ? fileName.replace(/\//g, '-') : fileName;
    const driveName = safeName.toLowerCase().endsWith('.jpg') ? safeName : `${safeName}.jpg`;

    const driveFileId = await this.uploadMultipart(token, parentId, driveName, blobData, 'image/jpeg');
    return { driveFileId };
  }

  /**
   * Salva o laudo (.docx) na mesma pasta do Drive das imagens do atendimento (`…/ano-protocolo/`).
   */
  async uploadLaudoDocx(atendimento: Atendimento, blob: Blob, fileBaseName: string): Promise<{ driveFileId: string }> {
    const token = await this.authService.getGoogleDriveAccessToken();
    this.invalidateFolderCacheIfNeeded(token);

    const anoProtocolo = this.pastaAnoProtocolo(atendimento);
    const parentId = await this.ensureAnoProtocoloFolder(token, anoProtocolo);
    const safeName = fileBaseName.includes('/') ? fileBaseName.replace(/\//g, '-') : fileBaseName;
    const driveName = safeName.toLowerCase().endsWith('.docx') ? safeName : `${safeName}.docx`;
    const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const driveFileId = await this.uploadMultipart(token, parentId, driveName, blob, docxMime);
    return { driveFileId };
  }

  /**
   * Grava ou substitui `{ano-protocolo}.json` na mesma pasta das imagens (`…/ano-protocolo/`).
   */
  async uploadAtendimentoInformacaoTxt(atendimento: Atendimento, textBody: string): Promise<void> {
    const token = await this.authService.getGoogleDriveAccessToken();
    this.invalidateFolderCacheIfNeeded(token);

    const segment = this.pastaAnoProtocolo(atendimento);
    const parentId = await this.ensureAnoProtocoloFolder(token, segment);
    const fileName = `${segment}.json`;
    const safeName = fileName.includes('/') ? fileName.replace(/\//g, '-') : fileName;

    const blob = new Blob([textBody], { type: 'application/json;charset=utf-8' });
    const existingId = await this.findNonFolderFileIdByName(token, parentId, safeName);
    if (existingId) {
      await this.multipartPatchFile(token, existingId, safeName, blob, 'application/json');
    } else {
      await this.uploadMultipart(token, parentId, safeName, blob, 'application/json');
    }
  }

  /**
   * Para cada imagem: com `driveFileId` válido → Google Drive; caso contrário → Firebase Storage (cadastros antigos).
   */
  async loadAll(atendimento: Atendimento): Promise<void> {
    const driveImages = atendimento.imagens.filter(imagemEstaNoGoogleDrive);
    const legacyFirebase = atendimento.imagens.filter((i) => !imagemEstaNoGoogleDrive(i));

    if (driveImages.length) {
      const token = await this.authService.getGoogleDriveAccessToken();
      await Promise.all(
        driveImages.map(async (img) => {
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${img.driveFileId!.trim()}?alt=media`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) {
            throw new Error(`Erro ao baixar imagem do Drive (${res.status}).`);
          }
          const blob = await res.blob();
          img.imagem = URL.createObjectURL(blob);
        })
      );
    }

    if (legacyFirebase.length) {
      const storage = getStorage();
      await Promise.all(
        legacyFirebase.map(async (img) => {
          const imageRef = ref(storage, `${atendimento.id}/${img.nome}`);
          img.imagem = await getDownloadURL(imageRef);
        })
      );
    }
  }

  /** Drive quando `driveFileId` válido; senão Firebase Storage no caminho legado `{atendimentoId}/{nome}`. */
  async remover(imagem: Imagem, atendimentoId?: string): Promise<void> {
    if (imagemEstaNoGoogleDrive(imagem)) {
      const token = await this.authService.getGoogleDriveAccessToken();
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${imagem.driveFileId!.trim()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => '');
        throw new Error(`Erro ao excluir no Drive (${res.status}): ${text}`);
      }
      return;
    }
    if (!atendimentoId) {
      throw new Error('Identificação do atendimento necessária para excluir imagem antiga.');
    }
    const storage = getStorage();
    const imageRef = ref(storage, `${atendimentoId}/${imagem.nome}`);
    return deleteObject(imageRef);
  }

  /**
   * Segundo nível do caminho `lawdo/…`: ano (4 dígitos) + número do protocolo.
   * Ex.: ano 2026 e número 18888 → pasta `2026-18888`.
   * Exposto para alinhar renomeação da pasta no Drive ao salvar identificação.
   */
  buildAnoProtocoloSegment(ano?: string | null, numero?: string | null): string {
    const rawAno = String(ano ?? '').trim();
    const yyyy = /^\d{4}$/.test(rawAno) ? rawAno : new Date().getFullYear().toString();
    let n = String(numero ?? '').trim();
    n = n.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
    if (!n.length) {
      n = 'sem-numero';
    }
    if (n.length > 80) {
      n = n.slice(0, 80);
    }
    return `${yyyy}-${n}`;
  }

  private pastaAnoProtocolo(atendimento: Atendimento): string {
    return this.buildAnoProtocoloSegment(
      atendimento.fields?.protocolo?.ano,
      atendimento.fields?.protocolo?.numero
    );
  }

  /**
   * Pasta em Meu Drive onde ficam as imagens deste atendimento (mesma lógica do upload).
   * Ex.: `Meu Drive / lawdo / 2026-18888`.
   */
  /**
   * Caminho legível até o ficheiro JPG na pasta do atendimento no Drive (`…/lawdo/{ano-protocolo}/{nome}.jpg`).
   * Quando a imagem não está no Drive, devolve `null`.
   */
  buildCaminhoImagemNoDrive(atendimento: Atendimento, imagem: Imagem): string | null {
    if (!imagemEstaNoGoogleDrive(imagem)) {
      return null;
    }
    const pasta = this.getDriveImagesLocationLabel(atendimento);
    const nome = imagem.nome.includes('/') ? imagem.nome.replace(/\//g, '-') : imagem.nome;
    const fileName = nome.toLowerCase().endsWith('.jpg') ? nome : `${nome}.jpg`;
    return `${pasta} / ${fileName}`.replace(/\s*\/\s*/g, '/');
  }

  getDriveImagesLocationLabel(atendimento: Atendimento): string {
    const segment = this.pastaAnoProtocolo(atendimento);
    const u = this.authService.user$.value;
    const raw = u?.config?.driveImageFolder?.trim();
    const base =
      raw && raw.length ? raw : `Meu Drive / ${DEFAULT_DRIVE_IMAGE_FOLDER}`;
    if (base.startsWith('Meu Drive')) {
      return `${base} / ${segment}`;
    }
    return `Meu Drive / ${base} / ${segment}`;
  }

  /**
   * Se existir subpasta com o nome antigo em Meu Drive (pasta raiz configurável), renomeia para o novo segmento.
   * Falhas de rede/permissão são ignoradas (não interrompem o fluxo).
   */
  async renameAnoProtocoloDriveFolderIfExists(oldSegment: string, newSegment: string): Promise<void> {
    const from = oldSegment.trim();
    const to = newSegment.trim();
    if (!from.length || !to.length || from === to) {
      return;
    }
    try {
      const token = await this.authService.getGoogleDriveAccessToken();
      this.invalidateFolderCacheIfNeeded(token);
      const rootId = await this.resolveRootParentId(token);
      const folderId = await this.findFolderIdByName(token, rootId, from);
      if (!folderId) {
        return;
      }
      const patchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: to })
        }
      );
      if (!patchRes.ok) {
        const err = await patchRes.text().catch(() => '');
        console.warn(`Drive (renomear pasta): ${patchRes.status} ${err}`);
        return;
      }
      this.anoProtocoloFolderIds.delete(from);
      this.anoProtocoloFolderIds.set(to, folderId);
    } catch (e) {
      console.warn('Drive (renomear pasta ano-protocolo):', e);
    }
  }

  /**
   * Remove `{jsonSegment}.json` se existir numa subpasta específica (`folderSegment`) dentro da raiz configurada.
   * Usado quando o protocolo/ano muda, para eliminar o snapshot antigo.
   */
  async deleteAtendimentoJsonSnapshotIfExists(jsonSegment: string, folderSegment: string): Promise<void> {
    const nameSeg = String(jsonSegment ?? '').trim();
    const folderSeg = String(folderSegment ?? '').trim();
    if (!nameSeg.length || !folderSeg.length) {
      return;
    }
    try {
      const token = await this.authService.getGoogleDriveAccessToken();
      this.invalidateFolderCacheIfNeeded(token);
      const rootId = await this.resolveRootParentId(token);
      const folderId = await this.findFolderIdByName(token, rootId, folderSeg);
      if (!folderId) {
        return;
      }
      const fileName = `${nameSeg}.json`;
      const fileId = await this.findNonFolderFileIdByName(token, folderId, fileName);
      if (!fileId) {
        return;
      }
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 404) {
        const err = await res.text().catch(() => '');
        console.warn(`Drive (excluir JSON antigo): ${res.status} ${err}`);
      }
    } catch (e) {
      console.warn('Drive (excluir JSON antigo):', e);
    }
  }

  private async findFolderIdByName(token: string, parentId: string, name: string): Promise<string | null> {
    const esc = this.escapeDriveQueryString(name);
    const q = `name='${esc}' and '${parentId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`;
    const listRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!listRes.ok) {
      return null;
    }
    const listJson = await listRes.json() as { files?: { id: string }[] };
    return listJson.files?.[0]?.id ?? null;
  }

  private invalidateFolderCacheIfNeeded(accessToken: string): void {
    const prefix = accessToken.slice(0, 16);
    if (prefix !== this.folderCacheTokenPrefix) {
      this.folderCacheTokenPrefix = prefix;
      this.rootConfigKeyCached = null;
      this.rootParentIdResolved = null;
      this.anoProtocoloFolderIds.clear();
      this.folderCreationLocks.clear();
    }
  }

  /** Chave estável para invalidar cache quando mudar nome ou ID da pasta configurada. */
  private driveRootConfigKey(): string {
    const u = this.authService.user$.value;
    const fid = u?.config?.driveImageFolderId?.trim();
    if (fid) {
      return `id:${fid}`;
    }
    return `name:${this.driveRootFolderName()}`;
  }

  /** Nome da pasta diretamente sob Meu Drive quando não há `driveImageFolderId` (padrão `lawdo`). */
  private driveRootFolderName(): string {
    const u = this.authService.user$.value;
    const raw = u?.config?.driveImageFolder?.trim();
    return raw && raw.length ? raw : DEFAULT_DRIVE_IMAGE_FOLDER;
  }

  private syncRootFolderCache(key: string): void {
    if (this.rootConfigKeyCached !== key) {
      this.rootConfigKeyCached = key;
      this.rootParentIdResolved = null;
      this.anoProtocoloFolderIds.clear();
      this.folderCreationLocks.clear();
    }
  }

  /** Pasta pai das subpastas `{ano}-{protocolo}`: ID configurado ou pasta por nome na raiz. */
  private async resolveRootParentId(token: string): Promise<string> {
    const key = this.driveRootConfigKey();
    this.syncRootFolderCache(key);
    if (this.rootParentIdResolved) {
      return this.rootParentIdResolved;
    }
    const u = this.authService.user$.value;
    const configuredId = u?.config?.driveImageFolderId?.trim();
    if (configuredId) {
      this.rootParentIdResolved = configuredId;
      return configuredId;
    }
    const name = this.driveRootFolderName();
    const id = await this.findOrCreateFolder(token, 'root', name);
    this.rootParentIdResolved = id;
    return id;
  }

  /** Dentro da pasta configurada → subpasta `ano-protocolo`. */
  private async ensureAnoProtocoloFolder(
    token: string,
    anoProtocoloSegment: string
  ): Promise<string> {
    const key = this.driveRootConfigKey();
    this.syncRootFolderCache(key);
    const cached = this.anoProtocoloFolderIds.get(anoProtocoloSegment);
    if (cached) {
      return cached;
    }
    const rootParentId = await this.resolveRootParentId(token);
    const folderId = await this.findOrCreateFolder(token, rootParentId, anoProtocoloSegment);
    this.anoProtocoloFolderIds.set(anoProtocoloSegment, folderId);
    return folderId;
  }

  private escapeDriveQueryString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private async findOrCreateFolder(token: string, parentId: string, name: string): Promise<string> {
    const lockKey = JSON.stringify([parentId, name]);
    let pending = this.folderCreationLocks.get(lockKey);
    if (pending) {
      return pending;
    }
    pending = this.findOrCreateFolderOnce(token, parentId, name).finally(() => {
      if (this.folderCreationLocks.get(lockKey) === pending) {
        this.folderCreationLocks.delete(lockKey);
      }
    });
    this.folderCreationLocks.set(lockKey, pending);
    return pending;
  }

  private async findOrCreateFolderOnce(token: string, parentId: string, name: string): Promise<string> {
    const esc = this.escapeDriveQueryString(name);
    const parentClause = parentId === 'root'
      ? "'root' in parents"
      : `'${parentId}' in parents`;
    const q = `name='${esc}' and ${parentClause} and mimeType='${FOLDER_MIME}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`;
    const listRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!listRes.ok) {
      const err = await listRes.text().catch(() => '');
      throw new Error(`Drive (listar pasta): ${listRes.status} ${err}`);
    }
    const listJson = await listRes.json() as { files?: { id: string }[] };
    const existing = listJson.files?.[0]?.id;
    if (existing) {
      return existing;
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: [parentId]
      })
    });
    if (!createRes.ok) {
      const err = await createRes.text().catch(() => '');
      throw new Error(`Drive (criar pasta): ${createRes.status} ${err}`);
    }
    const created = await createRes.json() as { id: string };
    return created.id;
  }

  private async uploadMultipart(
    token: string,
    parentId: string,
    fileName: string,
    blob: Blob,
    mediaContentType: string
  ): Promise<string> {
    const metadata = { name: fileName, parents: [parentId] };
    const boundary = 'lawdo-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metaPart =
      `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;

    const bodyParts: BlobPart[] = [
      delimiter + metaPart + delimiter + `Content-Type: ${mediaContentType}\r\n\r\n`,
      blob,
      closeDelim
    ];

    const multipartBody = new Blob(bodyParts, {
      type: `multipart/related; boundary=${boundary}`
    });

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: multipartBody
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Drive (upload): ${res.status} ${err}`);
    }
    const data = await res.json() as { id: string };
    return data.id;
  }

  private async findNonFolderFileIdByName(token: string, parentId: string, name: string): Promise<string | null> {
    const esc = this.escapeDriveQueryString(name);
    const q =
      `name='${esc}' and '${parentId}' in parents and mimeType!='${FOLDER_MIME}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`;
    const listRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!listRes.ok) {
      return null;
    }
    const listJson = await listRes.json() as { files?: { id: string }[] };
    return listJson.files?.[0]?.id ?? null;
  }

  private async multipartPatchFile(
    token: string,
    fileId: string,
    fileName: string,
    blob: Blob,
    mediaContentType: string
  ): Promise<void> {
    const metadata = { name: fileName };
    const boundary = 'lawdo-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metaPart =
      `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;

    const bodyParts: BlobPart[] = [
      delimiter + metaPart + delimiter + `Content-Type: ${mediaContentType}\r\n\r\n`,
      blob,
      closeDelim
    ];

    const multipartBody = new Blob(bodyParts, {
      type: `multipart/related; boundary=${boundary}`
    });

    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: multipartBody
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Drive (atualizar TXT): ${res.status} ${err}`);
    }
  }
}
