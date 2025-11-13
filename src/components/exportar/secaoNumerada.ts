import { Secao } from './secao';
import { Documento } from './documento';

import { Paragraph, TextRun, TabStopType } from 'docx';

export const INDICE_NUMERADO    = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const INDICE_LETRADO     = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

interface SecaoArguments{
    documento: Documento;
    secaoUperior?: SecaoNumerada;
}

export class SecaoNumerada extends Secao{

    protected secaoSuperior: SecaoNumerada;
    protected separadorSubItens = '.';
    protected indice;
    protected subIndices = INDICE_LETRADO;
    protected estiloTitulo = 'titulo';

    constructor(documento: Documento, secaoUperior?: SecaoNumerada){
        super(documento);

        if(!secaoUperior){
            this.secaoSuperior = null;
        }else{
            this.secaoSuperior = secaoUperior;
        }
        
    }

    // Titulo da Seçao
    getTitulo(){
        return '';
    }

    getProximoIndice(){
        return this.subIndices.shift();
    }

    getIndiceCompleto(){
        let indice = this.indice;

        if(this.secaoSuperior != null){
            indice = this.secaoSuperior.getIndiceCompleto() + this.secaoSuperior.separadorSubItens + this.indice;
        }

        return indice;
    }

    getNivel(){
        return 0;
    }

    getParagrafoTitulo(){
        return new Paragraph ({
            style: 'titulo',
            keepNext: true,
            numbering: {
                reference: 'titulo-reference',
                level: this.getNivel(),
                custom: true
            },
            contextualSpacing: false,
            children: [
                new TextRun({
                    text: this.getTitulo()
                }),
            ],

            tabStops: [{
                position: 0,
                type: TabStopType.LEFT
            }]
        });
    }

    

    async run(){

        if(!this.isSecaoDisponivel()){
            return [];
        }

        if(!this.secaoSuperior){
            this.indice = this.documento.getProximoCapitulo();
        }else{
            this.indice = this.secaoSuperior.getProximoIndice();
        }

        //this.capitulo = this.documento.getProximoCapitulo();

        let secoes = [this.getParagrafoTitulo()];

        secoes = secoes.concat(await this.runInternal()); 

        return secoes;
    }

    async runInternal(){
        return [];
    }


}