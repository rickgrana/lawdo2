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

    /** Nome do .docx na exportação: anos do laudo e do protocolo com 2 dígitos (ex.: 26). */
    getNomeArquivo(){
        const anoLaudo = Documento.ano2DigitosNomeArquivo(this.atendimento.fields.laudo?.ano);
        const anoProto = Documento.ano2DigitosNomeArquivo(this.atendimento.fields.protocolo?.ano);
        return `${anoLaudo}-${this.atendimento.fields.laudo.numero}--${anoProto}-${this.atendimento.fields.protocolo.numero}`;
    }

    /** Últimos 2 dígitos do ano (AAAA ou AA → AA). */
    private static ano2DigitosNomeArquivo(ano: string | number | null | undefined): string {
        const d = String(ano ?? '').replace(/\D/g, '');
        if (!d.length) {
            return '00';
        }
        return d.length >= 2 ? d.slice(-2) : d.padStart(2, '0');
    }

    proximoNumeroFigura(): number {
        this.contadorFigura += 1;
        return this.contadorFigura;
    }

}
