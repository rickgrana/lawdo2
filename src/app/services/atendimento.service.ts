import { Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Atendimento } from '../models/atendimento.model';
import { Vitima } from '../models/vitima.model';
import { Veiculo } from '../models/veiculo.model';
import { Quesito } from '../models/quesito.model';
import { map } from 'rxjs/operators';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, getDocs, limit, orderBy, query, startAfter, where, doc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { Conclusao } from '../interfaces/conclusao.interface';
import { Observable } from 'rxjs';

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

  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService
  ) {
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
      dtcriacao: Timestamp.now(),
      situacao: Atendimento.SIT_ABERTO
    });
  }

  async updateIdentificacao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const data = new Date(atendimento.fields.data);

    return await updateDoc(atendimentoRef, {
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
      dtupdate: Timestamp.now()
    });
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

    return await updateDoc(atendimentoRef, {
      requisicao: dados,
      dtupdate: Timestamp.now()
    });
  }

  async updateQuesitos(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    let quesitos = atendimento.quesitos.map(q => q.rawData());
    
    return await updateDoc(atendimentoRef, {
      quesitos,
      dtupdate: Timestamp.now()
    });
  }

  async updateLocal(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      local: atendimento.fields.local,
      dtupdate: Timestamp.now()
    });
  }

  async updatePreservacao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      local: atendimento.fields.local,
      equipes: atendimento.fields.equipes,
      presentes: atendimento.fields.presentes
    });
  }

  async updateVitimas(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);

    const vitimas = atendimento.fields.vitimas.map(v => v.rawData());
    
    return await updateDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      vitimas
    });
  }

  async updateConclusao(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      dinamica: atendimento.fields.dinamica,
      conclusao: atendimento.fields.conclusao
    });
  }

  async updateLaudo(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      laudo: atendimento.fields.laudo
    });
  }

  async updateVeiculos(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      veiculos: atendimento.fields.veiculos.map(v => v.rawData())
    });
  }

  async updateImagens(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      dtupdate: Timestamp.now(),
      imagens: atendimento.imagens
    });
  }

  async concluir(atendimento: Atendimento) {
    const atendimentoRef = this.getAtendimentoDoc(atendimento.id);
    
    return await updateDoc(atendimentoRef, {
      situacao: Atendimento.SIT_CONCLUIDO,
      dtconcluido: Timestamp.now()
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

