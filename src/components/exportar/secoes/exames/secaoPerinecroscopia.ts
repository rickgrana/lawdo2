import { SecaoSubExames } from './secaoSubExames'; 
import { SecaoPerinecroVitima } from './secaoPerinecroVitima'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { getCategoriaByKey, normalizeText, VestigioCategoria } from 'src/app/atendimento/vestigios/vestigios.data';

/** Texto introdutório da subsecção de vestígios balísticos (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_BALISTICOS =
    'No local examinado, foram identificados e devidamente recolhidos vestígios de natureza balística, os quais apresentam relevância para a elucidação da dinâmica dos fatos, especialmente quanto ao tipo de armamento empregado, quantidade de disparos efetuados e possível posicionamento dos envolvidos. Tais elementos foram submetidos aos procedimentos de acondicionamento e preservação adequados, garantindo a manutenção de sua integridade para posterior análise pericial detalhada.';

/** Texto introdutório da subsecção de vestígios químicos (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_QUIMICOS =
    'No local periciado, foram identificados vestígios de natureza química, os quais podem contribuir para a compreensão da dinâmica dos fatos, especialmente no que se refere à presença de substâncias potencialmente relacionadas à ocorrência, como resíduos de disparo, fluidos biológicos ou outros compostos de interesse forense. Tais vestígios foram devidamente reconhecidos, coletados e acondicionados conforme protocolos técnicos, visando preservar suas características originais e assegurar a confiabilidade de análises laboratoriais posteriores.';

/** Texto introdutório da subsecção de vestígios biológicos (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_BIOLOGICOS =
    'No local examinado, foram identificados vestígios de natureza biológica, os quais possuem elevada relevância pericial por possibilitarem a identificação de indivíduos envolvidos e a reconstrução da dinâmica dos fatos, a partir da análise de fluidos e materiais orgânicos. Tais vestígios foram devidamente reconhecidos, coletados e acondicionados conforme protocolos técnico-científicos, assegurando a preservação de suas características e a viabilidade de exames laboratoriais, como análises genéticas e sorológicas.';

/** Texto introdutório da subsecção de vestígios de impressões e marcas (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_IMPRESSOES_MARCAS =
    'No local periciado, foram identificados vestígios relacionados a impressões e marcas, os quais apresentam relevante valor probatório por possibilitarem a individualização de objetos, instrumentos ou indivíduos potencialmente envolvidos na ocorrência, bem como a reconstrução de ações praticadas no cenário. Tais vestígios foram devidamente registrados, documentados e, quando possível, coletados e acondicionados conforme protocolos técnico-periciais, de modo a preservar suas características morfológicas para posterior confronto e análise especializada.';

/** Texto introdutório da subsecção de vestígios papiloscópicos (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_PAPILOSCOPICOS =
    'No local examinado, foram identificados vestígios de natureza papiloscópica, consistentes em impressões digitais, palmares ou plantares, os quais possuem elevado valor identificativo por permitirem a individualização humana de forma inequívoca. Tais vestígios foram devidamente localizados, revelados por técnicas apropriadas, registrados fotograficamente e, quando possível, coletados e acondicionados conforme protocolos técnico-científicos, assegurando a preservação dos detalhes necessários para confronto em sistemas automatizados e análises periciais posteriores.';

/** Texto introdutório da subsecção de microvestígios (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_MICROVESTIGIOS =
    'No local periciado, foram identificados microvestígios, caracterizados por partículas de dimensões reduzidas, geralmente não perceptíveis a olho nu, mas de grande relevância pericial por sua capacidade de estabelecer vínculos entre pessoas, objetos e ambientes.';

/** Texto introdutório da subsecção de vestígios comportamentais/contextuais (exportação do laudo). */
const TEXTO_INTRO_VESTIGIOS_COMPORTAMENTAIS_CONTEXTUAIS =
    'No local examinado, foram observados vestígios de natureza comportamental-contextual, os quais não se materializam necessariamente em objetos físicos isolados, mas decorrem da análise integrada da disposição dos elementos na cena, padrões de organização/desorganização, posicionamento de objetos, bem como da interação entre os vestígios materiais e o ambiente. Esses elementos são fundamentais para a interpretação da dinâmica dos fatos, permitindo inferências técnico-científicas acerca de possíveis ações, sequências de eventos e comportamentos dos envolvidos.';

/** Marcador de alínea em minúsculas: a, b, …, z, aa, … */
function formatarMarcadorAlineaVestigio(indice: number): string {
    let n = indice;
    let out = '';
    while (n > 0) {
        n -= 1;
        out = String.fromCharCode(97 + (n % 26)) + out;
        n = Math.floor(n / 26);
    }
    return out || 'a';
}

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
                let indiceAlineaVestigio = 0;
                const proximaAlineaVestigio = () => {
                    indiceAlineaVestigio += 1;
                    return formatarMarcadorAlineaVestigio(indiceAlineaVestigio) + ') ';
                };

                const categoriaNomeBruto = getCategoriaByKey(categoriaKey)?.nome ?? 'Vestígios';
                const categoriaNome = this.removerEmojiCategoria(categoriaNomeBruto);

                retorno = retorno.concat([
                    new Paragraph({
                        style: 'titulo3',
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

                if (normalizeText(categoriaKey) === VestigioCategoria.Balisticos) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_BALISTICOS })],
                        }),
                    ]);
                }

                if (normalizeText(categoriaKey) === VestigioCategoria.Quimicos) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_QUIMICOS })],
                        }),
                    ]);
                }

                if (normalizeText(categoriaKey) === VestigioCategoria.Biologicos) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_BIOLOGICOS })],
                        }),
                    ]);
                }

                if (normalizeText(categoriaKey) === VestigioCategoria.ImpressoesMarcas) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_IMPRESSOES_MARCAS })],
                        }),
                    ]);
                }

                if (normalizeText(categoriaKey) === VestigioCategoria.Papiloscopicos) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_PAPILOSCOPICOS })],
                        }),
                    ]);
                }

                if (normalizeText(categoriaKey) === VestigioCategoria.Microvestigios) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_MICROVESTIGIOS })],
                        }),
                    ]);
                }

                if (normalizeText(categoriaKey) === VestigioCategoria.ComportamentaisContextuais) {
                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'padrao',
                            children: [new TextRun({ text: TEXTO_INTRO_VESTIGIOS_COMPORTAMENTAIS_CONTEXTUAIS })],
                        }),
                    ]);
                }

                const linhasCategoria = itens
                    .map((v) => this.montarCorpoFraseVestigio(v))
                    .filter((texto) => texto.length > 0);

                for (let i = 0; i < linhasCategoria.length; i++) {
                    const ultimoNaCategoria = i === linhasCategoria.length - 1;
                    const fraseVestigio = linhasCategoria[i] + (ultimoNaCategoria ? '.' : ';');

                    retorno = retorno.concat([
                        new Paragraph({
                            style: 'ListParagraph',
                            children: [
                                new TextRun({
                                    text: proximaAlineaVestigio() + fraseVestigio
                                }),
                            ]
                        })
                    ]);
                }

                retorno = retorno.concat([new Paragraph('')]);
            }
        }

        return retorno;
    }

    /** Texto do item sem pontuação final (; ou .). */
    private montarCorpoFraseVestigio(vestigio: any): string {
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

        return partes.join(', ');
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