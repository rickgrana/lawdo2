import { ListAtendimentosPage } from './atendimento/list/atendimento-list.page';
import { CorporacaoGerenciarPage } from './corporacao/gerenciar/corporacao-gerenciar.page';
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'folder',
    redirectTo: 'folder/inbox',
    pathMatch: 'full',
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then( m => m.HomePage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil.page').then( m => m.PerfilPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'corporacao/gerenciar',
    loadComponent: () => import('./corporacao/gerenciar/corporacao-gerenciar.page').then( m => m.CorporacaoGerenciarPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'atendimentos',
    loadComponent: () => import('./atendimento/list/atendimento-list.page').then( m => m.ListAtendimentosPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'atendimento/identificacao',
    loadComponent: () => import('./atendimento/identificacao/identificacao.page').then( m => m.IdentificacaoPage)
  },
];
