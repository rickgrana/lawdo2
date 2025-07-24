import { Injectable } from '@angular/core';
import { collection, doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';

import { map, tap, first } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) {
  }

  private getRef() {
    return collection(this.firestore, "users");
  }

  async getOne(id: string) {
    const docRef = doc(this.firestore, "users", id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    if (!data) {
      return null;
    }

    return User.loadFromDb(docRef, docSnap.data());
  }

  async update(id: string, data: any) {
    const docRef = doc(this.firestore, "users", id);
    await updateDoc(docRef, data);
  }
}

