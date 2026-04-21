import { Component, inject, OnInit , ViewChild} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ImageService } from '../../services/image.service';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { imagemEstaNoGoogleDrive } from 'src/app/models/atendimento.model';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonSpinner, IonReorder,
    IonReorderGroup,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonNote,
    Platform, ActionSheetController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FirearmDetectionService } from 'src/app/services/firearm-detection.service';

@Component({
  selector: 'app-imagens',
  templateUrl: './imagens.page.html',
  styleUrls: ['./imagens.page.scss'],
  standalone: true,
  imports: [CommonModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonReorder,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSpinner, IonReorderGroup, IonNote
  ]
})
export class ImagensPage extends AtendimentoBasePage implements OnInit {

  protected imageService = inject(ImageService);
  protected firearmDetectionService = inject(FirearmDetectionService);
  private platform = inject(Platform);
  private actionSheetController = inject(ActionSheetController);

  @ViewChild("reorderGroup", { read: IonReorderGroup, static: true}) reorderGroup!: IonReorderGroup;

  reorder = false;

  /** Fotos tiradas pela câmera aguardam até o utilizador indicar que não quer capturar mais. */
  private pendingCameraFiles: File[] = [];

  /** True durante resize/upload/update no Drive (uma ou várias imagens). Desativa o botão Adicionar. */
  imagesProcessing = false;

  /** Pelo menos uma imagem está no Google Drive (não apenas Firebase legado). */
  get driveLocationVisible(): boolean {
    return !!this.model?.imagens?.some(imagemEstaNoGoogleDrive);
  }

  get driveImagesLocationLabel(): string {
    if (!this.model) {
      return '';
    }
    return this.imageService.getDriveImagesLocationLabel(this.model);
  }

  /** Em mobile/nativo: escolher galeria ou câmera; no desktop mantém só o seletor de ficheiros (múltiplos). */
  private shouldOfferSourceChoice(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return this.platform.is('mobile') || this.platform.is('ios') || this.platform.is('android');
  }

  async selecionarImagens(): Promise<void> {
    if (this.imagesProcessing) {
      return;
    }
    if (this.shouldOfferSourceChoice()) {
      const sheet = await this.actionSheetController.create({
        header: 'Adicionar imagens',
        buttons: [
          {
            text: 'Galeria',
            handler: () => {
              document.getElementById('inputGaleria')?.click();
            }
          },
          {
            text: 'Câmera',
            handler: () => {
              document.getElementById('inputCamera')?.click();
            }
          },
          { text: 'Cancelar', role: 'cancel' }
        ]
      });
      await sheet.present();
      return;
    }
    document.getElementById('inputGaleria')?.click();
  }

  abrirImagens() {
    this.atendimentoService.imagem_selecionada = -1;
    this.router.navigate(['atendimento/image']);
  }

  editarImagem(index: number) {
    this.atendimentoService.imagem_selecionada = index;
    this.router.navigate(['atendimento/image']);
  }

  async readFileAsDataURL(file: File) {
    let result_base64 = await new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.onload = (e) => resolve(fileReader.result);
        fileReader.readAsDataURL(file);
    });

    return result_base64;
  }

  async resizeImage(src: string, maxHeight = 500, quality = 0.8) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise<{ base64: string; blob: Blob }>((resolve, reject) => {
      img.onload = async () => {
        const canvas = document.createElement('canvas');

        let width = img.width;
        let height = img.height;

        // resize proporcional pela altura
        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', quality);
        const res = await fetch(base64);
        const blob = await res.blob();

        resolve({ base64, blob });
      };

      img.onerror = reject;
      img.src = src;
    });
  }

  async onSelectGallery(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length || !this.model) {
      input.value = '';
      return;
    }
    const list = Array.from(files);
    input.value = '';
    await this.uploadFilesBatch(list);
  }

  async onSelectCamera(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length || !this.model) {
      input.value = '';
      return;
    }
    this.pendingCameraFiles.push(...Array.from(files));
    input.value = '';
    await this.promptCaptureAnotherPhoto();
  }

  /** Redimensiona, envia ao Drive e regista na lista (galeria ou fila da câmera já concluída). */
  private async uploadFilesBatch(files: File[]): Promise<void> {
    if (!files.length || !this.model) {
      return;
    }

    const filesAmount = files.length;

    this.imagesProcessing = true;
    try {
      await this.presentLoading(`Carregando 0/${filesAmount}`);

      try {
        const imagens: Array<{ src: string; nome: string; driveFileId: string } | null> =
          new Array(filesAmount).fill(null);

        let completed = 0;
        await Promise.all(
          Array.from(files, (file, i) =>
            (async () => {
              try {
                const dataUrl = await this.readFileAsDataURL(file);
                const { base64, blob } = await this.resizeImage(dataUrl as string, 500);
                const nome = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`;

                const { driveFileId } = await this.imageService.upload(this.model!, nome, blob);
                imagens[i] = { src: base64, nome, driveFileId };
              } catch (error: any) {
                console.error(error);
                await this.presentError(error?.message ?? String(error));
              } finally {
                completed++;
                this.setLoadingProgress(completed, filesAmount);
              }
            })()
          )
        );

        for (const img of imagens) {
          if (!img) {
            continue;
          }
          this.model.imagens.push({
            imagem: img.src,
            legenda: '',
            nome: img.nome,
            colunas: 0,
            driveFileId: img.driveFileId
          });
        }

        await this.atendimentoService.updateImagens(this.model);
      } catch (error: any) {
        console.error(error);
        await this.presentError(error?.message ?? String(error));
      } finally {
        await this.hideLoader();
      }
    } finally {
      this.imagesProcessing = false;
    }
  }

  private setLoadingProgress(completed: number, total: number): void {
    if (this.loading) {
      this.loading.message = `Carregando ${completed}/${total}`;
    }
  }

  private async flushPendingCameraFiles(): Promise<void> {
    const batch = this.pendingCameraFiles;
    if (!batch.length) {
      return;
    }
    this.pendingCameraFiles = [];
    await this.uploadFilesBatch(batch);
  }

  /** Após cada captura: Sim abre de novo; Não processa todas as fotos acumuladas. */
  private async promptCaptureAnotherPhoto(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Capturar mais?',
      message: 'Deseja tirar ou adicionar outra foto pela câmera? As fotos só serão enviadas quando terminar.',
      buttons: [
        {
          text: 'Sim',
          handler: () => {
            setTimeout(() => document.getElementById('inputCamera')?.click(), 150);
          }
        },
        {
          text: 'Não',
          handler: () => {
            void this.flushPendingCameraFiles();
          }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  async salvarImagem(n: number, src: string) {

    const img = await fetch(src);
    const blob = await img.blob();

    const nome = new Date().getTime().toString();

    try {
      const { driveFileId } = await this.imageService.upload(this.model!, nome, blob);
      this.model!.imagens.push({
        imagem: src,
        legenda: '',
        nome,
        driveFileId
      });
      await this.atendimentoService.update(this.model!);
    } catch (error: any) {
      console.log(error);
      await this.presentError(error?.message ?? String(error));
    }
  }

  doReorder(ev: any) {
    this.model!.imagens = ev.detail.complete(this.model!.imagens);
  }


  async toggleOrdem(){

    // salva a nova ordenacao
    if(this.reorder == true){

      await this.presentLoading();

      await this.atendimentoService.update(this.model!).then(async (resp) => {
        await this.hideLoader();
      })
      .catch(async(error) => {
        await this.hideLoader();
        console.log(error);
        await this.presentError(error.message);
      });
    }

    this.reorder = !this.reorder;
  }


}
