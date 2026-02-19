import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class VeiculoService {


  constructor(private firestore: Firestore) { }

  async getData() {
    const docRef = doc(this.firestore, "veiculos", '0');
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  }
}
