import { Component, OnInit, ViewChild, Input, ElementRef, inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { ImageService } from 'src/app/services/image.service';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, ActionSheetController, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { chevronForwardOutline, syncOutline, cutOutline, trash, sparklesOutline, ellipsisVerticalOutline, colorFillOutline, brushOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import 'cropperjs';
import Cropper from 'cropperjs';
import { FirearmDetectionService } from 'src/app/services/firearm-detection.service';
import { BloodstainDetectionService } from 'src/app/services/bloodstain-detection.service';
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
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSpinner
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

  /** Overlay sobre a imagem durante deteção remota (arma / manchas). */
  detectionBusy = false;
  detectionMessage = '';
  private detectionResultObjectUrl: string | null = null;


  @ViewChild("image", { static: true }) public imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('drawImage') drawImageElement?: ElementRef<HTMLImageElement>;
  @ViewChild('drawCanvas') drawCanvasElement?: ElementRef<HTMLCanvasElement>;

  @Input("src") public imageSource: string = 'assets/no-image.jpg';

  protected imageService = inject(ImageService);
  protected firearmDetectionService = inject(FirearmDetectionService);
  protected bloodstainDetectionService = inject(BloodstainDetectionService);
  private cdr = inject(ChangeDetectorRef);
  private actionSheetController = inject(ActionSheetController);
  drawEnabled = false;
  drawColor = '#ff2d55';
  private drawingActive = false;
  hasDrawn = false;
  private drawContext: CanvasRenderingContext2D | null = null;
  private drawScaleX = 1;
  private drawImageReady = false;

  constructor() {
    super();
    addIcons({ chevronForwardOutline, syncOutline, cutOutline, trash, sparklesOutline, ellipsisVerticalOutline, colorFillOutline, brushOutline });
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
          text: 'Desenhar',
          icon: 'brush-outline',
          handler: () => {
            this.startDrawing();
          }
        },
        {
          text: 'Identificar PAF no tórax',
          icon: 'sparkles-outline',
          handler: () => {
            void this.confirmFirearmDetection();
          }
        },
        {
          text: 'Identificar manchas de sangue',
          icon: 'color-fill-outline',
          handler: () => {
            void this.bloodstainDetection();
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

  async startDrawing(): Promise<void> {
    if (!this.imageSource || this.detectionBusy) {
      return;
    }

    this.cropperEnabled = false;
    this.drawEnabled = true;
    this.hasDrawn = false;
    this.drawImageReady = false;
    this.cdr.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    this.configureDrawingCanvas();
  }

  cancelDrawing(): void {
    this.drawEnabled = false;
    this.drawingActive = false;
    this.hasDrawn = false;
    this.drawContext = null;
    this.drawImageReady = false;
    this.cdr.detectChanges();
  }

  applyDrawing(): void {
    if (!this.drawCanvasElement || !this.drawImageElement) {
      return;
    }

    const imageEl = this.drawImageElement.nativeElement;
    const drawingCanvas = this.drawCanvasElement.nativeElement;
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = imageEl.naturalWidth;
    outputCanvas.height = imageEl.naturalHeight;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) {
      return;
    }

    outputCtx.drawImage(imageEl, 0, 0, outputCanvas.width, outputCanvas.height);
    outputCtx.drawImage(drawingCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
    this.imageSource = outputCanvas.toDataURL('image/jpeg', 1);
    this.cancelDrawing();
    this.cdr.detectChanges();
  }

  onDrawImageLoad(): void {
    this.drawImageReady = true;
    this.configureDrawingCanvas();
  }

  private configureDrawingCanvas(): void {
    if (!this.drawEnabled || !this.drawImageReady || !this.drawCanvasElement || !this.drawImageElement) {
      return;
    }

    const imageEl = this.drawImageElement.nativeElement;
    const canvasEl = this.drawCanvasElement.nativeElement;
    const width = imageEl.clientWidth;
    const height = imageEl.clientHeight;
    if (!width || !height) {
      return;
    }

    canvasEl.width = width;
    canvasEl.height = height;
    this.drawScaleX = imageEl.naturalWidth / width;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const baseLine = Math.max(2, Math.round((imageEl.naturalWidth / 500) * 3));
    ctx.lineWidth = baseLine / this.drawScaleX;
    ctx.strokeStyle = this.drawColor;
    this.drawContext = ctx;
  }

  beginDraw(event: PointerEvent): void {
    if (!this.drawEnabled || !this.drawContext) {
      return;
    }
    const point = this.getCanvasPoint(event);
    if (!point) {
      return;
    }
    this.drawingActive = true;
    if (!this.hasDrawn) {
      this.hasDrawn = true;
      this.cdr.detectChanges();
    }
    this.drawContext.strokeStyle = this.drawColor;
    this.drawContext.beginPath();
    this.drawContext.moveTo(point.x, point.y);
  }

  onDrawColorChange(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value;
    if (!value) {
      return;
    }
    this.drawColor = value;
    if (this.drawContext) {
      this.drawContext.strokeStyle = value;
    }
  }

  draw(event: PointerEvent): void {
    if (!this.drawingActive || !this.drawContext) {
      return;
    }
    const point = this.getCanvasPoint(event);
    if (!point) {
      return;
    }
    this.drawContext.lineTo(point.x, point.y);
    this.drawContext.stroke();
  }

  endDraw(): void {
    this.drawingActive = false;
  }

  startTouchDraw(event: TouchEvent): void {
    if (!event.touches.length) {
      return;
    }
    event.preventDefault();
    const touch = event.touches[0];
    this.beginDraw({
      clientX: touch.clientX,
      clientY: touch.clientY
    } as PointerEvent);
  }

  moveTouchDraw(event: TouchEvent): void {
    if (!event.touches.length) {
      return;
    }
    event.preventDefault();
    const touch = event.touches[0];
    this.draw({
      clientX: touch.clientX,
      clientY: touch.clientY
    } as PointerEvent);
  }

  endTouchDraw(event: TouchEvent): void {
    event.preventDefault();
    this.endDraw();
  }

  private getCanvasPoint(event: PointerEvent | TouchEvent): { x: number; y: number } | null {
    if (!this.drawCanvasElement) {
      return null;
    }
    const rect = this.drawCanvasElement.nativeElement.getBoundingClientRect();
    let clientX: number;
    let clientY: number;
    if ('touches' in event) {
      const touch = event.touches[0];
      if (!touch) {
        return null;
      }
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
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

  private async beginDetection(message: string): Promise<void> {
    this.detectionMessage = message;
    this.detectionBusy = true;
    this.cdr.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private async finishDetection(): Promise<void> {
    this.detectionBusy = false;
    this.detectionMessage = '';
    this.cdr.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private async applyDetectionResultImage(blob: Blob): Promise<void> {
    const nextObjectUrl = URL.createObjectURL(blob);
    this.detectionResultObjectUrl = nextObjectUrl;

    this.imageSource = nextObjectUrl;
    this.cdr.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private async confirmFirearmDetection(): Promise<void> {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      header: 'Confirmação',
      message: 'A identificação de perfurações por arma de fogo deve ser realizada em imagem que contenha apenas a região anterior do tórax da vítima. Deseja continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: () => {
            void this.firearmDetection();
          }
        }
      ]
    });

    await alert.present();
  }

  async firearmDetection() {
    await this.beginDetection('Identificando perfurações...');

    try {
      const response = await this.firearmDetectionService.detect(this.imageSource);
      const blob = response.blob;
      let detectionResultMessage = '';

      if (this.legenda.length > 0) {
        this.legenda = this.legenda + ' - ';
      }

      const q = response.quantidade;
      if (q === 0) {
        this.legenda = this.legenda + 'Nenhuma perfuração por arma de fogo detectada';
        detectionResultMessage = 'Nenhuma perfuração foi identificada. Verifique se a imagem contém apenas a região do tórax e tente novamente';
      } else if (q === 1) {
        this.legenda = this.legenda + '1 perfuração por arma de fogo detectada';
        detectionResultMessage = 'Identificação concluída. As marcações indicam o grau de certeza da IA em sua identificação.';
      } else {
        this.legenda = this.legenda + `${q} perfurações por arma de fogo detectadas`;
        detectionResultMessage = 'Identificação concluída. As marcações indicam o grau de certeza da IA em sua identificação.';
      }
      this.cdr.detectChanges();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      try {
        await this.applyDetectionResultImage(blob);
        await this.finishDetection();
        await this.presentAlertSalvo(detectionResultMessage);
      } catch (error: any) {
        await this.finishDetection();
        this.presentError('Erro ao exibir o resultado da detecção: ' + error.message);
      }
    } catch (error: any) {
      await this.finishDetection();
      this.presentError('Erro ao tentar identificar perfurações: ' + error.message);
    }
  }

  async bloodstainDetection() {
    await this.beginDetection('Identificando manchas de sangue...');

    try {
      const response = await this.bloodstainDetectionService.detect(this.imageSource);
      const blob = response.blob;

      if (this.legenda.length > 0) {
        this.legenda = this.legenda + ' - ';
      }

      const q = response.quantidade;
      if (q === 0) {
        this.legenda = this.legenda + 'Nenhuma mancha de sangue detectada';
      } else if (q === 1) {
        this.legenda = this.legenda + '1 mancha de sangue detectada';
      } else {
        this.legenda = this.legenda + `${q} manchas de sangue detectadas`;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const targetHeight = 500;
        const scale = targetHeight / img.height;
        const targetWidth = img.width * scale;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const src = canvas.toDataURL('image/jpeg', 0.9);

        this.imageSource = src;
        await this.finishDetection();
      };

      img.onerror = async () => {
        URL.revokeObjectURL(objectUrl);
        await this.finishDetection();
        this.presentError('Erro ao exibir o resultado da detecção.');
      };

      img.src = objectUrl;
    } catch (error: any) {
      await this.finishDetection();
      this.presentError('Erro ao tentar identificar manchas de sangue: ' + error.message);
    }
  }
}
