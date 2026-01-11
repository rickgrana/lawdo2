import { Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Atendimento } from '../models/atendimento.model';
import { Vitima } from '../models/vitima.model';
import { Veiculo } from '../models/veiculo.model';
import { Quesito } from '../models/quesito.model';
import { map } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, limit, orderBy, query, startAfter, where, doc, addDoc, Timestamp } from 'firebase/firestore';

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

  async create(atendimento: Atendimento) {
  // return this.firestore.collection('atendimentos').add(atendimento.rawData());'
    const atendimentosRef = collection(this.firestore, 'atendimentos');

    return await addDoc(atendimentosRef, {
      perito: atendimento.fields.perito,
      tipoExame: atendimento.fields.tipoExame,
      data: atendimento.fields.data,
      hora: atendimento.fields.hora,
      protocolo: {
        numero: atendimento.fields.protocolo.numero,
        ano: atendimento.fields.protocolo.ano
      },
      cidade: atendimento.fields.endereco.cidade,
      bairro: atendimento.fields.endereco.bairro,
      endereco: atendimento.fields.endereco.logradouro,
      pontoref: atendimento.fields.endereco.pontoref,
      dtcriacao: Timestamp.now(),
      situacao: Atendimento.SIT_ABERTO
    });
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
    //return this.firestore.collection('conclusoes').valueChanges();
  }

}

