import { Injectable } from '@angular/core';
import { collection, doc, docData, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';

import { map, tap, first, take } from 'rxjs/operators';
import { User } from '../models/user.model';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) {
  }

  private getRef() {
    return collection(this.firestore, "users");
  }

  getOne(uid: string): Observable<User | null> {
    const ref = doc(this.firestore, 'users', uid);
    return docData(ref, { idField: 'uid' })
      .pipe(
        tap(data => console.log('docData:', data)),
        map(data => data ? User.loadFromDb(ref, data) : null),
        take(1)
      );
  }

  async update(id: string, data: any) {
    const docRef = doc(this.firestore, "users", id);
    await updateDoc(docRef, data);
  }
}

