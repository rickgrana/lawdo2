import { Documento } from './documento'; 

import { Paragraph, TextRun, Footer, Media, 
    HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
    PageNumber, ImageRun, TabStopType, TabStopPosition
} 
    from 'docx';

export abstract class Rodape{

    static async run(laudo: Documento) {

        const imgRodape = await fetch('/assets/rodape_faixa.png');
        const imgRodape2 = await fetch('/assets/rodape_texto.png');

        /*const imageRodape = await Media.addMedia(laudo.docx, await imgRodape.arrayBuffer(), 320 * 2, 10, {
            floating: {
                horizontalPosition: {
                    relative: HorizontalPositionRelativeFrom.MARGIN,
                    offset: 0, // relative: HorizontalPositionRelativeFrom.PAGE by default
                },
                verticalPosition: {
                    relative: VerticalPositionRelativeFrom.PARAGRAPH,
                    offset: 0, // relative: VerticalPositionRelativeFrom.PAGE by default
                },
            },
        });

        const imgRodape2 = await fetch('/assets/rodape_texto.png');
        const imageRodape2 = await Media.addImage(laudo.docx, await imgRodape2.arrayBuffer(), 370, 30, {
        floating: {
            horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.MARGIN,
                offset: 20, // relative: HorizontalPositionRelativeFrom.PAGE by default
            },
            verticalPosition: {
                relative: VerticalPositionRelativeFrom.PARAGRAPH,
                offset: 20, // relative: VerticalPositionRelativeFrom.PAGE by default
            },
        },
        });*/

        return new Footer({ // The standard default header
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: await imgRodape.arrayBuffer(),
                            transformation: {
                                width: 320 * 2,
                                height: 10
                            }
                        }),
                        new ImageRun({
                            data: await imgRodape2.arrayBuffer(),
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