import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AtendimentoGuard } from './guards/atendimento.guard';
import { atendimentoFormDeactivateGuard } from './guards/atendimento-form-deactivate.guard';
import { identificacaoDeactivateGuard } from './guards/identificacao-deactivate.guard';

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
    path: 'orgao/gerenciar',
    loadComponent: () => import('./orgao/gerenciar/orgao-gerenciar.page').then( m => m.OrgaoGerenciarPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'atendimentos',
    loadComponent: () => import('./atendimento/list/atendimento-list.page').then( m => m.ListAtendimentosPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'atendimento/identificacao',
    loadComponent: () => import('./atendimento/identificacao/identificacao.page').then( m => m.IdentificacaoPage),
    canActivate: [AuthGuard],
    canDeactivate: [identificacaoDeactivateGuard],
  },
  {
    path: 'atendimento/visualizar',
    loadComponent: () => import('./atendimento/visualizar/atendimento-visualizar.page').then( m => m.AtendimentoVisualizarPage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
  {
    path: 'atendimento/requisicao',
    loadComponent: () => import('./atendimento/requisicao/requisicao.page').then( m => m.RequisicaoPage),
    canActivate: [AuthGuard, AtendimentoGuard],
    canDeactivate: [atendimentoFormDeactivateGuard],
  },
  {
    path: 'atendimento/local',
    loadComponent: () => import('./atendimento/local/local.page').then( m => m.LocalPage),
    canActivate: [AuthGuard, AtendimentoGuard],
    canDeactivate: [atendimentoFormDeactivateGuard],
  },
  {
    path: 'atendimento/preservacao',
    loadComponent: () => import('./atendimento/preservacao/preservacao.page').then( m => m.PreservacaoPage),
    canActivate: [AuthGuard, AtendimentoGuard],
    canDeactivate: [atendimentoFormDeactivateGuard],
  },
  {
    path: 'atendimento/vitimas',
    loadComponent: () => import('./atendimento/vitimas/vitimas.page').then( m => m.VitimasPage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
  { 
    path: 'atendimento/vitima',   
    loadComponent: () => import('./atendimento/vitima/vitima.page').then(m => m.VitimaPage),
    canActivate: [AuthGuard, AtendimentoGuard],
    canDeactivate: [atendimentoFormDeactivateGuard],
  },
  {
    path: 'atendimento/vitima/mapa/:visao',
    loadComponent: () => import('./atendimento/vitima/mapa/mapa.page').then((m) => m.MapaPage),
    canActivate: [AuthGuard, AtendimentoGuard],
  },
  {
    path: 'atendimento/conclusao',
    loadComponent: () => import('./atendimento/conclusao/conclusao.page').then(m => m.ConclusaoPage),
    canActivate: [AuthGuard, AtendimentoGuard],
    canDeactivate: [atendimentoFormDeactivateGuard],
  },
  {
    path: 'atendimento/laudo',
    loadComponent: () => import('./atendimento/laudo/laudo.page').then(m => m.LaudoPage),
    canActivate: [AuthGuard, AtendimentoGuard],
    canDeactivate: [atendimentoFormDeactivateGuard],
  },
  {
    path: 'atendimento/veiculos',
    loadComponent: () => import('./atendimento/veiculos/veiculos.page').then( m => m.VeiculosPage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
  {
    path: 'atendimento/veiculo',
    loadComponent: () => import('./atendimento/veiculo/veiculo.page').then( m => m.VeiculoPage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
  {
    path: 'atendimento/vestigios',
    loadComponent: () => import('./atendimento/vestigios/vestigios.page').then( m => m.VestigiosPage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
  {
    path: 'atendimento/vestigios/categoria/:categoriaKey',
    redirectTo: 'atendimento/vestigios',
    pathMatch: 'full',
  },
  {
    path: 'atendimento/imagens',
    loadComponent: () => import('./atendimento/imagens/imagens.page').then( m => m.ImagensPage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
  {
    path: 'atendimento/image',
    loadComponent: () => import('./atendimento/image/image.page').then( m => m.ImagePage),
    canActivate: [AuthGuard, AtendimentoGuard]
  },
];
