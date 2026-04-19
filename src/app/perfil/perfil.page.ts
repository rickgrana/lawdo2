import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonInput, IonTitle, IonToolbar, IonButtons, IonItem, IonButton,
    IonRow, IonCol, IonSelectOption, IonMenuButton, IonFooter, IonSelect,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/angular/standalone';
import { UnidadeService } from '../services/unidade.service';
import { MessageService } from '../services/message.service';
import { AuthenticationService } from '../authentication.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { CorporacaoService } from '../services/corporacao.service';
import { User } from '../models/user.model';
import { filter } from 'rxjs';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule,
    IonFooter, IonButtons, IonContent, IonItem, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButton, IonRow, IonCol, IonSelectOption, IonMenuButton, IonFooter, IonInput,
    IonSelect, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle
  ]
})
export class PerfilPage implements OnInit {

  form!: FormGroup;
  user?: User;
  state: any;

  corporacoes: any[] = [];
  unidades: any[] = [];
  loaded = false;
  /** Exibe cartão de boas-vindas quando veio do fluxo sem cadastro no Firestore */
  showWelcomeCadastro = false;

  constructor(public auth: AuthenticationService,
      private userService: UserService,
      private formBuilder: FormBuilder,
      private messageService: MessageService,
      private router: Router,
      private corporacaoService: CorporacaoService,
      private unidadeService: UnidadeService) { }

  async ngOnInit() {

    this.state = history.state;

    this.auth.user$.pipe(
      filter(user => !!user)
    ).subscribe((user: User) => {
      this.user = user;
      this.showWelcomeCadastro = !!user.pendingRegistration;
      this.loadForm();
    });

    if (this.auth.consumeCompletarCadastroPrompt()) {
      await this.messageService.presentAlert(
        'Bem-vindo',
        '',
        'O primeiro passo é completar o cadastro da sua conta com os dados profissionais abaixo.',
        [{ text: 'Entendi', role: 'cancel' }]
      );
    }
    this.corporacoes = await this.corporacaoService.list();
  }

  async loadForm() {
    this.form = this.formBuilder.group({
      nomeCompleto: [this.user?.fields.nomeCompleto ?? '', Validators.required],
      sexo: [this.user?.fields.sexo ?? '', Validators.required],
      matricula: [this.user?.fields.matricula ?? '', Validators.required],
      superior: [this.user?.fields.superior ?? '', Validators.required],
      corporacao: [this.user?.fields.corporacao ?? '', Validators.required],
      unidade: [this.user?.fields.unidade ?? '', Validators.required],
    });

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

  async updateUser(data: any) {

    const userData = {
      nomeCompleto: data.nomeCompleto,
      sexo: data.sexo,
      matricula: data.matricula,
      superior: data.superior,
      corporacao: data.corporacao,
      unidade: data.unidade
    };

    if (this.user!.pendingRegistration) {
      try {
        await this.messageService.presentLoading('Salvando cadastro...');
        await this.userService.create(this.user!.uid, {
          email: this.user!.fields.email,
          ...userData
        });
        const salvo = await this.userService.findByUid(this.user!.uid);
        if (!salvo) {
          throw new Error('Não foi possível carregar o cadastro após salvar.');
        }
        this.user = salvo;
        this.auth.user$.next(salvo);
        this.showWelcomeCadastro = false;
        await this.messageService.presentToast('Cadastro concluído com sucesso');
        await this.router.navigate(['/home'], { replaceUrl: true });
      } catch (error: any) {
        await this.messageService.presentError(error?.message ?? String(error));
      } finally {
        await this.messageService.hideLoader();
      }
      return;
    }

    this.user!.fields.nomeCompleto = userData.nomeCompleto;
    this.user!.fields.sexo = userData.sexo;
    this.user!.fields.matricula = userData.matricula;
    this.user!.fields.superior = userData.superior;
    this.user!.fields.corporacao = userData.corporacao;
    this.user!.fields.unidade = userData.unidade;

    this.auth.user$.next(this.user!);

    try {
      await this.userService.update(this.user!.uid, userData);
      await this.messageService.presentToast('Perfil alterado com sucesso');
      await this.router.navigate(['/home'], { replaceUrl: true });
    } catch (error: any) {
      await this.messageService.presentError(error.message);
    }
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    });
  }

}
