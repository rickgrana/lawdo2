import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonMenuButton,
  IonNote,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthenticationService } from '../authentication.service';
import { UserService } from '../services/user.service';
import { MessageService } from '../services/message.service';
import { User, DEFAULT_DRIVE_IMAGE_FOLDER } from '../models/user.model';
import { filter } from 'rxjs';

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.page.html',
  styleUrls: ['./configuracoes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonContent,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonNote,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
  ],
})
export class ConfiguracoesPage implements OnInit {
  readonly DEFAULT_DRIVE_IMAGE_FOLDER = DEFAULT_DRIVE_IMAGE_FOLDER;

  form!: FormGroup;
  user?: User;

  constructor(
    public auth: AuthenticationService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.auth.user$
      .pipe(filter((u): u is User => u != null))
      .subscribe((user) => {
        this.user = user;
        this.buildForm();
      });
  }

  buildForm(): void {
    const current =
      this.user?.config?.driveImageFolder?.trim() || DEFAULT_DRIVE_IMAGE_FOLDER;
    this.form = this.formBuilder.group({
      driveImageFolder: [
        current,
        [Validators.required, Validators.pattern(/^[^\\/]+$/)],
      ],
    });
  }

  async salvar(): Promise<void> {
    if (!this.form?.valid || !this.user?.uid || this.user.pendingRegistration) {
      return;
    }
    const raw = String(this.form.get('driveImageFolder')?.value ?? '').trim();
    const driveImageFolder = raw || DEFAULT_DRIVE_IMAGE_FOLDER;

    try {
      await this.messageService.presentLoading('Salvando...');
      await this.userService.update(this.user.uid, {
        config: {
          ...(this.user.config ?? {}),
          driveImageFolder,
        },
      });
      const salvo = await this.userService.findByUid(this.user.uid);
      if (!salvo) {
        throw new Error('Não foi possível recarregar o perfil.');
      }
      this.user = salvo;
      this.auth.user$.next(salvo);
      await this.messageService.presentToast('Configurações salvas');
    } catch (e: any) {
      await this.messageService.presentError(e?.message ?? String(e));
    } finally {
      await this.messageService.hideLoader();
    }
  }
}
