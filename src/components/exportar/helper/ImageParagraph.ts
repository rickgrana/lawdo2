import { ImageHelper } from './imageHelper';

import { Paragraph, TextRun, Media, SequentialIdentifier, ImageRun } from 'docx';

export class ImageParagraph{

    static get(imageData, legenda, width, height) {
    
        return [
            
            new Paragraph ({
                style: 'figura',
                children: [
                    new ImageRun({
                        data: imageData,
                        transformation: {
                            width: width,
                            height: height
                        }
                    })
                ]
            }),
            new Paragraph ({
                style: 'legenda_figura',
                children: [
                    new TextRun({
                        text: 'Figura '
                    }),

                    new SequentialIdentifier("Figura"),

                    new TextRun({
                        text: (legenda.length > 0)?': '+ legenda:''
                    })
                ],
            })
        ];    
    }

}