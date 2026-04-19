import { Injectable } from '@angular/core';
import { LoadingController, AlertController , ToastController} from '@ionic/angular/standalone';

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

    /**
     * Erro genérico: exibe o texto completo em modal (textarea selecionável + Copiar).
     */
    async presentErro(msg: string) {
      return this.presentErrorModal(msg, 'Erro');
    }

    /**
     * Erros ao salvar registro (prefixo padrão do app).
     */
    async presentError(msg: string) {
      const full = 'Erro ao tentar salvar registro: ' + msg;
      return this.presentErrorModal(full, 'Erro ao salvar');
    }

    private async presentErrorModal(fullText: string, header: string): Promise<void> {
      const text = fullText ?? '';

      const alert = await this.alertController.create({
        cssClass: 'alert-error-modal',
        header,
        backdropDismiss: true,
        message:
          'O texto abaixo pode ser copiado com o botão Copiar ou selecionado manualmente.',
        inputs: [
          {
            type: 'textarea',
            name: 'detail',
            value: text,
            attributes: {
              readonly: true,
              rows: 14,
              spellcheck: false,
              autocapitalize: 'off',
              autocomplete: 'off',
              wrap: 'soft',
            },
          },
        ],
        buttons: [
          {
            text: 'Copiar',
            handler: () => {
              void this.copyToClipboard(text).then(() =>
                this.presentToast('Erro copiado para a área de transferência'),
              );
              return false;
            },
          },
          {
            text: 'Fechar',
            role: 'cancel',
          },
        ],
      });

      await alert.present();
    }

    private async copyToClipboard(text: string): Promise<void> {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
      } catch {
        /* fallback */
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {
        console.error('Não foi possível copiar o texto.', e);
      }
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
    }

    async hideLoader() {
      if(this.loading == null){
        console.log('Nenhum loader ativo para ser ocultado.');
        return null;
      }
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
