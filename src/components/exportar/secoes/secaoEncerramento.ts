import { Secao } from '../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';

export class SecaoEncerramento extends Secao{

    async run(){
        return [

            new Paragraph ({
                style: 'titulo',
                children: [
                    new TextRun(' ')
                ]
            }),

            new Paragraph ({
                style: 'padrao',
                keepNext: true,
                children: [
                    new TextRun({ text: 'Não havendo mais nada a informar encerra-se o presente Laudo que, ' +
                        'elaborado em '}),
                        new TextRun({
                            children: [PageNumber.TOTAL_PAGES],
                        }),
                    new TextRun(' laudas ' +
                        'devidamente numeradas, segue assinado pel' + this.documento.perito.getArtigo() + 
                        ' signatári' + this.documento.perito.getArtigo() + '.'),
                ]
            })
        ];
    }

}