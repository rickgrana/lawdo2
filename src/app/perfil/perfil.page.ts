import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonInput, IonTitle, IonToolbar, IonButtons, IonItem, IonButton,
    IonRow, IonCol, IonLabel, IonSelectOption, IonMenuButton, IonFooter, IonSelect } from '@ionic/angular/standalone';
import { UnidadeService } from '../services/unidade.service';
import { MessageService } from '../services/message.service';
import { AuthenticationService } from '../authentication.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { CorporacaoService } from '../services/corporacao.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule,
    IonFooter, IonButtons, IonContent, IonItem, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButton, IonRow, IonCol, IonLabel, IonSelectOption, IonMenuButton, IonFooter, IonInput,
    IonSelect
  ]
})
export class PerfilPage implements OnInit {

  form?: FormGroup;

  corporacoes: any[] = [];
  unidades: any[] = [];
  loaded = false;

  constructor(public auth: AuthenticationService,
      private userService: UserService,
      private formBuilder: FormBuilder,
      private messageService: MessageService,
      private router: Router,
      private corporacaoService: CorporacaoService,
      private unidadeService: UnidadeService) { }

  async ngOnInit() {
    this.form = this.formBuilder.group({
      nomeCompleto: [this.auth.user?.fields.nomeCompleto, Validators.required],
      sexo: [this.auth.user?.fields.sexo, Validators.required],
      matricula: [this.auth.user?.fields.matricula, Validators.required],
      superior: [this.auth.user?.fields.superior, Validators.required],
      corporacao: [this.auth.user?.fields.corporacao, Validators.required],
      unidade: [this.auth.user?.fields.unidade, Validators.required],
    });

    this.corporacoes = await this.corporacaoService.list();

    if(this.form!.get('corporacao')!.value){
      this.loadUnidades();
    }
  }

  async loadUnidades(){
    this.unidades = [];
    if (this.form && this.form.get('corporacao')) {
      this.unidades = await this.unidadeService.list(this.form.get('corporacao')!.value);
    }
  }

  async selecionarCorporacao(event: any) {
    let idCorporacao = event.detail.value;

    if(idCorporacao  == null) return;

    await this.messageService.presentLoading('Aguarde');
    this.unidades = await this.unidadeService.list(idCorporacao);
    this.messageService.hideLoader();

  }

  updateUser(data: any) {
    const userData = {
      nomeCompleto: data.nomeCompleto,
      sexo: data.sexo,
      matricula: data.matricula,
      superior: data.superior,
      corporacao: data.corporacao,
      unidade: data.unidade
    };

    this.auth!.user!.fields.nomeCompleto = userData.nomeCompleto;
    this.auth!.user!.fields.sexo = userData.sexo;
    this.auth!.user!.fields.matricula = userData.matricula;
    this.auth!.user!.fields.superior = userData.superior;
    this.auth!.user!.fields.corporacao = userData.corporacao;
    this.auth!.user!.fields.unidade = userData.unidade;

    this.userService.update(this.auth!.user!.uid, userData).then(resp => {
        this.messageService.presentToast('Perfil alterado com sucesso');
    }).catch((error: any) => this.messageService.presentError(error.message));

  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      }
    });
  }

}
