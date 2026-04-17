import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Atendimento } from '../../models/atendimento.model';
import { ActionSheetController } from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { faFemale } from '@fortawesome/free-solid-svg-icons';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { Vitima } from 'src/app/models/vitima.model';
import { ImageService } from 'src/app/services/image.service';
import { AlertController } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular/standalone';
import { AtendimentoService } from '../../services/atendimento.service';
import { AuthenticationService } from 'src/app/authentication.service';
import { arrowBack, clipboard, pin, create, print, calendar, checkmarkCircle, car, images, documentOutline, lockOpenOutline, flask } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { IonGrid, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonBadge, IonNote,
    IonRow, IonCol, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonIcon, IonButton, IonItem, IonBackButton } from '@ionic/angular/standalone';
import { CommonModule, DatePipe } from '@angular/common';
import { ExportarService } from 'src/app/services/exportar.service';
import { filter } from 'rxjs';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-visualizar',
  templateUrl: './atendimento-visualizar.page.html',
  styleUrls: ['./atendimento-visualizar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonContent, IonItem, IonButton, IonIcon, IonToolbar, IonFooter, IonButtons, IonRow, IonCol, IonLabel,
    IonGrid, IonBadge, IonList, IonTitle, IonHeader, IonBackButton,
    FontAwesomeModule
  ]
})
export class AtendimentoVisualizarPage implements OnInit {

  faHome = faHome;
  faUser = faUser;
  faMale = faMale;
  faFemale = faFemale;
  faQuestion = faQuestion;
  gallery = null;
  user: User | null = null;
  loading?: any;

  constructor(
    private atendimentoService: AtendimentoService,
    private exportarService: ExportarService,
    private router: Router,
    private imageService: ImageService,
    public alertController: AlertController,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private authService: AuthenticationService,
    public actionSheetController: ActionSheetController
    ) {
      addIcons({ arrowBack, clipboard, pin, create, print, calendar, checkmarkCircle, car, images, documentOutline, lockOpenOutline, flask });
    }

  get model() {
    return this.atendimentoService.model;
  }

  async ngOnInit(): Promise<void> {
    if(this.model == null){
      this.router.navigate(['/']);
    } else{
      this.authService.user$.pipe(
        filter(user => !!user)
      ).subscribe((user: User) => {
        this.user = user;
      });

      // Evita overlay "Processando..." da tela anterior (dismiss global na ordem errada).
      await this.dismissAllLoadingOverlays();

      // carrega das imagens
      this.presentLoading('Carregando imagens...');
      try{
        await this.imageService.loadAll(this.model); // carrega as imagens
      } finally {
        this.hideLoader();
      }
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

  async abrirConclusao(model: any) {
    this.atendimentoService.model = model;
    this.router.navigate(['atendimento/conclusao']);
  }

  async abrirVitimas(model: any) {
    this.atendimentoService.model = model;
    this.router.navigate(['atendimento/vitimas']);
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

  async abrirVeiculos(model: any) {
    this.atendimentoService.model = model;
    this.router.navigate(['atendimento/veiculos']);
  }

  async abrirVestigios(model: any) {
    this.atendimentoService.model = model;
    this.router.navigate(['atendimento/vestigios']);
  }

  abrirImagens() {
    this.atendimentoService.imagem_selecionada = -1;
    this.router.navigate(['atendimento/imagens']);
  }

  editarImagem(index: number) {
    this.atendimentoService.imagem_selecionada = index;
    this.router.navigate(['atendimento/image']);
  }

  async removerImagem(index: number){

    await this.presentLoading();

    let imagem = this.model!.imagens[index];

    /*this.imageService.remover(this.model!.id, imagem.nome)
      .then(() => {

      }).catch((error: any) => {
        this.hideLoader();
        this.presentError('Erro ao tentar excluir Imagem: '+ error.message);
      });;
    */

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

    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }

    if(msg === null) msg = 'Processando...';

    this.loading = await this.loadingController.create({
      message: msg,
      showBackdrop: false
    });
    
    return await this.loading.present();

    // return await new Promise(resolve => requestAnimationFrame(resolve));
  }

  /** Remove todos os ion-loading da pilha (ex.: órfão após navegação rápida). */
  private async dismissAllLoadingOverlays(): Promise<void> {
    let top = await this.loadingController.getTop();
    while (top) {
      try {
        await top.dismiss();
      } catch {
        /* já removido */
      }
      top = await this.loadingController.getTop();
    }
    this.loading = null;
  }

  async ionViewDidLeave() {
      if (this.loading) {
        await this.loading.dismiss().catch(() => {});
        this.loading = null;
      }
    }

  async hideLoader() {
    setTimeout(async () => {
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
      }
    }, 500);
  }

  async exportar(){
    this.presentLoading('Gerando Laudo...');

    try{
      await this.exportarService.getLaudo(this.model!, this.user!);
    } catch(error: any){
      this.hideLoader();
      console.log(error);
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

    this.atendimentoService.concluir(this.model!).then(async resp => {
      this.hideLoader();
      await this.presentAlertSalvo('Ocorrência concluída com sucesso');
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
