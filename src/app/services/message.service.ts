import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController, IonicSafeString, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOutline, copyOutline, imagesOutline, settingsOutline } from 'ionicons/icons';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  alert: any;
  loading: any;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
  ) {
    addIcons({ cloudOutline, imagesOutline, copyOutline, settingsOutline });
  }

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

    /**
     * Aviso antes de iniciar um novo atendimento (nuvem Google / Drive).
     * @returns true se o usuário confirmou; false se cancelou ou fechou o alerta.
     */
    async confirmNovoAtendimentoPrivacidade(): Promise<boolean> {
      let accepted = false;
      const alert = await this.alertController.create({
        header: 'Novo atendimento',
        cssClass: 'alert-novo-atendimento-privacidade',
        message: new IonicSafeString(`
<div style="text-align:left;font-size:14px;line-height:1.45;color:var(--ion-text-color, #000);">
  <p style="display:flex;align-items:flex-start;gap:10px;margin:0 0 12px 0;">
    <ion-icon name="cloud-outline" style="font-size:22px;flex-shrink:0;margin-top:1px;color:var(--ion-color-medium,#666);" aria-hidden="true"></ion-icon>
    <span><strong>Dados na nuvem:</strong> informações do atendimento ficam armazenadas na nuvem, na base de dados do Google.</span>
  </p>
  <p style="display:flex;align-items:flex-start;gap:10px;margin:0 0 12px 0;">
    <ion-icon name="images-outline" style="font-size:22px;flex-shrink:0;margin-top:1px;color:var(--ion-color-primary);" aria-hidden="true"></ion-icon>
    <span><strong>Imagens:</strong> fotos e imagens são salvas no Google Drive da conta em que você está logado.</span>
  </p>
  <p style="display:flex;align-items:flex-start;gap:10px;margin:0 0 12px 0;">
    <ion-icon name="copy-outline" style="font-size:22px;flex-shrink:0;margin-top:1px;color:var(--ion-color-secondary);" aria-hidden="true"></ion-icon>
    <span><strong>Cópia dos dados:</strong> uma cópia dos dados também é armazenada no SEU Google Drive.</span>
  </p>
  <p style="display:flex;align-items:flex-start;gap:10px;margin:0;padding-top:12px;border-top:1px solid var(--ion-color-step-150, rgba(0,0,0,0.12));">
    <ion-icon name="settings-outline" style="font-size:22px;flex-shrink:0;margin-top:1px;color:var(--ion-color-medium,#666);" aria-hidden="true"></ion-icon>
    <span>Caso queira configurar a pasta no Google Drive aonde os dados são salvos, acesse <b>Configurações</b> no menu lateral.</span>
  </p>
</div>`),
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              accepted = false;
            },
          },
          {
            text: 'Continuar',
            handler: () => {
              accepted = true;
            },
          },
        ],
      });
      await alert.present();
      this.bindPrivacidadeConfigLink(alert);
      await alert.onDidDismiss();
      return accepted;
    }

    /** Link no HTML do alerta: navega via Router (SPA) e fecha o alerta. */
    private bindPrivacidadeConfigLink(
      alert: Awaited<ReturnType<AlertController['create']>>,
    ): void {
      const attach = (): boolean => {
        const anchor = alert.shadowRoot?.querySelector<HTMLAnchorElement>('a[data-priv-config-link]');
        if (!anchor) {
          return false;
        }
        anchor.addEventListener('click', (ev) => {
          ev.preventDefault();
          void alert.dismiss(undefined, 'cancel');
          void this.router.navigate(['/configuracoes']);
        });
        return true;
      };
      queueMicrotask(() => {
        if (!attach()) {
          requestAnimationFrame(() => void attach());
        }
      });
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
