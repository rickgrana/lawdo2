import { Component, OnInit, ViewChild, Input, ElementRef, inject } from '@angular/core';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { ImageService } from 'src/app/services/image.service';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon, IonProgressBar,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import Cropper from "cropperjs";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { chevronForwardOutline, syncOutline, cutOutline, trash } from 'ionicons/icons';
import { addIcons } from 'ionicons';

// import Jimp from 'jimp';

@Component({
  selector: 'app-image',
  templateUrl: './image.page.html',
  styleUrls: ['./image.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, FormsModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon, IonProgressBar,
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

  progresso = 0;

  enableSalvar = false;
  enableNovaImagem = false;
  imageLoaded = false;


  @ViewChild("image", { static: true }) public imageElement!: ElementRef;

  @Input("src") public imageSource: string = '';

  public imageDestination?: string;
  public cropper?: Cropper;
  protected imageService = inject(ImageService);

  constructor() {
    super();
    addIcons({ chevronForwardOutline, syncOutline, cutOutline, trash });
  }
  
  get imagem() {
    return this.atendimentoService.getImagem();
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  public ngAfterViewInit() {
    this.load();
  }

  load() {
    if(this.imagem) {
      this.legenda = this.imagem.legenda;
      this.enableNovaImagem = false;
      this.enableSalvar = true;
    }

    this.imageDestination = "";

    if(this.imagem){
      this.sequencia = (this.atendimentoService.imagem_selecionada + 1).toString().padStart(2, "0");
      this.titulo = 'Imagem ' + this.sequencia;
    } else {
      //this.sequencia = (this.model.imagens.length + 1).toString().padStart(2, "0");
      this.titulo = 'Nova Imagem';
    }

    this.colunas = 1;

    if(this.imagem) {

      /*Jimp.read(this.imagem.imagem).then((image) => {
        image.resize(Jimp.AUTO, 500) // resize
          .getBase64Async(Jimp.MIME_JPEG).then((src) => { // para jpeg
            
            this.imageElement.nativeElement.src = src;

            this.imageLoaded = true;
          });
      })*/

    } else {
      console.log('Zarou imagem');

      this.imageElement.nativeElement.src = '/assets/no-image.jpg';
    }
  }

  openArquivo(){
    document.getElementById("arquivo")!.click();
  }

  destroyCrop(){
      this.cropperEnabled = false;
      this.cropper!.destroy();
  }

  crop(){
    this.cropper = new Cropper('imageSource');
    this.cropperEnabled = true;
  }

  doCrop(){
    //const canvas = this.cropper!.getCropperCanvas() as HTMLCanvasElement;
    //this.imageElement.nativeElement.src = canvas!.toDataURL("image/jpeg", 1);

    this.destroyCrop();

    this.enableSalvar = true;
  }


  onSelectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
        var filesAmount = event.target.files.length;
        for (let i = 0; i < filesAmount; i++) {
          this.progresso = 0;

          var reader = new FileReader();

          reader.onprogress = (evt: any) => {
            if (evt.lengthComputable) {
              this.progresso = (evt.loaded / evt.total);
              console.log(this.progresso, evt.loaded, evt.total);      
            }
          };

          this.presentLoading('Carregando Imagem...');

          reader.onload = (event:any) => {

            try{

              /*Jimp.read(event.target.result).then((image) => {
                image
                  //.resize(Jimp.AUTO, 500) // resize
                  .getBase64Async(Jimp.MIME_JPEG)
                  .then((src) => { // para jpeg
                    //this.cropper.replace(src);
                    this.imageElement.nativeElement.src = src;
                    //this.crop();

                    this.messageService.hideLoader();

                    this.progresso = 0;

                    this.enableSalvar = true;

                    this.imageLoaded = true;

                    // deixa o resize em background
                    image.resize(Jimp.AUTO, 500).getBase64Async(Jimp.MIME_JPEG).then((src) => {
                      this.imageElement.nativeElement.src = src;
                    });
                  });
              });*/

            }catch(error){
              this.hideLoader();
              throw error;
            }
          }
          reader.readAsDataURL(event.target.files[i]);
        }
    }
  }

  override async salvar(){

    this.enableSalvar = false;

    await this.presentLoading();
    
    try{

      /*Jimp.read(this.imageElement.nativeElement.src).then((image) => {
        // faz o resize da imagem
        image.resize(Jimp.AUTO, 500).getBase64Async(Jimp.MIME_JPEG).then((src) => { 
            fetch(src).then(async(response) => {

              const record = {
                imagem: src,
                legenda:  this.legenda,
                nome: ((this.imagem)? this.imagem.nome:new Date().getTime().toString()),
                colunas: this.colunas
              }; 

              if(!this.imagem){
                this.model.imagens.push(record);
      
                this.atendimentoService.imagem_selecionada = this.model.imagens.length-1;
      
                this.load();

                this.enableNovaImagem = true;
              }else{
                this.model.imagens[this.atendimentoService.imagem_selecionada] = record;
              }

              let blob = await response.blob();

              this.imageService.upload(this.model.id, record.nome, blob).then(() => {
      
                this.atendimentoService.update(this.model).then(resp => {
                  this.messageService.hideLoader();
                  this.messageService.presentToast('Imagem salva com sucesso');
                });
      
              }) .catch(error => {
                console.log(error);
                this.messageService.presentError(error.message);
              });
                
            });
        });
      });*/

    }catch(error){
      this.enableSalvar = true;
      this.hideLoader();
      throw error;
    }
  }

  async rotate(){

    await this.presentLoading();

    try{
      /*Jimp.read(this.imageElement.nativeElement.src).then((image) => {
        image.resize(Jimp.AUTO, 500).rotate(-90).getBase64Async(Jimp.MIME_JPEG).then((src) => { 
          this.imageElement.nativeElement.src = src;
          this.messageService.hideLoader();

          this.enableSalvar = true;
          this.enableNovaImagem = false;
        });
      });*/

    }catch(error){
      this.hideLoader();
      throw error;
    }
  }


  async remover(){
    
    await this.presentLoading();

    const index = this.atendimentoService.imagem_selecionada;

    let imagem = this.model!.imagens[index];

    this.imageService.remover(this.model!.id, imagem.nome).then(() => {

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

  nova() {
    this.enableNovaImagem = false;
    this.atendimentoService.imagem_selecionada = -1;
    this.imageLoaded = false;
    this.load();
    document.getElementById("arquivo")!.click();
  }

}
