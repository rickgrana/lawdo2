import { ImageHelper } from './imageHelper';

import { Paragraph, TextRun, TableCell, VerticalAlign, BorderStyle} from 'docx';

const noBorder = {
    style: BorderStyle.NIL,
    size: 1,
    color: '#FF0000',
};

export class ImageCell{

    static async get(imageParagraph: any, columnSpan: number) {
    
        return new TableCell({
            children: imageParagraph,
            verticalAlign: VerticalAlign.CENTER,
            borders: {
                top: noBorder,
                bottom: noBorder,
                left: noBorder,
                right: noBorder
            },
            columnSpan: columnSpan,
        });
    }

}