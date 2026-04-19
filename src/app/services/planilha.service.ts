import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
      });
  }
}
