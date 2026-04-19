import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonImg, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { AuthenticationService } from '../authentication.service';
import { AtendimentoService } from '../services/atendimento.service';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { filter, take, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons,
    IonMenuButton, IonImg, IonGrid, IonRow, IonCol, IonButton, IonIcon
  ]
})
export class HomePage implements OnInit {
  usuario: any;
  private auth = inject(Auth);

  constructor(
    private authService: AuthenticationService,
    private atendimentoService: AtendimentoService,
    private router: Router
  ) {
    this.auth.onAuthStateChanged((user: any) => {
      this.usuario = user;
    });
  }

  async ngOnInit() {}

  async login() {
    await this.authService.login();
    // Espera o authState + findByUid (evita ler profileReady/user$ “velhos” antes do Firebase atualizar)
    const u = await firstValueFrom(
      this.authService.user$.pipe(filter((user) => user !== null), take(1))
    );
    // Popup costuma rodar fora da NgZone; navegar aqui (handler do clique) garante o outlet Ionic atualizar
    if (u.pendingRegistration) {
      await this.router.navigate(['/perfil'], { replaceUrl: true });
    }
  }

  logout() {
    this.authService.logout();
  }

  atendimentos() {
    this.router.navigate(['/atendimentos']);
  }

  async novoAtendimento() {
    this.atendimentoService.prepararNovoAtendimento();
    await this.router.navigate(['atendimento/identificacao']);
    this.atendimentoService.notificarIdentificacaoRecarregar();
  }

  perfil() {
    this.router.navigate(['perfil']);
  }

}
