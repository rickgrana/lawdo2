import { CanDeactivateFn } from '@angular/router';
import { IdentificacaoPage } from '../atendimento/identificacao/identificacao.page';

export const identificacaoDeactivateGuard: CanDeactivateFn<IdentificacaoPage> = (component) =>
  component.confirmLeaveIfDirty();
