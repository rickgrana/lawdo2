import { Injectable } from '@angular/core';
import { LoadingController, AlertController , ToastController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  alert: any;
  loading: any;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController) { }

  async presentToast(msg: string) {
      this.alert = await this.toastController.create({
        message: msg,
        duration: 2000
      });

      await this.alert.present();
    }

    async presentAlert(header: string, subheader: string, message: string, buttons: any) {
      this.alert = await this.alertController.create({
        header: header,
        subHeader: subheader,
        message: message,
        buttons: buttons
      });

      await this.alert.present();
    }

    async presentErro(msg: string) {
      this.alert = await this.toastController.create({
        message: msg,
        duration: 2000
      });

      return this.alert.present();
    }

    async presentError(msg: string) {
      this.alert = await this.toastController.create({
        message: 'Erro ao tentar salvar registro: ' + msg,
        duration: 2000
      });

      return await this.alert.present();
    }

    async presentLoading(msg = 'Processando...') {

      if(this.loading){
        await this.hideLoader();
      }

      this.loading = await this.loadingController.create({
        message: msg,
        showBackdrop: false
      });

      return await this.loading.present();

      //return loading.onDidDismiss();
    }

    async hideLoader() {
      if(this.loading == null) return null;
      await this.loading.dismiss();
      this.loading = null;
      return true;
    }

    alertDBOffline(){
      this.presentErro('Aplicação offline. Aguardando conexão...');
    }


    async alertDBOnline(){
      this.alert = await this.toastController.create({
        message: 'Você está Online',
        duration: 2000,
        cssClass: 'toast-success'
      });

      return await this.alert.present();
    }
}
