import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Atendimento } from '../../models/atendimento.model';

import { ActionSheetController } from '@ionic/angular';

import { faHome } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { faFemale } from '@fortawesome/free-solid-svg-icons';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { Vitima } from 'src/app/models/vitima.model';

import { ImageService } from 'src/app/services/image.service';
import { ExportarService } from '../../services/exportar.service';

import { AlertController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';

import { AtendimentoService } from '../../services/atendimento.service';
import { AuthenticationService } from 'src/app/authentication.service';

import Viewer from 'viewerjs';
import { IonHeader } from "@ionic/angular/standalone";

@Component({
  selector: 'app-visualizar',
  templateUrl: './atendimento-visualizar.page.html',
  styleUrls: ['./atendimento-visualizar.page.scss'],
})
export class VisualizarPage implements OnInit {

  faHome = faHome;
  faUser = faUser;
  faMale = faMale;
  faFemale = faFemale;
  faQuestion = faQuestion;

  gallery = null;

  constructor(
    private atendimentoService: AtendimentoService,
    private exportarService: ExportarService,
    private router: Router,
    private imageService: ImageService,
    public alertController: AlertController,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private authenticationService: AuthenticationService,
    public actionSheetController: ActionSheetController
    ) {

    }

  get model() {
    return this.atendimentoService.model;
  }

  ngOnInit() {
    if(this.model == null){
      this.router.navigate(['/']);
    } else{

      // adiciona nos recentes
      /*if(!this.authenticationService.userData.recentes){
        this.authenticationService.userData.recentes = [];
      }

      this.authenticationService.userData.recentes.unshift(this.model.id);

      this.atendimentoService.update(this.model);
      */


      // carrega das imagens
      this.imageService.loadAll(this.model); // carrega as imagens

    }

  }

  async abrirIdentificacao(model: any) {

    this.atendimentoService.model = model;

    this.router.navigate(['atendimento/identificacao']);
  }

  async abrirLocal(model: any) {

    this.atendimentoService.model = model;

    this.router.navigate(['atendimento/local']);
  }

  async abrirPreservacao(model: any) {

    this.atendimentoService.model = model;

    this.router.navigate(['atendimento/preservacao']);
  }

  async abrirLaudo(model: any) {

    this.atendimentoService.model = model;

    this.router.navigate(['atendimento/laudo']);
  }

  async abrirRequisicao(model: any) {

    this.atendimentoService.model = model;

    this.router.navigate(['atendimento/requisicao']);
  }


  async abrirVitima(index: number) {

    const vitima = Vitima.loadFrom(this.atendimentoService.model!.fields.vitimas[index]);

    this.atendimentoService.vitima = vitima;
    this.atendimentoService.vitima_selecionada = index;

    this.router.navigate(['atendimento/vitima']);
  }

  adicionarVitima() {

    this.atendimentoService.vitima = new Vitima();
    this.atendimentoService.vitima_selecionada = -1; // nao selecionado

    this.router.navigate(['atendimento/vitima']);
  }


  async removerVitima(event: any, index: number){

    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Atenção!',
      message: 'Deseja realmente remover esta vítima?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        }, {
          text: 'Sim',
          handler: async() => {
            await this.presentLoading();

            this.model!.fields.vitimas.splice(index, 1);

            this.atendimentoService.update(this.model!).then(resp => {
              this.hideLoader();
              this.presentAlertSalvo('Vítima removida com sucesso');
            })
            .catch((error: any) => {
              this.hideLoader();
              this.presentError(error.message);
            });
          }
        }
      ]
    });

    await alert.present();

  }



  abrirImagens(model: any) {
    this.atendimentoService.imagem_selecionada = -1;
    this.router.navigate(['atendimento/image']);
  }

  editarImagem(index: number) {

    this.atendimentoService.imagem_selecionada = index;

    this.router.navigate(['atendimento/image']);
  }

  async removerImagem(index: number){

    await this.presentLoading();

    let imagem = this.model!.imagens[index];

    this.imageService.remover(this.model!.id, imagem.nome).then(() => {

    }).catch((error: any) => {
      this.hideLoader();
      this.presentError('Erro ao tentar excluir Imagem: '+ error.message);
    });;

    this.model!.imagens.splice(index, 1);

    this.atendimentoService.update(this.model!).then(resp => {
      this.hideLoader();
      this.presentAlertSalvo('Imagem removida com sucesso');
    })
    .catch((error: any) => {
      this.hideLoader();
      this.presentError('Erro ao tentar excluir Imagem (1): '+ error.message);
    });

  }


  async presentAlertSalvo(msg: string) {
    const alert = await this.toastController.create({
      message: msg,
      duration: 2000
    });

    await alert.present();
  }

  async presentError(msg: string) {
    const alert = await this.toastController.create({
      message: msg,
      duration: 2000
    });

    await alert.present();
  }

  async presentLoading(msg: string|null = null) {

    if(msg === null) msg = 'Processando...';

    const loading = await this.loadingController.create({
      message: msg,
      showBackdrop: false
    });
    return await loading.present();

    //return loading.onDidDismiss();
  }

  async hideLoader() {
    setTimeout(async () => {
      await this.loadingController.dismiss();
    }, 500);
  }

  async exportar(){

    this.presentLoading('Gerando Laudo...');

    try{
      await this.exportarService.getLaudo(this.model!);
    }catch(error: any){
      this.hideLoader();
      console.log(error);
      console.log(error!.message);

      this.presentError(error!.message);
      return;
    }

      this.hideLoader();
      this.presentAlertSalvo('Laudo gerado. Baixando...');


  }

  async showAlert(msg: string){
    const alert = await this.alertController.create({  message: msg   });

    return await alert.present();
  }

  async concluir() {


    if(this.model!.isConcluido()){
      await this.showAlert('Ocorrência já Concluída');
      return;
    }

    if(this.model!.isArquivado()){
      await this.showAlert('Ocorrência Arquivada não pode ser concluída');
      return;
    }

    await this.presentLoading();

    this.model!.fields.situacao = Atendimento.SIT_CONCLUIDO;

    this.atendimentoService.update(this.model!).then(resp => {
      this.hideLoader();
      this.presentAlertSalvo('Ocorrência concluída com sucesso');
    })
    .catch((error: any) => {

      this.hideLoader();
      this.showAlert(error.message);
    });
  }


  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opções',
      buttons: [{
        text: 'Exportar',
        icon: 'share',
        handler: () => {
          console.log('Share clicked');
        }
      }, {
        text: 'Duplicar',
        icon: 'arrow-dropright-circle',
        handler: () => {
          console.log('Play clicked');
        }
      }, {
        text: 'Fechar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
    await actionSheet.present();
  }


}
