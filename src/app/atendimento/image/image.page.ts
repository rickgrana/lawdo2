import { Component, OnInit, ViewChild, Input, ElementRef, inject, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { ImageService } from 'src/app/services/image.service';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, ActionSheetController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { chevronForwardOutline, syncOutline, cutOutline, trash, sparklesOutline, ellipsisVerticalOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import 'cropperjs';
import Cropper from 'cropperjs';
import { FirearmDetectionService } from 'src/app/services/firearm-detection.service';
import { imagemEstaNoGoogleDrive, Imagem } from 'src/app/models/atendimento.model';

@Component({
  selector: 'app-image',
  templateUrl: './image.page.html',
  styleUrls: ['./image.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    ReactiveFormsModule, CommonModule, FormsModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton
  ]
})
export class ImagePage extends AtendimentoBasePage implements OnInit {

  data: any;
  legenda = '';
  colunas = 1;
  modo = 1;

  sequencia = "";
  titulo = "";

  cropperEnabled = false;
  enableSalvar = false;
  imageLoaded = false;


  @ViewChild("image", { static: true }) public imageElement!: ElementRef<HTMLImageElement>;

  @Input("src") public imageSource: string = 'assets/no-image.jpg';

  protected imageService = inject(ImageService);
  protected firearmDetectionService = inject(FirearmDetectionService);
  private actionSheetController = inject(ActionSheetController);

  constructor() {
    super();
    addIcons({ chevronForwardOutline, syncOutline, cutOutline, trash, sparklesOutline, ellipsisVerticalOutline });
  }

  async presentImageActions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Imagem',
      buttons: [
        {
          text: 'Cortar',
          icon: 'cut-outline',
          handler: () => {
            this.crop();
          }
        },
        {
          text: 'Rotacionar',
          icon: 'sync-outline',
          handler: () => {
            void this.rotate();
          }
        },
        {
          text: 'Identificar perfurações',
          icon: 'sparkles-outline',
          handler: () => {
            void this.firearmDetection();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
  
  get imagem() {
    return this.atendimentoService.getImagem();
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  public ionViewDidEnter() {
    this.load();
  }

  async load() {
    if(this.imagem) {
      this.legenda = this.imagem.legenda;
      this.enableSalvar = true;
    }

    if(this.imagem){
      this.sequencia = (this.atendimentoService.imagem_selecionada + 1).toString().padStart(2, "0");
      this.titulo = 'Imagem ' + this.sequencia;
    } else {
      //this.sequencia = (this.model.imagens.length + 1).toString().padStart(2, "0");
      this.titulo = 'Nova Imagem';
    }

    this.colunas = 1;

    if(this.imagem) {

      await this.presentLoading('Carregando Imagem...');

      const response = await fetch(this.imagem.imagem);
      const blob = await response.blob();

      const img = new Image();
      img.src = URL.createObjectURL(blob);

      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // mantém proporção
        const targetHeight = 500;
        const scale = targetHeight / img.height;
        const targetWidth = img.width * scale;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // JPEG base64
        const src = canvas.toDataURL('image/jpeg', 0.9);

        this.imageLoaded = true;
        this.imageSource = src;
        await this.hideLoader();
      };

    } else {
      console.log('Nenhuma imagem a carregar  ');
      this.imageSource = 'assets/no-image.jpg';
    }
  }

  openArquivo(){
    document.getElementById("arquivo")!.click();
  }

  destroyCrop(){
      this.cropperEnabled = false;
  }

  crop(){
    this.cropperEnabled = true;
  }

  async doCrop(){
    const canvas = await (document.getElementById("cropperSelection") as any).$toCanvas();
    this.imageSource = canvas!.toDataURL("image/jpeg", 1);
    this.cropperEnabled = false;
  }

  override async salvar(){

    this.enableSalvar = false;

    await this.presentLoading();
    
    try{
      const img = new Image();
      img.src = this.imageSource;

      img.onload = async () => {

        const maxHeight = 500;
        const scale = maxHeight / img.height;

        const canvas = document.createElement('canvas');
        canvas.height = maxHeight;
        canvas.width = img.width * scale;

        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

        // base64 jpeg
        const src = canvas.toDataURL('image/jpeg', 1);

        const record: Imagem = {
          imagem: src,
          legenda: this.legenda,
          nome: (this.imagem ? this.imagem.nome : new Date().getTime().toString()),
          colunas: this.colunas
        };

        if (!this.imagem) {
          this.model!.imagens.push(record);
          this.atendimentoService.imagem_selecionada = this.model!.imagens.length - 1;
        } else {
          this.model!.imagens[this.atendimentoService.imagem_selecionada] = record;
        }

        // blob para upload
        const blob: Blob = await new Promise(resolve =>
          canvas.toBlob(b => resolve(b!), 'image/jpeg', 1)
        );

        try {
          if (this.imagem && imagemEstaNoGoogleDrive(this.imagem)) {
            await this.imageService.remover(
              { nome: this.imagem.nome, imagem: '', legenda: '', driveFileId: this.imagem.driveFileId },
              this.model!.id
            );
          }
        } catch (e) {
          console.warn('Remoção da versão anterior no Drive:', e);
        }

        this.imageService.upload(this.model!, record.nome, blob)
          .then((r) => {
            record.driveFileId = r.driveFileId;
            this.atendimentoService.updateImagens(this.model!).then(() => {
              this.hideLoader();
              this.presentAlertSalvo('Imagem salva com sucesso');
            });
          })
          .catch(error => {
            console.log(error);
            this.presentError('Erro ao tentar salvar Imagem: '+ error.message);
            return;
          });
      };
    } catch(error){
      this.enableSalvar = true;
      this.hideLoader();
      throw error;
    }
  }

  async rotate(){

    await this.presentLoading('Rotacionando Imagem...');

    try{
      const img = new Image();
      img.src = this.imageSource;
      
      img.onload = () => {

        const maxHeight = 500;
        const scale = maxHeight / img.height;

        const newWidth = img.width * scale;
        const newHeight = maxHeight;

        const canvas = document.createElement('canvas');

        // inverter dimensões por causa da rotação -90
        canvas.width = newHeight;
        canvas.height = newWidth;

        const ctx = canvas.getContext('2d')!;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // mover origem para centro
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // rotacionar -90 graus
        ctx.rotate(-90 * Math.PI / 180);

        // desenhar imagem centralizada
        ctx.drawImage(
          img,
          -newWidth / 2,
          -newHeight / 2,
          newWidth,
          newHeight
        );

        const src = canvas.toDataURL('image/jpeg', 1);

        this.imageSource = src;
        this.hideLoader();
      };

    }catch(error){
      this.hideLoader();
      throw error;
    }
  }


  async remover(){
    
    await this.presentLoading();

    const index = this.atendimentoService.imagem_selecionada;

    let imagem = this.model!.imagens[index];

    this.imageService.remover(imagem, this.model!.id).then(() => {

      this.atendimentoService.updateImagens(this.model!)
      .then(async resp => {
        await this.hideLoader();

        this.navCtrl.navigateBack('atendimento/imagens');
      })
      .catch(error => {
        this.hideLoader();
        this.presentError('Erro ao tentar excluir Imagem (1): '+ error.message);
      });


    }).catch(error => {
      this.hideLoader();
      this.presentError('Erro ao tentar excluir Imagem: '+ error.message);
    });;

    this.model!.imagens.splice(index, 1);
  }

  async firearmDetection() {
    await this.presentLoading('Identificando perfurações...');

    try {
      const response = await this.firearmDetectionService.detect(this.imageSource);
      const blob = response.blob;

      if (this.legenda.length > 0) {
        this.legenda = this.legenda + ' - ';
      }

      console.log('Número de detecções:', response.quantidade);

      const q = response.quantidade;
      if (q === 0) {
        this.legenda = this.legenda + 'Nenhuma perfuração por arma de fogo detectada';
      } else if (q === 1) {
        this.legenda = this.legenda + '1 perfuração por arma de fogo detectada';
      } else {
        this.legenda = this.legenda + `${q} perfurações por arma de fogo detectadas`;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // mantém proporção
        const targetHeight = 500;
        const scale = targetHeight / img.height;
        const targetWidth = img.width * scale;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // JPEG base64
        const src = canvas.toDataURL('image/jpeg', 0.9);

        this.imageSource = src;
        await this.hideLoader();
      };

      img.onerror = async () => {
        URL.revokeObjectURL(objectUrl);
        await this.hideLoader();
        this.presentError('Erro ao exibir o resultado da detecção.');
      };

      img.src = objectUrl;
    } catch (error: any) {
      await this.hideLoader();
      this.presentError('Erro ao tentar identificar perfurações: ' + error.message);
    }
  }
}
