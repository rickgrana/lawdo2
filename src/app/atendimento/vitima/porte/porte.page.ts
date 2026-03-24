import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AtendimentoService } from '../../../services/atendimento.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular/standalone';
import { Location } from "@angular/common";

import { faMale } from '@fortawesome/free-solid-svg-icons';
import { faBaby} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-porte',
  templateUrl: './porte.page.html',
  styleUrls: ['./porte.page.scss'],
})
export class PortePage implements OnInit {

  form?: FormGroup;

  faMale = faMale;

  faBaby = faBaby;

  constructor(private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private atendimentoService: AtendimentoService,
      private router: Router,
      public toastController: ToastController,
      public loadingController: LoadingController,
      private location: Location) {
    
    this.loadForm();
    
  }

  get model() {
    return this.atendimentoService.model;
  }

  get vitima() {
    return this.atendimentoService.vitima;
  }

  ngOnInit() {
  }

  loadForm() {

    this.form = this.formBuilder.group({
      'porte': new FormControl(this.vitima!.porte, 
        Validators.compose([
          //Validators.required
        ]))
      });
  }

  voltar(){
    this.location.back();
  }

  proximo(){
    this.router.navigate(['/']);
  }

  salvar(form: any){

  }

}