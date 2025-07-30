import { MessageService } from './../../services/message.service';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { CorporacaoService } from '../../services/corporacao.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonGrid, IonCard, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonRow, IonCol, IonLabel, IonMenuButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Storage } from '@ionic/storage-angular';


@Component({
  selector: 'app-corporacao-gerenciar',
  templateUrl: './corporacao-gerenciar.page.html',
  styleUrls: ['./corporacao-gerenciar.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule,
    IonGrid, IonCard, IonList, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonRow, IonCol, IonLabel, IonMenuButton
    ]
})
export class CorporacaoGerenciarPage implements OnInit {

  items: any[] = [];

  constructor(private corporacaoService: CorporacaoService,
    private messageService: MessageService,
    private router: Router,
    private storage: Storage) {

  }

  async ngOnInit() {
    await this.storage.create();
    this.messageService.presentLoading('Carregando Corporações').then(async() => {
      this.items = await this.corporacaoService.list();
      this.messageService.hideLoader();
    }).catch((error: any) => {
      this.messageService.hideLoader().then(() => {
        this.messageService.presentErro('Erro ao carregar Corporações');
      });
      throw error;
    })

  }

  unidades(paramCorporacao: any) {

    this.storage.set('corporacao', paramCorporacao).then(() => {
      console.log('salvo corporacao no storage');
      this.router.navigate(['/corporacao/unidades']);
    }).catch((error: any) => {
      console.log('erro ao abrir unidades');
      throw error;
    })

  }


}
