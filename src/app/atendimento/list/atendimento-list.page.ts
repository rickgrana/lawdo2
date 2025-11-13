import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { Atendimento } from '../../models/atendimento.model';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonGrid, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonRow, IonCol, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonIcon, IonButton, IonItem } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from 'src/app/authentication.service';
import { AtendimentoService } from 'src/app/services/atendimento.service';
import { DatePipe } from '@angular/common';
import { arrowBack, list, addCircle, calendarOutline, timeOutline, body, alertCircleOutline, star, skullOutline, skull } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { BaseData } from 'src/app/interfaces/base-data.interface';

//import { SearchPage } from '../search/search.page';

@Component({
  selector: 'app-atendimentos',
  templateUrl: './atendimento-list.page.html',
  styleUrls: ['./atendimento-list.page.scss'],
  standalone: true,
  imports: [IonItem, IonButton, ReactiveFormsModule,
    IonGrid, IonList, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    IonRow, IonCol, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonIcon,
    DatePipe, CommonModule
    ]
})
export class ListAtendimentosPage implements OnInit {
  items: any[] = [];
  ultimo: any = null;
  connectedRef: any;
  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;

  constructor(private router: Router,
    private atendimentoService: AtendimentoService,
    private messageService: MessageService,
    //private modalController: ModalController,
    private authService: AuthenticationService) {

    this.ultimo = null;

    addIcons({arrowBack,addCircle,calendarOutline,timeOutline,body,alertCircleOutline,star,list, skull, skullOutline});
  }

  async ngOnInit() {
    this.carregar();
  }

  async carregar(){
    try{
      this.messageService.presentLoading('Carregando Dados...');

      const lista: any[] = await this.atendimentoService.list(this.ultimo);

      lista.forEach((item: BaseData) => {
        if (item) {
          this.items.push(Atendimento.loadFromDoc(item));
        }
        this.ultimo = item.doc;
      });

      this.messageService.hideLoader();

    } catch(error: any){
      this.messageService.hideLoader().then(() => {
        this.messageService.presentErro(error.message);
      });
    }

  }

  loadData(event: any) {
    setTimeout(() => {

      console.log('Load Data');

      event.target.complete();

      this.carregar();

    }, 500);
  }



  async abrir(atendimento: Atendimento) {

    this.atendimentoService.model = atendimento;

    this.router.navigate(['atendimento/visualizar']);
  }

  novo() {

    this.atendimentoService.model = new Atendimento();
    this.atendimentoService.model.isNew = true;

    this.router.navigate(['atendimento/identificacao']);
  }

  /*async openSearch() {
    const modal = await this.modalController.create({
      component: SearchPage
    });

    return await modal.present();
  }*/

}
