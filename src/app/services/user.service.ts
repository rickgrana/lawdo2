import { Injectable } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { doc, getDoc, updateDoc, Timestamp, setDoc } from 'firebase/firestore';
import { docData, Firestore } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) {
  }

  async create(uid: string, data: any) {
    const userRef = doc(this.firestore, 'users', uid);

    const existing = await getDoc(userRef);
    if (existing.exists()) {
      const row = { ...existing.data(), uid: existing.id };
      return User.loadFromDb(userRef, row);
    }

    const userData = {
      uid,
      email: data.email,
      nomeCompleto: data.nomeCompleto,
      dtcriacao: Timestamp.now()
    };

    await setDoc(userRef, userData, { merge: false });

    return User.loadFromDb(userRef, userData);
  }

  getOne(uid: string): Observable<User | null> {
    const ref = doc(this.firestore, 'users', uid);
    return docData(ref, { idField: 'uid' })
      .pipe(
        map(data => data ? User.loadFromDb(ref, data) : null),
        take(1)
      );
  }

  /**
   * Documento em `users/{uid}` é a fonte de verdade (mesmo uid do Firebase Auth).
   * Evita consulta por e-mail + take(1): o primeiro valor da query podia vir vazio e
   * disparar create() com setDoc sem merge, apagando campos já salvos no Firestore.
   */
  async findByUid(uid: string): Promise<User | null> {
    const userRef = doc(this.firestore, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return null;
    }
    const row = { ...snap.data(), uid: snap.id };
    return User.loadFromDb(userRef, row);
  }

  async update(id: string, data: any) {
    const docRef = doc(this.firestore, "users", id);
    return await updateDoc(docRef, data);
      
  }
}

