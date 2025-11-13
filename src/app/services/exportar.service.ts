import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';

import { DocumentoFactory } from 'src/components/exportar/factory/documento.factory';
import { MessageService } from './message.service';
import { Atendimento } from '../models/atendimento.model';
import { CorporacaoService } from 'src/app/services/corporacao.service';
import { UnidadeService } from 'src/app/services/unidade.service';
import { Packer } from 'docx';
import { AuthenticationService } from 'src/app/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class ExportarService {



  constructor(
    private auth: AuthenticationService,
    private corporacaoService: CorporacaoService,
    private unidadeService: UnidadeService,
    private messageService: MessageService
  )
  {

  }

  async getLaudo(atendimento: Atendimento) {

    let laudo = await DocumentoFactory.create(atendimento, this.auth, this.corporacaoService, this.unidadeService);

    const packer = new Packer();

    Packer.toBlob(laudo.docx).then(blob => {
        saveAs(blob, laudo.getNomeArquivo() + '.docx');
    });

    let audio = new Audio();
    audio.src = '/assets/ring.wav';
    audio.load();
    audio.play();

  }



}
