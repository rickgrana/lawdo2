import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { AtendimentoService } from '../../services/atendimento.service';
import { VestigioCategoria } from './enums/vestigio-categoria.enum';
import { CATEGORIAS_VESTIGIOS, getCategoriaByKey, resolveCategoriaKey } from './vestigios.data';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

@Component({
  selector: 'app-vestigios-categoria',
  templateUrl: './vestigios-categoria.page.html',
  styleUrls: ['./vestigios-categoria.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonList, IonItem, IonLabel, IonFooter, IonButton, IonIcon]
})
export class VestigiosCategoriaPage implements OnInit {
  categorias = CATEGORIAS_VESTIGIOS;
  categoriaKey: VestigioCategoria | string = VestigioCategoria.Fisicos;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private atendimentoService: AtendimentoService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ create, trash });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const categoriaParam = params.get('categoriaKey') || VestigioCategoria.Fisicos;
      this.categoriaKey = getCategoriaByKey(categoriaParam) ? categoriaParam : VestigioCategoria.Fisicos;
    });
  }

  get categoriaNome(): string {
    return getCategoriaByKey(this.categoriaKey)?.nome || 'Vestígios';
  }

  get vestigiosCategoria(): Array<{ vestigio: any; index: number }> {
    const vestigios = this.atendimentoService.model?.fields?.vestigios || [];
    return vestigios
      .map((vestigio: any, index: number) => ({ vestigio, index }))
      .filter((item) => resolveCategoriaKey(item.vestigio) === (this.categoriaKey as VestigioCategoria));
  }

  abrirFormulario() {
    this.router.navigate(['atendimento/vestigios/novo', this.categoriaKey]);
  }

  editarVestigio(index: number) {
    this.router.navigate(['atendimento/vestigios/editar', this.categoriaKey, index]);
  }

  async removerVestigio(index: number) {
    if (!this.atendimentoService.model) return;

    const alert = await this.alertController.create({
      header: 'Atenção!',
      message: 'Deseja realmente remover este vestígio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sim',
          handler: async () => {
            const removido = this.atendimentoService.model!.fields.vestigios[index];
            this.atendimentoService.model!.fields.vestigios.splice(index, 1);
            try {
              await this.atendimentoService.updateVestigios(this.atendimentoService.model!);
              await this.showToast('Vestígio removido com sucesso.');
            } catch (error: any) {
              this.atendimentoService.model!.fields.vestigios.splice(index, 0, removido);
              await this.showToast(error?.message || 'Erro ao remover vestígio.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
    });
    await toast.present();
  }
}
