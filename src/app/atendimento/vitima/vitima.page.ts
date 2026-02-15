import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonTextarea, IonListHeader, IonImg, IonList,
    IonRow, IonCol, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';

@Component({
  selector: 'app-vitima',
  templateUrl: './vitima.page.html',
  styleUrls: ['./vitima.page.scss'],
  standalone: true,
  imports: [
      ReactiveFormsModule, CommonModule,
      IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
      IonTextarea, IonListHeader, IonImg, IonList,
      IonRow, IonCol, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption
    ]
})
export class VitimaPage extends AtendimentoBasePage implements OnInit {

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
      pertences: new FormControl<string>(this.vitima!.pertences),
      tatuagens: new FormControl<string>(this.vitima!.tatuagens),
      paf_frente: new FormControl<string>(this.vitima!.paf_frente),
      paf_costas: new FormControl<string>(this.vitima!.paf_costas),
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
    this.vitima!.pertences = record.pertences;
    this.vitima!.tatuagens = record.tatuagens;
    this.vitima!.paf_frente = record.paf_frente;
    this.vitima!.paf_costas = record.paf_costas;
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


  abrir_cabeca_posterior() {

  }

  abrir_cabeca() {

  }

  abrir_cabeca_lateral() {

  }

  editarPorte() {
    this.router.navigate(['/atendimento/vitima/porte']);
  }

  onChangeSexo($event: any){
    //this.rgInput.setFocus();
  }

  onChangePorte($event: any){

    console.log(this.complSelect);

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

}