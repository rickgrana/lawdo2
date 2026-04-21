import { Secao } from '../secao'; 

import { Paragraph, TextRun} from 'docx';

export class SecaoTitulo extends Secao{

    override async runInternal(): Promise<any[]> {
        const subt = String(this.documento.atendimento.fields.tipoExame ?? '').trim();
        const blocos: any[] = [

            new Paragraph ({
                style: 'titulo_laudo',
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