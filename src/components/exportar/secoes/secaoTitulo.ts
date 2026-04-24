import { Secao } from '../secao'; 

import { Paragraph, TextRun, convertMillimetersToTwip } from 'docx';
import { ESPACO_ENTRE_LINHAS_15 } from '../styles';

export class SecaoTitulo extends Secao{

    /** Uma linha em espaçamento 1,5 (corpo 12 pt) entre título/subtítulo e o preâmbulo. */
    private static readonly ESPACO_APOS_TITULO_TWIPS = 360;

    override async runInternal(): Promise<any[]> {
        const subt = String(this.documento.atendimento.fields.tipoExame ?? '').trim();
        const blocos: any[] = [

            new Paragraph ({
                style: 'titulo_laudo',
                spacing: subt.length > 0
                    ? undefined
                    : {
                        before: convertMillimetersToTwip(2),
                        after: SecaoTitulo.ESPACO_APOS_TITULO_TWIPS,
                        ...ESPACO_ENTRE_LINHAS_15,
                    },
                children: [
                    new TextRun({
                        text: 'LAUDO DE PERÍCIA CRIMINAL',
                        bold: true,
                        size: 24
                    })
                ],
            }),
        ];
        if (subt.length > 0) {
            blocos.push(
                new Paragraph ({
                    style: 'tipo_laudo',
                    spacing: {
                        after: SecaoTitulo.ESPACO_APOS_TITULO_TWIPS,
                        ...ESPACO_ENTRE_LINHAS_15,
                    },
                    children: [
                        new TextRun({
                            text: '(' + subt.toUpperCase() + ')',
                            bold: false,
                            size: 24
                        }),
                    ],
                })
            );
        }
        return blocos;

    }

}