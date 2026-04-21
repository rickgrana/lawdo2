import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  bagHandleOutline,
  bandageOutline,
  bodyOutline,
  colorPaletteOutline,
  documentTextOutline,
  idCardOutline,
  shirtOutline,
  trashOutline,
} from 'ionicons/icons';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonTextarea, IonListHeader, IonImg, IonList,
    IonRow, IonCol, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption, IonIcon, ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { MapaPage } from './mapa/mapa.page';
import { MapaVisao } from './mapa/mapa-visao.enum';
import { obterPertencesItensParaDocumento, obterTatuagensItensParaDocumento, PertenceVitima, serializarPertencesParaCampoTexto, serializarTatuagensParaCampoTexto, TatuagemVitima } from 'src/app/models/vitima.model';

@Component({
  selector: 'app-vitima',
  templateUrl: './vitima.page.html',
  styleUrls: ['./vitima.page.scss'],
  standalone: true,
  imports: [
      ReactiveFormsModule, CommonModule,
      IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
      IonTextarea, IonListHeader, IonImg, IonList,
      IonRow, IonCol, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption, IonIcon
    ]
})
export class VitimaPage extends AtendimentoBasePage implements OnInit {

  protected readonly modalCtrl = inject(ModalController);
  readonly MapaVisao = MapaVisao;
  readonly regioesTatuagem = [
    'Couro cabeludo',
    'Testa',
    'Face',
    'Têmpora direita',
    'Têmpora esquerda',
    'Orelha direita',
    'Orelha esquerda',
    'Região retroauricular direita',
    'Região retroauricular esquerda',
    'Nuca',
    'Pescoço anterior',
    'Pescoço lateral direito',
    'Pescoço lateral esquerdo',
    'Pescoço posterior',
    'Ombro direito',
    'Ombro esquerdo',
    'Clavícula direita',
    'Clavícula esquerda',
    'Peito direito',
    'Peito esquerdo',
    'Região esternal',
    'Costela direita',
    'Costela esquerda',
    'Abdômen',
    'Dorso superior',
    'Dorso médio',
    'Dorso inferior',
    'Axila direita',
    'Axila esquerda',
    'Braço direito',
    'Braço esquerdo',
    'Cotovelo direito',
    'Cotovelo esquerdo',
    'Antebraço direito',
    'Antebraço esquerdo',
    'Punho direito',
    'Punho esquerdo',
    'Mão direita',
    'Mão esquerda',
    'Dedos da mão direita',
    'Dedos da mão esquerda',
    'Região glútea direita',
    'Região glútea esquerda',
    'Quadril direito',
    'Quadril esquerdo',
    'Virilha direita',
    'Virilha esquerda',
    'Coxa direita',
    'Coxa esquerda',
    'Joelho direito',
    'Joelho esquerdo',
    'Perna direita',
    'Perna esquerda',
    'Tornozelo direito',
    'Tornozelo esquerdo',
    'Pé direito',
    'Pé esquerdo',
    'Dedos do pé direito',
    'Dedos do pé esquerdo',
  ] as const;

  constructor() {
    super();
    addIcons({
      trashOutline,
      idCardOutline,
      bodyOutline,
      shirtOutline,
      bagHandleOutline,
      colorPaletteOutline,
      documentTextOutline,
      bandageOutline,
    });
  }

  @ViewChild("rg", { read: ElementRef, static: true}) rgInput?: ElementRef;
  @ViewChild("compleicao", { static: true}) complSelect: any;
  @ViewChild("estatura", { static: true}) estaturaSelect: any;
  @ViewChild("localizacao", { static: true}) localizacaoInput: any;
  @ViewChild("etnia", { static: true}) etniaSelect: any;
  @ViewChild("tipoCabelo", { static: true}) tipoCabeloSelect: any;
  @ViewChild("corCabelo", { static: true}) corCabeloSelect: any;
  @ViewChild("comprCabelo", { static: true}) comprCabeloSelect: any;
  @ViewChild("posicao", { static: true}) posicaoSelect: any;
  @ViewChild("estado", { static: true}) estadoSelect: any;
  
  errorMessage = '';
  successMessage = '';

  override ngOnInit() {
    if(this.vitima == null){
      this.router.navigate(['/']);
    }
    
    super.ngOnInit();
  }

  get vitima() {
    return this.atendimentoService.vitima;
  }

  override loadForm() {

    this.form = this.formBuilder.group({
      identificada: new FormControl<string|boolean>(this.vitima!.identificada),
      nome: new FormControl<string>(this.vitima!.nome),
      sexo: new FormControl<string>(this.vitima!.sexo),
      rg: new FormControl<string>(this.vitima!.rg),
      idade: new FormControl<number>(this.vitima!.idade),
      condicoes: new FormControl<string>(this.vitima!.condicoes),
      porte: new FormControl<string>(this.vitima!.porte),
      complfisica: new FormControl<string>(this.vitima!.complfisica),
      estatura: new FormControl<string>(this.vitima!.estatura),
      etnia: new FormControl<string>(this.vitima!.etnia),
      cabeloTipo: new FormControl<string>(this.vitima!.cabelo.tipo),
      cabeloCor: new FormControl<string>(this.vitima!.cabelo.cor),
      cabeloCompr: new FormControl<string>(this.vitima!.cabelo.comprimento),
      posicao: new FormControl<string>(this.vitima!.posicao),
      estado: new FormControl<string>(this.vitima!.estado),
      localizacao: new FormControl<string>(this.vitima!.localizacao),
      vestCabeca: new FormControl<string>(this.vitima!.vestes.cabeca),
      vestCalcados: new FormControl<string>(this.vitima!.vestes.calcados),
      vestSuperior: new FormControl<string>(this.vitima!.vestes.superior),
      vestInferior: new FormControl<string>(this.vitima!.vestes.inferior),
      pertencesItems: this.criarPertencesFormArray(),
      tatuagensItems: this.criarTatuagensFormArray(),
      paf_frente: new FormControl<string>(this.vitima!.paf_frente),
      paf_costas: new FormControl<string>(this.vitima!.paf_costas),
      paf_mapa_marcacoes: new FormControl<string>(this.vitima!.paf_mapa_marcacoes),
      vestigios: new FormControl<any[]>(this.vitima!.vestigios ?? []),
      observacoes: new FormControl<string>(this.vitima!.observacoes)
    });

    super.loadForm();
  }

  override async salvar(record: any) {

    this.model!.fields.dtupdate = new Date();

    let isNew = true;
    this.vitima!.identificada = record.identificada;
    this.vitima!.nome = record.nome;
    this.vitima!.sexo = record.sexo;
    this.vitima!.rg = record.rg;
    this.vitima!.idade = record.idade;
    this.vitima!.condicoes = record.condicoes;
    this.vitima!.porte = record.porte;
    this.vitima!.complfisica = record.complfisica;
    this.vitima!.estatura = record.estatura;
    this.vitima!.etnia = record.etnia;
    this.vitima!.cabelo.tipo = record.cabeloTipo;
    this.vitima!.cabelo.cor = record.cabeloCor;
    this.vitima!.cabelo.comprimento = record.cabeloCompr;
    this.vitima!.posicao = record.posicao;
    this.vitima!.estado = record.estado;
    this.vitima!.localizacao = record.localizacao;
    this.vitima!.vestes.cabeca = record.vestCabeca;
    this.vitima!.vestes.calcados = record.vestCalcados;
    this.vitima!.vestes.superior = record.vestSuperior;
    this.vitima!.vestes.inferior = record.vestInferior;
    const pertencesLista = this.coletarPertencesDoFormulario();
    this.vitima!.pertencesLista = pertencesLista;
    this.vitima!.pertences = serializarPertencesParaCampoTexto(pertencesLista);
    const tatuagensLista = this.coletarTatuagensDoFormulario();
    this.vitima!.tatuagensLista = tatuagensLista;
    this.vitima!.tatuagens = serializarTatuagensParaCampoTexto(tatuagensLista);
    this.vitima!.paf_frente = record.paf_frente;
    this.vitima!.paf_costas = record.paf_costas;
    this.vitima!.paf_mapa_marcacoes = record.paf_mapa_marcacoes ?? '';
    this.vitima!.vestigios = Array.isArray(record.vestigios) ? record.vestigios : (this.vitima!.vestigios ?? []);
    this.vitima!.observacoes = record.observacoes;

    if(this.vitima!.isNewRecord()) {
      this.model!.fields.vitimas.push(this.vitima!);
      this.vitima!.setIsNewRecord(false);
    } else {
      isNew = false;
      this.model!.fields.vitimas[this.atendimentoService.vitima_selecionada] = this.vitima!;
    }

    this.presentLoading();

    this.atendimentoService.updateVitimas(this.model!).then(async(resp) => {
      this.hideLoader();

      if(!isNew){
        this.presentAlertSalvo('Dados alterados com sucesso');
      }else {
        await this.presentAlertSalvo('Vítima salva com sucesso');
        this.router.navigate(['/atendimento/vitimas']);
      }
    })
    .catch(error => {
      this.hideLoader();
      this.presentError(error.message);
    });
      
    this.loadForm();
  }


  async abrirMapa(visao: MapaVisao) {
    const modal = await this.modalCtrl.create({
      component: MapaPage,
      componentProps: { visaoEntrada: visao, formularioVitima: this.form },
      cssClass: 'mapa-modal',
    });
    await modal.present();
  }

  editarPorte() {
    this.router.navigate(['/atendimento/vitima/porte']);
  }

  onChangeSexo($event: any){
    //this.rgInput.setFocus();
  }

  onChangePorte($event: any){
    setTimeout(() => {
      this.complSelect.open();
    }, 100);
  }

  onChangeCompl($event: any){
    this.estaturaSelect.open();
  }

  onChangeEstatura($event: any){
    this.etniaSelect.open();
  }

  onChangeEtnia($event: any){
    this.tipoCabeloSelect.open();
  }

  onChangeTipo($event: any){
    this.corCabeloSelect.open();
  }

  onChangeCor($event: any){
    this.comprCabeloSelect.open();
  }

  onChangeCompr($event: any){
    this.posicaoSelect.open();
  }

  onChangePosicao($event: any){
    this.estadoSelect.open();
  }

  onChangeEstado($event: any){
    this.localizacaoInput.setFocus();
  }

  get pertencesItems(): FormArray<FormGroup> {
    return this.form!.get('pertencesItems') as FormArray<FormGroup>;
  }

  adicionarPertence() {
    this.pertencesItems.push(this.novoGrupoPertence());
  }

  removerPertence(index: number) {
    if (index < 0 || index >= this.pertencesItems.length) {
      return;
    }
    this.pertencesItems.removeAt(index);
  }

  get tatuagensItems(): FormArray<FormGroup> {
    return this.form!.get('tatuagensItems') as FormArray<FormGroup>;
  }

  adicionarTatuagem() {
    this.tatuagensItems.push(this.novoGrupoTatuagem());
  }

  removerTatuagem(index: number) {
    if (index < 0 || index >= this.tatuagensItems.length) {
      return;
    }
    this.tatuagensItems.removeAt(index);
  }

  private criarPertencesFormArray(): FormArray<FormGroup> {
    const inicial = obterPertencesItensParaDocumento(this.vitima!);
    return new FormArray<FormGroup>(inicial.map((item) => this.novoGrupoPertence(item)));
  }

  private novoGrupoPertence(item?: PertenceVitima): FormGroup {
    const q = item?.quantidade;
    const qNum = Number(q);
    const quantidade = Number.isFinite(qNum) && qNum > 0 ? Math.floor(qNum) : 1;
    return this.formBuilder.group({
      quantidade: new FormControl<number>(quantidade, { nonNullable: true }),
      descricao: new FormControl<string>(item?.descricao ?? '', { nonNullable: true }),
    });
  }

  private coletarPertencesDoFormulario(): PertenceVitima[] {
    return this.pertencesItems.controls
      .map((ctrl) => {
        const g = ctrl as FormGroup;
        const qRaw = Number(g.get('quantidade')?.value);
        const q = Number.isFinite(qRaw) && qRaw > 0 ? Math.floor(qRaw) : 1;
        const descricao = String(g.get('descricao')?.value ?? '').trim();
        return { quantidade: q, descricao };
      })
      .filter((item) => item.descricao.length > 0);
  }

  private criarTatuagensFormArray(): FormArray<FormGroup> {
    const inicial = obterTatuagensItensParaDocumento(this.vitima!);
    return new FormArray<FormGroup>(inicial.map((item) => this.novoGrupoTatuagem(item)));
  }

  private novoGrupoTatuagem(item?: TatuagemVitima): FormGroup {
    return this.formBuilder.group({
      regiao: new FormControl<string>(item?.regiao ?? '', { nonNullable: true }),
      descricao: new FormControl<string>(item?.descricao ?? '', { nonNullable: true }),
    });
  }

  private coletarTatuagensDoFormulario(): TatuagemVitima[] {
    return this.tatuagensItems.controls
      .map((ctrl) => {
        const g = ctrl as FormGroup;
        const regiao = String(g.get('regiao')?.value ?? '').trim();
        const descricao = String(g.get('descricao')?.value ?? '').trim();
        return { regiao, descricao };
      })
      .filter((item) => item.regiao.length > 0 || item.descricao.length > 0);
  }

}