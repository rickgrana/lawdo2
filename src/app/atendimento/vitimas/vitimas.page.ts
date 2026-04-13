import { Component, OnInit } from '@angular/core';
import { AtendimentoService } from '../../services/atendimento.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular/standalone';
import { Vitima } from 'src/app/models/vitima.model';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonIcon,
    IonRow, IonList, IonCol, IonLabel, IonButton, IonItem, IonBackButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMars, faVenus, faPerson, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { trash } from 'ionicons/icons';

@Component({
  selector: 'app-vitimas',
  templateUrl: './vitimas.page.html',
  styleUrls: ['./vitimas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonList, IonIcon, FontAwesomeModule,
          IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
          IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton
  ]
})
export class VitimasPage implements OnInit {

  faQuestion = faQuestion;
  faMars = faMars;
  faVenus = faVenus;
  faPerson = faPerson;

  constructor(private atendimentoService: AtendimentoService, public alertController: AlertController,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private router: Router) {
      addIcons({trash});
  }

  ngOnInit() {
  }

  get model() {
    return this.atendimentoService.model;
  }

  async abrirVitima(index: any) {

    const vitima = Vitima.loadFrom(this.atendimentoService.model!.fields.vitimas[index]);

    this.atendimentoService.vitima = vitima;
    this.atendimentoService.vitima_selecionada = index;

    this.router.navigate(['atendimento/vitima']);
  }

  adicionarVitima() {

    this.atendimentoService.vitima = new Vitima();
    this.atendimentoService.vitima_selecionada = -1; // nao selecionado

    this.router.navigate(['atendimento/vitima']);
  }

  getSexoIcon(sexo?: string) {
    switch (sexo) {
      case 'M':
        return this.faMars;
      case 'F':
        return this.faVenus;
      default:
        return this.faPerson;
    }
  }

  async removerVitima(event: any, index: number){

    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Atenção!',
      message: 'Deseja realmente remover esta vítima?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        }, {
          text: 'Sim',
          handler: async() => {
            await this.presentLoading();

            this.model!.fields.vitimas.splice(index, 1);
                
            this.atendimentoService.update(this.model!).then(resp => {
              this.hideLoader();
              //this.presentAlertSalvo('Vítima removida com sucesso');
            })
            .catch(error => {
              this.hideLoader();
              this.presentError(error.message);
            });
          }
        }
      ]
    });

    await alert.present();

  }

  async presentError(msg: string) {
    const alert = await this.toastController.create({
      message: msg,
      duration: 2000
    });

    await alert.present();
  }

  async presentLoading(msg: string|null = null) {

    if(msg === null) msg = 'Processando...';

    const loading = await this.loadingController.create({
      message: msg,
      showBackdrop: false
    });
    return await loading.present();
  }

  async hideLoader() {
    setTimeout(async () => {
      await this.loadingController.dismiss();
    }, 500);
  }

  

}
