import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { Bairros } from 'src/app/extensions/bairroHelper';
import { Cidades } from 'src/app/extensions/cidadeHelper';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonTextarea, IonListHeader, IonSelect,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton, IonSelectOption, IonIcon, IonNote, ActionSheetController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { PresenteNoLocal } from 'src/app/models/atendimento.model';

function nomePresenteNaoVazio(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').toString().trim();
  return v.length ? null : { required: true };
}

const ORGAOS_PREDEFINIDOS = ['Polícia Militar', 'Polícia Civil', 'IML'] as const;

function orgaoOutroSeNecessarioValidator(g: AbstractControl): ValidationErrors | null {
  const fg = g as FormGroup;
  const tipo = fg.get('orgaoTipo')?.value;
  const outro = (fg.get('orgaoOutro')?.value ?? '').toString().trim();
  if (tipo === 'Outro' && !outro.length) {
    return { orgaoOutro: true };
  }
  return null;
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

  private actionSheetController = inject(ActionSheetController);

  constructor() {
    super();
    addIcons({ trashOutline });
  }

  readonly ORGAO_OUTRO = 'Outro';
  /** Lista do select: predefinidos + Outro (texto livre). */
  readonly orgaosSelect: readonly string[] = [...ORGAOS_PREDEFINIDOS, 'Outro'];

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

  createPresenteGroup(p?: Partial<PresenteNoLocal>, iniciarOrgaoComoOutro = false): FormGroup {
    const o = (p?.orgao ?? '').trim();
    const isPredef = (ORGAOS_PREDEFINIDOS as readonly string[]).includes(o);
    let orgaoTipoValor: string;
    let orgaoOutroValor: string;
    if (iniciarOrgaoComoOutro && !o.length) {
      orgaoTipoValor = this.ORGAO_OUTRO;
      orgaoOutroValor = '';
    } else if (o && isPredef) {
      orgaoTipoValor = o;
      orgaoOutroValor = '';
    } else if (o) {
      orgaoTipoValor = this.ORGAO_OUTRO;
      orgaoOutroValor = o;
    } else {
      orgaoTipoValor = 'Polícia Civil';
      orgaoOutroValor = '';
    }
    return this.formBuilder.group(
      {
        orgaoTipo: new FormControl<string>(orgaoTipoValor),
        orgaoOutro: new FormControl<string>(orgaoOutroValor),
        nome: new FormControl<string>(p?.nome ?? '', nomePresenteNaoVazio),
        cargo: new FormControl<string>(p?.cargo ?? ''),
        origem: new FormControl<string>(p?.origem ?? ''),
        veiculo: new FormControl<string>(p?.veiculo ?? '')
      },
      { validators: [orgaoOutroSeNecessarioValidator] }
    );
  }

  getNomeControl(i: number): AbstractControl | null {
    return this.presentesArray.at(i)?.get('nome') ?? null;
  }

  isOrgaoOutro(i: number): boolean {
    return this.presentesArray.at(i)?.get('orgaoTipo')?.value === this.ORGAO_OUTRO;
  }

  get presentesArray(): FormArray<FormGroup> {
    return this.form!.get('presentes') as FormArray<FormGroup>;
  }

  adicionarPresente() {
    this.adicionarPresenteComPerfil('livre');
  }

  async abrirMenuAdicionarPresente() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Adicionar presente',
      buttons: [
        {
          text: 'Adicionar PM',
          icon: 'shield-outline',
          handler: () => {
            this.adicionarPresenteComPerfil('pm');
          }
        },
        {
          text: 'Adicionar Delegado',
          icon: 'briefcase-outline',
          handler: () => {
            this.adicionarPresenteComPerfil('delegado');
          }
        },
        {
          text: 'Adicionar Investigador',
          icon: 'search-outline',
          handler: () => {
            this.adicionarPresenteComPerfil('investigador');
          }
        },
        {
          text: 'Adicionar IML',
          icon: 'flask-outline',
          handler: () => {
            this.adicionarPresenteComPerfil('iml');
          }
        },
        {
          text: 'Adicionar Outros',
          icon: 'person-add-outline',
          handler: () => {
            this.adicionarPresenteComPerfil('outros');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  adicionarPresenteComPerfil(perfil: 'livre' | 'pm' | 'delegado' | 'investigador' | 'iml' | 'outros') {
    if (perfil === 'outros') {
      this.presentesArray.push(this.createPresenteGroup({}, true));
      return;
    }
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
      g.markAsTouched();
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

    const rows: PresenteNoLocal[] = (record.presentes || []).map((r: any) => {
      const tipo = (r.orgaoTipo ?? '').toString().trim();
      const outro = (r.orgaoOutro ?? '').toString().trim();
      const orgao = tipo === this.ORGAO_OUTRO ? outro : tipo;
      return {
        orgao,
        nome: (r.nome ?? '').trim(),
        cargo: (r.cargo ?? '').trim(),
        origem: (r.origem ?? '').trim(),
        veiculo: (r.veiculo ?? '').trim()
      };
    }).filter((r: PresenteNoLocal) => !!r.nome);

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
