import { Component, OnInit } from '@angular/core';
import { AtendimentoService } from '../../services/atendimento.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { Veiculo } from 'src/app/models/veiculo.model';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonRow, IonList, IonCol, IonLabel, IonButton, IonItem, IonBackButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-veiculos',
  templateUrl: './veiculos.page.html',
  styleUrls: ['./veiculos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonList,
    IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonRow, IonCol, IonLabel, IonButton, IonItem, IonBackButton
  ]
})
export class VeiculosPage implements OnInit {

  constructor(private atendimentoService: AtendimentoService, public alertController: AlertController,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private router: Router
  ) { }

  ngOnInit() {
  }

  async abrir(index: number) {
    const veiculo = Veiculo.loadFrom(this.atendimentoService.model!.fields.veiculos[index]);
    veiculo.setIsNewRecord(false);
    
    this.atendimentoService.veiculo = veiculo;
    this.atendimentoService.veiculo_selecionado = index;

    this.router.navigate(['atendimento/veiculo']);
  }

  adicionar() {
    this.atendimentoService.veiculo = new Veiculo();
    this.atendimentoService.veiculo_selecionado = -1; // nao selecionado

    this.router.navigate(['atendimento/veiculo']);
  }

  get model() {
    return this.atendimentoService.model;
  }

  getNumero(i: number){
    return NumberHelper.getRomano(i);
  }

}
