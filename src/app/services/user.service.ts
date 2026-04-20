import { Injectable } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { deleteField, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
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

    const userData: Record<string, unknown> = {
      uid,
      email: data.email,
      nomeCompleto: data.nomeCompleto,
      dtcriacao: Timestamp.now()
    };
    const profileKeys = ['sexo', 'matricula', 'corporacao', 'unidade', 'superior'] as const;
    for (const key of profileKeys) {
      const v = data[key];
      if (v != null && v !== '') {
        userData[key] = v;
      }
    }

    // merge: true evita corrida com outro login/create ou com update de perfil no meio do
    // getDoc → setDoc: setDoc sem merge substituía o documento inteiro e apagava campos já salvos.
    await setDoc(userRef, userData, { merge: true });

    const created = await getDoc(userRef);
    const row = { ...created.data()!, uid: created.id };
    return User.loadFromDb(userRef, row);
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

  /**
   * Atualiza preferência de pasta de imagens no Drive sem substituir o mapa `config` inteiro
   * (preserva outras chaves). Remove `driveImageFolderId` no Firestore quando `folderId` é null.
   */
  async updateDriveImageFolderPreference(
    uid: string,
    folderName: string,
    folderId: string | null
  ): Promise<void> {
    const docRef = doc(this.firestore, 'users', uid);
    const id = folderId?.trim();
    await updateDoc(docRef, {
      'config.driveImageFolder': folderName,
      'config.driveImageFolderId': id ? id : deleteField(),
    });
  }
}

