import { Component, Directive, HostListener, inject, OnInit } from '@angular/core';
import { AtendimentoService } from 'src/app/services/atendimento.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ToastController } from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular/standalone';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/authentication.service';
import { User } from 'src/app/models/user.model';
import { CommonModule } from '@angular/common';
import { AlertController } from '@ionic/angular/standalone';
import { MessageService } from 'src/app/services/message.service';


@Directive()
export abstract class AtendimentoBasePage implements OnInit {
  user?: User;
  form?: FormGroup;
  loading?: any;

  protected authService = inject(AuthenticationService);
  protected atendimentoService = inject(AtendimentoService);
  protected formBuilder = inject(FormBuilder);
  protected alertController = inject(AlertController);
  protected messageService = inject(MessageService);
  protected toastController = inject(ToastController);
  protected loadingController = inject(LoadingController);
  protected navCtrl = inject(NavController);
  protected router = inject(Router);

  ngOnInit() {
    this.loadForm();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe((user: User) => {
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
    await this.messageService.presentError(msg);
  }

  async presentLoading(message: string = 'Processando...') {
    if (this.loading) {
      await this.loading.dismiss();
    }
    
    this.loading = await this.loadingController.create({
      message: message,
      showBackdrop: true
    });
    
    await this.loading.present();

    return await new Promise(resolve => requestAnimationFrame(resolve));
  }

  async hideLoader() {
    setTimeout(async () => {
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
      }
    }, 500);
  }

  async ionViewDidLeave() {
    if (this.loading) {
      await this.loading.dismiss().catch(() => {});
      this.loading = null;
    }
  }

  hasUnsavedFormChanges(): boolean {
    return !!this.form?.dirty && !this.form.disabled;
  }

  async confirmLeaveIfDirty(): Promise<boolean> {
    if (!this.hasUnsavedFormChanges()) {
      return true;
    }
    return new Promise((resolve) => {
      void this.alertController
        .create({
          backdropDismiss: false,
          header: 'Alterações não salvas',
          message:
            'Há alterações no formulário que precisam ser salvas. Deseja sair mesmo assim?',
          buttons: [
            {
              text: 'Continuar editando',
              role: 'cancel',
              handler: () => resolve(false),
            },
            {
              text: 'Sair',
              handler: () => resolve(true),
            },
          ],
        })
        .then((a) => a.present());
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedFormChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

}
