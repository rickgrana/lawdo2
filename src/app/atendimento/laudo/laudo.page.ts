import { Component, OnInit } from '@angular/core';
import {  Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonModal, IonDatetimeButton, IonDatetime, IonRow, IonCol, IonInput, IonLabel,
    IonButton, IonItem, IonBackButton } from '@ionic/angular/standalone';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-laudo',
  templateUrl: './laudo.page.html',
  styleUrls: ['./laudo.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonModal, IonDatetimeButton, IonDatetime, IonRow, IonCol, IonInput,
    IonButton, IonItem, IonBackButton, IonLabel
  ]
})
export class LaudoPage extends AtendimentoBasePage implements OnInit {

  override loadForm() {
    const data = new Date().toISOString();

    this.form = this.formBuilder.group({
      numero: new FormControl<string>(this.model!.fields.laudo.numero, Validators.required),
      ano: new FormControl<string>(this.model!.fields.laudo.ano, Validators.required),
      data: new FormControl<string>(this.model!.fields.laudo.data || data, Validators.required),
     });

    super.loadForm();  
  }

  override async salvar(record: any) {

    this.model!.fields.laudo.numero = record.numero;
    this.model!.fields.laudo.ano = record.ano;
    this.model!.fields.laudo.data = record.data;

    await this.presentLoading();

    this.atendimentoService.updateLaudo(this.model!).then(resp => {
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

}
