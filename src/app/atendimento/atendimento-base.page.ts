import { Component, Directive, inject, OnInit } from '@angular/core';
import { AtendimentoService } from 'src/app/services/atendimento.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/authentication.service';
import { User } from 'src/app/models/user.model';
import { CommonModule } from '@angular/common';

@Directive()
export abstract class AtendimentoBasePage implements OnInit {
  user?: User;
  form?: FormGroup;

  protected authService = inject(AuthenticationService);
  protected atendimentoService = inject(AtendimentoService);
  protected formBuilder = inject(FormBuilder);
  protected toastController = inject(ToastController);
  protected loadingController = inject(LoadingController);
  protected navCtrl = inject(NavController);
  protected router = inject(Router);

  ngOnInit() {
    this.loadForm();

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
    if(this.model!.isConcluido() || this.model!.isArquivado()){
      this.form!.disable();
    }
  }

  async salvar(record: any) {
  }

  async presentAlertSalvo(msg: string) {
    const alert = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'middle'
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
  }

  async hideLoader() {
    setTimeout(async () => {
      await this.loadingController.dismiss();
    }, 500);
  }

}
