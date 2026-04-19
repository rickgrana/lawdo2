import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AtendimentoService } from '../../services/atendimento.service';
import { QuesitoService } from '../../services/quesito.service';
import { Quesito } from 'src/app/models/quesito.model';
import { Observable } from 'rxjs';
import { LoadingController } from '@ionic/angular/standalone';
import { MessageService } from 'src/app/services/message.service';
import { IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonLabel, IonButton, IonItem, IonFooter,
     IonModal, ModalController, PopoverController, IonSearchbar,
 } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quesito',
  templateUrl: './quesito.page.html',
  styleUrls: ['./quesito.page.scss'],
  standalone: true,
  imports: [IonItem, IonButton, ReactiveFormsModule, IonSearchbar,
      IonList, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
      IonLabel, IonBackButton, IonFooter,
      CommonModule
    ]
})
export class QuesitoPage implements OnInit {

  form?: FormGroup;
  private loading?: HTMLIonLoadingElement;

  quesitosOptions?: Observable<string[]>;
  respostasOptions?: Observable<string[]>;

  @ViewChild('modal', { static: true }) modal!: IonModal;

  public results: string[] = [];
  public respostas: string[] = [];

  constructor(public modalController: ModalController, 
    private atendimentoService: AtendimentoService,
    private quesitoService: QuesitoService,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private messageService: MessageService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController
  ) { 
      this.loadForm();
  }

  ngOnInit() {
    this.loadForm();
  }

  get model() {
    return this.atendimentoService.model;
  }

  get quesito() {
    return this.atendimentoService.quesito;
  }

  loadForm() {

    this.form = this.formBuilder.group({
      pergunta: new FormControl(this.quesito!.pergunta),
      resposta: new FormControl(this.quesito!.resposta)
    });  

    if(this.model!.isConcluido() || this.model!.isArquivado()){
      this.form.disable();
    }

  }

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toLowerCase() || '';

    if (query.length > 2) {
      this.results = this.quesitoService.catalogoPerguntas.filter((d) => d.toLowerCase().includes(query));
    }

    this.form!.controls['pergunta'].setValue(target.value);
  }

  handleClear() {
    this.results = [];
  }
  selectQuesito(item: string) {
    this.form?.get('pergunta')?.setValue(item);
    this.results = [];
  }


  handleResposta(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toLowerCase() || '';

    if (query.length > 2) {
      this.respostas = this.quesitoService.catalogoRespostas.filter((d) => d.toLowerCase().includes(query));
    }

    this.form!.controls['resposta'].setValue(target.value);
  }

  handleClearResposta() {
    this.respostas = [];
  }
  selectResposta(item: string) {
    this.form?.get('resposta')?.setValue(item);
    this.respostas = [];
  }


  filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.quesitoService.catalogoPerguntas.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterRespostas(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.quesitoService.catalogoRespostas.filter(option => option.toLowerCase().includes(filterValue));
  }

  fechar() {
    this.modalController.dismiss();
  }

  async salvar(record: any) {
    this.quesito!.pergunta = record.pergunta;
    this.quesito!.resposta = record.resposta;

    if (this.quesito!.isNew) {
      this.model!.quesitos.push(this.quesito!);
      this.quesito!.isNew = false;
    }

    await this.presentLoading('Salvando...');

    try {
      await this.atendimentoService.updateQuesitos(this.model!);
      try {
        await this.quesitoService.appendCatalogoEntries(record.pergunta, record.resposta);
      } catch (e) {
        console.error('appendCatalogoEntries', e);
      }
      await this.hideLoader();
      this.fechar();
      this.loadForm();
    } catch (error: any) {
      await this.hideLoader();
      console.log(error);
      await this.presentError(error?.message ?? String(error));
    }
  }

  private async presentLoading(message: string = 'Salvando...') {
    if (this.loading) {
      await this.loading.dismiss();
    }
    this.loading = await this.loadingController.create({
      message,
      showBackdrop: true,
    });
    await this.loading.present();
  }

  private async hideLoader() {
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        if (this.loading) {
          await this.loading.dismiss();
          this.loading = undefined;
        }
        resolve();
      }, 500);
    });
  }

  async presentError(msg: string) {
    await this.messageService.presentError(msg);
  }

}
