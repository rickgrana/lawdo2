import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList,
    IonMenuToggle, IonItem, IonIcon, IonLabel, IonItemDivider,
    IonHeader, IonToolbar,IonTitle,
    IonRouterOutlet, IonRouterLink, Config } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp,
    heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline,
    warningSharp, bookmarkOutline, bookmarkSharp, peopleSharp, peopleOutline,
    person,
    businessOutline,
    addCircle,
    list,
    home,
    star,
    settingsOutline} from 'ionicons/icons';
import { AuthenticationService } from './authentication.service';
import { AtendimentoService } from './services/atendimento.service';
import { MessageService } from './services/message.service';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, RouterLink, IonApp, IonSplitPane, IonMenu, IonContent,
      IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonItemDivider,
      IonHeader, IonToolbar,IonTitle,
      IonRouterLink, IonRouterOutlet
  ]
})
export class AppComponent implements AfterViewInit, OnDestroy {
  usuario: any;

  @ViewChild(IonRouterOutlet, { static: false })
  private rootOutlet?: IonRouterOutlet;

  /**
   * No iOS/WebView o gesto de voltar na borda pode afetar o `ion-router-outlet` atrás dos overlays.
   * Contamos modal, action sheet, popover e alert; com depth > 0 o swipe-back do outlet principal fica desligado.
   */
  private ionOverlayDepth = 0;

  private static readonly OVERLAY_PRESENT_EVENTS = [
    'ionModalDidPresent',
    'ionActionSheetDidPresent',
    'ionPopoverDidPresent',
    'ionAlertDidPresent',
  ] as const;

  private static readonly OVERLAY_DISMISS_EVENTS = [
    'ionModalDidDismiss',
    'ionActionSheetDidDismiss',
    'ionPopoverDidDismiss',
    'ionAlertDidDismiss',
  ] as const;

  constructor(
    private firebaseAuth: Auth,
    private authService: AuthenticationService,
    private atendimentoService: AtendimentoService,
    private messageService: MessageService,
    private router: Router,
    private ionConfig: Config,
  ) {
    this.firebaseAuth.onAuthStateChanged((user: any) => {
      this.usuario = user;
    });

    addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp,
      heartOutline, heartSharp, archiveOutline, archiveSharp, star,
      trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp,
      peopleSharp, peopleOutline, person, businessOutline, addCircle, list, home, settingsOutline}
    );
  }

  ngAfterViewInit(): void {
    for (const ev of AppComponent.OVERLAY_PRESENT_EVENTS) {
      document.addEventListener(ev, this.onIonOverlayDidPresent, true);
    }
    for (const ev of AppComponent.OVERLAY_DISMISS_EVENTS) {
      document.addEventListener(ev, this.onIonOverlayDidDismiss, true);
    }
  }

  ngOnDestroy(): void {
    for (const ev of AppComponent.OVERLAY_PRESENT_EVENTS) {
      document.removeEventListener(ev, this.onIonOverlayDidPresent, true);
    }
    for (const ev of AppComponent.OVERLAY_DISMISS_EVENTS) {
      document.removeEventListener(ev, this.onIonOverlayDidDismiss, true);
    }
  }

  private readonly onIonOverlayDidPresent = (): void => {
    this.ionOverlayDepth++;
    const outlet = this.rootOutlet;
    if (this.ionOverlayDepth !== 1 || !outlet) {
      return;
    }
    outlet.swipeGesture = false;
  };

  private readonly onIonOverlayDidDismiss = (): void => {
    if (this.ionOverlayDepth > 0) {
      this.ionOverlayDepth--;
    }
    const outlet = this.rootOutlet;
    if (this.ionOverlayDepth !== 0 || !outlet) {
      return;
    }
    outlet.swipeGesture = this.ionConfig.getBoolean('swipeBackEnabled', outlet.nativeEl.mode === 'ios');
  };

  async novoAtendimento() {
    const ok = await this.messageService.confirmNovoAtendimentoPrivacidade();
    if (!ok) {
      return;
    }
    this.atendimentoService.prepararNovoAtendimento();
    await this.router.navigate(['atendimento/identificacao']);
    this.atendimentoService.notificarIdentificacaoRecarregar();
  }

  novoAtendimento2() {
  }

  suporte(){
  }
}
