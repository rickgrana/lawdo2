import { Component } from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  IonBadge,
  ModalController,
  AlertController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoService } from '../../services/atendimento.service';
import { VestigioCategoria } from './enums/vestigio-categoria.enum';
import { CATEGORIAS_VESTIGIOS, CategoriaVestigio, resolveCategoriaKey } from './vestigios.data';
import { create, trash } from 'ionicons/icons';
import { addIcons } from 'ionicons';

export interface VestigioGrupoLinha {
  vestigio: any;
  index: number;
}

@Component({
  selector: 'app-vestigios',
  templateUrl: './vestigios.page.html',
  styleUrls: ['./vestigios.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonAccordionGroup,
    IonAccordion,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButton,
    IonFooter,
  ],
})
export class VestigiosPage implements ViewWillEnter {
  categorias = CATEGORIAS_VESTIGIOS;

  /** Lista estável por ciclo — evita recomputar filtros a cada change detection (travava WebView em produção). */
  grupos: Array<CategoriaVestigio & { itens: VestigioGrupoLinha[] }> = [];

  constructor(
    private atendimentoService: AtendimentoService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
  ) {
    addIcons({ create, trash });
  }

  ionViewWillEnter() {
    this.rebuildGrupos();
  }

  private rebuildGrupos() {
    const vestigios = this.atendimentoService.model?.fields?.vestigios || [];
    this.grupos = CATEGORIAS_VESTIGIOS.map((categoria) => ({
      ...categoria,
      itens: vestigios
        .map((vestigio: any, index: number) => ({ vestigio, index }))
        .filter((item) => resolveCategoriaKey(item.vestigio) === categoria.key),
    }));
  }

  trackByGrupo(_i: number, g: CategoriaVestigio & { itens: VestigioGrupoLinha[] }) {
    return g.key;
  }

  trackByItem(_i: number, item: VestigioGrupoLinha) {
    return item.index;
  }

  async abrirFormularioCadastro() {
    const padrao = this.categorias[0]?.key ?? VestigioCategoria.Fisicos;
    const { VestigioFormPage } = await import('./vestigio-form.page');
    const modal = await this.modalController.create({
      component: VestigioFormPage,
      componentProps: {
        categoriaContext: padrao,
        vestigioEditIndex: null,
      },
      cssClass: 'vestigio-form-modal',
      backdropDismiss: true,
    });
    void modal.onDidDismiss().then(() => this.rebuildGrupos());
    await modal.present();
  }

  async editarVestigio(categoriaKey: VestigioCategoria, index: number) {
    const { VestigioFormPage } = await import('./vestigio-form.page');
    const modal = await this.modalController.create({
      component: VestigioFormPage,
      componentProps: {
        categoriaContext: categoriaKey,
        vestigioEditIndex: index,
      },
      cssClass: 'vestigio-form-modal',
      backdropDismiss: true,
    });
    void modal.onDidDismiss().then(() => this.rebuildGrupos());
    await modal.present();
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
              this.rebuildGrupos();
              this.showToast('Vestígio removido com sucesso.');
            } catch (error: any) {
              this.atendimentoService.model!.fields.vestigios.splice(index, 0, removido);
              this.rebuildGrupos();
              this.showToast(error?.message || 'Erro ao remover vestígio.');
            }
          },
        },
      ],
    });

    await alert.present();
  }

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
