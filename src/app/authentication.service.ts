import { inject, Injectable, NgZone } from '@angular/core';
import { Auth, signOut, signInWithPopup,
    GoogleAuthProvider,
    browserSessionPersistence,
    setPersistence,
    authState,
    UserCredential,
} from '@angular/fire/auth';
import { BehaviorSubject, filter, firstValueFrom, from } from 'rxjs';
import { User } from './models/user.model';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private auth = inject(Auth);
  private ngZone = inject(NgZone);
  public user$ = new BehaviorSubject<User | null>(null);
  /** false até o primeiro `findByUid` após cada mudança de auth state (evita guard com user$ ainda null). */
  public profileReady$ = new BehaviorSubject(false);

  /** Dispara mensagem única na Conta (perfil) quando o fluxo exige completar cadastro no Firestore. */
  private completarCadastroPrompt = false;

  constructor(private userService: UserService, private router: Router) {
    authState(this.auth).subscribe(async firebaseUser => {
      this.ngZone.run(() => this.profileReady$.next(false));
      try {
        if (!firebaseUser) {
          this.ngZone.run(() => this.user$.next(null));
          console.log('Sem Usuário!');
          return;
        }

        const usuario = await this.userService.findByUid(firebaseUser.uid);

        if (usuario) {
          this.ngZone.run(() => this.user$.next(usuario));
          console.log('Usuario autenticado::', usuario);
          return;
        }

        await this.ngZone.run(async () => {
          const pendente = User.fromPendingAuth(firebaseUser);
          this.user$.next(pendente);
          console.log('Usuário autenticado sem cadastro Firestore — redirecionar para Conta');

          this.completarCadastroPrompt = true;
          const path = this.router.url.split(/[?#]/)[0];
          const jaNaConta = path === '/perfil' || path.endsWith('/perfil');
          if (!jaNaConta) {
            await this.router.navigate(['/perfil'], { replaceUrl: true });
          }
        });
      } catch (err) {
        console.error('Erro ao resolver perfil após login:', err);
        this.ngZone.run(() => this.user$.next(null));
      } finally {
        this.ngZone.run(() => this.profileReady$.next(true));
      }
    });
  }

  /** True uma vez — usado pela página Conta para o alerta de boas-vindas. */
  consumeCompletarCadastroPrompt(): boolean {
    const show = this.completarCadastroPrompt;
    this.completarCadastroPrompt = false;
    return show;
  }

  /** Quando uma rota protegida envia quem ainda não tem cadastro na collection `users`. */
  markCompletarCadastroPrompt(): void {
    this.completarCadastroPrompt = true;
  }

  async waitForUser(): Promise<User> {
    return firstValueFrom(this.user$.pipe(
        filter(user => user !== null)
      )
    );
  }

  /** Promise com credencial — evita retornar Observable dentro de método async. */
  async login(): Promise<UserCredential> {
    await setPersistence(this.auth, browserSessionPersistence);
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    this.ngZone.run(() => this.user$.next(null));
    return from(signOut(this.auth));
  }
}
