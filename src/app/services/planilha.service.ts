import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

interface DadosProtocolo {
  data: string | null;
  hora: string | null;
  descricao: string | null;
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
