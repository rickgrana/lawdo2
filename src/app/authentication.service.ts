import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup,
    GoogleAuthProvider, signInWithRedirect, getRedirectResult,
    browserSessionPersistence,
    setPersistence,
    User as FirebaseUser
} from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { User } from './models/user.model';
import { UserService } from './services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private auth = inject(Auth);
  public user: User | null = null;

  constructor(private userService: UserService) {
    this.auth.onAuthStateChanged((user: any) => {
      console.log('User logged in:', user);
      this.changeUser(user);
    });
  }

  async login() {
    await setPersistence(this.auth, browserSessionPersistence);
    return from(signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  logout() {
    return from(signOut(this.auth));
  }

  // Obter usuário autenticado
  /*getUser(): Observable<User | null> {
    return new Observable((observer) => {
      this.auth.onAuthStateChanged(user => observer.next(user));
    });
  }*/

  /*getRedirectResult(): Observable<User | null> {
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
  }*/

  async changeUser(firebaseUser: FirebaseUser | null) {

    this.user = null;

    if(firebaseUser){
      this.user = await this.userService.getOne(firebaseUser.uid);
    }

    return null;
  }
}
