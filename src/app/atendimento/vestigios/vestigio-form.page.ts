import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { AtendimentoService } from '../../services/atendimento.service';
import { VestigioCategoria } from './enums/vestigio-categoria.enum';
import { CATEGORIAS_VESTIGIOS, TIPOS_POR_CATEGORIA, VestigioItem, getCategoriaByKey } from './vestigios.data';

@Component({
  selector: 'app-vestigio-form',
  templateUrl: './vestigio-form.page.html',
  styleUrls: ['./vestigio-form.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonFooter, IonButton]
})
export class VestigioFormPage implements OnInit {
  categorias = CATEGORIAS_VESTIGIOS;
  form;
  vestigioIndex: number | null = null;
  isEdicao = false;

  constructor(
    private atendimentoService: AtendimentoService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private toastController: ToastController
  ) {
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
    this.route.paramMap.subscribe((params) => {
      const categoriaKeyParam = params.get('categoriaKey');
      const categoriaInicial: VestigioCategoria =
        categoriaKeyParam !== null && getCategoriaByKey(categoriaKeyParam)
          ? (categoriaKeyParam as VestigioCategoria)
          : VestigioCategoria.Fisicos;
      const indexParam = params.get('index');
      const hasIndexParam = indexParam !== null;
      const index = hasIndexParam ? Number(indexParam) : -1;

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

      if (hasIndexParam && !Number.isNaN(index) && index >= 0 && this.atendimentoService.model?.fields?.vestigios?.[index]) {
        const vestigio = this.atendimentoService.model.fields.vestigios[index] as any;
        this.vestigioIndex = index;
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
            tipoOutro: vestigio.tipo
          });
        }
      }
    });
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

  async salvar() {
    if (!this.atendimentoService.model) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      await this.showToast('Preencha os campos obrigatórios.');
      return;
    }

    const value = this.form.value;
    const tipoFinal = value.tipo === 'Outros'
      ? (value.tipoOutro || '').trim()
      : (value.tipo || '').trim();

    if (!tipoFinal) {
      await this.showToast('Informe o tipo do vestígio.');
      return;
    }

    const novoVestigio: VestigioItem = {
      categoria: (value.categoria || VestigioCategoria.Fisicos) as VestigioCategoria,
      tipo: tipoFinal,
      descricao: (value.descricao || '').trim(),
      quantidade: value.quantidade ?? null,
      localizacao: (value.localizacao || '').trim(),
      lacre: (value.lacre || '').trim(),
    };

    let backup: any = null;
    if (this.isEdicao && this.vestigioIndex !== null) {
      backup = this.atendimentoService.model.fields.vestigios[this.vestigioIndex];
      this.atendimentoService.model.fields.vestigios[this.vestigioIndex] = novoVestigio as any;
    } else {
      this.atendimentoService.model.fields.vestigios.push(novoVestigio as any);
    }

    try {
      await this.atendimentoService.updateVestigios(this.atendimentoService.model);
      await this.showToast(this.isEdicao ? 'Vestígio alterado com sucesso.' : 'Vestígio adicionado com sucesso.');
      this.router.navigate(['atendimento/vestigios/categoria', novoVestigio.categoria]);
    } catch (error: any) {
      if (this.isEdicao && this.vestigioIndex !== null) {
        this.atendimentoService.model.fields.vestigios[this.vestigioIndex] = backup;
      } else {
        this.atendimentoService.model.fields.vestigios.pop();
      }
      await this.showToast(error?.message || 'Erro ao salvar vestígio.');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
    });
    await toast.present();
  }
}
