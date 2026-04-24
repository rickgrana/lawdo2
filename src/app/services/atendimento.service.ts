import { Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Atendimento } from '../models/atendimento.model';
import { Vitima } from '../models/vitima.model';
import { Veiculo } from '../models/veiculo.model';
import { Quesito } from '../models/quesito.model';
import { map } from 'rxjs/operators';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, getDocs, limit, orderBy, query, startAfter, where, doc, addDoc, Timestamp, updateDoc, deleteField } from 'firebase/firestore';
import { ImageService } from './image.service';
import { MapaVisao, parseMapaVisao } from '../atendimento/vitima/mapa/mapa-visao.enum';
import { REGIOES_CABECA_ANTERIOR } from '../const/regioes-cabeca-anterior';
import { REGIOES_CABECA_LATERAL } from '../const/regioes-cabeca-lateral';
import { REGIOES_CORPO_FRENTE } from '../const/regioes-corpo-frente';
import { REGIOES_CORPO_VERSO } from '../const/regioes-corpo-verso';
import { Conclusao } from '../interfaces/conclusao.interface';
import { Observable, Subject } from 'rxjs';
import { PreservacaoService } from './preservacao.service';
import { reverseGeocodeFromNominatim } from '../utils/nominatim-reverse-geocode.util';

@Injectable({
  providedIn: 'root'
})
export class AtendimentoService {

  model?: Atendimento;
  vitima_selecionada = -1;
  vitima?: Vitima;

  veiculo_selecionado = -1;
  veiculo?: Veiculo;

  quesito?: Quesito;

  conclusoes: any[] = [];

  imagem_selecionada = -1;

  /** Emite após “Novo Atendimento” para a página de identificação recriar o FormGroup (inclui navegação para a mesma URL). */
  readonly identificacaoRefresh$ = new Subject<void>();

  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private preservacaoService: PreservacaoService,
    private imageService: ImageService
  ) {
  }

  /**
   * Limpa o atendimento em memória e seleções auxiliares antes de abrir um novo fluxo.
   * Chame antes de navegar para `atendimento/identificacao`.
   */
  prepararNovoAtendimento(): void {
    this.model = undefined;
    this.vitima_selecionada = -1;
    this.vitima = undefined;
    this.veiculo_selecionado = -1;
    this.veiculo = undefined;
    this.quesito = undefined;
    this.conclusoes = [];
    this.imagem_selecionada = -1;
  }

  notificarIdentificacaoRecarregar(): void {
    this.identificacaoRefresh$.next();
  }

  new() {
    this.model = new Atendimento();
    

    return this.model;
  }

  getRef() {
    return collection(this.firestore, "atendimentos");
  }

  getVitima() {
    return this.model!.fields.vitimas[this.vitima_selecionada];
  }

  getVeiculo() {
    return this.model!.fields.veiculos[this.veiculo_selecionado];
  }

  getImagem() {
    if(this.imagem_selecionada >= 0){
      return this.model!.imagens[this.imagem_selecionada];
    }else{
      return null;
    }
  }

  async list(userId: string, last: any = null) {
    let peritoRef = userId;

    const peritoDocRef = doc(this.firestore, "users", userId);

    let q = query(this.getRef(),
      where('perito', '==', peritoDocRef),
      orderBy('data', 'desc'),
      orderBy('hora', 'desc'),
      limit(10)
    );

    if (last) {
      q = query(q, startAfter(last));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      return {
        id: doc.id,
        data: doc.data(),
        doc
      };
    });
  }

  async create(atendimento: Atendimento) {
  // return this.firestore.collection('atendimentos').add(atendimento.rawData());'
    const atendimentosRef = collection(this.firestore, 'atendimentos');

    const data = new Date(atendimento.fields.data);

    const ref = await addDoc(atendimentosRef, {
      perito: atendimento.fields.perito,
      tipoExame: atendimento.fields.tipoExame,
      data: Timestamp.fromDate(data),
      hora: atendimento.fields.hora,
      protocolo: {
        numero: atendimento.fields.protocolo.numero,
        ano: atendimento.fields.protocolo.ano
      },
      endereco: {
        cidade: atendimento.fields.endereco.cidade,
        bairro: atendimento.fields.endereco.bairro,
        logradouro: atendimento.fields.endereco.logradouro,
        pontoref: atendimento.fields.endereco.pontoref
      },
      coordenadas: {
        lat: atendimento.fields.coordenadas.lat,
        long: atendimento.fields.coordenadas.long
      },
      dtcriacao: Timestamp.now(),
      situacao: Atendimento.SIT_ABERTO
    });
    atendimento.id = ref.id;
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return ref;
  }

  async updateIdentificacao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const data = new Date(atendimento.fields.data);

    const out = await this.updateSanitizedDoc(atendimentoRef, {
      tipoExame: atendimento.fields.tipoExame,
      data: Timestamp.fromDate(data),
      hora: atendimento.fields.hora,
      protocolo: {
        numero: atendimento.fields.protocolo.numero,
        ano: atendimento.fields.protocolo.ano
      },
      endereco: {
        cidade: atendimento.fields.endereco.cidade,
        bairro: atendimento.fields.endereco.bairro,
        logradouro: atendimento.fields.endereco.logradouro,
        pontoref: atendimento.fields.endereco.pontoref
      },
      coordenadas: {
        lat: atendimento.fields.coordenadas.lat,
        long: atendimento.fields.coordenadas.long
      },
      dtupdate: Timestamp.now()
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  /** Atualiza `coordenadas` e `dtupdate`; opcionalmente preenche `bairro` e/ou `logradouro` via Nominatim se estiverem vazios. */
  async updateCoordenadas(
    atendimento: Atendimento,
    options?: { preencherEnderecoPorGeocodigoSeVazio?: boolean },
  ) {
    const lat = Number(atendimento.fields.coordenadas.lat);
    const long = Number(atendimento.fields.coordenadas.long);

    const bairroAtual = String(atendimento.fields.endereco.bairro ?? '').trim();
    const logradouroAtual = String(atendimento.fields.endereco.logradouro ?? '').trim();
    const precisaBairro = bairroAtual.length === 0;
    const precisaLogradouro = logradouroAtual.length === 0;

    let enderecoGravar = false;
    if (
      options?.preencherEnderecoPorGeocodigoSeVazio &&
      (precisaBairro || precisaLogradouro) &&
      Number.isFinite(lat) &&
      Number.isFinite(long)
    ) {
      try {
        const parts = await reverseGeocodeFromNominatim(lat, long);
        if (precisaBairro && parts.bairro) {
          atendimento.fields.endereco.bairro = parts.bairro;
          enderecoGravar = true;
        }
        if (precisaLogradouro && parts.logradouro) {
          atendimento.fields.endereco.logradouro = parts.logradouro;
          enderecoGravar = true;
        }
      } catch {
        /* Mantém só as coordenadas se o Nominatim falhar. */
      }
    }

    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    const payload: Record<string, unknown> = {
      coordenadas: {
        lat: atendimento.fields.coordenadas.lat,
        long: atendimento.fields.coordenadas.long,
      },
      dtupdate: Timestamp.now(),
    };

    if (enderecoGravar) {
      payload['endereco'] = {
        cidade: atendimento.fields.endereco.cidade,
        bairro: atendimento.fields.endereco.bairro,
        logradouro: atendimento.fields.endereco.logradouro,
        pontoref: atendimento.fields.endereco.pontoref,
      };
    }

    const out = await this.updateSanitizedDoc(atendimentoRef, payload as any);
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  getAtendimentoDoc(id: string) {
    return doc(this.firestore, 'atendimentos', id);
  }

  async updateRequisicao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const dados = {
      ...atendimento.fields.requisicao,
      recebimento: atendimento.fields.requisicao.recebimento
    };

    const out = await this.updateSanitizedDoc(atendimentoRef, {
      requisicao: dados,
      dtupdate: Timestamp.now()
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updateQuesitos(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    let quesitos = atendimento.quesitos.map(q => q.rawData());
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      quesitos,
      dtupdate: Timestamp.now()
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updateLocal(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      local: atendimento.fields.local,
      dtupdate: Timestamp.now()
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updatePreservacao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      local: atendimento.fields.local,
      equipes: atendimento.fields.equipes,
      presentes: atendimento.fields.presentes
    });
    await this.preservacaoService.mergeCatalogoComPresentes(atendimento.fields.presentes ?? []);
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
  }

  async updateVitimas(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const vitimas = atendimento.fields.vitimas.map(v => v.rawData());
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      vitimas
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updateConclusao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      dinamica: atendimento.fields.dinamica,
      conclusao: atendimento.fields.conclusao
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updateLaudo(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      laudo: atendimento.fields.laudo
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updateVeiculos(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      veiculos: atendimento.fields.veiculos.map(v => v.rawData())
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async updateVestigios(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    const vestigios = atendimento.fields.vestigios.map((vestigio: any) => this.sanitizeForFirestore(vestigio));

    const out = await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      vestigios
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  private async updateSanitizedDoc(atendimentoRef: any, payload: any) {
    return await updateDoc(atendimentoRef, this.sanitizeForFirestore(payload));
  }

  private sanitizeForFirestore(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForFirestore(item));
    }

    if (data !== null && typeof data === 'object') {
      const sanitized: any = {};
      Object.keys(data).forEach((key) => {
        const value = this.sanitizeForFirestore(data[key]);
        if (value !== undefined) {
          sanitized[key] = value;
        }
      });
      return sanitized;
    }

    return data === undefined ? null : data;
  }

  private coerceParaDate(val: unknown): Date | null {
    if (val === null || val === undefined) {
      return null;
    }
    if (typeof val === 'object' && val !== null && Object.keys(val).length === 0) {
      return null;
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val;
    }
    if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as Timestamp).toDate === 'function') {
      try {
        const d = (val as Timestamp).toDate();
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    }
    if (typeof val === 'string' && val.trim()) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  /** Apenas dia (campos tipo “data do exame”). */
  private formatSomenteData(val: unknown): string | undefined {
    const d = this.coerceParaDate(val);
    if (!d) {
      return undefined;
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** Dia e hora (criação / atualização). */
  private formatDataHora(val: unknown): string | undefined {
    const d = this.coerceParaDate(val);
    if (!d) {
      return undefined;
    }
    const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${data} ${hora}`;
  }

  private mapVitimaParaTxt(vitima: Vitima): Record<string, unknown> {
    const raw = vitima.rawData() as Record<string, unknown>;
    const omit = new Set(['condicoes', 'tatuagens', 'tatuagensLista', 'paf_frente', 'paf_costas']);
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) {
      if (omit.has(k)) {
        continue;
      }
      out[k] = raw[k];
    }
    if (Array.isArray(out['vestigios'])) {
      out['vestigios'] = (out['vestigios'] as unknown[]).map((item) => this.mapVestigioParaTxt(item));
    }
    return out;
  }

  private mapVestigioParaTxt(v: unknown): Record<string, unknown> {
    if (v === null || typeof v !== 'object') {
      return {};
    }
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src)) {
      if (key === 'coordenadas') {
        continue;
      }
      out[key] = src[key];
    }
    const regRaw = out['regiao'] ?? out['região'];
    if (regRaw !== undefined && regRaw !== null && String(regRaw).trim() !== '') {
      const visaoRaw = out['visao'];
      out['regiao_nome'] = this.nomeRegiaoComoNaExportacao(visaoRaw, String(regRaw));
    }
    return out;
  }

  /** Mesmo mapeamento textual de região usado na exportação do laudo. */
  private nomeRegiaoComoNaExportacao(visaoRaw: unknown, regiaoRaw: string): string {
    const codigoRegiao = String(regiaoRaw ?? '').trim();
    if (!codigoRegiao.length) {
      return '';
    }
    const visao = parseMapaVisao(String(visaoRaw ?? '').trim());

    if (visao === MapaVisao.CABECA_ANTERIOR) {
      return REGIOES_CABECA_ANTERIOR.get(codigoRegiao) ?? codigoRegiao;
    }

    if (visao === MapaVisao.CABECA_LE) {
      return (
        REGIOES_CABECA_LATERAL.get(codigoRegiao) ??
        REGIOES_CABECA_LATERAL.get(`${codigoRegiao}E`) ??
        codigoRegiao
      );
    }

    if (visao === MapaVisao.CABECA_LD) {
      return (
        REGIOES_CABECA_LATERAL.get(codigoRegiao) ??
        REGIOES_CABECA_LATERAL.get(`${codigoRegiao}D`) ??
        codigoRegiao
      );
    }

    if (visao === MapaVisao.CORPO_VERSO) {
      return REGIOES_CORPO_VERSO.get(codigoRegiao) ?? codigoRegiao;
    }

    // Sem visão explícita, usa a mesma convenção dominante do laudo (corpo frente).
    return REGIOES_CORPO_FRENTE.get(codigoRegiao) ?? codigoRegiao;
  }

  private mapImagensParaTxt(atendimento: Atendimento): Array<{
    legenda: string;
    caminho_google_drive?: string;
    link_download?: string;
  }> {
    return atendimento.imagens.map((imagem) => {
      const caminho = this.imageService.buildCaminhoImagemNoDrive(atendimento, imagem);
      const id = typeof imagem.driveFileId === 'string' ? imagem.driveFileId.trim() : '';
      const row: { legenda: string; caminho_google_drive?: string; link_download?: string } = {
        legenda: imagem.legenda ?? ''
      };
      if (caminho) {
        row.caminho_google_drive = caminho;
      }
      if (id.length) {
        row.link_download = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
      }
      return row;
    });
  }

  private mapRequisicaoParaTxt(req: Atendimento['fields']['requisicao']): Record<string, unknown> {
    const recebimentoFmt = this.formatSomenteData(req?.recebimento as unknown);
    return {
      recebida: req?.recebida,
      numero: req?.numero,
      origem: req?.origem,
      destino: req?.destino,
      delegado: req?.delegado,
      recebimento: recebimentoFmt ?? req?.recebimento,
      ip: req?.ip
    };
  }

  private pruneCamposVazios<T>(value: T): T | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return (trimmed.length ? trimmed : undefined) as T | undefined;
    }
    if (Array.isArray(value)) {
      const arr = value
        .map((item) => this.pruneCamposVazios(item))
        .filter((item) => item !== undefined);
      return (arr.length ? arr : undefined) as T | undefined;
    }
    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const cleaned = this.pruneCamposVazios(v);
        if (cleaned !== undefined) {
          out[k] = cleaned;
        }
      }
      return (Object.keys(out).length ? out : undefined) as T | undefined;
    }
    return value;
  }

  private buildAtendimentoTxtParaDrive(atendimento: Atendimento): string {
    const payload: Record<string, unknown> = {
      data: this.formatSomenteData(atendimento.fields.data),
      hora: atendimento.fields.hora,
      tipoExame: atendimento.fields.tipoExame,
      protocolo: atendimento.fields.protocolo,
      natureza: atendimento.fields.natureza,
      endereco: atendimento.fields.endereco,
      coordenadas: atendimento.fields.coordenadas,
      laudo: {
        numero: atendimento.fields.laudo?.numero,
        ano: atendimento.fields.laudo?.ano,
        data: this.formatSomenteData(atendimento.fields.laudo?.data as unknown)
      },
      possuiRequisicao: atendimento.fields.possuiRequisicao,
      requisicao: this.mapRequisicaoParaTxt(atendimento.fields.requisicao),
      local: atendimento.fields.local,
      presentes: atendimento.fields.presentes,
      conclusao: atendimento.fields.conclusao,
      dinamica: atendimento.fields.dinamica,
      vitimas: atendimento.fields.vitimas.map((v) => this.mapVitimaParaTxt(v)),
      quesitos: atendimento.quesitos.map((q) => q.rawData()),
      vestigios: atendimento.fields.vestigios.map((vest) => this.mapVestigioParaTxt(vest)),
      veiculos: atendimento.fields.veiculos.map((v) => v.rawData()),
      imagens: this.mapImagensParaTxt(atendimento)
    };

    const dc = this.formatDataHora(atendimento.fields.dtcriacao);
    const du = this.formatDataHora(atendimento.fields.dtupdate);
    if (dc !== undefined) {
      payload['data_criacao'] = dc;
    }
    if (du !== undefined) {
      payload['Atualizado_em'] = du;
    }

    const cleaned = this.pruneCamposVazios(payload) ?? {};
    return JSON.stringify(cleaned, null, 2);
  }

  /**
   * Cópia JSON legível em `{ano-protocolo}.txt` na pasta do Drive do atendimento; falhas não impedem o Firestore.
   */
  private async mirrorAtendimentoTxtAoDrive(atendimento: Atendimento): Promise<void> {
    if (!atendimento?.id) {
      return;
    }
    try {
      const text = this.buildAtendimentoTxtParaDrive(atendimento);
      await this.imageService.uploadAtendimentoInformacaoTxt(atendimento, text);
    } catch (e) {
      console.warn('Drive (cópia TXT dos dados do atendimento):', e);
    }
  }

  async updateImagens(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      imagens: atendimento.imagens
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async concluir(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    const out = await this.updateSanitizedDoc(atendimentoRef, {
      situacao: Atendimento.SIT_CONCLUIDO,
      dtconcluido: Timestamp.now()
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async reabrir(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const out = await updateDoc(atendimentoRef, {
      situacao: Atendimento.SIT_ABERTO,
      dtconcluido: deleteField(),
      dtupdate: Timestamp.now()
    });
    await this.mirrorAtendimentoTxtAoDrive(atendimento);
    return out;
  }

  async update(atendimento: Atendimento) {
    //return this.firestore.collection('atendimentos').doc(atendimento.id).update(atendimento.rawData());
  }

  async delete(id: string) {
    //return this.firestore.collection('atendimentos').doc(id).delete();
  }

  async read(id: string) {
    //return this.firestore.collection('atendimentos').doc(id);
  }

  getConclusoes() {
    const conclusoesRef = collection(this.firestore, 'conclusoes');
    return collectionData(conclusoesRef, { idField: 'id' });
  }

  getDinamicas(): Observable<Conclusao[]> {
    const ref = collection(this.firestore, 'dinamicas');

    return collectionData(ref, {
      idField: 'id'
    }) as Observable<Conclusao[]>;
  }

}

