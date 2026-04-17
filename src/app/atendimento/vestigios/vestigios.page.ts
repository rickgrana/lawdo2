import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonBadge, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoService } from '../../services/atendimento.service';
import { Router } from '@angular/router';
import { chevronForward } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CATEGORIAS_VESTIGIOS, resolveCategoriaKey } from './vestigios.data';

@Component({
  selector: 'app-vestigios',
  templateUrl: './vestigios.page.html',
  styleUrls: ['./vestigios.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonBadge, IonIcon]
})
export class VestigiosPage {
  categorias = CATEGORIAS_VESTIGIOS;

  constructor(private atendimentoService: AtendimentoService, private router: Router) {
    addIcons({ chevronForward });
  }

  get vestigios(): any[] {
    return this.atendimentoService.model?.fields?.vestigios ?? [];
  }

  abrirCategoria(categoriaKey: string) {
    this.router.navigate(['atendimento/vestigios/categoria', categoriaKey]);
  }

  getContadorCategoria(categoriaKey: string): number {
    return this.vestigios.filter((v) => resolveCategoriaKey(v) === categoriaKey).length;
  }
}
