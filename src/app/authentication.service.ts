import { inject, Injectable, NgZone } from '@angular/core';
import { Auth, signOut, signInWithPopup,
    GoogleAuthProvider,
    browserSessionPersistence,
    setPersistence,
    authState,
    UserCredential,
    reauthenticateWithPopup,
    OAuthCredential,
} from '@angular/fire/auth';
import { BehaviorSubject, filter, firstValueFrom, from } from 'rxjs';
import { User } from './models/user.model';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';

const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
/** Lista metadados de pastas para o seletor em Configurações (somente metadados, não o conteúdo dos ficheiros). */
const GOOGLE_DRIVE_METADATA_READONLY = 'https://www.googleapis.com/auth/drive.metadata.readonly';

/** OAuth access token é persistido aqui para acompanhar a sessão Firebase (IndexedDB/local). `sessionStorage` não é compartilhado entre abas e some ao fechar a aba, o que forçava um segundo popup embora o utilizador já estivesse autenticado. */
const GOOGLE_AT_KEY = 'lawdo_google_at';
const GOOGLE_AT_EXP_KEY = 'lawdo_google_at_exp';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private auth = inject(Auth);
  private ngZone = inject(NgZone);
  public user$ = new BehaviorSubject<User | null>(null);
  /** false até o primeiro `findByUid` após cada mudança de auth state (evita guard com user$ ainda null). */
  public profileReady$ = new BehaviorSubject(false);

  /** Token OAuth do Google para a API Drive (cache de sessão). */
  private googleAccessToken?: string;
  private googleAccessTokenExpiry = 0;

  /** Provider Google com escopo para criar/ler arquivos criados pelo app no Drive do usuário. */
  private readonly googleDriveProvider = (() => {
    const p = new GoogleAuthProvider();
    p.addScope(GOOGLE_DRIVE_FILE_SCOPE);
    p.addScope(GOOGLE_DRIVE_METADATA_READONLY);
    return p;
  })();

  /** Dispara mensagem única na Conta (perfil) quando o fluxo exige completar cadastro no Firestore. */
  private completarCadastroPrompt = false;

  constructor(private userService: UserService, private router: Router) {
    authState(this.auth).subscribe(async firebaseUser => {
      this.ngZone.run(() => this.profileReady$.next(false));
      try {
        if (!firebaseUser) {
          this.clearGoogleDriveToken();
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
    const uc = await signInWithPopup(this.auth, this.googleDriveProvider);
    this.captureGoogleAccessTokenFromUserCredential(uc);
    return uc;
  }

  /**
   * Token OAuth para chamadas à Google Drive API (upload/download/delete).
   * Renova via popup se expirado ou ausente (ex.: após recarregar a página).
   */
  async getGoogleDriveAccessToken(): Promise<string> {
    this.restoreGoogleDriveTokenFromStorage();
    const bufferMs = 60_000;
    if (this.googleAccessToken && Date.now() < this.googleAccessTokenExpiry - bufferMs) {
      return this.googleAccessToken;
    }
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('É necessário estar logado para usar o Google Drive.');
    }
    /** Provider próprio para não alterar `googleDriveProvider` global e para sugerir a conta já em uso (menos fricção). */
    const driveProvider = new GoogleAuthProvider();
    driveProvider.addScope(GOOGLE_DRIVE_FILE_SCOPE);
    driveProvider.addScope(GOOGLE_DRIVE_METADATA_READONLY);
    const email = user.email;
    if (email) {
      driveProvider.setCustomParameters({ login_hint: email });
    }
    const uc = await reauthenticateWithPopup(user, driveProvider);
    this.captureGoogleAccessTokenFromUserCredential(uc);
    if (!this.googleAccessToken) {
      throw new Error('Permissão do Google Drive não concedida ou token indisponível.');
    }
    return this.googleAccessToken;
  }

  /** Obtém o access token OAuth da resposta Google (várias formas conforme versão do SDK). */
  private captureGoogleAccessTokenFromUserCredential(uc: UserCredential): void {
    const token = this.extractGoogleAccessTokenFromUserCredential(uc);
    if (token) {
      this.persistGoogleAccessToken(token);
    }
  }

  private extractGoogleAccessTokenFromUserCredential(uc: UserCredential): string | undefined {
    const fromProvider = GoogleAuthProvider.credentialFromResult(uc)?.accessToken;
    if (fromProvider) {
      return fromProvider;
    }
    const maybeCred = uc as unknown as { credential?: OAuthCredential | null };
    if (maybeCred.credential?.accessToken) {
      return maybeCred.credential.accessToken;
    }
    const tokenResponse = (uc as unknown as { _tokenResponse?: { oauthAccessToken?: string } })._tokenResponse;
    return tokenResponse?.oauthAccessToken;
  }

  private persistGoogleAccessToken(token: string): void {
    this.googleAccessToken = token;
    // Tokens do Google costumam durar ~1h; margem conservadora em memória.
    this.googleAccessTokenExpiry = Date.now() + 50 * 60 * 1000;
    try {
      localStorage.setItem(GOOGLE_AT_KEY, token);
      localStorage.setItem(GOOGLE_AT_EXP_KEY, String(this.googleAccessTokenExpiry));
      sessionStorage.removeItem(GOOGLE_AT_KEY);
      sessionStorage.removeItem(GOOGLE_AT_EXP_KEY);
    } catch { /* ignore */ }
  }

  private restoreGoogleDriveTokenFromStorage(): void {
    try {
      let t = localStorage.getItem(GOOGLE_AT_KEY);
      let exp = localStorage.getItem(GOOGLE_AT_EXP_KEY);
      if (!t || !exp) {
        const st = sessionStorage.getItem(GOOGLE_AT_KEY);
        const se = sessionStorage.getItem(GOOGLE_AT_EXP_KEY);
        if (st && se) {
          t = st;
          exp = se;
          localStorage.setItem(GOOGLE_AT_KEY, st);
          localStorage.setItem(GOOGLE_AT_EXP_KEY, se);
          sessionStorage.removeItem(GOOGLE_AT_KEY);
          sessionStorage.removeItem(GOOGLE_AT_EXP_KEY);
        }
      }
      if (t && exp && Date.now() < Number(exp) - 60_000) {
        this.googleAccessToken = t;
        this.googleAccessTokenExpiry = Number(exp);
      }
    } catch { /* ignore */ }
  }

  private clearGoogleDriveToken(): void {
    this.googleAccessToken = undefined;
    this.googleAccessTokenExpiry = 0;
    try {
      localStorage.removeItem(GOOGLE_AT_KEY);
      localStorage.removeItem(GOOGLE_AT_EXP_KEY);
      sessionStorage.removeItem(GOOGLE_AT_KEY);
      sessionStorage.removeItem(GOOGLE_AT_EXP_KEY);
    } catch { /* ignore */ }
  }

  /**
   * Remove o access token OAuth do Google em memória e no storage.
   * Use quando a API Drive devolver 401/403 (ex.: token antigo sem o scope de listagem).
   * O próximo `getGoogleDriveAccessToken()` pede novo consentimento.
   */
  invalidateGoogleDriveAccessToken(): void {
    this.clearGoogleDriveToken();
  }

  logout() {
    this.clearGoogleDriveToken();
    this.ngZone.run(() => this.user$.next(null));
    return from(signOut(this.auth));
  }
}
