import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonImg, IonGrid, IonRow, IonCol, IonButton, IonIcon  } from '@ionic/angular/standalone';
import { AuthenticationService } from '../authentication.service';
import { Router } from '@angular/router';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons,
    IonMenuButton, IonImg, IonGrid, IonRow, IonCol, IonButton, IonIcon
  ]
})
export class HomePage implements OnInit {
  usuario: any;
  private auth = inject(Auth);

  constructor(private authService: AuthenticationService, private router: Router) {
    this.auth.onAuthStateChanged((user: any) => {
      this.usuario = user;
    });
  }

  ngOnInit() {

    getRedirectResult(this.auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken;
          const user = result.user;
        }
        // ...
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  }

  login() {
    //this.messageService.presentLoading('Aguarde...');

    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  atendimentos() {
    this.router.navigate(['/atendimentos']);
  }

  novoAtendimento() {
    // this.atendimentoService.model = new Atendimento();
    // this.atendimentoService.model.isNew = true;

    this.router.navigate(['atendimento/identificacao']);
  }

  perfil() {
    this.router.navigate(['perfil']);
  }

}
