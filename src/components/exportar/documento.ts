import { Atendimento } from 'src/app/models/atendimento.model'; 
import { Secao } from './secao'; 
import { Perito } from './perito'; 

import { CorporacaoService } from 'src/app/cadastros/corporacao/corporacao.service';
import { UnidadeService } from 'src/app/cadastros/unidade/unidade.service';


export class Documento{

    public docx: any;
    public atendimento: Atendimento;

    public secoes: Secao[];
    public perito: Perito;
    public corporacao: any;
    public unidade: any;

    capitulos = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    criarSecao(secao: Secao){
        secao.documento = this;
        this.secoes.push(secao);
    }

    getCreator(){
        return 'Polícia Civil do Amazonas';
        return this.perito.corporacao.nome;
    }

    getNumeroLaudo(){
        return this.atendimento.fields.laudo.numero + '/' + this.atendimento.fields.laudo.ano;
    }

    getConteudo(){

    }

    getProximoCapitulo(){
        return this.capitulos.shift();
    }


    getNomeArquivo(){
        return this.atendimento.fields.laudo.ano + '-' + this.atendimento.fields.laudo.numero + 
                '--' +
                this.atendimento.fields.protocolo.ano + '-' + this.atendimento.fields.protocolo.numero;
    }
    

}
