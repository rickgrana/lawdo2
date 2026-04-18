import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/message.service';
import { Atendimento } from 'src/app/models/atendimento.model';
import { CommonModule } from '@angular/common';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonDatetime, IonInput,
    IonSelect, IonIcon, IonSpinner,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonModal, IonDatetimeButton } from '@ionic/angular/standalone';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/authentication.service';
import { AtendimentoService } from 'src/app/services/atendimento.service';
import { filter, map, Observable, startWith } from 'rxjs';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { LoadingController } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { NavController, AlertController } from '@ionic/angular/standalone';
import { DateTimeHelper } from 'src/app/extensions/dateTimeHelper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PlanilhaService } from '../../services/planilha.service';
import { search } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-identificacao',
  templateUrl: './identificacao.page.html',
  styleUrls: ['./identificacao.page.scss'],
  standalone: true,
  imports: [IonDatetimeButton, IonModal, IonBackButton, IonItem, IonButton, FormsModule, ReactiveFormsModule,
    IonGrid, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    IonRow, IonCol, IonLabel, IonSelectOption, IonFooter,
    IonInput, IonDatetime, IonSelect, IonIcon, IonSpinner,
    CommonModule,
    MatAutocompleteModule, MatFormFieldModule, MatInputModule,
  ]
})
export class IdentificacaoPage implements OnInit {
  @ViewChild('protocoloInput', { read: IonInput }) private protocoloInput?: IonInput;

  form!: FormGroup;
  user: User | null = null;
  /** Loader do salvamento — dismiss explícito evita fechar o overlay da próxima rota (race com visualizar). */
  private saveLoading: HTMLIonLoadingElement | null = null;
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

  loadingProtocolo = false;

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
    private alertController: AlertController,
    private router: Router,
    private authService: AuthenticationService,
    private navCtrl: NavController,
    private messageService: MessageService,
    private planilhaService: PlanilhaService)
  {
    addIcons({ search });
  }

  get model() {
    return this.atendimentoService.model;
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

  ionViewDidEnter(): void {
    if (!this.model || this.model.isConcluido() || this.model.isArquivado()) {
      return;
    }
    setTimeout(() => {
      void this.protocoloInput?.setFocus();
    }, 150);
  }

  loadForm() {

    if (!this.model) {
      this.atendimentoService.model = new Atendimento();
      this.atendimentoService.model.isNew = true;
      this.atendimentoService.model.fields.tipoExame = 'LOCAL DE ENCONTRO DE CADÁVER';
      this.atendimentoService.model.fields.data = new Date().toISOString();
      this.atendimentoService.model.fields.protocolo.ano = new Date().getFullYear().toString();
      this.atendimentoService.model.fields.endereco.cidade = 'MANAUS';
    }

    const f = this.model!.fields; // atalho

    this.form = this.formBuilder.group({
      tipoExame: new FormControl<string>(f.tipoExame ?? '', Validators.required),
      data: new FormControl<string|null>(f.data, Validators.required),
      hora: new FormControl<string>(f.hora ?? '', Validators.required),

      protocolo: new FormControl<string>(f.protocolo?.numero ?? '', Validators.required),
      protocoloAno: new FormControl<string>(f.protocolo.ano, Validators.required),
      cidade: new FormControl<string>(f.endereco?.cidade ?? '', Validators.required),
      bairro: new FormControl<string>(f.endereco?.bairro ?? ''),

      endereco: new FormControl<string>(f.endereco?.logradouro ?? '', Validators.required),
      pontoref: new FormControl<string>(f.endereco?.pontoref ?? '')
    });

    this.cidadesOptions = this.form.get('cidade')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterCidades(value.toString()))
      );

    this.bairrosOptions = this.form.get('bairro')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterBairros(value.toString()))
      );
      
    if(this.model!.isConcluido() || this.model!.isArquivado()){
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  filterCidades(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.cidades.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterBairros(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.bairros.filter(option => option.toLowerCase().includes(filterValue));
  }

  async salvar(record: any) {

    if (this.model!.isNew) {
      this.model!.fields.perito = this.user!.ref;
      this.model!.fields.dtcriacao =  new Date();
      this.model!.fields.situacao = Atendimento.SIT_ABERTO;
    } else {
      this.model!.fields.dtupdate = new Date();
    }

    this.model!.fields.tipoExame = record.tipoExame;
    this.model!.fields.data = record.data;
    this.model!.fields.hora = record.hora;
    this.model!.fields.protocolo.numero = record.protocolo;
    this.model!.fields.protocolo.ano = record.protocoloAno;
    this.model!.fields.endereco.cidade = record.cidade;
    this.model!.fields.endereco.bairro = record.bairro;
    this.model!.fields.endereco.logradouro = record.endereco;
    this.model!.fields.endereco.pontoref = record.pontoref;

    if (this.model!.isNew) {
      await this.presentLoading();
      try {
        const ref = await this.atendimentoService.create(this.model!);
        this.model!.id = ref.id;
        this.model!.isNew = false;
        this.atendimentoService.model = this.model;

        await this.hideLoader();

        this.form.markAsPristine();
        await this.presentAlertSalvo('Dados salvos com sucesso');
        this.voltar();
      } catch (error: any) {
        await this.hideLoader();
        console.log(error);
        this.presentError(error.message);
      }
    } else {
      await this.presentLoading();
      try {
        await this.atendimentoService.updateIdentificacao(this.model!);
        await this.hideLoader();
        this.form.markAsPristine();
        await this.presentAlertSalvo('Dados alterados com sucesso');
        this.voltar();
      } catch (error: any) {
        await this.hideLoader();
        console.log(error);
        this.presentError(error.message);
      }
    }

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
    await this.dismissSaveLoading();
    this.saveLoading = await this.loadingController.create({
      message: 'Processando...',
      showBackdrop: false
    });
    return this.saveLoading.present();
  }

  async hideLoader() {
    await this.dismissSaveLoading();
  }

  private async dismissSaveLoading(): Promise<void> {
    if (!this.saveLoading) {
      return;
    }
    try {
      await this.saveLoading.dismiss();
    } catch {
      /* overlay já encerrado */
    }
    this.saveLoading = null;
  }

  bairroSelecionado(valor: string) {
    console.log('Selecionado:', valor);
  }

  async carregarProtocolo() {
    this.loadingProtocolo = true;

    this.planilhaService.buscarProtocolo(this.form.value.protocolo, this.form.value.protocoloAno.substring(2,4))
      .subscribe(resp => {
        if (!resp) {
          this.loadingProtocolo = false;
          this.messageService.alert('Protocolo não encontrado na planilha de protocolos');
        }

        let data = DateTimeHelper.dmyToDate(resp!.data ?? '') ?? new Date();
        let endereco = resp!.descricao;
        let enderecoNorm = resp!.descricao!.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        // localiza o bairro
        let bairro = Bairros.find(bairro =>
          enderecoNorm.includes(bairro
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
          )
        ) ?? null

        if (bairro) {
          // remove o bairro e cidade do endereço
          let bairroNorm = bairro!.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');

          const index = enderecoNorm.indexOf(bairroNorm);

          if (index >= 0) {
            endereco = resp!.descricao!.slice(0, index) + resp!.descricao!.slice(index + bairro.length);
          }

          // remove a cidade
          enderecoNorm = endereco!.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

          const indexCidade = enderecoNorm.indexOf('manaus');
          if (indexCidade >= 0) {
            endereco = endereco!.slice(0, indexCidade) + endereco!.slice(indexCidade + 6);
          }

          endereco = endereco!
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+,/g, ',')
            .replace(/,\s*,/g, ',')
            .replace(/\s[-–—]\s/g, '')
            .replace(/\s*-\s*/g, '')
            .replace(/\s-\s/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .replace(/[\r\n].*$/s, '')
            .replace(/,+$/g, '')
            .trim();
        }

        this.form.patchValue({
          data: data.toISOString(),
          hora: resp!.hora,
          endereco,
          bairro
        });

        this.loadingProtocolo = false;
      }, error => {
        this.loadingProtocolo = false;
        this.messageService.alert('Erro ao buscar protocolo: ' + error.message);
      })
  }

  completarComZeros(controlName: string) {
    const control = this.form.get(controlName);
    if (!control) return;

    const valor = (control.value ?? '').toString().replace(/\D/g, '');

    if (!valor) return;

    const valorFormatado = valor.padStart(6, '0');

    control.setValue(valorFormatado, { emitEvent: false });
  }

  hasUnsavedFormChanges(): boolean {
    return !!this.form?.dirty && !this.form.disabled;
  }

  async confirmLeaveIfDirty(): Promise<boolean> {
    if (!this.hasUnsavedFormChanges()) {
      return true;
    }
    return new Promise((resolve) => {
      void this.alertController
        .create({
          backdropDismiss: false,
          header: 'Alterações não salvas',
          message:
            'Há alterações no formulário que precisam ser salvas. Deseja sair mesmo assim?',
          buttons: [
            {
              text: 'Continuar editando',
              role: 'cancel',
              handler: () => resolve(false),
            },
            {
              text: 'Sair',
              handler: () => resolve(true),
            },
          ],
        })
        .then((a) => a.present());
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedFormChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
