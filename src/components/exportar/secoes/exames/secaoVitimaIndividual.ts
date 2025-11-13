import { Secao } from '../../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Vitima } from 'src/app/models/vitima.model';

export class SecaoVitimaIndividual extends Secao{

    private vitima: Vitima;
    
    setVitima(vitima: Vitima){
        this.vitima = vitima;

        return this;
    }

    getVitima(){
        return this.vitima;
    }

    async runInternal(){

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        // CADAVER
        const retorno = [];

        retorno.push(new TextRun({ text: 'O cadáver doravante denominado de '}));

        retorno.push(new TextRun({ text: this.getVitima().index, bold: true}));

        if (!this.getVitima().identificada) {
            retorno.push(new TextRun({ text: ', sem identificação no momento da realização do exame', bold: true}));
        } else{
            if (this.getVitima().identificada == 'Não reconhecida') {
                retorno.push(new TextRun({ text: ', sem reconhecimento no momento da realização do exame', bold: true}));
            }else{
            retorno.push(new TextRun({ text: ', ' + this.getVitima().identificada.toLowerCase() + 
                        ' no local como sendo referente a '}));
            retorno.push(new TextRun({ text: this.getVitima().nome.toUpperCase(), bold: true}));
            }
        }

        retorno.push(new TextRun({ text: ', tratava-se de '}));
        retorno.push(new TextRun({ text: this.getVitima().porte.toUpperCase(), bold: true}));

        retorno.push(new TextRun({ text: ', do sexo '}));
        retorno.push(new TextRun({ text: this.getVitima().getSexoText().toUpperCase(), bold: true}));

        if (this.getVitima().rg.length) {
        retorno.push(new TextRun({ text: ', RG Nº', bold: true}));
        retorno.push(new TextRun({ text: this.getVitima().rg, bold: true}));
        }

        if (this.getVitima().idade) {
            retorno.push(new TextRun({ text: ', ' + this.getVitima().idade + ' anos', bold: true}));
        }

        retorno.push(new TextRun({ text: ', de tez '}));
        retorno.push(new TextRun({ text: this.getVitima().etnia.toLowerCase()}));

        retorno.push(new TextRun({ text: ', cabelos '}));
        retorno.push(new TextRun({ text: this.getVitima().cabelo.cor.toLowerCase()}));

        retorno.push(new TextRun({ text: ' '}));
        retorno.push(new TextRun({ text: this.getVitima().cabelo.tipo.toLowerCase()}));

        retorno.push(new TextRun({ text: ' de tamanho '}));
        retorno.push(new TextRun({ text: this.getVitima().cabelo.comprimento.toLowerCase()}));

        retorno.push(new TextRun({ text: ', com estatura '}));
        retorno.push(new TextRun({ text: this.getVitima().estatura.toLowerCase()}));

        retorno.push(new TextRun({ text: ' e compleição física '}));
        retorno.push(new TextRun({ text: this.getVitima().complfisica.toLowerCase()}));

        retorno.push(new TextRun({ text: '. '}));


        retorno.push(new TextRun({ text: 'Quanto às vestes, trajava '}));

        if (this.getVitima().vestes.cabeca.length) {
            retorno.push(new TextRun({ text: this.getVitima().vestes.cabeca + ' na cabeça, '}));
        }

        if (this.getVitima().vestes.superior.length) {
            retorno.push(new TextRun({ text: this.getVitima().vestes.superior + ', '}));
        }else{
            retorno.push(new TextRun({ text:  'com o dorso despido, '}));
        }

        if (this.getVitima().vestes.inferior.length) {
            retorno.push(new TextRun({ text: this.getVitima().vestes.inferior + ', '}));
        }else{
            retorno.push(new TextRun({ text: 'com a parte inferior do corpo despida, '}));
        }

        if (this.getVitima().vestes.calcados.length) {
            retorno.push(new TextRun({ text: 'além de ' + this.getVitima().vestes.calcados + ' nos pés.'}));
        } else {
            retorno.push(new TextRun({ text: 'com os pés descalços.'}));
        }

        let secoes = [];

        secoes = secoes.concat([

                new Paragraph ({
                    style: 'padrao',
                    children: retorno
                }),

                new Paragraph ({
                    style: 'padrao',
                    children: [
                        new TextRun({
                            text: 'O corpo da vítima encontrava-se em posição ' + this.getVitima().posicao.toLowerCase() + 
                                ' e em estado de ' +  this.getVitima().estado.toLowerCase() + ', ' +
                                this.getVitima().localizacao + '.'
                        }),
                    ]
                }),

                
                
        ]);

        //secoes = secoes.concat(this.getSecaoFerimentos(this.getVitima(), index));

        return secoes;
    }

}