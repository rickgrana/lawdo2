import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, signInWithPopup,
    GoogleAuthProvider, signInWithRedirect, getRedirectResult,
    browserSessionPersistence,
    setPersistence} from '@angular/fire/auth';
import { from, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private auth = inject(Auth);

  constructor() { }

  async login() {
    await setPersistence(this.auth, browserSessionPersistence);
    return from(signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  logout() {
    return from(signOut(this.auth));
  }

  // Obter usuário autenticado
  getUser(): Observable<User | null> {
    return new Observable((observer) => {
      this.auth.onAuthStateChanged(user => observer.next(user));
    });
  }

  getRedirectResult(): Observable<User | null> {
    return new Observable((observer) => {
      getRedirectResult(this.auth)
        .then(result => {
          console.log(result);
          if (result?.user) {
            observer.next(result.user);
          } else {
            observer.next(null);
          }
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
