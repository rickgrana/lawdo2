import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup,
    GoogleAuthProvider, signInWithRedirect, getRedirectResult,
    browserSessionPersistence,
    setPersistence,
    User as FirebaseUser,
    authState
} from '@angular/fire/auth';
import { BehaviorSubject, filter, firstValueFrom, from, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { User } from './models/user.model';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private auth = inject(Auth);
  public user$ = new BehaviorSubject<User | null>(null);

  constructor(private userService: UserService, private router: Router) {
    authState(this.auth).subscribe(async user => {
      if (!user) {
        this.user$.next(null);
        console.log('Sem Usuário!');
      } else {
        const usuario = await this.userService.findByEmail(user.email ?? '');
        if (usuario) {
          this.user$.next(usuario);
          console.log('Usuario autenticado::', usuario);
        } else {
          // cria usuario se não existir e redireciona para perfil
          const novoUsuario = await this.userService.create(user.uid, {
            email: user.email,
            nomeCompleto: user.displayName
          });

          this.user$.next(novoUsuario);
          console.log('Usuário criado e autenticadocom sucesso:', novoUsuario);

          this.router.navigate(['perfil'], {
            state: { novoUsuario: true }
          });
        }
      }
    });
  }

  async waitForUser(): Promise<User> {
    return firstValueFrom(this.user$.pipe(
        filter(user => user !== null)
      )
    );
  }

  async login() {
    await setPersistence(this.auth, browserSessionPersistence);
    return from(signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  logout() {
    this.user$.next(null);
    return from(signOut(this.auth));
  }
}
