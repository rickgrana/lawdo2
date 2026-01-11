import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup,
    GoogleAuthProvider, signInWithRedirect, getRedirectResult,
    browserSessionPersistence,
    setPersistence,
    User as FirebaseUser,
    authState
} from '@angular/fire/auth';
import { BehaviorSubject, from, Observable, switchMap } from 'rxjs';
import { User } from './models/user.model';
import { UserService } from './services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private auth = inject(Auth);
  // public user: User | null = null;
  private _user$ = new BehaviorSubject<User | null>(null);

  user$ = this._user$.asObservable();

  /*constructor(private userService: UserService) {
    this.auth.onAuthStateChanged((user: any) => {
      console.log('User logged in:', user);
      this.changeUser(user);
    });
  }*/

  constructor(private userService: UserService) {
    authState(this.auth).pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) {
          this._user$.next(null);
          return [];
        }
        return this.userService.getOne(firebaseUser.uid);
      })
    ).subscribe(user => {
      this._user$.next(user);
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

  /*async changeUser(firebaseUser: FirebaseUser | null) {

    this.user = null;

    if(firebaseUser){
      this.user = await this.userService.getOne(firebaseUser.uid);
    }

    return null;
  }*/
}
