import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AtendimentoService } from '../services/atendimento.service';

@Injectable({ providedIn: 'root' })
export class AtendimentoGuard implements CanActivate {

  private atendimentoService = inject(AtendimentoService);
  private router = inject(Router);

  canActivate(): boolean {

    if (this.atendimentoService && this.atendimentoService.model) {
      return true;
    }
    
    this.router.createUrlTree(['/home']);
    return false;
  }
}
