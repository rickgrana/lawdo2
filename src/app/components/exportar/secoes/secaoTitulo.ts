import { Secao } from '../secao'; 

import { Paragraph, TextRun} from 'docx';

export class SecaoTitulo extends Secao{

    async runInternal(){
        return [

            new Paragraph ({
                style: 'titulo_laudo',
                children: [
                    new TextRun({
                        text: 'LAUDO DE PERÍCIA CRIMINAL',
                        bold: true,
                        size: 26
                    })
                ],
            }),
    
            new Paragraph ({
                style: 'tipo_laudo',
                children: [
                    new TextRun({
                        text: this.documento.atendimento.fields.tipoExame,
                        size: 21
                    }),
                ],
            })
        ];

    }

}