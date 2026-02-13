import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonIcon, IonTextarea, IonRadio, IonListHeader, IonRadioGroup,
    IonList,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';

@Component({
  selector: 'app-local',
  templateUrl: './local.page.html',
  styleUrls: ['./local.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonIcon, IonTextarea, IonRadio, IonListHeader, IonRadioGroup,
    IonList,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton
  ]
})
export class LocalPage extends AtendimentoBasePage implements OnInit {
  cidades = Cidades;
  bairros = Bairros;

  override ngOnInit() {
    this.loadForm();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.loadForm();
    });
  }

  override loadForm() {

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

  override async salvar(record: any) {
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
}
