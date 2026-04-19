import { Component, inject, OnInit , ViewChild} from '@angular/core';
import { ImageService } from '../../services/image.service';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonSpinner, IonReorder,
    IonReorderGroup,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonProgressBar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FirearmDetectionService } from 'src/app/services/firearm-detection.service';

@Component({
  selector: 'app-imagens',
  templateUrl: './imagens.page.html',
  styleUrls: ['./imagens.page.scss'],
  standalone: true,
  imports: [CommonModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonReorder,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSpinner, IonReorderGroup, IonProgressBar
  ]
})
export class ImagensPage extends AtendimentoBasePage implements OnInit {

  protected imageService = inject(ImageService);
  protected firearmDetectionService = inject(FirearmDetectionService);
  
  @ViewChild("reorderGroup", { read: IonReorderGroup, static: true}) reorderGroup!: IonReorderGroup;

  reorder = false;

  /** Upload em lote: barra e contagem (apenas quando há mais de um arquivo). */
  uploadInProgress = false;
  uploadCurrent = 0;
  uploadTotal = 0;

  get uploadProgressRatio(): number {
    return this.uploadTotal > 0 ? this.uploadCurrent / this.uploadTotal : 0;
  }

  selecionarImagens(){
    document.getElementById("arquivo")!.click();
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

  async onSelectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files?.length || !this.model) {
      input.value = '';
      return;
    }

    const filesAmount = files.length;
    const showBatchProgress = filesAmount > 1;

    if (showBatchProgress) {
      this.uploadTotal = filesAmount;
      this.uploadCurrent = 0;
      this.uploadInProgress = true;
    } else {
      await this.presentLoading();
    }

    try {
      const imagens: Array<{ src: string; nome: string } | null> = new Array(filesAmount).fill(null);

      await Promise.all(
        Array.from(files, (file, i) =>
          (async () => {
            try {
              const dataUrl = await this.readFileAsDataURL(file);
              const { base64, blob } = await this.resizeImage(dataUrl as string, 500);
              const nome = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`;

              await this.imageService.upload(this.model!.id, nome, blob);
              imagens[i] = { src: base64, nome };
            } catch (error: any) {
              console.error(error);
              await this.presentError(error?.message ?? String(error));
            } finally {
              if (showBatchProgress) {
                this.uploadCurrent++;
              }
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
          colunas: 0
        });
      }

      await this.atendimentoService.updateImagens(this.model);
    } catch (error: any) {
      console.error(error);
      await this.presentError(error?.message ?? String(error));
    } finally {
      input.value = '';
      this.uploadInProgress = false;
      if (!showBatchProgress) {
        await this.hideLoader();
      }
    }
  }

  async salvarImagem(n: number, src: string) {

    const img = await fetch(src);
    const blob = await img.blob();

    const record = {
      imagem:   src,
      legenda:  '',
      nome: new Date().getTime().toString()
    }; 

    await this.imageService.upload(this.model!.id, record.nome, blob).then(async() => {

      await this.model!.imagens.push(record);

      await this.atendimentoService.update(this.model!).then(async (resp) => {
      })
      .catch(async(error) => {
        console.log(error);
        await this.presentError(error.message);
      });

    }).catch(async(error) => {
      console.log(error);
      await this.presentError(error.message);
    });
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
