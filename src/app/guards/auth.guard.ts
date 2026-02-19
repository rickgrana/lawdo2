import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { AuthenticationService } from '../authentication.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  private auth = inject(Auth);
  private router = inject(Router);

  public constructor(private authService: AuthenticationService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      map(user => {
        if (user) {
          return true;
        }
        return this.router.createUrlTree(['/home']);
      })
    );
  }
}
