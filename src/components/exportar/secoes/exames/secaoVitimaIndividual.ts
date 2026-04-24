import { Secao } from '../../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Vitima } from 'src/app/models/vitima.model';

export class SecaoVitimaIndividual extends Secao{

    private vitima!: Vitima;
    
    setVitima(vitima: Vitima){
        this.vitima = vitima;

        return this;
    }

    getVitima(){
        return this.vitima;
    }

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();
        const vitima = this.getVitima();
        const textoValido = (valor: unknown): string => String(valor ?? '').trim();
        const temTexto = (valor: unknown): boolean => textoValido(valor).length > 0;

        // CADAVER
        const retorno: any[] = [];

        retorno.push(new TextRun({ text: 'O cadáver doravante denominado de '}));

        retorno.push(new TextRun({ text: vitima.index, bold: true}));

        if (!vitima.identificada) {
            retorno.push(new TextRun({ text: ', sem identificação no momento da realização do exame', bold: true}));
        } else{
            if (vitima.identificada == 'Não reconhecida') {
                retorno.push(new TextRun({ text: ', sem reconhecimento no momento da realização do exame', bold: true}));
            }else{
            retorno.push(new TextRun({ text: ', ' + (vitima.identificada as string)!.toLowerCase() + 
                        ' no local como sendo referente a '}));
            retorno.push(new TextRun({ text: vitima.nome.toUpperCase(), bold: true}));
            }
        }

        if (temTexto(vitima.porte)) {
            retorno.push(new TextRun({ text: ', tratava-se de '}));
            retorno.push(new TextRun({ text: textoValido(vitima.porte).toUpperCase(), bold: true}));
        }

        const sexo = textoValido(vitima.getSexoText());
        if (sexo) {
            retorno.push(new TextRun({ text: ', do sexo '}));
            retorno.push(new TextRun({ text: sexo.toUpperCase(), bold: true}));
        }

        if (temTexto(vitima.rg)) {
        retorno.push(new TextRun({ text: ', RG Nº', bold: true}));
        retorno.push(new TextRun({ text: textoValido(vitima.rg), bold: true}));
        }

        if (vitima.idade) {
            retorno.push(new TextRun({ text: ', ' + vitima.idade + ' anos', bold: true}));
        }

        if (temTexto(vitima.etnia)) {
            retorno.push(new TextRun({ text: ', de tez '}));
            retorno.push(new TextRun({ text: textoValido(vitima.etnia).toLowerCase()}));
        }

        const cabeloCor = textoValido(vitima.cabelo.cor).toLowerCase();
        const cabeloTipo = textoValido(vitima.cabelo.tipo).toLowerCase();
        const cabeloComprimento = textoValido(vitima.cabelo.comprimento).toLowerCase();
        if (cabeloCor || cabeloTipo || cabeloComprimento) {
            let textoCabelo = ', cabelos';
            if (cabeloCor) {
                textoCabelo += ' ' + cabeloCor;
            }
            if (cabeloTipo) {
                textoCabelo += ' ' + cabeloTipo;
            }
            if (cabeloComprimento) {
                textoCabelo += ' de tamanho ' + cabeloComprimento;
            }
            retorno.push(new TextRun({ text: textoCabelo }));
        }

        if (temTexto(vitima.estatura)) {
            retorno.push(new TextRun({ text: ', com estatura ' + textoValido(vitima.estatura).toLowerCase()}));
        }

        if (temTexto(vitima.complfisica)) {
            retorno.push(new TextRun({ text: ', compleição física ' + textoValido(vitima.complfisica).toLowerCase()}));
        }

        retorno.push(new TextRun({ text: '. '}));


        retorno.push(new TextRun({ text: 'Quanto às vestes, trajava '}));

        if (this.getVitima().vestes.cabeca.length) {
            retorno.push(new TextRun({ text: this.getVitima().vestes.cabeca + ' na cabeça, '}));
        }

        if (this.getVitima().vestes.superior.length) {
            retorno.push(new TextRun({ text: this.getVitima().vestes.superior + ', '}));
        }else{
            retorno.push(new TextRun({ text:  'encontrava-se com o dorso despido, '}));
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

        let secoes: any[] = [];

        secoes = secoes.concat([

                new Paragraph ({
                    style: 'padrao',
                    children: retorno
                }),

                new Paragraph ({
                    style: 'padrao',
                    children: [
                        new TextRun({
                            text: (() => {
                                const descricao: string[] = [];
                                if (temTexto(vitima.posicao)) {
                                    descricao.push('em posição ' + textoValido(vitima.posicao).toLowerCase());
                                }
                                if (temTexto(vitima.estado)) {
                                    descricao.push('em estado de ' + textoValido(vitima.estado).toLowerCase());
                                }
                                if (temTexto(vitima.localizacao)) {
                                    descricao.push(textoValido(vitima.localizacao));
                                }
                                const sufixo = descricao.length ? ' ' + descricao.join(', ') : '';
                                return 'O corpo da vítima encontrava-se' + sufixo + '.';
                            })()
                        }),
                    ]
                }),

                
                
        ]);

        //secoes = secoes.concat(this.getSecaoFerimentos(this.getVitima(), index));

        return secoes;
    }

}