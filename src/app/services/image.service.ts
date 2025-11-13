import { Injectable } from '@angular/core';
import { Atendimento } from '../models/atendimento.model';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor() { }

  async upload(atendimento_id: string, fileName: string, blobData: any){

      /*let storageRef = firebase.storage().ref();

      let ocorrenciaRef = storageRef.child(atendimento_id);

      let imageRef = ocorrenciaRef.child(fileName);

      console.log('Salvando', blobData);

      return imageRef.put(blobData);*/
  }

  async loadAll(atendimento: Atendimento){

      /*let storageRef = firebase.storage().ref();

      let ocorrenciaRef = storageRef.child(atendimento.id);

      let promises = [];

      for(const index in atendimento.imagens){

        let promise = ocorrenciaRef.child(atendimento.imagens[index].nome).getDownloadURL().then(async(url) => {
          atendimento.imagens[index].imagem = url;
        });

        promises.push(promise);

      }

      return Promise.all(promises);*/
  }

  remover(atendimento_id: string, nome: string){
    /*let storageRef = firebase.storage().ref();

    let ocorrenciaRef = storageRef.child(atendimento_id);

    let imageRef = ocorrenciaRef.child(nome);


    return imageRef.delete();*/
  }
}
