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
import { filter } from 'rxjs';
import { User } from '../models/user.model';

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
  user?: User;

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

    this.auth.user$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      this.user = user;
      this.form = this.formBuilder.group({
        nomeCompleto: [this.user?.fields.nomeCompleto, Validators.required],
        sexo: [this.user?.fields.sexo, Validators.required],
        matricula: [this.user?.fields.matricula, Validators.required],
        superior: [this.user?.fields.superior, Validators.required],
        corporacao: [this.user?.fields.corporacao, Validators.required],
        unidade: [this.user?.fields.unidade, Validators.required],
      });
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

    this.user!.fields.nomeCompleto = userData.nomeCompleto;
    this.user!.fields.sexo = userData.sexo;
    this.user!.fields.matricula = userData.matricula;
    this.user!.fields.superior = userData.superior;
    this.user!.fields.corporacao = userData.corporacao;
    this.user!.fields.unidade = userData.unidade;

    this.userService.update(this.user!.uid, userData).then(resp => {
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
