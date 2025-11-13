import { Secao } from '../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';

import { DateTimeHelper } from 'src/extensions/dateTimeHelper';

export class SecaoAssinatura extends Secao{

    async runInternal(){

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        return [
            new Paragraph ({
              style: 'data_e_hora',
              keepNext: true,
              children: [
                new TextRun({
                    text: '\n' + this.documento.perito.unidade.cidade + '(' +
                        this.documento.perito.corporacao.uf + '), ' +
                    model.fields.laudo.data.substr(0, 2) + ' de ' +
                    DateTimeHelper.getMesExtenso(model.fields.laudo.data.substr(3, 2)) + ' de ' +
                    model.fields.laudo.data.substr(6, 4) + '\n\n'
                })
              ]
            }),

            new Paragraph ({
                style: 'assinatura',
                keepNext: true,
                children: [
                    new TextRun({ text: '\n\n' + this.documento.perito.data.nomeCompleto.toUpperCase() }),
                ]
              }),
            

            new Paragraph ({
              style: 'assinatura',
              keepNext: true,
              children: [
                  new TextRun({ text: 'Perit' + artigo + ' Criminal' }),
              ]
            }),
            new Paragraph ({
              style: 'assinatura',
              children: [
                  new TextRun({ text: 'Matrícula ' + this.documento.perito.data.matricula }),
              ]
            })
        ];
    }

}