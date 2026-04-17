import { Secao } from '../../secao'; 
import { Paragraph, TextRun} from 'docx';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { Vitima } from 'src/app/models/vitima.model';
import { MapaTipoVestigio } from 'src/app/atendimento/vitima/mapa/mapa-ferramenta.enum';
import { MapaVisao } from 'src/app/atendimento/vitima/mapa/mapa-visao.enum';
import { REGIOES_CABECA_ANTERIOR } from 'src/app/const/regioes-cabeca-anterior';
import { REGIOES_CABECA_LATERAL } from 'src/app/const/regioes-cabeca-lateral';
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


        const paragrafosVestigios = await this.getParagrafosVestigiosPorTipo();
        if(paragrafosVestigios.length > 0){
            retorno = retorno.concat(paragrafosVestigios);
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

    private normalizarNomeRegiao(nomeRegiao: string): string {
        return nomeRegiao.replace(/^Região\s+/i, '').trim();
    }

    private getCabecalhoTipoVestigio(tipo: MapaTipoVestigio, totalVestigios: number): string {
        const plural = totalVestigios !== 1;
        const totalExtenso = NumberHelper.getExtenso(totalVestigios, 'M');

        if(tipo === MapaTipoVestigio.PAF){
            return 'A presença de ' +
                totalVestigios.toString().padStart(2, '0') +
                ' (' + totalExtenso + ') ' +
                'ferimento' + (plural ? 's' : '') +
                ' produzido' + (plural ? 's' : '') +
                ' por instrumento perfuro-contundente e compatíve' + (plural ? 'is' : 'l') +
                ' ao' + (plural ? 's' : '') +
                ' produzido' + (plural ? 's' : '') +
                ' por ' + (plural ? 'projéteis' : 'projétil') +
                ' de arma de fogo curta, nas seguintes quantidades e regiões:';
        }

        if(tipo === MapaTipoVestigio.FACA){
            return 'A presença de ' +
                totalVestigios.toString().padStart(2, '0') +
                ' (' + totalExtenso + ') ' +
                'ferimento' + (plural ? 's' : '') +
                ' produzido' + (plural ? 's' : '') +
                ' por instrumento perfuro-cortante, nas seguintes quantidades e regiões:';
        }

        if(tipo === MapaTipoVestigio.TACO){
            return 'A presença de ' +
                totalVestigios.toString().padStart(2, '0') +
                ' (' + totalExtenso + ') ' +
                'les' + (plural ? 'ões' : 'ão') +
                ' produzida' + (plural ? 's' : '') +
                ' por instrumento contundente, nas seguintes quantidades e regiões:';
        }

        return 'A presença de ' +
            totalVestigios.toString().padStart(2, '0') +
            ' (' + totalExtenso + ') ' +
            'hematoma' + (plural ? 's' : '') +
            ', nas seguintes quantidades e regiões:';
    }

    private getTermoItemTipoVestigio(tipo: MapaTipoVestigio, quantidade: number): string {
        if(tipo === MapaTipoVestigio.PAF){
            return 'perfuraç' + (quantidade > 1 ? 'ões' : 'ão');
        }
        if(tipo === MapaTipoVestigio.FACA){
            return 'les' + (quantidade > 1 ? 'ões' : 'ão');
        }
        if(tipo === MapaTipoVestigio.TACO){
            return 'les' + (quantidade > 1 ? 'ões' : 'ão');
        }
        return 'hematoma' + (quantidade > 1 ? 's' : '');
    }

    private traduzirRegiaoPorVisao(visao: MapaVisao, regiao: string): string {
        const codigoRegiao = regiao.trim();
        const regioesCabececaLateral = REGIOES_CABECA_LATERAL;

        if (visao === MapaVisao.CABECA_ANTERIOR) {
            return REGIOES_CABECA_ANTERIOR.get(codigoRegiao) ?? codigoRegiao;
        }

        if (visao === MapaVisao.CABECA_LE) {
            return (
                regioesCabececaLateral.get(codigoRegiao) ??
                regioesCabececaLateral.get(`${codigoRegiao}E`) ??
                codigoRegiao
            );
        }

        if (visao === MapaVisao.CABECA_LD) {
            return (
                regioesCabececaLateral.get(codigoRegiao) ??
                regioesCabececaLateral.get(`${codigoRegiao}D`) ??
                codigoRegiao
            );
        }

        if (visao === MapaVisao.CORPO_VERSO) {
            return REGIOES_CORPO_VERSO.get(codigoRegiao) ?? codigoRegiao;
        }

        return REGIOES_CORPO_FRENTE.get(codigoRegiao) ?? codigoRegiao;
    }

    async getParagrafosVestigiosPorTipo(): Promise<any[]> {
        const secoes: any[] = [];
        const tiposOrdem = [
            MapaTipoVestigio.PAF,
            MapaTipoVestigio.FACA,
            MapaTipoVestigio.TACO,
            MapaTipoVestigio.HEMATOMA
        ];

        for (const tipo of tiposOrdem) {
            const vestigiosPorRegiao = new Map<string, { visao: MapaVisao; regiao: string; quantidade: number }>();

            for (const vestigio of this.vitima.vestigios ?? []) {
                if (vestigio.tipoVestigio !== tipo) {
                    continue;
                }
                if (!vestigio.visao) {
                    continue;
                }
                const regiao = String(vestigio.regiao ?? '').trim();
                if (!regiao) {
                    continue;
                }
                const quantidade = Number(vestigio.quantidade);
                const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;
                const chave = `${vestigio.visao}::${regiao}`;
                const atual = vestigiosPorRegiao.get(chave);
                if (atual) {
                    atual.quantidade += quantidadeValida;
                } else {
                    vestigiosPorRegiao.set(chave, {
                        visao: vestigio.visao,
                        regiao,
                        quantidade: quantidadeValida,
                    });
                }
            }

            let totalVestigios = 0;
            for (const item of vestigiosPorRegiao.values()) {
                totalVestigios += Number(item.quantidade);
            }

            if (totalVestigios === 0) {
                continue;
            }

            secoes.push(
                new Paragraph({
                    style: 'padrao',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: this.getCabecalhoTipoVestigio(tipo, totalVestigios),
                        }),
                    ],
                })
            );

            const itensPorRegiao = Array.from(vestigiosPorRegiao.values());
            for (let i = 0; i < itensPorRegiao.length; i++) {
                const item = itensPorRegiao[i];
                const ultimoItemDoTipo = i === itensPorRegiao.length - 1;
                const qtde = item.quantidade;
                const regiaoTraduzida = this.traduzirRegiaoPorVisao(item.visao, item.regiao);
                const nomeRegiao = this.normalizarNomeRegiao(regiaoTraduzida).toUpperCase();
                const termoItem = this.getTermoItemTipoVestigio(tipo, qtde);

                secoes.push(
                    new Paragraph({
                        style: 'Normal',
                        bullet: {
                            level: 1,
                        },
                        children: [
                            new TextRun({
                                text: qtde.toString().padStart(2, '0') +
                                    ' (' + NumberHelper.getExtenso(qtde, 'F') + ') ' +
                                    termoItem + ' na região '
                            }),
                            new TextRun({ text: nomeRegiao, bold: true }),
                            new TextRun(ultimoItemDoTipo ? '.' : ';')
                        ],
                    })
                );
            }

            secoes.push(new Paragraph(''));
        }

        return secoes;
    }

}