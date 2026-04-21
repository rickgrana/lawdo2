import { DateTimeHelper } from 'src/app/extensions/dateTimeHelper';
import { Secao } from '../secao'; 
import { Paragraph, TextRun, PageNumber} from 'docx';
import { SecaoAnexo } from './secaoAnexo';

export class SecaoAssinatura extends Secao{

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();
        const numImagens = SecaoAnexo.contagemImagensLaudo(model);
        const textoImagens =
            numImagens === 1 ? '1 imagem' : `${numImagens} imagens`;

        return [
            new Paragraph ({
              style: 'padrao',
              keepNext: true,
              children: [
                new TextRun({
                  text:
                    'Não havendo mais nada a informar encerra-se o presente Laudo que, ' +
                    'elaborado em ',
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                }),
                new TextRun({
                  text:
                    ' laudas devidamente numeradas, contendo ' +
                    textoImagens +
                    ', segue assinado pel' +
                    artigo +
                    ' signatári' +
                    artigo +
                    '.',
                }),
              ],
            }),

            new Paragraph ({
              style: 'data_e_hora',
              keepNext: true,
              children: [
                new TextRun({
                    text: '\n' + this.documento.perito.unidade.cidade + '(' +
                        this.documento.perito.corporacao.uf + '), ' +
                    model.fields.laudo.data.substr(8, 2) + ' de ' +
                    DateTimeHelper.getMesExtenso(model.fields.laudo.data.substr(5, 2)) + ' de ' +
                    model.fields.laudo.data.substr(0, 4) + '\n\n'
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