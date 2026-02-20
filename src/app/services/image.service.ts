import { Injectable } from '@angular/core';
import { Atendimento } from '../models/atendimento.model';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor() { }

  async upload(atendimento_id: string, fileName: string, blobData: Blob) {
    const storage = getStorage();

    const imageRef = ref(storage, `${atendimento_id}/${fileName}`);

    console.log('Salvando', blobData);

    const snapshot = await uploadBytes(imageRef, blobData);

    return snapshot;
  }

  async loadAll(atendimento: Atendimento) {
    const storage = getStorage();

    const promises = atendimento.imagens.map(async (img) => {
      const imageRef = ref(storage, `${atendimento.id}/${img.nome}`);

      const url = await getDownloadURL(imageRef);

      img.imagem = url;
    });

    return Promise.all(promises);
  }

  remover(atendimento_id: string, nome: string){
    const storage = getStorage();

    const imageRef = ref(storage, `${atendimento_id}/${nome}`);

    return deleteObject(imageRef);
  }
}
