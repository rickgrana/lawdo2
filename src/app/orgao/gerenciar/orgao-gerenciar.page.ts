import { Component, OnInit } from '@angular/core';
import { OrgaoService } from '../../services/orgao.service';
import { CorporacaoService } from '../../services/corporacao.service';
import { MessageService } from '../../services/message.service';
import { AuthenticationService } from 'src/app/authentication.service';
import { IonGrid, IonCard, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonRow, IonCol, IonLabel, IonMenuButton, IonText, IonItem } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

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
  corporacao?: any = null;

  constructor(private orgaoService: OrgaoService, 
    private messageService: MessageService,
    private authService: AuthenticationService,
    private corporacaoService: CorporacaoService) { 
      console.log('Orgão Gerenciar Page');
  }

  async ngOnInit() {
    await this.messageService.presentLoading('Carregando...');

    this.authService.user$.pipe(
        filter(user => !!user)
      ).subscribe(async (user: any) => {
        await this.messageService.hideLoader();
        if (user && user.fields.corporacao) {
          this.corporacao = await this.corporacaoService.read(user.fields.corporacao);
          if (this.corporacao) {
            this.items = await this.orgaoService.list(this.corporacao['uf']);
          }
        } else {
          this.corporacao = null;
          this.items = [];
        }
    });   
  }

  adicionar() {

  }

  abrir(item: any) {

  }

  remover(id: any) {
    
  }

}
