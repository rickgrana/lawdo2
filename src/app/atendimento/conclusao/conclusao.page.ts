import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonTextarea, IonSelect,
    IonButton, IonItem, IonBackButton, IonSelectOption } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../atendimento-base.page';
import { Conclusao } from 'src/app/interfaces/conclusao.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-conclusao',
  templateUrl: './conclusao.page.html',
  styleUrls: ['./conclusao.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonFooter,
    IonTextarea, IonSelect,
    IonButton, IonItem, IonBackButton, IonSelectOption
  ]
})
export class ConclusaoPage extends AtendimentoBasePage implements OnInit {
  conclusoes: any;
  dinamicas$!: Observable<Conclusao[]>;

  override ngOnInit() {
    this.conclusoes = this.atendimentoService.getConclusoes();
    this.dinamicas$ = this.atendimentoService.getDinamicas();

    super.ngOnInit();
  }

  override loadForm() {
    this.form = this.formBuilder.group({
      tipo: new FormControl<string>(''),
      tipoDinamica: new FormControl<string>(''),
      texto: new FormControl<string>(this.model!.fields.conclusao, Validators.required),
      dinamica: new FormControl<string>(this.model!.fields.dinamica)
    }); 

    super.loadForm();
  }

  override async salvar(record: any) {

    this.model!.fields.conclusao = record.texto;
    this.model!.fields.dinamica = record.dinamica;
    this.model!.fields.dtupdate = new Date();

    await this.presentLoading();

    this.atendimentoService.updateConclusao(this.model!).then(resp => {
      this.hideLoader();
      this.form?.markAsPristine();
      this.presentAlertSalvo('Dados alterados com sucesso');
      this.navCtrl.navigateBack('atendimento/visualizar');
    })
    .catch(error => {
      this.hideLoader();
      console.log(error);
      this.presentError(error.message);
    });
  }

  selecionar(event: any) {
    this.form!.get('texto')!.setValue(event.detail.value);
  }

  selecionarDinamica(event: any) {
    this.form!.get('dinamica')!.setValue(event.detail.value);
  }
}
