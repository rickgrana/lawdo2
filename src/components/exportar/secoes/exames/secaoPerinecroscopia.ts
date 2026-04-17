import { SecaoSubExames } from './secaoSubExames'; 
import { SecaoPerinecroVitima } from './secaoPerinecroVitima'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { getCategoriaByKey } from 'src/app/atendimento/vestigios/vestigios.data';


export class SecaoPerinecroscopia extends SecaoSubExames{

    override getTitulo(){
        return 'PERINECROSCOPIA';
    }

    override async runInternal(): Promise<any[]> {

        let retorno: any[] = [];

        let model = this.documento.atendimento;

        for (var vitima of model.fields.vitimas){
            retorno = retorno.concat(
                await (new SecaoPerinecroVitima(this.documento).setVitima(vitima).run())
            );
        }

        retorno = retorno.concat([
            new Paragraph ('')
        ]);

        const vestigiosGerais: any[] = (model.fields.vestigios as any[]) ?? [];
        if (vestigiosGerais.length > 0) {
            retorno = retorno.concat([
                new Paragraph({
                    style: 'padrao',
                    children: [
                        new TextRun({
                            text: 'Ainda na perinecroscopia, foram observados e registrados os seguintes vestígios no local:'
                        }),
                    ]
                })
            ]);

            const porCategoria = new Map<string, any[]>();
            for (const vestigio of vestigiosGerais) {
                const categoriaKey = this.limpar(vestigio?.categoria) || 'sem-categoria';
                const itens = porCategoria.get(categoriaKey) ?? [];
                itens.push(vestigio);
                porCategoria.set(categoriaKey, itens);
            }

            for (const [categoriaKey, itens] of porCategoria.entries()) {
                const categoriaNomeBruto = getCategoriaByKey(categoriaKey)?.nome ?? 'Vestígios';
                const categoriaNome = this.removerEmojiCategoria(categoriaNomeBruto);

                retorno = retorno.concat([
                    new Paragraph({
                        style: 'titulo',
                        keepNext: true,
                        numbering: {
                            reference: 'titulo-reference',
                            level: 2,
                            custom: true
                        },
                        contextualSpacing: false,
                        children: [
                            new TextRun({
                                text: categoriaNome
                            }),
                        ],
                    })
                ]);

                for (const vestigio of itens) {
                    const fraseVestigio = this.montarFraseVestigio(vestigio);
                    if (!fraseVestigio) {
                        continue;
                    }

                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'Normal',
                            bullet: {
                                level: 0,
                            },
                            children: [
                                new TextRun({
                                    text: fraseVestigio
                                }),
                            ]
                        })
                    ]);
                }

                retorno = retorno.concat([new Paragraph('')]);
            }
        }
    
        retorno = retorno.concat([
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: 'Ainda sobre os elementos observados no local de crime, constatou o perit' + 
                                this.documento.perito.getArtigo() + ':'
                    }),
                ]
            }),
    
            new Paragraph ({
                style: 'Normal',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A presença de X () estojo(s) de munição de arma de fogo, calibre X, localização, devidamente entregue(s) à Autoridade Policial no local;'
                    }),
                ]
            }),
    
    
            new Paragraph ({
                style: 'Normal',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A presença de X () massa(s) deflagrada(s) e deformada(s)  de munição de arma de fogo, localização, devidamente entregue(s) à Autoridade Policial no local;'
                    }),
                ]
            }),
    
            new Paragraph ({
                style: 'Normal',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A presença de mancha de sangue, localizada....'
                    }),
                ]
            }),
    
            new Paragraph ({
                style: 'Normal',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A ausência de manchas de sangue ou outros vestígios de violêcia.'
                    }),
                ]
            }),
    
        ]);

        return retorno;
    }

    private montarFraseVestigio(vestigio: any): string {
        const tipo = this.limpar(vestigio?.tipo);
        const descricao = this.limpar(vestigio?.descricao);
        const localizacao = this.limpar(vestigio?.localizacao);
        const lacre = this.limpar(vestigio?.lacre);
        const quantidadeNumero = Number(vestigio?.quantidade);
        const possuiQuantidade = Number.isFinite(quantidadeNumero) && quantidadeNumero > 0;

        const partes: string[] = [];
        let tipoFormatado = tipo;
        const concordanciaBase = this.getConcordancia(tipoFormatado || tipo, quantidadeNumero, possuiQuantidade);

        if (possuiQuantidade) {
            tipoFormatado = this.formatarTipoComQuantidade(tipo, quantidadeNumero);
            const concordanciaTipo = this.getConcordancia(tipoFormatado || tipo, quantidadeNumero, possuiQuantidade);
            const extenso = NumberHelper.getExtenso(quantidadeNumero, concordanciaTipo.feminino ? 'F' : 'M');
            const numeroExibicao =
                quantidadeNumero < 10 ? quantidadeNumero.toString().padStart(2, '0') : quantidadeNumero.toString();
            partes.push(
                numeroExibicao +
                ' (' + extenso + ')' +
                (tipoFormatado ? ' ' + tipoFormatado : '')
            );
        } else if (tipo) {
            partes.push(tipo);
        }

        const concordancia = this.getConcordancia(tipoFormatado || tipo, quantidadeNumero, possuiQuantidade) || concordanciaBase;

        if (descricao) {
            partes.push(descricao);
        }

        if (localizacao) {
            partes.push(this.aplicarConcordancia('localizado', concordancia) + ' em ' + localizacao);
        }

        if (lacre) {
            partes.push(this.aplicarConcordancia('acondicionado', concordancia) + ' sob lacre ' + lacre);
        }

        if (partes.length === 0) {
            return '';
        }

        return partes.join(', ') + ';';
    }

    private formatarTipoComQuantidade(tipo: string, quantidade: number): string {
        if (!tipo) {
            return '';
        }

        const tipoNormalizado = this.normalizar(tipo);
        const plural = quantidade > 1;

        if (tipoNormalizado.includes('estojo') || tipoNormalizado.includes('capsula')) {
            return plural ? 'estojos de munição' : 'estojo de munição';
        }

        if (tipoNormalizado.includes('projetei') || tipoNormalizado.includes('projetil')) {
            return plural ? 'projéteis de arma de fogo' : 'projétil de arma de fogo';
        }

        if (tipoNormalizado.includes('fragment')) {
            return plural ? 'fragmentos balísticos' : 'fragmento balístico';
        }

        if (tipoNormalizado.includes('residuo') && tipoNormalizado.includes('polvora')) {
            return plural ? 'resíduos de pólvora' : 'resíduo de pólvora';
        }

        if (tipoNormalizado.includes('mancha') && tipoNormalizado.includes('sangue')) {
            return plural ? 'manchas de sangue' : 'mancha de sangue';
        }

        if (tipoNormalizado.includes('pegada')) {
            return plural ? 'pegadas' : 'pegada';
        }

        if (tipoNormalizado.includes('marca') && tipoNormalizado.includes('pneu')) {
            return plural ? 'marcas de pneus' : 'marca de pneu';
        }

        if (tipoNormalizado.includes('marca') && tipoNormalizado.includes('arrasto')) {
            return plural ? 'marcas de arrasto' : 'marca de arrasto';
        }

        if (tipoNormalizado.includes('marca') && tipoNormalizado.includes('ferrament')) {
            return plural ? 'marcas de ferramentas' : 'marca de ferramenta';
        }

        if (tipoNormalizado.includes('fibra')) {
            return plural ? 'fibras de tecido' : 'fibra de tecido';
        }

        if (!plural && tipoNormalizado.startsWith('marcas de ')) {
            const sufixoOriginal = tipo.substring('marcas de '.length).trim();
            const sufixoSingular = this.singularizarSufixo(sufixoOriginal);
            return 'marca de ' + sufixoSingular;
        }

        return tipo;
    }

    private singularizarSufixo(texto: string): string {
        const valor = texto.trim();
        const normalizado = this.normalizar(valor);

        if (normalizado.endsWith('oes')) {
            return valor.slice(0, -3) + 'ão';
        }
        if (normalizado.endsWith('aes')) {
            return valor.slice(0, -3) + 'ão';
        }
        if (normalizado.endsWith('eis')) {
            return valor.slice(0, -3) + 'el';
        }
        if (normalizado.endsWith('is')) {
            return valor.slice(0, -2) + 'il';
        }
        if (normalizado.endsWith('s') && valor.length > 1) {
            return valor.slice(0, -1);
        }
        return valor;
    }

    private normalizar(valor: string): string {
        return valor
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private getConcordancia(tipo: string, quantidade: number, possuiQuantidade: boolean): { feminino: boolean; plural: boolean } {
        const normalizado = this.normalizar(tipo || '');
        const plural = possuiQuantidade && Number.isFinite(quantidade) && quantidade > 1;

        const femininos = [
            'marca',
            'mancha',
            'fibra',
            'pegada',
            'capsula',
            'trajetoria'
        ];

        const feminino = femininos.some((raiz) => normalizado.startsWith(raiz));
        return { feminino, plural };
    }

    private aplicarConcordancia(baseMasculina: string, concordancia: { feminino: boolean; plural: boolean }): string {
        let texto = baseMasculina;

        if (concordancia.feminino) {
            if (texto.endsWith('o')) {
                texto = texto.slice(0, -1) + 'a';
            }
        }

        if (concordancia.plural) {
            texto += 's';
        }

        return texto;
    }

    private limpar(valor: any): string {
        return (valor ?? '').toString().trim();
    }

    private removerEmojiCategoria(texto: string): string {
        return texto.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    }
}