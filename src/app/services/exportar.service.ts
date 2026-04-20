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

  /**
   * Gera o .docx do laudo (sem gravar em disco nem no Drive).
   */
  async createLaudoBlob(atendimento: Atendimento, user: User): Promise<{ blob: Blob; nomeArquivo: string }> {
    if (!atendimento.fields.laudo.numero || atendimento.fields.laudo.ano.trim() === '') {
      throw new Error('Atendimento não possui número de Laudo definido');
    }

    const perito = await this.peritoFactory.create(user);
    const laudo = await DocumentoFactory.create(atendimento, perito);
    const blob = await Packer.toBlob(laudo.docx);
    return { blob, nomeArquivo: laudo.getNomeArquivo() + '.docx' };
  }

  /** Baixa o laudo no dispositivo (com som de conclusão, como antes). */
  async downloadLaudo(atendimento: Atendimento, user: User): Promise<void> {
    const { blob, nomeArquivo } = await this.createLaudoBlob(atendimento, user);
    saveAs(blob, nomeArquivo);
    this.playRing();
  }

  private playRing(): void {
    const audio = new Audio();
    audio.src = '/assets/ring.wav';
    audio.load();
    void audio.play();
  }
}
