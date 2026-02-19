import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Veiculo } from '../../models/veiculo.model';
import { Marca } from 'src/app/interfaces/marca.interface';
import { Carroceria } from 'src/app/interfaces/carroceria.interface';
import { VeiculoService } from 'src/app/services/veiculo.service';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { CommonModule } from '@angular/common';
import { IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
    IonSelect, IonIcon, IonText,
    IonRow, IonCol, IonButton, IonItem, IonBackButton, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';

@Component({
  selector: 'app-veiculo',
  templateUrl: './veiculo.page.html',
  styleUrls: ['./veiculo.page.scss'],
  standalone: true,
  imports: [
      ReactiveFormsModule, CommonModule,
      IonGrid, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter, IonInput,
      IonIcon, IonText,
      IonRow, IonCol, IonButton, IonItem, IonBackButton, IonSelect, IonSelectOption
    ]
})
export class VeiculoPage extends AtendimentoBasePage implements OnInit {

  marcas: Marca[] = [];
  carrocerias: Carroceria[] = [];
  protected veiculoService = inject(VeiculoService);
  @ViewChild('marcaInput', { static: false }) marcaInput!: IonInput;

  constructor() {
    super();
    addIcons({ trash });
  }
  
  get veiculo() {
    return this.atendimentoService.veiculo;
  }

  override ngOnInit() {
    if(this.veiculo == null){
      this.router.navigate(['/']);
    }

    this.marcas = [];
    this.carrocerias = [];

    Veiculo.carrocerias.forEach(element => {
      this.carrocerias.push({id: element, nome: element});
    });

    this.veiculoService.getData().then((veiculos: any) => {
      let dados = veiculos.marcas.sort();

      console.log(dados);

      dados.forEach((element: any) => {
        this.marcas.push({id: element, nome: element});
      });
    });

    super.ngOnInit();
  }

  async ngAfterViewInit() {
    const nativeInput = await this.marcaInput.getInputElement();
    nativeInput.setAttribute('list', 'marcas');
  }

  ionViewWillEnter(){
    this.loadForm();
  }

  override loadForm() {
    this.form = this.formBuilder.group({
      placa: new FormControl<string>(this.veiculo!.placa, Validators.required),
      tracao: new FormControl<string>(this.veiculo!.tracao),
      tipo: new FormControl<string>(this.veiculo!.tipo),
      especie: new FormControl<string>(this.veiculo!.especie),
      carroceria: new FormControl<string>(this.veiculo!.carroceria),
      marca: new FormControl<string>(this.veiculo!.marca),
      modelo: new FormControl<string>(this.veiculo!.modelo),
      ano: new FormControl<string>(this.veiculo!.ano),
      chassi: new FormControl<string>(this.veiculo!.chassi),
      cor: new FormControl<string>(this.veiculo!.cor),
      categoria: new FormControl<string>(this.veiculo!.categoria),
      responsavel: new FormControl<string>(this.veiculo!.apresentacao.responsavel),
      doc_responsavel: new FormControl<string>(this.veiculo!.apresentacao.doc_responsavel),
      local: new FormControl<string>(this.veiculo!.apresentacao.local)
    });

    super.loadForm();
  }

  override async salvar(record: any) {

    this.veiculo!.placa = record.placa;
    this.veiculo!.tracao = record.tracao;
    this.veiculo!.tipo = record.tipo;
    this.veiculo!.especie = record.especie;
    this.veiculo!.marca = record.marca;
    this.veiculo!.modelo = record.modelo;
    this.veiculo!.ano = record.ano;
    this.veiculo!.chassi = record.chassi;
    this.veiculo!.cor = record.cor;
    this.veiculo!.apresentacao.responsavel = record.responsavel;
    this.veiculo!.apresentacao.doc_responsavel = record.doc_responsavel;

    if(this.veiculo!.isNewRecord()) {
      let qtde = this.model!.fields.veiculos.push(this.veiculo!);
      this.veiculo!.setIsNewRecord(false);
    } else {
      this.model!.fields.veiculos[this.atendimentoService.veiculo_selecionado] = this.veiculo!;
    }

    this.presentLoading();

    this.atendimentoService.updateVeiculos(this.model!).then(resp => {
      this.hideLoader();
      this.presentAlertSalvo('Dados alterados com sucesso').then(() => {
        this.navCtrl.navigateBack('atendimento/veiculos');
      });
    })
    .catch(error => {
      this.hideLoader();
      this.presentError(error.message);
      console.log(error);
    });
      
    this.loadForm();
  }

  async excluir(event: any) {

    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Atenção!',
      message: 'Deseja realmente remover este veículo?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        }, {
          text: 'Sim',
          handler: async() => {
            await this.presentLoading();

            this.model!.fields.veiculos.splice(this.atendimentoService.veiculo_selecionado, 1);
                
            this.atendimentoService.updateVeiculos(this.model!).then(resp => {
              this.hideLoader();
              this.presentAlertSalvo('Veículo removido com sucesso');
              this.navCtrl.navigateBack('atendimento/veiculos');
            })
            .catch(error => {
              this.hideLoader();
              this.presentError(error.message);
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
