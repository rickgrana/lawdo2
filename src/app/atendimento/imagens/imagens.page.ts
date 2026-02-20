import { Component, inject, OnInit , ViewChild} from '@angular/core';
import { ImageService } from '../../services/image.service';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonSpinner, IonReorder,
    IonReorderGroup,
    IonRow, IonList, IonCol, IonLabel, IonButton, IonItem, IonBackButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagens',
  templateUrl: './imagens.page.html',
  styleUrls: ['./imagens.page.scss'],
  standalone: true,
  imports: [CommonModule, IonList,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonReorder,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSpinner, IonReorderGroup
  ]
})
export class ImagensPage extends AtendimentoBasePage implements OnInit {

  protected imageService = inject(ImageService);
  
  @ViewChild("reorderGroup", { read: IonReorderGroup, static: true}) reorderGroup!: IonReorderGroup;

  reorder = false;

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

  onSelectFile(event: any) {
    let promises = [];
    let imagens = [];

    if (event.target.files && event.target.files[0]) {

      this.presentLoading();

      try{

        var filesAmount = event.target.files.length;

        for (let i = 0; i < filesAmount; i++) {
          imagens.push({
            src: '',
            blob: '',
            nome: ''
          });
        }

        for (let i = 0; i < filesAmount; i++) {
            // UPLOADS
            promises.push(new Promise((resolve) => {
                let fileReader = new FileReader();
                
                fileReader.onload = async (event:any) => {

                  const src = event.target.result;

                  // 🔥 substitui Jimp
                  const { base64, blob } = await this.resizeImage(src, 500);

                  imagens[i].src = base64;
                  imagens[i].blob = await blob.text();
                  imagens[i].nome = new Date().getTime().toString();

                  this.imageService.upload(this.model!.id, imagens[i].nome, blob)
                    .then(() => resolve('Upload concluido: ' + i))
                    .catch(async (error) => {
                      console.log(error);
                      await this.presentError(error.message);
                    });
                }

                fileReader.readAsDataURL(event.target.files[i]);
            }));
        }

        // SALVAMENTO
        Promise.all(promises).then(() => {

          console.log('Salvando imagens');

          for (let i = 0; i < filesAmount; i++) {
              let imagem = imagens[i];

              const record = {
                imagem:   imagem.src,
                legenda:  '',
                nome:     imagem.nome,
                colunas: 0
              };

              this.model!.imagens.push(record);
          }

          this.atendimentoService.updateImagens(this.model!).then(async (resp) => {
             this.hideLoader();
          });
        });

      }catch(error){
        this.hideLoader();
        console.log(error);
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
