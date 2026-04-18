import { CanDeactivateFn } from '@angular/router';
import { AtendimentoBasePage } from '../atendimento/atendimento-base.page';

export const atendimentoFormDeactivateGuard: CanDeactivateFn<AtendimentoBasePage> = (component) =>
  component.confirmLeaveIfDirty();
