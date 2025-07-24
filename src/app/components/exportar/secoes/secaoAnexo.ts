import { Secao } from '../secao'; 
import { Paragraph, TextRun, PageNumber, Table, WidthType, TableLayoutType,
    BorderStyle, TableCell, VerticalAlign, TableRow, HeightRule, Media } from 'docx';

import {ImageHelper} from '../helper/imageHelper';
import {ImageCell} from '../helper/imageCell';
import { ImageParagraph } from '../helper/ImageParagraph';

export class SecaoAnexo extends Secao{

    cells = [];
    rows = [];

    total = 0;



    isSecaoDisponivel(){
        return (this.documento.atendimento.imagens.length > 0);
    }

    async runInternal(){

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        let anexos = await this.getImagens();

        return [
            new Paragraph ({
                style: 'titulo_anexo',
                pageBreakBefore: true,
                children: [
                    new TextRun({
                        text: 'ANEXO I'
                        
                    }),
                ],
            }),
        
            new Table({
                rows: anexos,

                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                
                columnWidths: [4000, 4000],
                layout: TableLayoutType.AUTOFIT
                /*,
                height: {
                    value: 50,
                    rule: HeightRule.AUTO
                }*/
            })
                
        ];
    
    }


    getImagens() {
    
        let imagens = this.documento.atendimento.imagens;
        
        this.cells  = [];
        this.rows   = [];
        this.total = 0;

        const promises = [];
        const paragraphs = [];
        var i = 0;
        
        for (let imagem of imagens) {

            let promise = this.addParagraph(paragraphs, i, imagem);

            promises.push(promise);

            i++;
        };

        return Promise.all(promises).then(async() => {
            for (let paragraph of paragraphs) {
                this.total += 1;

                await this.addCell(paragraph);
            }

            return this.rows;
        });
        
    }

    addParagraph(paragraphs, ordem, imagem){

        return this.getImageParagraph(imagem).then(
            function(paragraph) {
                paragraphs[ordem] = paragraph;
            }
        );
    }

    isPrimeiraImagem(){
        return this.total == 1;
    }

    isUltimaImagem(){
        return this.total == this.documento.atendimento.imagens.length;
    }

    isSemImagens(){
        return this.total == 0;
    }

    isFimLinha(){
        return this.total % 2;
    }


    /*async outputImage(imagem)
    {
        this.total += 1;

        let imageParagraph = await this.getImageParagraph(imagem);

        await this.addCell(imageParagraph);
    }*/

    getImageParagraph(imagem) {

        return ImageHelper.getBufferFromURL(imagem.imagem)
                .then(function(buffer){
                    return ImageHelper.loadFromURL(imagem.imagem).then(img => {

                        return [img[0], img[1]];
                    })
                    .then(function(result){
                        const width= result[0];
                        const height = result[1];

                        return ImageParagraph.get(buffer, imagem.legenda, 200 * width/height, 200);
                    });
                });


        //const imageData = await Media.addImage(this.documento.docx, buffer, 200 * width/height, 200);
    }
    
    async addCell(imageParagraph){

        let colSpan = 1;

        if(this.isPrimeiraImagem() || (this.isUltimaImagem())) { 
            colSpan = 2;
        }

        let cell = await ImageCell.get(imageParagraph, colSpan);

        await this.cells.push(cell);

        await this.addCellsToRows();

    }

    async addCellsToRows(){

        if(this.isFimLinha() || this.isUltimaImagem()){

            await this.rows.push(
                new TableRow({
                    children: this.cells,
                    height: {
                        value: 250,
                        rule: HeightRule.AUTO
                    }
                })
            );

            this.cells = [];
        }
      
        
    }


    

}