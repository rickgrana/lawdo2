import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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
  IonItem,
  IonLabel,
  IonMenuButton,
  IonModal,
  IonNote,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { Subscription, filter } from 'rxjs';
import { AuthenticationService } from '../authentication.service';
import { UserService } from '../services/user.service';
import { MessageService } from '../services/message.service';
import { User, DEFAULT_DRIVE_IMAGE_FOLDER } from '../models/user.model';
import { DriveFolderBrowserService } from '../services/drive-folder-browser.service';

/** Nós da árvore do seletor de pastas do Drive (modal). */
export interface DriveFolderTreeNode {
  id: string;
  name: string;
  pathLabel: string;
  children: DriveFolderTreeNode[] | null;
  loading?: boolean;
}

@Component({
  selector: 'app-drive-folder-picker-modal',
  templateUrl: './drive-folder-picker-modal.component.html',
  styleUrls: ['./drive-folder-picker-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSpinner,
  ],
})
export class DriveFolderPickerModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;

  readonly DEFAULT_LABEL = DEFAULT_DRIVE_IMAGE_FOLDER;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<{ folderId: string; pathLabel: string }>();
  @Output() useDefault = new EventEmitter<void>();

  readonly treeControl = new NestedTreeControl<DriveFolderTreeNode>(
    (n) => n.children ?? []
  );

  readonly dataSource = new MatTreeNestedDataSource<DriveFolderTreeNode>();

  readonly hasNestedChild = (_n: number, node: DriveFolderTreeNode): boolean =>
    node.children === null || (node.children?.length ?? 0) > 0;

  rootNode: DriveFolderTreeNode = {
    id: 'root',
    name: 'Meu Drive',
    pathLabel: 'Meu Drive',
    children: null,
    loading: false,
  };

  selected: DriveFolderTreeNode | null = null;
  loadError: string | null = null;
  treeBusy = false;

  private expansionSub?: Subscription;

  constructor(
    private readonly browser: DriveFolderBrowserService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.dataSource.data = [this.rootNode];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.resetTree();
      this.subscribeExpansion();
      void this.presentAndLoadRoot();
    }
    if (changes['open'] && !this.open) {
      this.expansionSub?.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this.expansionSub?.unsubscribe();
  }

  private subscribeExpansion(): void {
    this.expansionSub?.unsubscribe();
    this.expansionSub = this.treeControl.expansionModel.changed.subscribe((ch) => {
      ch.added.forEach((node) => {
        void this.loadChildren(node);
      });
    });
  }

  private resetTree(): void {
    this.loadError = null;
    this.selected = null;
    this.rootNode = {
      id: 'root',
      name: 'Meu Drive',
      pathLabel: 'Meu Drive',
      children: null,
      loading: false,
    };
    this.dataSource.data = [this.rootNode];
    this.treeControl.expand(this.rootNode);
  }

  private async presentAndLoadRoot(): Promise<void> {
    this.treeBusy = true;
    this.cdr.markForCheck();
    try {
      await this.loadChildren(this.rootNode);
      this.treeControl.expand(this.rootNode);
    } catch (e: unknown) {
      this.loadError = e instanceof Error ? e.message : String(e);
    } finally {
      this.treeBusy = false;
      this.cdr.markForCheck();
    }
  }

  private async loadChildren(node: DriveFolderTreeNode): Promise<void> {
    if (node.loading || node.children !== null) {
      return;
    }
    node.loading = true;
    this.notifyDataChanged();
    try {
      const rows = await this.browser.listChildFolders(node.id);
      node.children = rows.map((r) => ({
        id: r.id,
        name: r.name,
        pathLabel: `${node.pathLabel} / ${r.name}`,
        children: null,
        loading: false,
      }));
    } catch (e: unknown) {
      this.loadError = e instanceof Error ? e.message : String(e);
      node.children = [];
    } finally {
      node.loading = false;
      this.notifyDataChanged();
    }
  }

  private notifyDataChanged(): void {
    const snap = this.dataSource.data;
    this.dataSource.data = [];
    this.dataSource.data = snap;
    this.cdr.markForCheck();
  }

  select(node: DriveFolderTreeNode): void {
    this.selected = node;
    this.cdr.markForCheck();
  }

  isSelected(node: DriveFolderTreeNode): boolean {
    return this.selected?.id === node.id;
  }

  confirmSelection(): void {
    if (!this.selected) {
      return;
    }
    this.confirmed.emit({
      folderId: this.selected.id,
      pathLabel: this.selected.pathLabel,
    });
    this.close();
  }

  emitUseDefault(): void {
    this.useDefault.emit();
    this.close();
  }

  close(): void {
    this.openChange.emit(false);
  }

  onModalDismiss(): void {
    this.openChange.emit(false);
  }
}

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
    IonLabel,
    IonNote,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    DriveFolderPickerModalComponent,
  ],
})
export class ConfiguracoesPage implements OnInit {
  readonly DEFAULT_DRIVE_IMAGE_FOLDER = DEFAULT_DRIVE_IMAGE_FOLDER;

  form!: FormGroup;
  user?: User;

  private pastaEscolhidaId: string | null = null;

  seletorPastasAberto = false;

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
    this.pastaEscolhidaId = this.user?.config?.driveImageFolderId?.trim() ?? null;
    const display =
      this.user?.config?.driveImageFolder?.trim() || DEFAULT_DRIVE_IMAGE_FOLDER;
    this.form = this.formBuilder.group({
      folderDisplay: [display, [Validators.required]],
    });
  }

  abrirSeletorPastas(): void {
    this.seletorPastasAberto = true;
  }

  aoConfirmarPasta(event: { folderId: string; pathLabel: string }): void {
    this.pastaEscolhidaId = event.folderId;
    this.form.patchValue({ folderDisplay: event.pathLabel });
  }

  aoUsarPastaPadrao(): void {
    this.pastaEscolhidaId = null;
    this.form.patchValue({ folderDisplay: DEFAULT_DRIVE_IMAGE_FOLDER });
  }

  async salvar(): Promise<void> {
    if (!this.form?.valid || !this.user?.uid || this.user.pendingRegistration) {
      return;
    }
    const folderName =
      String(this.form.get('folderDisplay')?.value ?? '').trim() ||
      DEFAULT_DRIVE_IMAGE_FOLDER;

    try {
      await this.messageService.presentLoading('Salvando...');
      await this.userService.updateDriveImageFolderPreference(
        this.user.uid,
        folderName,
        this.pastaEscolhidaId,
      );
      const salvo = await this.userService.findByUid(this.user.uid);
      if (!salvo) {
        throw new Error('Não foi possível recarregar o perfil.');
      }
      this.user = salvo;
      this.pastaEscolhidaId = salvo.config?.driveImageFolderId?.trim() ?? null;
      this.auth.user$.next(salvo);
      await this.messageService.presentToast('Configurações salvas');
    } catch (e: any) {
      await this.messageService.presentError(e?.message ?? String(e));
    } finally {
      await this.messageService.hideLoader();
    }
  }
}
