import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/message.service';
import { Atendimento } from 'src/app/models/atendimento.model';
import { CommonModule } from '@angular/common';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonDatetime, IonInput,
    IonSelect,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonModal, IonDatetimeButton } from '@ionic/angular/standalone';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/authentication.service';
import { AtendimentoService } from 'src/app/services/atendimento.service';
import { map, Observable, startWith } from 'rxjs';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { LoadingController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { DateTimeHelper } from 'src/app/extensions/dateTimeHelper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AutoCompleteComponent } from "src/components/inputs/autocomplete/input-autocomplete.component";

@Component({
  selector: 'app-identificacao',
  templateUrl: './identificacao.page.html',
  styleUrls: ['./identificacao.page.scss'],
  standalone: true,
  imports: [IonDatetimeButton, IonModal, IonBackButton, IonItem, IonButton, ReactiveFormsModule,
    IonGrid, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    IonRow, IonCol, IonLabel, IonSelectOption, IonFooter, IonModal,
    IonInput, IonDatetime, IonSelect,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule, AutoCompleteComponent]
})
export class IdentificacaoPage implements OnInit {

  form!: FormGroup;
  cidades = Cidades;
  bairros = Bairros;

  fields = {

    tipoExame: {
      field: 'tipoExame',
      rules: Validators.compose([
        Validators.required
      ])
    },

    data: {
      field: 'data',
      rules: Validators.compose([
        Validators.required
      ])
    },

    hora: {
      field: 'hora',
      rules: Validators.compose([
        Validators.required
      ])
    },

    protocolo: {
      field: 'protocolo.numero',
      rules: Validators.compose([
        Validators.required
      ])
    },

    protocoloAno: {
      field: 'protocolo.ano',
      rules: Validators.compose([
        Validators.required
      ])
    },

    cidade: {
      field: 'endereco.cidade',
      rules: Validators.compose([
        Validators.required
      ])
    },

    bairro: {
      field: 'endereco.bairro',
      rules: Validators.compose([

      ])
    },

    endereco: {
      field: 'endereco.logradouro',
      rules: Validators.compose([
        Validators.required
      ])
    },

    pontoref: {
      field: 'endereco.pontoref',
      rules: Validators.compose([

      ])
    }
  };

  datePickerObj: any = {
    fromDate: new Date('2019-01-01'), // default null
    toDate: new Date(), // default null
    mondayFirst: false, // default false
    setLabel: 'Selecionar',  // default 'Set'
    todayLabel: 'Hoje', // default 'Today'
    closeLabel: 'Fechar', // default 'Close'
    titleLabel: 'Selecionar Data', // default null
    monthsList: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    weeksList: ["D", "S", "T", "Q", "Q", "S", "S"],
    dateFormat: 'DD/MM/YYYY',
    momentLocale: 'pt-BR', // Default 'en-US'
    yearInAscending: true, // Default false
    btnCloseSetInReverse: true, // Default false
    btnProperties: {
      expand: 'block', // Default 'block'
      fill: '', // Default 'solid'
      size: '', // Default 'default'
      disabled: '', // Default false
      strong: '', // Default false
      color: '' // Default ''
    }
  };

  cidadesOptions!: Observable<string[]>;
  bairrosOptions!: Observable<string[]>;

  constructor(
    private atendimentoService: AtendimentoService,
    private formBuilder: FormBuilder,
    public loadingController: LoadingController,
    public toastController: ToastController,
    private router: Router,
    private auth: AuthenticationService,
    private navCtrl: NavController,
    private messageService: MessageService)
  {
      this.loadForm();
  }

  get model() {
    return this.atendimentoService.model;
  }

  ngOnInit() {
    this.loadForm();

    if(this.model!.isConcluido() || this.model!.isArquivado()){
      this.form.disable();
    }
  }

  loadForm() {

    if (!this.model) {
      this.atendimentoService.model = new Atendimento();
      this.atendimentoService.model.isNew = true;
    }

    const f = this.model!.fields; // atalho

    this.form = this.formBuilder.group({
      tipoExame: new FormControl<string>(f.tipoExame ?? '', Validators.required),
      data: new FormControl<string|null>(f.data.toDate().toISOString() ?? '', Validators.required),
      hora: new FormControl<string>(f.hora ?? '', Validators.required),

      protocolo: new FormControl<string>(f.protocolo?.numero ?? '', Validators.required),
      protocoloAno: new FormControl<string>(f.protocolo?.ano ?? '', Validators.required),

      cidade: new FormControl<string>(f.endereco?.cidade ?? '', Validators.required),
      bairro: new FormControl<string>(f.endereco?.bairro ?? ''),

      endereco: new FormControl<string>(f.endereco?.logradouro ?? '', Validators.required),
      pontoref: new FormControl<string>(f.endereco?.pontoref ?? '')
    });
  }

  filterBairros(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.bairros.filter(option => option.toLowerCase().includes(filterValue));
  }

  async salvar(record: any) {

    Object.entries(this.fields).forEach(([componente, valor]) => {
      const fields = valor.field.split('.');

      /*if (fields.length === 1) {
        this.model!.fields[valor.field] = record[componente];
      }

      if (fields.length === 2) {
        this.model!.fields[fields[0]][fields[1]] = record[componente];
      }

      if (fields.length === 3) {
        this.model!.fields[fields[0]][fields[1]][fields[2]] = record[componente];
      }*/

    });

    const dataAux = DateTimeHelper.dmyToDate(this.model!.fields.data);
    // this.model!.fields.data = dataAux;

    if (this.model!.isNew) {
      // this.model!.fields.perito = this.auth!.user.ref;
      this.model!.fields.dtcriacao =  new Date();
      this.model!.fields.situacao = Atendimento.SIT_ABERTO;
    } else {
      this.model!.fields.dtupdate = new Date();
    }


    if (this.model!.isNew) {

        await this.presentLoading();

        /*this.atendimentoService.create(this.model!)
          .then(async (ref) => {
              this.model!.id = ref.id;
              this.model!.isNew = false;

              this.atendimentoService.model = this.model;

              await this.hideLoader();

              //this.presentAlertSalvo('Dados salvos com sucesso');

              this.voltar();
            })
          .catch(async (error: any) => {

              await this.hideLoader();

              console.log(error);

              this.presentError(error.message);
          });*/


    } else {

        await this.presentLoading();

        /*this.atendimentoService.update(this.model!).then(resp => {
          this.hideLoader();
          this.presentAlertSalvo('Dados alterados com sucesso');

          this.voltar();
        })
          .catch(error => {

            this.hideLoader();

            console.log(error);

            this.presentError(error.message);
          });*/

      }

      // this.model!.fields.data = firestore.Timestamp.fromDate(dataAux);

      this.loadForm();

  }

  voltar(){
    this.atendimentoService.model = this.model;
    this.navCtrl.navigateBack('atendimento/visualizar');

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
      message: 'Erro ao tentar salvar registro' + msg,
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

  bairroSelecionado(valor: string) {
    console.log('Selecionado:', valor);
  }
}
