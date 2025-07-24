import { inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(Auth);
  constructor() {}

  canActivate(): boolean {
    return this.auth.currentUser !== null;
  }

}
