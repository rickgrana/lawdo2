import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList,
    IonMenuToggle, IonItem, IonIcon, IonLabel, IonItemDivider,
    IonHeader, IonToolbar,IonTitle,
    IonRouterOutlet, IonRouterLink, IonListHeader, IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp,
    heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline,
    warningSharp, bookmarkOutline, bookmarkSharp, peopleSharp, peopleOutline,
    person,
    businessOutline,
    addCircle,
    list,
    home} from 'ionicons/icons';
import { AuthenticationService } from './authentication.service';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, RouterLink, IonApp, IonSplitPane, IonMenu, IonContent,
      IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonItemDivider,
      IonHeader, IonToolbar,IonTitle,
      IonRouterLink, IonRouterOutlet]
})
export class AppComponent {
  usuario: any;

  constructor(private firebaseAuth: Auth, private authService: AuthenticationService, private router: Router) {

    this.firebaseAuth.onAuthStateChanged((user: any) => {
      this.usuario = user;
    });

    addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp,
      heartOutline, heartSharp, archiveOutline, archiveSharp,
      trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp,
      peopleSharp, peopleOutline, person, businessOutline, addCircle, list, home}
    );
  }

  novoAtendimento() {
    this.router.navigate(['atendimento/identificacao']);
  }

  novoAtendimento2() {
  }

  suporte(){
  }
}
