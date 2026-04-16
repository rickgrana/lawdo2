import { Secao } from '../../secao'; 
import { Paragraph, TextRun} from 'docx';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { Vitima } from 'src/app/models/vitima.model';
import { MapaTipoVestigio } from 'src/app/atendimento/vitima/mapa/mapa-ferramenta.enum';
import { REGIOES_CORPO_FRENTE } from 'src/app/const/regioes-corpo-frente';
import { REGIOES_CORPO_VERSO } from 'src/app/const/regioes-corpo-verso';

export class SecaoPerinecroVitima extends Secao{

    private vitima!: Vitima;
    
    setVitima(vitima: Vitima){
        this.vitima = vitima;

        return this;
    }

    getVitima(){
        return this.vitima;
    }

    override async runInternal(): Promise<any[]> {

        let retorno: any[] = [];

        let model = this.documento.atendimento;
    
        retorno = retorno!.concat([
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: 'A partir da observação dos elementos presentes no local de crime, ' +
                            'em relação à '
                    }),

                    new TextRun({
                        text: this.getVitima().index,
                        bold: true
                    }),

                    new TextRun({
                        text: ', constatou o perit' + this.documento.perito.getArtigo() + ':'
                    })
                ]
            })
        ]);


        const ferimentosResultado = await this.getParagrafoFerimentos();
        const ferimentos = ferimentosResultado.secoes;

        if(ferimentos.length > 0){

            retorno = retorno.concat([
                new Paragraph ({
                    style: 'padrao',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: this.getTextoResumoFerimentos(ferimentosResultado.totalVestigios),
                        }),
                    ],
                })
            ]);

            
            for(const ferimento of ferimentos){
                retorno = retorno.concat(ferimento);
            }
        }

        if(this.documento.atendimento.isSuicidio){
            retorno = retorno.concat([
                new Paragraph ({
                    style: 'Normal',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: 'A presença na VÍTIMA de sulco único ascendente e oblíquo na região do pescoço, com borda superior mais alta que a inferior, com interrupção na parte posterior da cabeça;',
                        }),
                    ],
                })
            ]);
        }

        // PERTENCES DA VITIMA
        if(this.vitima.pertences.length > 0){

            if(this.vitima.pertences.trim().toUpperCase() == 'NADA'){
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'Normal',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A AUSÊNCIA de PERTENCES com a vítima;',
                            }),
                        ],
                    })
                ]);
            }else{

                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'Normal',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A presença dos seguintes PERTENCES com a vítima:',
                            }),
                        ],
                    })
                ]);

                this.vitima.pertences.split(",").forEach((pertence) => {
                    retorno = retorno.concat([
                        new Paragraph ({
                            style: 'Normal',
                            bullet: {
                                level: 1,
                            },
                            children: [
                                new TextRun({
                                    text: pertence.trim().toUpperCase()
                                }),
                                new TextRun(';')
                            ],
                        }),
                    ]);
                });
            }
        }


        // TATUAGENS DA VITIMA
        if(this.vitima.tatuagens.length > 0){

            const qtde = this.vitima.tatuagens.split(",").length;

            if(qtde == 1){
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'Normal',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A presença de TATUAGEM ' + this.vitima.tatuagens,
                            }),
                        ],
                    })
                ]);
            }else{

                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'Normal',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A presença de TATUAGEM nas seguintes regiões:'
                            }),
                        ],
                    })
                ]);
             
                this.vitima.tatuagens.split(",").forEach((tatoo) => {
                    retorno = retorno.concat([
                        new Paragraph ({
                            style: 'Normal',
                            bullet: {
                                level: 1,
                            },
                            children: [
                                new TextRun({
                                    text: tatoo.trim().toUpperCase()
                                }),
                                new TextRun(';')
                            ],
                        }),
                    ]);
                });
            }
        }


        // OBSERVAÇÕES DA VITIMA
        if(this.vitima.observacoes.length > 0){

            this.vitima.observacoes.split(";").forEach((item) => {
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'Normal',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: item.trim()
                            }),
                            new TextRun(';')
                        ],
                    }),
                ]);
            });
        }
        

        return retorno;

    }

    private getTextoResumoFerimentos(totalVestigios: number): string {
        const plural = totalVestigios !== 1;
        const totalExtenso = NumberHelper.getExtenso(totalVestigios, 'M');

        return 'A presença de ' +
            totalVestigios.toString().padStart(2, '0') +
            ' (' + totalExtenso + ') ' +
            'ferimento' + (plural ? 's' : '') +
            ' produzido' + (plural ? 's' : '') +
            ' por instrumento perfuro-contundente e compatíve' + (plural ? 'is' : 'l') +
            ' ao' + (plural ? 's' : '') +
            ' produzido' + (plural ? 's' : '') +
            ' por projétei' + (plural ? 's' : '') +
            ' de arma de fogo curta, nas seguintes quantidades e regiões:';
    }

    private normalizarNomeRegiao(nomeRegiao: string): string {
        return nomeRegiao.replace(/^Região\s+/i, '').trim();
    }

    async getParagrafoFerimentos(): Promise<{ secoes: any[]; totalVestigios: number }> {

        let secoes: any[] = [];
    
        const pafsPorRegiao = new Map<string, number>();
    
    
        var regiao_traduzida= '';
    
    
        for (const vestigio of this.vitima.vestigios ?? []) {
            if (vestigio.tipoVestigio !== MapaTipoVestigio.PAF) {
                continue;
            }
            const regiao = String(vestigio.regiao ?? '').trim();
            if (!regiao) {
                continue;
            }
            const quantidade = Number(vestigio.quantidade);
            const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;
            const atual = pafsPorRegiao.get(regiao) ?? 0;
            pafsPorRegiao.set(regiao, atual + quantidadeValida);
        }

        let totalVestigios = 0;
        const regioes = new Map<string, string>([
            ...REGIOES_CORPO_FRENTE,
            ...REGIOES_CORPO_VERSO
        ]);

        for (const [regiao, qtde] of pafsPorRegiao) {
            regiao_traduzida = regioes.get(regiao.trim()) ?? regiao.trim();
            const nomeRegiao = this.normalizarNomeRegiao(regiao_traduzida).toUpperCase();
            totalVestigios += Number(qtde);

            secoes = secoes.concat([
                new Paragraph ({
                    style: 'Normal',
                    bullet: {
                        level: 1,
                    },
                    children: [
                        new TextRun({
                            text: qtde.toString().padStart(2, '0') + 
                            ' (' + NumberHelper.getExtenso(qtde, 'F') + ')' + 
                            ' perfuraç' + ((qtde > 1) ? 'ões' : 'ão') + ' na região '
                        }),
                        new TextRun({ text: nomeRegiao, bold: true }),
                        new TextRun(';')
                    ],
                }),
            ]);
        }
    
        if(secoes.length > 0){
            secoes = secoes.concat([
                new Paragraph ('')
            ]);
        }
        
    
        /*const lesoes = new Map();
        let qtde = 0;
    
        for (let item of data.ferimentos.cabeca_anterior.items) {
            if (lesoes.has(item.regiao)) {
                qtde = lesoes.get(item.regiao);
            } else {
                qtde = 0;
            }
    
            lesoes.set(item.regiao, qtde + 1);
        }
    
        for (let item of data.ferimentos.cabeca_posterior.items) {
            if (lesoes.has(item.regiao)) {
                qtde = lesoes.get(item.regiao);
            } else {
                qtde = 0;
            }
    
            lesoes.set(item.regiao, qtde + 1);
        }
        
        for (let item of data.ferimentos.cabeca_lateral.items) {
            if (lesoes.has(item.regiao)) {
                qtde = lesoes.get(item.regiao);
            } else {
                qtde = 0;
            }
    
            lesoes.set(item.regiao, qtde + 1);
        }
    
        lesoes.forEach((qtde, regiao) => {
    
    
            secoes = secoes.concat([
                new Paragraph ({
                    style: 'padrao',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: qtde.toString().padStart(2, '0') + 
                            ' (' + NumberHelper.getExtenso(qtde) + ')' + 
                            ' perfuraç' + ((qtde > 1) ? 'ões' : 'ão') + ' na região '
                        }),
                        new TextRun({ text: regiao.toUpperCase(), bold: true }),
                        new TextRun(';')
                    ],
                }),
            ]);
        });*/
    
        return { secoes, totalVestigios };
      }

}