import { Documento } from './documento'; 

import { Paragraph, TextRun, Header, Media, ImageRun} from 'docx';

import {ImageHelper} from './helper/imageHelper';

export abstract class Cabecalho{

    static async run(laudo: Documento) {

        const img = await ImageHelper.getBufferFromURL('/assets/cabecalho.png');


        //const img = await fetch('/assets/cabecalho.png');
        //const imageCabecalho =  Media.addImage(laudo.docx, await img.arrayBuffer(), 320 * 2, 48 * 2);
    
        return new Header({ 
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: img,
                            transformation: {
                                width: 320 * 2,
                                height: 48 * 2
                            }
                        })
                    ]
                }),
                new Paragraph({
                    style: 'numero_laudo',
                    children: [
                        new TextRun({
                            text: 'LAUDO Nº ' + laudo.getNumeroLaudo()
                        })
                    ]
                })
            ]
        });
      }

}