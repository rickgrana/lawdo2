import { Component, DestroyRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/message.service';
import { Atendimento } from 'src/app/models/atendimento.model';
import { CommonModule } from '@angular/common';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonDatetime, IonInput,
    IonSelect, IonIcon, IonSpinner,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonModal, IonDatetimeButton,
    ViewWillEnter } from '@ionic/angular/standalone';
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
import { DadosProtocolo, PlanilhaService } from '../../services/planilha.service';
import { ImageService } from 'src/app/services/image.service';
import { locate, search } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { User } from 'src/app/models/user.model';

/** Valores aplicados ao FormGroup ao carregar dados do protocolo */
type ProtocoloIdentPatch = Partial<{
  data: string;
  hora: string;
  tipoExame: string;
  cidade: string;
  bairro: string;
  endereco: string;
  pontoref: string;
  latitude: string;
  longitude: string;
}>;

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
export class IdentificacaoPage implements OnInit, ViewWillEnter {
  @ViewChild('protocoloInput', { read: IonInput }) private protocoloInput?: IonInput;

  private readonly destroyRef = inject(DestroyRef);

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
    },

    latitude: {
      field: 'coordenadas.lat',
      rules: Validators.compose([])
    },

    longitude: {
      field: 'coordenadas.long',
      rules: Validators.compose([])
    }
  };

  loadingProtocolo = false;
  loadingGeolocalizacao = false;

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
    private planilhaService: PlanilhaService,
    private imageService: ImageService)
  {
    addIcons({ search, locate });
  }

  get model() {
    return this.atendimentoService.model;
  }

  ngOnInit() {
    this.atendimentoService.identificacaoRefresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadForm());

    this.loadForm();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.loadForm();
    });
  }

  ionViewWillEnter(): void {
    /** Ionic reutiliza o componente ao voltar à rota; sem isto o form fica com dados da visita anterior. */
    this.loadForm();
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
    const coords = f.coordenadas ?? { lat: 0, long: 0 };
    const proto = f.protocolo ?? { numero: '', ano: '' };
    const protocoloNumero =
      proto.numero != null && proto.numero !== '' ? String(proto.numero) : '';
    const protocoloAnoVal =
      proto.ano != null && proto.ano !== '' ? String(proto.ano) : '';

    this.form = this.formBuilder.group({
      tipoExame: new FormControl<string>(f.tipoExame ?? '', Validators.required),
      data: new FormControl<string|null>(f.data, Validators.required),
      hora: new FormControl<string>(f.hora ?? '', Validators.required),

      protocolo: new FormControl<string>(protocoloNumero, Validators.required),
      protocoloAno: new FormControl<string>(protocoloAnoVal, Validators.required),
      cidade: new FormControl<string>(f.endereco?.cidade ?? '', Validators.required),
      bairro: new FormControl<string>(f.endereco?.bairro ?? ''),

      endereco: new FormControl<string>(f.endereco?.logradouro ?? '', Validators.required),
      pontoref: new FormControl<string>(f.endereco?.pontoref ?? ''),
      latitude: new FormControl<string>(this.coordToInput(coords.lat)),
      longitude: new FormControl<string>(this.coordToInput(coords.long))
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

    let segmentoDriveAnterior: string | null = null;
    if (!this.model!.isNew) {
      segmentoDriveAnterior = this.imageService.buildAnoProtocoloSegment(
        this.model!.fields.protocolo?.ano,
        this.model!.fields.protocolo?.numero
      );
    }

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

    const latParsed = this.parseCoordInput(record.latitude);
    const longParsed = this.parseCoordInput(record.longitude);
    this.model!.fields.coordenadas = {
      lat: latParsed !== null ? latParsed : 0,
      long: longParsed !== null ? longParsed : 0
    };

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
        if (segmentoDriveAnterior !== null) {
          const novoSeg = this.imageService.buildAnoProtocoloSegment(
            this.model!.fields.protocolo?.ano,
            this.model!.fields.protocolo?.numero
          );
          if (segmentoDriveAnterior !== novoSeg) {
            await this.imageService.renameAnoProtocoloDriveFolderIfExists(
              segmentoDriveAnterior,
              novoSeg
            );
          }
        }
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
    await this.messageService.presentError(msg);
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

    this.planilhaService
      .buscarProtocolo(
        this.form.value.protocolo,
        this.form.value.protocoloAno.substring(2, 4),
      )
      .subscribe({
        next: (resp) => {
          if (!resp) {
            this.loadingProtocolo = false;
            void this.messageService.presentErro(
              'Protocolo não encontrado na planilha de protocolos',
            );
            return;
          }

          const patch = this.buildPatchFromProtocolo(resp);
          this.form.patchValue(patch);
          this.form.markAsDirty();
          this.loadingProtocolo = false;
        },
        error: (error: { message?: string }) => {
          this.loadingProtocolo = false;
          void this.messageService.presentErro(
            'Erro ao buscar protocolo: ' + (error?.message ?? ''),
          );
        },
      });
  }

  /** Lê valor do objeto SISREX comparando cabeçalhos sem case e com espaços normalizados */
  private sisrexPick(
    sx: Record<string, string | null> | undefined,
    ...labels: string[]
  ): string | null {
    if (!sx) {
      return null;
    }
    const keys = Object.keys(sx);
    for (const label of labels) {
      const want = this.normalizeHeaderKey(label);
      const k = keys.find((key) => this.normalizeHeaderKey(key) === want);
      if (k !== undefined) {
        const v = sx[k];
        if (v != null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
    }
    return null;
  }

  private normalizeHeaderKey(s: string): string {
    return s
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  private parseDataPericia(raw: string | null | undefined): Date {
    if (!raw?.trim()) {
      return new Date();
    }
    const s = raw.trim();
    if (s.includes('/')) {
      return DateTimeHelper.dmyToDate(s) ?? new Date();
    }
    if (s.includes('-')) {
      return DateTimeHelper.strToDate(s) ?? new Date();
    }
    return new Date();
  }

  /** ion-datetime (time) espera ISO completo no valor do controle */
  private horaParaDatetimeIon(dataBase: Date, horaRaw: string | null | undefined): string {
    if (!horaRaw?.trim()) {
      return dataBase.toISOString();
    }
    const parts = horaRaw.trim().split(':');
    const h = parseInt(parts[0] ?? '0', 10);
    const m = parseInt(parts[1] ?? '0', 10);
    const d = new Date(dataBase);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      return dataBase.toISOString();
    }
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  private matchBairroNaLista(nome: string | null | undefined): string | null {
    if (!nome?.trim()) {
      return null;
    }
    const want = nome
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return (
      Bairros.find(
        (b) =>
          b
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') === want,
      ) ?? null
    );
  }

  private matchTipoExameNaLista(
    valor: string | null | undefined,
  ): string | null {
    if (!valor?.trim() || !this.model) {
      return null;
    }
    const v = valor.trim().toUpperCase();
    const lista = this.model.tipos_exame;
    const exato = lista.find((t) => t.toUpperCase() === v);
    if (exato) {
      return exato;
    }
    return lista.find((t) => v.includes(t.toUpperCase())) ?? null;
  }

  private parseCoordenadasPlanilha(
    raw: string | null | undefined,
  ): { lat: string; long: string } | null {
    if (!raw?.trim()) {
      return null;
    }
    const s = raw.trim();
    const bySep = s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    if (bySep.length >= 2) {
      const lat = parseFloat(bySep[0].replace(',', '.'));
      const lng = parseFloat(bySep[1].replace(',', '.'));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          lat: lat.toFixed(7),
          long: lng.toFixed(7),
        };
      }
    }
    const nums = s.match(/-?\d+[.,]\d+|-?\d+/g);
    if (nums && nums.length >= 2) {
      const lat = parseFloat(nums[0].replace(',', '.'));
      const lng = parseFloat(nums[1].replace(',', '.'));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          lat: lat.toFixed(7),
          long: lng.toFixed(7),
        };
      }
    }
    return null;
  }

  /**
   * Endereço legado (coluna descrição): extrai bairro/cidade do texto.
   */
  private enderecoEBairroDoTextoDescricao(descricao: string | null): {
    endereco: string;
    bairro: string | null;
  } {
    let endereco = descricao ?? '';
    let enderecoNorm = endereco
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let bairro =
      Bairros.find((b) =>
        enderecoNorm.includes(
          b
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''),
        ),
      ) ?? null;

    if (bairro) {
      const bairroNorm = bairro
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const index = enderecoNorm.indexOf(bairroNorm);

      if (index >= 0) {
        endereco =
          descricao!.slice(0, index) + descricao!.slice(index + bairro.length);
      }

      enderecoNorm = endereco
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const indexCidade = enderecoNorm.indexOf('manaus');
      if (indexCidade >= 0) {
        endereco =
          endereco.slice(0, indexCidade) + endereco.slice(indexCidade + 6);
      }

      endereco = endereco
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

    return { endereco, bairro };
  }

  private buildPatchFromProtocolo(resp: DadosProtocolo): ProtocoloIdentPatch {
    const dataRaw = resp.data;
    const dataRef = this.parseDataPericia(dataRaw);
    const horaRaw = resp.hora;

    const patch: ProtocoloIdentPatch = {
      data: dataRef.toISOString(),
      hora: this.horaParaDatetimeIon(dataRef, horaRaw),
    };

    if (resp.fonte === 'SISREX' && resp.sisrex) {
      const sx = resp.sisrex;

      const tipoPlan = this.matchTipoExameNaLista(
        this.sisrexPick(sx, 'TIPO DE EXAME', 'Tipo de Exame'),
      );
      if (tipoPlan) {
        patch.tipoExame = tipoPlan;
      }

      const cidadeNome = this.sisrexPick(sx, 'CIDADE', 'Cidade');
      const cidadeLista = cidadeNome
        ? this.matchCidadeNaLista(cidadeNome)
        : null;
      if (cidadeLista) {
        patch.cidade = cidadeLista;
      }

      const localCol =
        this.sisrexPick(sx, 'LOCAL', 'Local') ?? '';

      patch.endereco = localCol;

      let bairro = this.matchBairroNaLista(
        this.sisrexPick(sx, 'BAIRRO', 'Bairro'),
      );
      if (!bairro && localCol) {
        bairro = this.enderecoEBairroDoTextoDescricao(localCol).bairro;
      }

      if (bairro) {
        patch.bairro = bairro;
      }

      const coords = this.parseCoordenadasPlanilha(
        this.sisrexPick(sx, 'COORDENADAS', 'Coordenadas'),
      );
      if (coords) {
        patch.latitude = coords.lat;
        patch.longitude = coords.long;
      }

      return patch;
    }

    // Registro legado ou SISREX sem objeto (fallback)
    const desc = resp.descricao;
    const { endereco, bairro } = this.enderecoEBairroDoTextoDescricao(desc);

    patch.endereco = endereco;
    if (bairro) {
      patch.bairro = bairro;
    }

    return patch;
  }

  completarComZeros(controlName: string) {
    const control = this.form.get(controlName);
    if (!control) return;

    const valor = (control.value ?? '').toString().replace(/\D/g, '');

    if (!valor) return;

    const valorFormatado = valor.padStart(6, '0');

    control.setValue(valorFormatado, { emitEvent: false });
  }

  private coordToInput(v: number | undefined): string {
    if (v === undefined || v === null || !Number.isFinite(v)) {
      return '';
    }
    if (v === 0) {
      return '';
    }
    return String(v);
  }

  private parseCoordInput(raw: unknown): number | null {
    const s = raw?.toString().trim().replace(',', '.');
    if (!s) {
      return null;
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  /** Correspondência com a lista fixa de cidades do formulário (ion-select). */
  private matchCidadeNaLista(nomeGeocoder: string): string | null {
    const nome = nomeGeocoder.trim();
    if (!nome) {
      return null;
    }
    const lower = nome.toLowerCase();
    const found = this.cidades.find((c) => c.toLowerCase() === lower);
    return found ?? null;
  }

  /**
   * OpenStreetMap Nominatim (uso moderado; requer rede).
   * @see https://operations.osmfoundation.org/policies/nominatim/
   */
  private async buscarEnderecoPorCoordenadas(lat: number, lon: number): Promise<Partial<{
    cidade: string; bairro: string; endereco: string;
  }>> {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(String(lat))}` +
      `&lon=${encodeURIComponent(String(lon))}&format=json`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data: { address?: Record<string, string> } = await res.json();
    const a = data.address ?? {};

    const rua = [
      a['road'] ?? a['pedestrian'] ?? a['path'],
      a['house_number']
    ]
      .filter((x) => x && String(x).trim().length > 0)
      .join(', ')
      .trim();

    const bairro = (
      a['suburb'] ??
      a['neighbourhood'] ??
      a['quarter'] ??
      a['city_district'] ??
      ''
    ).toString().trim();

    const cidadeNome = (
      a['city'] ??
      a['town'] ??
      a['municipality'] ??
      a['village'] ??
      a['county'] ??
      ''
    ).toString().trim();

    const out: Partial<{ cidade: string; bairro: string; endereco: string }> = {};

    const cidadeLista = this.matchCidadeNaLista(cidadeNome);
    if (cidadeLista) {
      out.cidade = cidadeLista;
    }

    if (bairro) {
      out.bairro = bairro;
    }

    if (rua) {
      out.endereco = rua;
    }

    return out;
  }

  async obterLocalizacao(): Promise<void> {
    if (this.form.disabled) {
      return;
    }
    if (!globalThis.navigator?.geolocation) {
      await this.messageService.presentErro(
        'Geolocalização não é suportada neste navegador.',
      );
      return;
    }

    this.loadingGeolocalizacao = true;

    globalThis.navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let extras: Partial<{ cidade: string; bairro: string; endereco: string }> = {};

          try {
            extras = await this.buscarEnderecoPorCoordenadas(lat, lng);
          } catch {
            await this.messageService.presentToast(
              'Coordenadas obtidas; não foi possível preencher o endereço automaticamente.',
            );
          }

          this.form.patchValue({
            latitude: lat.toFixed(7),
            longitude: lng.toFixed(7),
            ...extras
          });
          this.form.markAsDirty();
        } finally {
          this.loadingGeolocalizacao = false;
        }
      },
      async (err) => {
        this.loadingGeolocalizacao = false;
        let msg = 'Não foi possível obter a localização.';
        if (err.code === 1) {
          msg = 'Permissão de localização negada.';
        } else if (err.code === 2) {
          msg = 'Localização indisponível.';
        } else if (err.code === 3) {
          msg = 'Tempo esgotado ao obter a localização.';
        }
        await this.messageService.presentErro(msg);
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
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
