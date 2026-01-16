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
import { AtendimentoBasePage } from '../atendimento-base.page';

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
export class RequisicaoPage extends AtendimentoBasePage implements OnInit {

  constructor(private modalCtrl: ModalController) {
    super();
  }

  override ngOnInit() {
    this.loadForm();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.loadForm();
    });
  }

  override loadForm() {

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

  override async salvar(record: any) {
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
