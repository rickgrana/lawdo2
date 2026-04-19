import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { AtendimentoService } from '../../services/atendimento.service';
import { VestigioCategoria } from './enums/vestigio-categoria.enum';
import { CATEGORIAS_VESTIGIOS, TIPOS_POR_CATEGORIA, VestigioItem, getCategoriaByKey } from './vestigios.data';

@Component({
  selector: 'app-vestigio-form',
  templateUrl: './vestigio-form.page.html',
  styleUrls: ['./vestigio-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonFooter,
  ],
})
export class VestigioFormPage implements OnInit {
  categorias = CATEGORIAS_VESTIGIOS;
  form;
  vestigioIndex: number | null = null;
  isEdicao = false;
  saving = false;
  private saveLoading: HTMLIonLoadingElement | null = null;

  /** Categoria ao abrir o modal (nova ou edição nesta lista). `componentProps` do Ionic. */
  @Input() categoriaContext: VestigioCategoria | string = VestigioCategoria.Fisicos;
  /** Índice em `fields.vestigios`; `null` = novo vestígio. */
  @Input() vestigioEditIndex: number | null = null;

  private readonly modalCtrl = inject(ModalController);

  constructor(
    private atendimentoService: AtendimentoService,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {
    addIcons({ close });
    this.form = this.formBuilder.group({
      categoria: new FormControl<VestigioCategoria>(VestigioCategoria.Fisicos, Validators.required),
      tipo: new FormControl<string>('', Validators.required),
      tipoOutro: new FormControl<string>(''),
      descricao: new FormControl<string>('', Validators.required),
      quantidade: new FormControl<number | null>(1),
      localizacao: new FormControl<string>(''),
      lacre: new FormControl<string>(''),
    });
  }

  ngOnInit() {
    const rawCat = this.categoriaContext;
    const categoriaInicial: VestigioCategoria =
      rawCat != null && String(rawCat) !== '' && getCategoriaByKey(String(rawCat))
        ? (rawCat as VestigioCategoria)
        : VestigioCategoria.Fisicos;

    const idx = this.vestigioEditIndex;

    this.vestigioIndex = null;
    this.isEdicao = false;
    this.form.reset({
      categoria: categoriaInicial,
      tipo: '',
      tipoOutro: '',
      descricao: '',
      quantidade: 1,
      localizacao: '',
      lacre: '',
    });

    if (
      idx !== null &&
      idx !== undefined &&
      idx >= 0 &&
      this.atendimentoService.model?.fields?.vestigios?.[idx]
    ) {
      const vestigio = this.atendimentoService.model.fields.vestigios[idx] as any;
      this.vestigioIndex = idx;
      this.isEdicao = true;
      const catV = vestigio.categoria;
      const categoriaPatch: VestigioCategoria =
        typeof catV === 'string' && catV !== '' && getCategoriaByKey(catV)
          ? (catV as VestigioCategoria)
          : categoriaInicial;
      this.form.patchValue({
        categoria: categoriaPatch,
        tipo: vestigio.tipo || '',
        tipoOutro: '',
        descricao: vestigio.descricao || '',
        quantidade: vestigio.quantidade ?? 1,
        localizacao: vestigio.localizacao || '',
        lacre: vestigio.lacre || '',
      });

      if (this.usaTiposPredefinidos && vestigio.tipo && !this.tiposDaCategoriaSelecionada.includes(vestigio.tipo)) {
        this.form.patchValue({
          tipo: 'Outros',
          tipoOutro: vestigio.tipo,
        });
      }
    }
  }

  get categoriaSelecionadaKey(): VestigioCategoria {
    return this.form?.value?.categoria ?? VestigioCategoria.Fisicos;
  }

  get tiposDaCategoriaSelecionada(): string[] {
    return TIPOS_POR_CATEGORIA[this.categoriaSelecionadaKey] || [];
  }

  get tiposDaCategoriaComOutros(): string[] {
    return this.usaTiposPredefinidos ? [...this.tiposDaCategoriaSelecionada, 'Outros'] : [];
  }

  get usaTiposPredefinidos(): boolean {
    return this.tiposDaCategoriaSelecionada.length > 0;
  }

  get selecionouTipoOutros(): boolean {
    return this.usaTiposPredefinidos && this.form?.value?.tipo === 'Outros';
  }

  onCategoriaChange() {
    this.form.patchValue({ tipo: '', tipoOutro: '' });
  }

  fechar() {
    void this.modalCtrl.dismiss();
  }

  async salvar() {
    if (!this.atendimentoService.model || this.saving) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.showToast('Preencha os campos obrigatórios.');
      return;
    }

    const value = this.form.value;
    const tipoFinal =
      value.tipo === 'Outros' ? (value.tipoOutro || '').trim() : (value.tipo || '').trim();

    if (!tipoFinal) {
      this.showToast('Informe o tipo do vestígio.');
      return;
    }

    const rawQ = value.quantidade;
    let quantidade: number | null = null;
    if (rawQ !== null && rawQ !== undefined && String(rawQ).trim() !== '') {
      const n = Number(rawQ);
      quantidade = Number.isFinite(n) ? n : null;
    }

    const novoVestigio: VestigioItem = {
      categoria: (value.categoria || VestigioCategoria.Fisicos) as VestigioCategoria,
      tipo: tipoFinal,
      descricao: (value.descricao || '').trim(),
      quantidade,
      localizacao: (value.localizacao || '').trim(),
      lacre: (value.lacre || '').trim(),
    };

    this.saving = true;
    try {
      await this.presentSaveLoading();
      let backup: any = null;
      try {
        if (this.isEdicao && this.vestigioIndex !== null) {
          backup = this.atendimentoService.model.fields.vestigios[this.vestigioIndex];
          this.atendimentoService.model.fields.vestigios[this.vestigioIndex] = novoVestigio as any;
        } else {
          this.atendimentoService.model.fields.vestigios.push(novoVestigio as any);
        }

        await this.atendimentoService.updateVestigios(this.atendimentoService.model);
      } catch (error: any) {
        if (this.isEdicao && this.vestigioIndex !== null) {
          this.atendimentoService.model.fields.vestigios[this.vestigioIndex] = backup;
        } else {
          this.atendimentoService.model.fields.vestigios.pop();
        }
        this.saving = false;
        await this.dismissSaveLoading();
        this.showToast(error?.message || 'Erro ao salvar vestígio.');
        return;
      }

      this.saving = false;
      await this.dismissSaveLoading();

      this.showToast(this.isEdicao ? 'Vestígio alterado com sucesso.' : 'Vestígio adicionado com sucesso.');
      void this.modalCtrl.dismiss({ saved: true });
    } finally {
      this.saving = false;
      await this.dismissSaveLoading();
    }
  }

  async ionViewDidLeave() {
    await this.dismissSaveLoading();
  }

  private async presentSaveLoading() {
    await this.dismissSaveLoading();
    this.saveLoading = await this.loadingController.create({
      message: 'Salvando...',
      backdropDismiss: false,
    });
    await this.saveLoading.present();
  }

  private async dismissSaveLoading() {
    if (!this.saveLoading) {
      return;
    }
    try {
      await this.saveLoading.dismiss();
    } catch {
      /* já removido */
    }
    this.saveLoading = null;
  }

  /** Não usar async/await: `create()` e `present()` podem não resolver na WebView e travam o fluxo. */
  private showToast(message: string): void {
    void this.toastController
      .create({
        message,
        duration: 2500,
        position: 'bottom',
      })
      .then((toast) => {
        void toast.present();
      })
      .catch(() => {});
  }
}
