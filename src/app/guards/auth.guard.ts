import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, combineLatest, filter, map, take } from 'rxjs';
import { AuthenticationService } from '../authentication.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  private router = inject(Router);

  public constructor(private authService: AuthenticationService) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return combineLatest([
      this.authService.user$,
      this.authService.profileReady$
    ]).pipe(
      filter(([, ready]) => ready),
      take(1),
      map(([user]) => {
        if (!user) {
          return this.router.createUrlTree(['/home']);
        }
        if (user.pendingRegistration && route.routeConfig?.path !== 'perfil') {
          this.authService.markCompletarCadastroPrompt();
          return this.router.createUrlTree(['/perfil']);
        }
        return true;
      })
    );
  }
}
