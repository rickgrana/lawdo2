import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Linha SISREX: chaves = textos da primeira linha da planilha (colunas extras incluídas). */
export type SisrexOcorrencia = Record<string, string | null>;

export interface DadosProtocolo {
  fonte?: 'SISREX' | 'REGISTRO';
  sisrex?: SisrexOcorrencia;
  data: string | null;
  hora: string | null;
  descricao: string | null;
  destino?: string | null;
  ip?: string | null;
  vitima?: string | null;
  recebimento?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PlanilhaService {

  private apiUrl =
    'https://buscardadosprotocolo-kyhzxk2loq-uc.a.run.app';

  constructor(private http: HttpClient) {}

  buscarProtocolo(protocolo: string, ano: string): Observable<DadosProtocolo | null> {
    return this.http
      .get<DadosProtocolo>(this.apiUrl, {
        params: { valor: ano + '-' + protocolo }
      })
      .pipe(
        catchError((err: unknown) => {
          const httpErr = err as HttpErrorResponse;
          if (httpErr.status === 404) {
            return of(null);
          }
          const body = httpErr.error as { error?: string } | undefined;
          const apiMsg = body?.error ?? '';
          if (
            httpErr.status === 500 &&
            apiMsg.includes('Protocolo não encontrado')
          ) {
            return of(null);
          }
          return throwError(() => err);
        }),
      );
  }
}
