import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})
export class OrgaoService {

  constructor(private firestore: Firestore) { }

  getRef() {
    return collection(this.firestore, "orgaos");
  }

  async list(uf: string) {

    const q = query(this.getRef(),
      where('uf', '==', uf),
      where('status', '==', "2"),
      orderBy('sigla', 'asc')
    );

    const snapshot = await getDocs(q) ;

    return snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
  }

  async read(id: string) {
    const docRef = doc(this.firestore, "orgaos", id);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  }
}
