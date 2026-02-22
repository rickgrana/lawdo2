import { Atendimento } from 'src/app/models/atendimento.model'; 
import { Secao } from './secao'; 
import { Perito } from './perito'; 

export class Documento{

    public docx: any;
    public atendimento: Atendimento;
    public perito: Perito;
    public secoes: Secao[] = [];
    public capitulos = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    constructor(atendimento: Atendimento, perito: Perito){
        this.atendimento = atendimento;
        this.perito = perito;
    }

    criarSecao(secao: Secao){
        secao.documento = this;
        this.secoes.push(secao);
    }

    getCreator(){
        return this.perito.corporacao.nome;
    }

    getNumeroLaudo(){
        return this.atendimento.fields.laudo.numero + '/' + this.atendimento.fields.laudo.ano;
    }

    getConteudo(){
    }

    getProximoCapitulo(){
        return this.capitulos.shift() ?? '';
    }

    getNomeArquivo(){
        return this.atendimento.fields.laudo.ano + '-' + this.atendimento.fields.laudo.numero + 
                '--' +
                this.atendimento.fields.protocolo.ano + '-' + this.atendimento.fields.protocolo.numero;
    }
    

}
