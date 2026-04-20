import { inject, Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication.service';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

@Injectable({
  providedIn: 'root',
})
export class DriveFolderBrowserService {
  private readonly auth = inject(AuthenticationService);

  /**
   * Pastas filhas diretas de `parentId` (`'root'` = Meu Drive). Ordenadas por nome (client-side).
   * Em 401/403 invalida o token OAuth e tenta uma vez de novo (tokens antigos podem não incluir o scope de metadados).
   */
  async listChildFolders(parentId: string): Promise<{ id: string; name: string }[]> {
    return this.listChildFoldersInner(parentId, true, true);
  }

  private async listChildFoldersInner(
    parentId: string,
    allowAuthRetry: boolean,
    preferAllDrives: boolean
  ): Promise<{ id: string; name: string }[]> {
    const token = await this.auth.getGoogleDriveAccessToken();
    const parentClause =
      parentId === 'root' ? "'root' in parents" : `'${parentId}' in parents`;
    const q = `${parentClause} and mimeType='${FOLDER_MIME}' and trashed=false`;
    const out: { id: string; name: string }[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q,
        fields: 'nextPageToken, files(id, name)',
        spaces: 'drive',
        pageSize: '200',
      });
      if (preferAllDrives) {
        params.set('includeItemsFromAllDrives', 'true');
        params.set('supportsAllDrives', 'true');
      }
      if (pageToken) {
        params.set('pageToken', pageToken);
      }
      const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if ((res.status === 401 || res.status === 403) && allowAuthRetry) {
        this.auth.invalidateGoogleDriveAccessToken();
        return this.listChildFoldersInner(parentId, false, preferAllDrives);
      }

      if (!res.ok) {
        if (res.status === 400 && preferAllDrives) {
          return this.listChildFoldersInner(parentId, allowAuthRetry, false);
        }
        const err = await res.text().catch(() => '');
        throw new Error(`Drive (listar pastas): ${res.status} ${err}`);
      }
      const data = (await res.json()) as {
        nextPageToken?: string;
        files?: { id: string; name: string }[];
      };
      for (const f of data.files ?? []) {
        if (f.id && f.name) {
          out.push({ id: f.id, name: f.name });
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    out.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    return out;
  }
}
