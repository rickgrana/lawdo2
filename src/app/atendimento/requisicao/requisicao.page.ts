import { Component, OnInit } from '@angular/core';
import { AtendimentoService } from '../../services/atendimento.service';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Atendimento } from '../../models/atendimento.model';
import { Quesito } from 'src/app/models/quesito.model';
import { CommonModule } from '@angular/common';
import { IonGrid, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonFooter,
    IonRow, IonCol, IonLabel, IonIcon, IonButton, IonItem,
    IonDatetime, IonModal, IonInput, ModalController ,
  IonDatetimeButton } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { AuthenticationService } from 'src/app/authentication.service';
import { User } from 'src/app/models/user.model';
import { QuesitoPage } from '../quesito/quesito.page';

@Component({
  selector: 'app-requisicao',
  templateUrl: './requisicao.page.html',
  styleUrls: ['./requisicao.page.scss'],
  standalone: true,
  imports: [IonItem, IonButton, ReactiveFormsModule, IonFooter, IonInput,
    IonGrid, IonList, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    IonRow, IonCol, IonLabel, IonIcon, IonBackButton,
    CommonModule, IonDatetimeButton, IonDatetime, IonModal
  ]
})
export class RequisicaoPage implements OnInit {

  user?: User;
  form!: FormGroup;

  constructor(
    private authService: AuthenticationService,
    private atendimentoService: AtendimentoService,
    private formBuilder: FormBuilder,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private router: Router) { 
  }

  ngOnInit() {
    this.loadForm();

    if(this.model == null){
      this.router.navigate(['/']);
    }

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.loadForm();
    });
  }

  get model() {
    return this.atendimentoService.model;
  }

  loadForm() {

    let dtRecebimento = new Date().toISOString();

    this.form = this.formBuilder.group({
      requisicaoNumero: new FormControl<string>(this.model!.fields.requisicao.numero, Validators.required),
      dipOrigem: new FormControl<string>(this.model!.fields.requisicao.origem, Validators.required),
      delegado: new FormControl<string>(this.model!.fields.requisicao.delegado ?? ''),
      dtRecebimento: new FormControl<string>(this.model!.fields.requisicao.recebimento.length ? this.model!.fields.requisicao.recebimento : dtRecebimento),
      ip: new FormControl<string>(this.model!.fields.requisicao.ip ?? ''),
      dipDestino: new FormControl<string>(this.model!.fields.requisicao.destino ?? ''),
    });

    if(this.model!.isConcluido() || this.model!.isArquivado()){
      this.form.disable();
    }
  }

  async salvar(record: any) {
    this.model!.fields.requisicao.numero = record.requisicaoNumero;
    this.model!.fields.requisicao.origem = record.dipOrigem;
    this.model!.fields.requisicao.delegado = record.delegado;
    this.model!.fields.requisicao.recebimento = record.dtRecebimento;
    this.model!.fields.requisicao.ip = record.ip;
    this.model!.fields.requisicao.destino = record.dipDestino;

    this.model!.fields.dtupdate = new Date();

    await this.presentLoading();

    this.atendimentoService.updateRequisicao(this.model!).then(resp => {
      this.hideLoader();
      this.navCtrl.navigateBack('atendimento/visualizar');
    })
    .catch(error => {
      this.hideLoader();
      console.log(error);
      this.presentError(error.message);
    });

    this.loadForm();
  }

  async presentAlertSalvo(msg: string) {
    const alert = await this.toastController.create({
      message: msg,
      duration: 2000
    });

    await alert.present();
  }

  async presentError(msg: string) {
    const alert = await this.toastController.create({
      message: 'Erro ao tentar salvar registro: ' + msg,
      duration: 2000
    });

    await alert.present();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Processando...',
      showBackdrop: false
    });
    return await loading.present();

    //return loading.onDidDismiss();
  }

  async hideLoader() {
    setTimeout(async () => {
      await this.loadingController.dismiss();
    }, 500);
  }

  async adicionarQuesito() {

    this.atendimentoService.quesito = new Quesito();
    await this.openModal();
  }

  async editarQuesito(quesito: Quesito) {
    this.atendimentoService.quesito = quesito;
    await this.openModal();
  }

  async openModal() {
    const modal = await this.modalCtrl.create({
      component: QuesitoPage
    });
    
    return await modal.present();
  }

  deleteQuesito(index: number){
    this.model!.quesitos.splice(index, 1);
    this.model!.fields.dtupdate = new Date();
    this.atendimentoService.update(this.model!).then(resp => {
      this.hideLoader();
    })
    .catch(error => {
      this.hideLoader();
      this.presentError(error.message);
    });
    
  }

}
