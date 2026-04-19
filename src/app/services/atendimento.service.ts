import { Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Atendimento } from '../models/atendimento.model';
import { Vitima } from '../models/vitima.model';
import { Veiculo } from '../models/veiculo.model';
import { Quesito } from '../models/quesito.model';
import { map } from 'rxjs/operators';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, getDocs, limit, orderBy, query, startAfter, where, doc, addDoc, Timestamp, updateDoc, deleteField, DocumentReference } from 'firebase/firestore';
import { Conclusao } from '../interfaces/conclusao.interface';
import { Observable, Subject } from 'rxjs';
import { PreservacaoService } from './preservacao.service';

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
    private preservacaoService: PreservacaoService
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
    await this.ensureProtocoloUnico(atendimento);

    const atendimentosRef = collection(this.firestore, 'atendimentos');

    const data = new Date(atendimento.fields.data);

    return await addDoc(atendimentosRef, {
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
  }

  async updateIdentificacao(atendimento: Atendimento) {
    await this.ensureProtocoloUnico(atendimento, atendimento.id);

    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const data = new Date(atendimento.fields.data);

    return await this.updateSanitizedDoc(atendimentoRef, {
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
  }

  getAtendimentoDoc(id: string) {
    return doc(this.firestore, 'atendimentos', id);
  }

  /**
   * Impede dois atendimentos do mesmo perito com o mesmo ano e número de protocolo.
   * @param excludeAtendimentoId ao editar, o próprio documento é ignorado
   */
  private async ensureProtocoloUnico(
    atendimento: Atendimento,
    excludeAtendimentoId?: string
  ): Promise<void> {
    const peritoRef = atendimento.fields.perito as DocumentReference | undefined;
    if (!peritoRef?.path) {
      throw new Error('Perito não definido.');
    }
    const ano = String(atendimento.fields.protocolo?.ano ?? '').trim();
    const numero = String(atendimento.fields.protocolo?.numero ?? '').trim();
    if (!ano || !numero) {
      return;
    }
    const duplicado = await this.existeOutroAtendimentoComProtocolo(
      peritoRef,
      ano,
      numero,
      excludeAtendimentoId
    );
    if (duplicado) {
      throw new Error('Já existe um atendimento com este ano e número de protocolo.');
    }
  }

  private async existeOutroAtendimentoComProtocolo(
    peritoRef: DocumentReference,
    ano: string,
    numero: string,
    excludeAtendimentoId?: string
  ): Promise<boolean> {
    const q = query(
      this.getRef(),
      where('perito', '==', peritoRef),
      where('protocolo.ano', '==', ano),
      where('protocolo.numero', '==', numero),
      limit(8)
    );
    const snap = await getDocs(q);
    return snap.docs.some((d) => d.id !== excludeAtendimentoId);
  }

  async updateRequisicao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const dados = {
      ...atendimento.fields.requisicao,
      recebimento: atendimento.fields.requisicao.recebimento
    };

    return await this.updateSanitizedDoc(atendimentoRef, {
      requisicao: dados,
      dtupdate: Timestamp.now()
    });
  }

  async updateQuesitos(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    let quesitos = atendimento.quesitos.map(q => q.rawData());
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      quesitos,
      dtupdate: Timestamp.now()
    });
  }

  async updateLocal(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      local: atendimento.fields.local,
      dtupdate: Timestamp.now()
    });
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
  }

  async updateVitimas(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const vitimas = atendimento.fields.vitimas.map(v => v.rawData());
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      vitimas
    });
  }

  async updateConclusao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      dinamica: atendimento.fields.dinamica,
      conclusao: atendimento.fields.conclusao
    });
  }

  async updateLaudo(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      laudo: atendimento.fields.laudo
    });
  }

  async updateVeiculos(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      veiculos: atendimento.fields.veiculos.map(v => v.rawData())
    });
  }

  async updateVestigios(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    const vestigios = atendimento.fields.vestigios.map((vestigio: any) => this.sanitizeForFirestore(vestigio));

    return await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      vestigios
    });
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

  async updateImagens(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      imagens: atendimento.imagens
    });
  }

  async concluir(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await this.updateSanitizedDoc(atendimentoRef, {
      situacao: Atendimento.SIT_CONCLUIDO,
      dtconcluido: Timestamp.now()
    });
  }

  async reabrir(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    return await updateDoc(atendimentoRef, {
      situacao: Atendimento.SIT_ABERTO,
      dtconcluido: deleteField(),
      dtupdate: Timestamp.now()
    });
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

