import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonImg,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../../atendimento-base.page';
import { MapaVisao, mapaSrcParaVisao, parseMapaVisao } from './mapa-visao.enum';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonImg,
  ],
})
export class MapaPage extends AtendimentoBasePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalCtrl = inject(ModalController);

  /** Quando aberto como modal a partir da vítima (componentProps). */
  @Input() visaoEntrada: string | MapaVisao | null = null;

  visao: MapaVisao | null = null;
  imagemSrc = '';

  override ngOnInit() {
    const entrada = this.visaoEntrada;
    if (entrada != null && `${entrada}` !== '') {
      this.aplicarVisao(String(entrada));
    } else {
      this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        this.aplicarVisao(params.get('visao'));
      });
    }
    super.ngOnInit();
  }

  private aplicarVisao(raw: string | null | undefined) {
    this.visao = parseMapaVisao(raw);
    this.imagemSrc = this.visao ? mapaSrcParaVisao(this.visao) : '';
  }

  async fechar() {
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      await modal.dismiss();
    } else {
      this.navCtrl.navigateBack('/atendimento/vitima');
    }
  }

  override loadForm() {
    this.form = this.formBuilder.group({
      _placeholder: new FormControl(''),
    });
    super.loadForm();
  }
}
