import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";


@Injectable({
  providedIn: 'root'
})
export class CorporacaoService {

  constructor(private firestore: Firestore) { }

  getRef() {
    return collection(this.firestore, "corporacoes");
  }

  async list() {

    const q = query(this.getRef(), orderBy('nome', 'asc'));

    const snapshot = await getDocs(q) ;

    return snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
  }

  async read(id: string) {
    const docRef = doc(this.firestore, "corporacoes", id);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  }

}
