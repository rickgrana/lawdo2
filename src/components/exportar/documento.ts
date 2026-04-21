import { Atendimento } from 'src/app/models/atendimento.model'; 
import { Secao } from './secao'; 
import { Perito } from './perito'; 

export class Documento{

    public docx: any;
    public atendimento: Atendimento;
    public perito: Perito;
    public secoes: Secao[] = [];
    /** Capítulos romanos para seções primárias (Portaria 003/2017-DPTC/AM, art. 19 e 23). */
    public capitulos = ['I', 'II', 'III', 'IV', 'V'];

    private contadorFigura = 0;

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

    /**
     * Portaria 003/2017-DPTC/AM, art. 11 §§3–4: LAUDO Nº cinco dígitos, hífen, ano quatro dígitos.
     */
    getNumeroLaudo(){
        const num = String(this.atendimento.fields.laudo.numero ?? '').replace(/\D/g, '');
        const ano = String(this.atendimento.fields.laudo.ano ?? '').trim();
        const ano4 = ano.length >= 4 ? ano.slice(-4) : ano.padStart(4, '0');
        const cinco = num.padStart(5, '0');
        return `${cinco}-${ano4}`;
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

    proximoNumeroFigura(): number {
        this.contadorFigura += 1;
        return this.contadorFigura;
    }

}
