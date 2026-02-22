import { Documento } from './documento'; 

import { Paragraph, TextRun, Footer,
    PageNumber, ImageRun, TabStopType, TabStopPosition
} 
    from 'docx';

export abstract class Rodape{

    static async run(laudo: Documento) {

        const imgRodape = await fetch('/assets/rodape_faixa.png');
        const imgRodape2 = await fetch('/assets/rodape_texto.png');

        return new Footer({ // The standard default header
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: await imgRodape.arrayBuffer(),
                            type: "png",
                            transformation: {
                                width: 320 * 2,
                                height: 10
                            }
                        }),
                        new ImageRun({
                            data: await imgRodape2.arrayBuffer(),
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