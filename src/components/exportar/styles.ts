import { AlignmentType, LineRuleType } from 'docx';
import { convertMillimetersToTwip } from "docx";

/** Recuo da primeira linha do parágrafo (Portaria 003/2017-DPTC/AM, art. 7): 2,5 cm */
const RECUO_PRIMEIRA_LINHA_MM = 25;

/** Corpo do laudo: espaçamento 1,5 entre linhas (múltiplo automático do Word). */
export const ESPACO_ENTRE_LINHAS_15 = { line: 360, lineRule: LineRuleType.AUTO } as const;

/** Cabeçalho, rodapé, notas de rodapé, citações longas, ilustrações e respectivas legendas: simples. */
export const ESPACO_ENTRE_LINHAS_1 = { line: 240, lineRule: LineRuleType.AUTO } as const;

export const ESTILOS_PARAGRAFOS = [
        {
            id: "numero_laudo",
            name: "numero_laudo",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                /* art. 11 §3: corpo 11 para "LAUDO Nº …-AAAA" */
                size: 22,
                bold: false,
                color: "000000"
            },
            paragraph: {
                alignment: AlignmentType.RIGHT,
                spacing: { ...ESPACO_ENTRE_LINHAS_1 },
            },
        },

        {
            id: "padrao",
            name: "padrao",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 24
            },
            paragraph: {
                indent: { firstLine: convertMillimetersToTwip(RECUO_PRIMEIRA_LINHA_MM)},
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 0, ...ESPACO_ENTRE_LINHAS_15 },
            },
        } ,

        {
            id: "quesito_identificacao",
            name: "quesito_identificacao",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 24,
                bold: true,
            },
            paragraph: {
                indent: { left: convertMillimetersToTwip(RECUO_PRIMEIRA_LINHA_MM), firstLine: 0 },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 180, ...ESPACO_ENTRE_LINHAS_1 },
            },
        },

        {
            id: "quesito_resposta",
            name: "quesito_resposta",
            basedOn: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 24,
            },
            paragraph: {
                indent: {
                    left: convertMillimetersToTwip(RECUO_PRIMEIRA_LINHA_MM),
                    firstLine: 0,
                },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 0, ...ESPACO_ENTRE_LINHAS_15 },
            },
        },

        {
            id: "data_e_hora",
            name: "data_e_hora",
            basedOn: "padrao",
            next: "Normal",
            quickFormat: true,
            paragraph: {
                alignment: AlignmentType.RIGHT,
                spacing: { before: 360, after: convertMillimetersToTwip(40), ...ESPACO_ENTRE_LINHAS_15 },
            },
        },

        {
            id: "ListParagraph",
            name: "ListParagraph",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 24,
            },
            leftTabStop: 0,
            paragraph: {
                indent: { 
                    firstLine: 0,
                    left: convertMillimetersToTwip(RECUO_PRIMEIRA_LINHA_MM), 
                },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 220, after: convertMillimetersToTwip(5), ...ESPACO_ENTRE_LINHAS_15 },
            },
        },


        {
            id: "assinatura",
            name: "assinatura",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 20,
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { before: 180, ...ESPACO_ENTRE_LINHAS_15 },
            },
        },

        {
            id: "titulo",
            name: "titulo",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 24,
                bold: true,
            },
            paragraph: {
                contextualSpacing: true,
                alignment: AlignmentType.CENTER,
                indent: { 
                    left: 0
                },
                spacing: { 
                    before: 60 * 72 * 0.1, 
                    after: convertMillimetersToTwip(2),
                    ...ESPACO_ENTRE_LINHAS_15,
                }
            },
        },


        {
            id: "titulo2",
            name: "titulo2",
            basedOn: "titulo",
            paragraph: {
                indent: { 
                    left: 0
                },
                spacing: { before: 20 * 72 * 0.1, after: 0, ...ESPACO_ENTRE_LINHAS_15 }
            },
        },

        {
            id: "titulo3",
            name: "titulo3",
            basedOn: "titulo",
            paragraph: {
                spacing: { before: 20 * 72 * 0.1, after: 0, ...ESPACO_ENTRE_LINHAS_15 } 
            },
        },

        {
            id: "titulo_apendice",
            name: "titulo_apendice",
            basedOn: "titulo",
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 60 * 72 * 0.1,
                    after: convertMillimetersToTwip(2),
                    ...ESPACO_ENTRE_LINHAS_1,
                },
            },
        },


        {
            id: "figura",
            name: "figura",
            basedOn: "Normal",
            run: {
                font: "Times New Roman",
                size: 24,
                bold: true
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { ...ESPACO_ENTRE_LINHAS_1 },
            },
        },

        {
            id: "legenda_figura",
            name: "legenda_figura",
            basedOn: "legenda",
            run: {
                font: "Times New Roman",
                /* corpo 11 (meio-pontos, como no art. 11 §3 do número do laudo) */
                size: 22,
                bold: true
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { before: convertMillimetersToTwip(1), after: convertMillimetersToTwip(2), ...ESPACO_ENTRE_LINHAS_1 } 
            },
        },

        {
            id: "padrao-centralizado",
            name: "padrao-centralizado",
            basedOn: "padrao",
            paragraph: {
                alignment: AlignmentType.CENTER,
                /* não herdar recuo do parágrafo padrão (títulos centrados) */
                indent: { firstLine: 0, left: 0 },
                spacing: { ...ESPACO_ENTRE_LINHAS_15 },
            },
        },

        {
            id: "titulo_laudo",
            name: "titulo_laudo",
            basedOn: "padrao-centralizado",
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { before: convertMillimetersToTwip(2), ...ESPACO_ENTRE_LINHAS_15 } 
            },
        },

        {
            id: "tipo_laudo",
            name: "tipo_laudo",
            basedOn: "padrao-centralizado",
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { after: convertMillimetersToTwip(2), ...ESPACO_ENTRE_LINHAS_15 } 
            },
        },


        {
            id: "rodape1",
            name: "rodape1",
            basedOn: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 16
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { ...ESPACO_ENTRE_LINHAS_1 },
            },
        },


        {
            id: "rodape2",
            name: "rodape2",
            basedOn: "rodape1",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 16
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { ...ESPACO_ENTRE_LINHAS_1 },
            },
        },


        {
            id: "rodape3",
            name: "rodape3",
            basedOn: "rodape1",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 16,
                bold: true
            },
            paragraph: {
                alignment: AlignmentType.RIGHT,
                spacing: { ...ESPACO_ENTRE_LINHAS_1 },
            },
        },


        {
            id: "rodape_line",
            name: "rodape_line",
            basedOn: "Normal",
            quickFormat: true,
            paragraph: {
                spacing: { before: 0, after: 0, ...ESPACO_ENTRE_LINHAS_1 }
            },
        },

        {
            id: "itens",
            name: "itens",
            basedOn: "Normal",
            paragraph: {
                spacing: { ...ESPACO_ENTRE_LINHAS_15 },
            },
        }
        
    ];
