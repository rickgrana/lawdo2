import { Injectable } from '@angular/core';

import { saveAs } from 'file-saver';

import { DocumentoFactory } from 'src/components/exportar/factory/documento.factory';
import { MessageService } from './message.service';
import { Atendimento } from '../models/atendimento.model';
import { CorporacaoService } from 'src/app/services/corporacao.service';
import { UnidadeService } from 'src/app/services/unidade.service';
import { Packer } from 'docx';
import { AuthenticationService } from 'src/app/authentication.service';
import { Perito } from 'src/components/exportar/perito';
import { User } from '../models/user.model';
import { PeritoFactory } from 'src/components/exportar/factory/perito.factory';

@Injectable({
  providedIn: 'root'
})
export class ExportarService {

  constructor(
    private auth: AuthenticationService,
    private corporacaoService: CorporacaoService,
    private unidadeService: UnidadeService,
    private messageService: MessageService,
    private peritoFactory: PeritoFactory
  )
  {
  }

  async getLaudo(atendimento: Atendimento, user: User) {

    if (!atendimento.fields.laudo.numero || atendimento.fields.laudo.ano.trim() === '') {
      throw new Error('Atendimento não possui número de Laudo definido');
    }

    const perito = await this.peritoFactory.create(user);

    let laudo = await DocumentoFactory.create(atendimento, perito);

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
