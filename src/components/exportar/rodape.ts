import { Documento } from './documento'; 

import { Paragraph, TextRun, Footer,
    PageNumber, ImageRun, TabStopType, TabStopPosition
} 
    from 'docx';

import { ImageHelper } from './helper/imageHelper';

export abstract class Rodape{

    static async run(laudo: Documento) {

        const dataFaixa = await ImageHelper.getBufferFromURL('/assets/rodape_faixa.png');
        const dataTexto = await ImageHelper.getBufferFromURL('/assets/rodape_texto.png');

        return new Footer({ // The standard default header
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: dataFaixa,
                            type: "png",
                            transformation: {
                                width: 320 * 2,
                                height: 10
                            }
                        }),
                        new ImageRun({
                            data: dataTexto,
                            type: "png",
                            transformation: {
                                width: 370,
                                height: 30
                            }
                        }),

                        new TextRun({
                            children: ['\tPágina ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
                        }),
                    ],

                    tabStops: [{
                        position: TabStopPosition.MAX,
                        type: TabStopType.RIGHT
                    }]
                }),
                //footer
            
            ],
        })
    }

}