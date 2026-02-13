import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonTextarea, IonListHeader, IonSelect,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';

@Component({
  selector: 'app-preservacao',
  templateUrl: './preservacao.page.html',
  styleUrls: ['./preservacao.page.scss'],
  standalone: true,
    imports: [
      ReactiveFormsModule, CommonModule,
      IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
      IonTextarea, IonListHeader,
      IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption
    ]
})
export class PreservacaoPage extends AtendimentoBasePage implements OnInit {

  cidades = Cidades;
  bairros = Bairros;

  override loadForm() {

    this.form = this.formBuilder.group({
      preservacao: new FormControl<string>(this.model!.fields.local.preservacao),
      isolamento: new FormControl<string>(this.model!.fields.local.isolamento),
      condicoes: new FormControl<string>(this.model!.fields.local.condicoes),
      eqp_pc: new FormControl<string>(this.model!.fields.equipes.pc.investigacao),
      eqp_pc_origem: new FormControl<string>(this.model!.fields.equipes.pc.origem),
      eqp_pc_vtr: new FormControl<string>(this.model!.fields.equipes.pc.vtr),
      eqp_pc_delta: new FormControl<string>(this.model!.fields.equipes.pc.delegado),
      eqp_pm_vtr: new FormControl<string>(this.model!.fields.equipes.pm.vtr),
      eqp_pm_origem: new FormControl<string>(this.model!.fields.equipes.pm.origem),
      eqp_pm: new FormControl<string>(this.model!.fields.equipes.pm.representante)
    });

    super.loadForm();
  }

  override async salvar(record: any) {

    this.model!.fields.dtupdate = new Date();
    
    await this.presentLoading();

    this.atendimentoService.update(this.model!).then(resp => {
      this.hideLoader();
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
