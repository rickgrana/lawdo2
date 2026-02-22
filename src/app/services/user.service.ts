import { Injectable } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Observable, firstValueFrom } from 'rxjs';
import { collection, doc, addDoc, updateDoc, Timestamp, where, query, setDoc } from 'firebase/firestore';
import { collectionData, docData, Firestore } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) {
  }

  async create(uid: string, data: any) {
    const userRef = doc(this.firestore, 'users', uid);

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

  async findByEmail(email: string): Promise<User | null> {
    const ref = collection(this.firestore, 'users');
    const q = query(ref, where('email', '==', email));
    return await firstValueFrom(
      collectionData(q, { idField: 'uid' })
        .pipe(
          take(1),
          map((data: any[]) => {
            if (!data || data.length === 0) {
              return null;
            }
            return User.loadFromDb(ref, data[0]);
          })
        )
      );
  }

  async update(id: string, data: any) {
    const docRef = doc(this.firestore, "users", id);
    return await updateDoc(docRef, data);
      
  }
}

