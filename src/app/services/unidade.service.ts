import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UnidadeService {

constructor(private firestore: Firestore) { }

  getRef() {
    return collection(this.firestore, "unidades");
  }

  async list(idCorporacao: string) {

    const q = query(this.getRef(), where('corporacao', '==', idCorporacao), orderBy('sigla', 'asc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
  }

  async read(id: string) {
    const docRef = doc(this.firestore, "unidades", id);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  }
}
