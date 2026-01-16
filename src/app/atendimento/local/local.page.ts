import { Component, OnInit } from '@angular/core';
import { AtendimentoService } from '../../services/atendimento.service';
import { FormGroup, FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { DateTimeHelper } from 'src/app/extensions/dateTimeHelper';
import { Router } from '@angular/router';
import { Atendimento } from '../../models/atendimento.model';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon, IonSpinner, IonTextarea, IonRadio, IonListHeader, IonRadioGroup,
    IonList,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonModal } from '@ionic/angular/standalone';
import { AuthenticationService } from 'src/app/authentication.service';
import { CommonModule } from '@angular/common';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-local',
  templateUrl: './local.page.html',
  styleUrls: ['./local.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonIcon, IonSpinner, IonTextarea, IonRadio, IonListHeader, IonRadioGroup,
    IonList,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonModal
  ]
})
export class LocalPage implements OnInit {
  user?: User;
  form?: FormGroup;
  cidades = Cidades;
  bairros = Bairros;

  constructor(
    private authService: AuthenticationService,
    private atendimentoService: AtendimentoService,
    private formBuilder: FormBuilder,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private auth: AuthenticationService,
    private navCtrl: NavController,
    private router: Router) { 
  }

  ngOnInit() {
    this.loadForm();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.loadForm();
    });
  }

  get model() {
    return this.atendimentoService.model;
  }

  loadForm() {
    const formFields = {};

    this.form = this.formBuilder.group({
      localZona: new FormControl<string>(this.model!.fields.local.zona, Validators.compose([
        Validators.required
      ])),
      localNatureza: new FormControl<string>(this.model!.fields.local.natureza, Validators.compose([
        Validators.required
      ])),
      localFuncao: new FormControl<string>(this.model!.fields.local.funcao),
      localTipo: new FormControl<string>(this.model!.fields.local.tipo),
      localConstrucao: new FormControl<string>(this.model!.fields.local.construcao),
      localAcesso: new FormControl<string>(this.model!.fields.local.acesso),
      preservacao: new FormControl<string>(this.model!.fields.local.preservacao),
      isolamento: new FormControl<string>(this.model!.fields.local.isolamento),
      condicoes: new FormControl<string>(this.model!.fields.local.condicoes),
      descricao: new FormControl<string>(this.model!.fields.local.descricao)
    });  

    if(this.model!.isConcluido() || this.model!.isArquivado()){
      this.form.disable();
    }
  }

  async salvar(record: any) {
    this.model!.fields.local.zona = record.localZona;
    this.model!.fields.local.natureza = record.localNatureza;
    this.model!.fields.local.acesso = record.localAcesso;
    this.model!.fields.local.funcao = record.localFuncao;
    this.model!.fields.local.tipo = record.localTipo;
    this.model!.fields.local.construcao = record.localConstrucao;
    this.model!.fields.local.descricao = record.descricao;

    await this.presentLoading();

    this.atendimentoService.updateLocal(this.model!).then(resp => {
      this.hideLoader();
      this.atendimentoService.model = this.model;
      this.navCtrl.navigateBack('atendimento/visualizar');
    })
    .catch(error => {
      this.hideLoader();
      console.log(error);
      this.presentError(error.message);
    });

    this.loadForm();
  }

  async presentAlertSalvo(msg: string) {
    const alert = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'middle'
    });

    await alert.present();
  }

  async presentError(msg: string) {
    const alert = await this.toastController.create({
      message: 'Erro ao tentar salvar registro: ' + msg,
      duration: 2000
    });

    await alert.present();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Processando...',
      showBackdrop: false
    });
    return await loading.present();
  }

  async hideLoader() {
    setTimeout(async () => {
      await this.loadingController.dismiss();
    }, 500);
  }

}
