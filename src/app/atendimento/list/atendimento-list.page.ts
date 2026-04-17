import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { Atendimento } from '../../models/atendimento.model';
import { CommonModule } from '@angular/common';
import { IonGrid, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonRow, IonCol, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonIcon, IonButton, IonItem } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from 'src/app/authentication.service';
import { AtendimentoService } from 'src/app/services/atendimento.service';
import { DatePipe } from '@angular/common';
import { arrowBack, list, addCircle, calendarOutline, timeOutline, body, alertCircleOutline, star, skullOutline, skull } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { BaseData } from 'src/app/interfaces/base-data.interface';
import { Auth } from '@angular/fire/auth';
import { filter } from 'rxjs/operators';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-atendimentos',
  templateUrl: './atendimento-list.page.html',
  styleUrls: ['./atendimento-list.page.scss'],
  standalone: true,
  imports: [IonItem, IonButton, ReactiveFormsModule,
    IonGrid, IonList, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    IonRow, IonCol, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonIcon, IonBackButton,
    DatePipe, CommonModule
    ]
})
export class ListAtendimentosPage implements OnInit {
  items: any[] = [];
  /** Evita flash da mensagem de lista vazia antes da primeira resposta da API */
  primeiraCargaCompleta = false;
  ultimo: any = null;
  connectedRef: any;
  user: User | null = null;
  private auth = inject(Auth);
  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;

  constructor(private router: Router,
    private atendimentoService: AtendimentoService,
    private messageService: MessageService,
    private authService: AuthenticationService) {

    this.ultimo = null;

    addIcons({arrowBack,addCircle,calendarOutline,timeOutline,body,alertCircleOutline,star,list, skull, skullOutline});
  }

  async ngOnInit() {
    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.carregar(user.uid);
    });
  }

  async carregar(userId: string){
    try{
      this.messageService.presentLoading('Carregando Dados...');

      const lista: any[] = await this.atendimentoService.list(userId, this.ultimo);

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
    } finally {
      this.primeiraCargaCompleta = true;
    }
  }

  loadData(event: any) {
    setTimeout(() => {
      event.target.complete();

      if (this.user) {
        this.carregar(this.user.uid);
      }

    }, 500);
  }

  async abrir(atendimento: Atendimento) {
    this.atendimentoService.model = atendimento;
    console.log(atendimento);
    this.router.navigate(['atendimento/visualizar']);
  }

  novo() {
    this.atendimentoService.model = new Atendimento();
    this.router.navigate(['atendimento/identificacao']);
  }

  /*async openSearch() {
    const modal = await this.modalController.create({
      component: SearchPage
    });

    return await modal.present();
  }*/

}
