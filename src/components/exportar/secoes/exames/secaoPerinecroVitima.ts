import { Secao } from '../../secao'; 
import { Paragraph, TextRun, convertMillimetersToTwip } from 'docx';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { formatarPertenceParaLaudo, obterPertencesItensParaDocumento, obterTatuagensItensParaDocumento, Vitima } from 'src/app/models/vitima.model';
import { MapaTipoVestigio } from 'src/app/atendimento/vitima/mapa/mapa-ferramenta.enum';
import { MapaVisao } from 'src/app/atendimento/vitima/mapa/mapa-visao.enum';
import { REGIOES_CABECA_ANTERIOR } from 'src/app/const/regioes-cabeca-anterior';
import { REGIOES_CABECA_LATERAL } from 'src/app/const/regioes-cabeca-lateral';
import { REGIOES_CORPO_FRENTE } from 'src/app/const/regioes-corpo-frente';
import { REGIOES_CORPO_VERSO } from 'src/app/const/regioes-corpo-verso';

export class SecaoPerinecroVitima extends Secao{
    /** Subalíneas: 2,5 cm além do recuo da alínea (total: 5,0 cm da margem esquerda). */
    private static readonly RECUO_SUBALINEA_TWIP = convertMillimetersToTwip(50);

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
        let indiceMarcacao = 0;
        const proximaAlinea = () => {
            indiceMarcacao += 1;
            return this.formatarMarcadorMinusculo(indiceMarcacao);
        };
        const proximoMarcador = () => {
            return proximaAlinea() + ') ';
        };

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
                        text: ', constatou o perito:'
                    })
                ]
            })
        ]);


        const paragrafosVestigios = await this.getParagrafosVestigiosPorTipo(proximaAlinea);
        if(paragrafosVestigios.length > 0){
            retorno = retorno.concat(paragrafosVestigios);
        }

        if(this.documento.atendimento.isSuicidio){
            retorno = retorno.concat([
                new Paragraph ({
                    style: 'ListParagraph',
                    children: [
                        new TextRun({
                            text: proximoMarcador() + 'A presença na VÍTIMA de sulco único ascendente e oblíquo na região do pescoço, com borda superior mais alta que a inferior, com interrupção na parte posterior da cabeça;',
                        }),
                    ],
                })
            ]);
        }

        // PERTENCES DA VITIMA
        const pertencesLista = obterPertencesItensParaDocumento(this.vitima);
        if(pertencesLista.length > 0){

            if(pertencesLista.length === 1 && pertencesLista[0].descricao.trim().toUpperCase() == 'NADA'){
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'ListParagraph',
                        children: [
                            new TextRun({
                                text: proximoMarcador() + 'A AUSÊNCIA de PERTENCES com a vítima;',
                            }),
                        ],
                    })
                ]);
            }else{
                const alineaPertences = proximaAlinea();
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'ListParagraph',
                        children: [
                            new TextRun({
                                text: alineaPertences + ') ' + 'A presença dos seguintes PERTENCES com a vítima:',
                            }),
                        ],
                    })
                ]);

                pertencesLista.forEach((pertence, i) => {
                    retorno = retorno.concat([
                        new Paragraph ({
                            style: 'ListParagraph',
                            indent: { left: SecaoPerinecroVitima.RECUO_SUBALINEA_TWIP, firstLine: 0 },
                            children: [
                                new TextRun({
                                    text: alineaPertences + '.' + String(i + 1) + ') ' + formatarPertenceParaLaudo(pertence)
                                }),
                                new TextRun(';')
                            ],
                        }),
                    ]);
                });
            }
        }


        // TATUAGENS DA VITIMA
        const tatuagensLista = obterTatuagensItensParaDocumento(this.vitima);
        if(tatuagensLista.length > 0){
            const alineaTatuagens = proximaAlinea();
            retorno = retorno.concat([
                new Paragraph ({
                    style: 'ListParagraph',
                    children: [
                        new TextRun({
                            text: alineaTatuagens + ') ' + 'A presença das seguintes TATUAGENS na vítima:'
                        }),
                    ],
                })
            ]);
         
            tatuagensLista.forEach((item, i) => {
                const regiao = item.regiao.trim();
                const descricao = item.descricao.trim();
                let linha = '';
                if (regiao.length > 0 && descricao.length > 0) {
                    linha = descricao.toUpperCase() + ', NA REGIÃO ' + this.getPreposicaoRegiao(regiao) + ' ' + regiao.toUpperCase();
                } else if (regiao.length > 0) {
                    linha = 'NA REGIÃO ' + this.getPreposicaoRegiao(regiao) + ' ' + regiao.toUpperCase();
                } else {
                    linha = descricao.toUpperCase();
                }
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'ListParagraph',
                        indent: { left: SecaoPerinecroVitima.RECUO_SUBALINEA_TWIP, firstLine: 0 },
                        children: [
                            new TextRun({
                                text: alineaTatuagens + '.' + String(i + 1) + ') ' + linha
                            }),
                            new TextRun(';')
                        ],
                    }),
                ]);
            });
        }


        // OBSERVAÇÕES DA VITIMA
        const observacoesItens = this.vitima.observacoes
            .split(';')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        if (observacoesItens.length > 0) {
            const alineaObservacoes = proximaAlinea();
            retorno = retorno.concat([
                new Paragraph({
                    style: 'ListParagraph',
                    children: [
                        new TextRun({
                            text: alineaObservacoes + ') ' + 'Observações quanto à vítima:',
                        }),
                    ],
                }),
            ]);
            observacoesItens.forEach((item, i) => {
                retorno = retorno.concat([
                    new Paragraph({
                        style: 'ListParagraph',
                        indent: { left: SecaoPerinecroVitima.RECUO_SUBALINEA_TWIP, firstLine: 0 },
                        children: [
                            new TextRun({
                                text: alineaObservacoes + '.' + String(i + 1) + ') ' + item,
                            }),
                            new TextRun(';'),
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

    private getPreposicaoRegiao(regiao: string): 'DA' | 'DO' {
        const regiaoNorm = regiao
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        const femininas = [
            'testa', 'face', 'nuca', 'orelha', 'regiao', 'clavicula', 'costela',
            'axila', 'mao', 'virilha', 'coxa', 'perna'
        ];
        if (femininas.some((r) => regiaoNorm.includes(r))) {
            return 'DA';
        }

        const masculinas = [
            'couro cabeludo', 'pescoco', 'ombro', 'peito', 'abdomen', 'dorso',
            'braco', 'cotovelo', 'antebraco', 'punho', 'dedos', 'quadril',
            'joelho', 'tornozelo', 'pe'
        ];
        if (masculinas.some((r) => regiaoNorm.includes(r))) {
            return 'DO';
        }

        return regiaoNorm.endsWith('a') ? 'DA' : 'DO';
    }

    private getCabecalhoTipoVestigio(tipo: MapaTipoVestigio, totalVestigios: number): string {
        const plural = totalVestigios !== 1;
        const totalExtenso = NumberHelper.getExtenso(totalVestigios, 'M');

        if(tipo === MapaTipoVestigio.PAF){
            return 'a presença de ' +
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
            return 'a presença de ' +
                totalVestigios.toString().padStart(2, '0') +
                ' (' + totalExtenso + ') ' +
                'ferimento' + (plural ? 's' : '') +
                ' produzido' + (plural ? 's' : '') +
                ' por instrumento perfuro-cortante, nas seguintes quantidades e regiões:';
        }

        if(tipo === MapaTipoVestigio.TACO){
            return 'a presença de ' +
                totalVestigios.toString().padStart(2, '0') +
                ' (' + totalExtenso + ') ' +
                'les' + (plural ? 'ões' : 'ão') +
                ' produzida' + (plural ? 's' : '') +
                ' por instrumento CONTUNDENTE, nas seguintes quantidades e regiões:';
        }

        return 'a presença de ' +
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

    async getParagrafosVestigiosPorTipo(proximaAlinea: () => string): Promise<any[]> {
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
            const alineaAssunto = proximaAlinea();

            secoes.push(
                new Paragraph({
                    style: 'ListParagraph',
                    children: [
                        new TextRun({
                            text: alineaAssunto + ') ' + this.getCabecalhoTipoVestigio(tipo, totalVestigios),
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
                        style: 'ListParagraph',
                        indent: { left: SecaoPerinecroVitima.RECUO_SUBALINEA_TWIP, firstLine: 0 },
                        children: [
                            new TextRun({
                                text: alineaAssunto + '.' + String(i + 1) + ') ' + qtde.toString().padStart(2, '0') +
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

    private formatarMarcadorMinusculo(indice: number): string {
        let n = indice;
        let out = '';
        while (n > 0) {
            n -= 1;
            out = String.fromCharCode(97 + (n % 26)) + out;
            n = Math.floor(n / 26);
        }
        return out || 'a';
    }

}