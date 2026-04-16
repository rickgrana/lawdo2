import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonTextarea, IonListHeader, IonSelect,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonIcon, IonNote } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { PresenteNoLocal } from 'src/app/models/atendimento.model';

function nomePresenteNaoVazio(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').toString().trim();
  return v.length ? null : { required: true };
}

@Component({
  selector: 'app-preservacao',
  templateUrl: './preservacao.page.html',
  styleUrls: ['./preservacao.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonTextarea, IonListHeader,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption, IonIcon, IonNote
  ]
})
export class PreservacaoPage extends AtendimentoBasePage implements OnInit {

  constructor() {
    super();
    addIcons({ trashOutline });
  }

  readonly orgaosPresentes = ['Polícia Militar', 'Polícia Civil', 'IML'] as const;

  cidades = Cidades;
  bairros = Bairros;

  override loadForm() {

    const presentesFa = this.formBuilder.array<FormGroup>([]);
    const fromModel = this.model!.fields.presentes ?? [];
    fromModel.forEach(p => presentesFa.push(this.createPresenteGroup(p)));

    this.form = this.formBuilder.group({
      preservacao: new FormControl<string>(this.model!.fields.local.preservacao),
      isolamento: new FormControl<string>(this.model!.fields.local.isolamento),
      condicoes: new FormControl<string>(this.model!.fields.local.condicoes),
      presentes: presentesFa
    });

    super.loadForm();
  }

  createPresenteGroup(p?: Partial<PresenteNoLocal>): FormGroup {
    return this.formBuilder.group({
      orgao: new FormControl<string>(p?.orgao ?? 'Polícia Civil'),
      nome: new FormControl<string>(p?.nome ?? '', nomePresenteNaoVazio),
      cargo: new FormControl<string>(p?.cargo ?? ''),
      origem: new FormControl<string>(p?.origem ?? ''),
      veiculo: new FormControl<string>(p?.veiculo ?? '')
    });
  }

  getNomeControl(i: number): AbstractControl | null {
    return this.presentesArray.at(i)?.get('nome') ?? null;
  }

  get presentesArray(): FormArray<FormGroup> {
    return this.form!.get('presentes') as FormArray<FormGroup>;
  }

  adicionarPresente() {
    this.adicionarPresenteComPerfil('livre');
  }

  adicionarPresenteComPerfil(perfil: 'livre' | 'pm' | 'delegado' | 'investigador' | 'iml') {
    let preset: Partial<PresenteNoLocal> = {};
    switch (perfil) {
      case 'pm':
        preset = { orgao: 'Polícia Militar' };
        break;
      case 'delegado':
        preset = { orgao: 'Polícia Civil', cargo: 'Delegado' };
        break;
      case 'investigador':
        preset = { orgao: 'Polícia Civil', cargo: 'Investigador' };
        break;
      case 'iml':
        preset = { orgao: 'IML' };
        break;
      default:
        preset = {};
    }
    this.presentesArray.push(this.createPresenteGroup(preset));
  }

  removerPresente(index: number) {
    this.presentesArray.removeAt(index);
  }

  private marcarPresentesTouched() {
    this.presentesArray.controls.forEach(g => {
      g.get('nome')?.markAsTouched();
    });
  }

  tentarSalvar() {
    if (this.form!.invalid) {
      this.marcarPresentesTouched();
      return;
    }
    this.salvar(this.form!.value);
  }

  override async salvar(record: any) {

    this.model!.fields.dtupdate = new Date();
    this.model!.fields.local.preservacao = record.preservacao;
    this.model!.fields.local.isolamento = record.isolamento;
    this.model!.fields.local.condicoes = record.condicoes;

    const rows: PresenteNoLocal[] = (record.presentes || []).map((r: any) => ({
      orgao: (r.orgao ?? '').trim(),
      nome: (r.nome ?? '').trim(),
      cargo: (r.cargo ?? '').trim(),
      origem: (r.origem ?? '').trim(),
      veiculo: (r.veiculo ?? '').trim()
    })).filter((r: PresenteNoLocal) => !!r.nome);

    this.model!.fields.presentes = rows;

    this.model!.fields.equipes = {
      pc: { presente: true, delegado: '', investigacao: '', vtr: '', origem: '' },
      pm: { presente: true, representante: '', origem: '', vtr: '' }
    };

    await this.presentLoading();

    this.atendimentoService.updatePreservacao(this.model!).then(resp => {
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
