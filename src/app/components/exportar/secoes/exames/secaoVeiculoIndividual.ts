import { Secao } from '../../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Veiculo } from 'src/app/models/veiculo.model';

export class SecaoVeiculoIndividual extends Secao{

    private veiculo: Veiculo;
    
    setVeiculo(veiculo: Veiculo){
        this.veiculo = veiculo;

        return this;
    }

    getVeiculo(){
        return this.veiculo;
    }

    async runInternal(){

        let paragrafos = [];

        let texto = [];

        texto.push(new TextRun({ text: 'O veículo, doravante denominado de '}));

        texto.push(new TextRun({ text: this.getVeiculo().index, bold: true}));

        texto.push(new TextRun({ text: ', tratava-se de '}));

        texto.push(new TextRun({ text: this.getVeiculo().tipo.toUpperCase(), bold: true})); 

        if (this.getVeiculo().tracao) {
            texto.push(new TextRun({ text: ', com tração '}));
            texto.push(new TextRun({ text: this.getVeiculo().tracao.toUpperCase(), bold: true}));
        } 


        if (this.getVeiculo().especie) {
            texto.push(new TextRun({ text: ', espécie '}));

            if (this.getVeiculo().especie == 'Misto') {
                texto.push(new TextRun({ text: 'MISTA', bold: true}));
            }else{
                if (this.getVeiculo().especie == 'Especial') {
                    texto.push(new TextRun({ text: 'ESPECIAL', bold: true}));
                }else{
                    texto.push(new TextRun({ text: 'de '}));
                    texto.push(new TextRun({ text: this.getVeiculo().especie.toUpperCase(), bold: true}));
                }
            }
            
        } 


        if (this.getVeiculo().carroceria) {
            texto.push(new TextRun({ text: ', carroceria tipo '}));
            texto.push(new TextRun({ text: this.getVeiculo().carroceria.toUpperCase(), bold: true}));
        }

        

        if (this.getVeiculo().marca) {
            texto.push(new TextRun({ text: ', da marca '}));
            texto.push(new TextRun({ text: this.getVeiculo().marca.toUpperCase(), bold: true}));
        }

        if (this.getVeiculo().modelo) {
            texto.push(new TextRun({ text: ', modelo '}));
            texto.push(new TextRun({ text: this.getVeiculo().modelo.toUpperCase(), bold: true}));
        }

        if (this.getVeiculo().ano) {
            texto.push(new TextRun({ text: ', ano '}));
            texto.push(new TextRun({ text: this.getVeiculo().ano.toUpperCase(), bold: true}));
        }

        if (this.getVeiculo().placa) {
            texto.push(new TextRun({ text: ', placa '}));
            texto.push(new TextRun({ text: this.getVeiculo().placa.toUpperCase(), bold: true}));
        }

        if (this.getVeiculo().cor) {
            texto.push(new TextRun({ text: ', na cor '}));
            texto.push(new TextRun({ text: this.getVeiculo().cor.toUpperCase(), bold: true}));
        }

        texto.push(new TextRun({ text: '.'}));
    
        paragrafos = paragrafos.concat([
                new Paragraph ({
                    style: 'padrao',
                    children: texto
                })
        ]);


        texto = [];

        if (this.getVeiculo().apresentacao.responsavel) {
            texto.push(new TextRun({ text: 'O veículo foi apresentado por '}));
            texto.push(new TextRun({ text: this.getVeiculo().apresentacao.responsavel.toUpperCase(), bold: true}));

            if (this.getVeiculo().apresentacao.doc_responsavel) {
                texto.push(new TextRun({ text: ', ' + this.getVeiculo().apresentacao.doc_responsavel}));
            }
            texto.push(new TextRun({ text: '.'}));
        }

        paragrafos = paragrafos.concat([
            new Paragraph ({
                style: 'padrao',
                children: texto
            })
        ]);

        return paragrafos;
    }

}