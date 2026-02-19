import { Component, OnInit } from '@angular/core';
import { OrgaoService } from '../../services/orgao.service';
import { CorporacaoService } from '../../services/corporacao.service';
import { MessageService } from '../../services/message.service';
import { AuthenticationService } from 'src/app/authentication.service';
import { IonGrid, IonCard, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonRow, IonCol, IonLabel, IonMenuButton, IonText, IonItem } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orgao-gerenciar',
  templateUrl: './orgao-gerenciar.page.html',
  styleUrls: ['./orgao-gerenciar.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule,
    IonGrid, IonCard, IonList, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    IonRow, IonCol, IonLabel, IonMenuButton, IonText, IonItem
    ]
})
export class OrgaoGerenciarPage implements OnInit {

  items: any[] = [];
  loading = true;
  corporacao = null;

  constructor(private orgaoService: OrgaoService, 
    private messageService: MessageService,
    private authService: AuthenticationService,
    private corporacaoService: CorporacaoService) { 
      console.log('Orgão Gerenciar Page');
  }

  ngOnInit() {
    this.messageService.presentLoading('Carregando...');

    this.authService.user$.subscribe(async user => {
      if (user && user.fields.corporacao) {
        const corporacao = await this.corporacaoService.read(user.fields.corporacao);
        if (corporacao) {
          this.items = await this.orgaoService.list(corporacao['uf']);
        }
        this.messageService.hideLoader();
      }
    })   
  }

  adicionar() {

  }

  abrir(item: any) {

  }

  remover(id: any) {
    
  }

}
