import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AtendimentoService } from '../../services/atendimento.service';
import { Quesito } from 'src/app/models/quesito.model';
import { Observable } from 'rxjs';
import { LoadingController } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonLabel, IonButton, IonItem,
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
      IonLabel, IonBackButton,
      CommonModule
    ]
})
export class QuesitoPage implements OnInit {

  form?: FormGroup;

  quesitosOptions?: Observable<string[]>;
  respostasOptions?: Observable<string[]>;

  @ViewChild('modal', { static: true }) modal!: IonModal;

  public results: string[] = [];
  public respostas: string[] = [];

  constructor(public modalController: ModalController, 
    private atendimentoService: AtendimentoService,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private toastController: ToastController,
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
      this.results = Quesito.perguntasPadrao.filter((d) => d.toLowerCase().includes(query));
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
      this.respostas = Quesito.respostasPadrao.filter((d) => d.toLowerCase().includes(query));
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
    return Quesito.perguntasPadrao.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterRespostas(value: string): string[] {
    const filterValue = value.toLowerCase();
    return Quesito.respostasPadrao.filter(option => option.toLowerCase().includes(filterValue));
  }

  fechar() {
    this.modalController.dismiss();
  }

  salvar(record: any) {
    this.quesito!.pergunta = record.pergunta;
    this.quesito!.resposta = record.resposta;

    if(this.quesito!.isNew){
      let qtde = this.model!.quesitos.push(this.quesito!);
      this.quesito!.isNew = false;
    }

    this.atendimentoService.updateQuesitos(this.model!).then(resp => {
      this.hideLoader();
      this.fechar();
    })
    .catch(error => {
      this.hideLoader();
      console.log(error);
      this.presentError(error.message);
    });
      
    this.loadForm();
  }

  async hideLoader() {
    setTimeout(async () => {
      await this.loadingController.dismiss();
    }, 500);
  }

  async presentError(msg: string) {
    const alert = await this.toastController.create({
      message: 'Erro ao tentar salvar registro: ' + msg,
      duration: 2000
    });

    await alert.present();
  }

}
