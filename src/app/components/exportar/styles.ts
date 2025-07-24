import { AlignmentType, TabStopType} from 'docx';
import { convertMillimetersToTwip } from "docx";

export const ESTILOS_PARAGRAFOS = [
        {
            id: "numero_laudo",
            name: "numero_laudo",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                font: "Times New Roman",
                size: 24,
                bold: true,
                color: "000000"
            },
            paragraph: {
                alignment: AlignmentType.RIGHT
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
                indent: { firstLine: 720},
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 360, before: 0, after: 0 },
            },
        } ,

        {
            id: "data_e_hora",
            name: "data_e_hora",
            basedOn: "padrao",
            next: "Normal",
            quickFormat: true,
            paragraph: {
                alignment: AlignmentType.RIGHT,
                spacing: { before: 360, after: convertMillimetersToTwip(40) }
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
                    left: convertMillimetersToTwip(15), 
                },
                spacing: { before: 220, after: convertMillimetersToTwip(5) } 
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
                spacing: { before: 180 } 
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
                indent: { 
                    left: 0
                },
                spacing: { 
                    line: 360, 
                    before: 60 * 72 * 0.1, 
                    after: convertMillimetersToTwip(2)
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
                spacing: { line: 360, before: 20 * 72 * 0.1, after: 0 }
            },
        },

        {
            id: "titulo3",
            name: "titulo3",
            basedOn: "titulo",
            paragraph: {
                spacing: { line: 360, before: 20 * 72 * 0.1, after: 0 } 
            },
        },

        {
            id: "titulo_anexo",
            name: "titulo_anexo",
            basedOn: "titulo",
            paragraph: {
                alignment: AlignmentType.CENTER
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
                alignment: AlignmentType.CENTER
            },
        },

        {
            id: "legenda_figura",
            name: "legenda_figura",
            basedOn: "legenda",
            run: {
                font: "Times New Roman",
                size: 18,
                bold: true
            },
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { line: 360, before: convertMillimetersToTwip(1), after: convertMillimetersToTwip(2) } 
            },
        },

        {
            id: "padrao-centralizado",
            name: "padrao-centralizado",
            basedOn: "padrao",
            paragraph: {
                alignment: AlignmentType.CENTER
            },
        },

        {
            id: "titulo_laudo",
            name: "titulo_laudo",
            basedOn: "padrao-centralizado",
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { line: 360, before: convertMillimetersToTwip(2) } 
            },
        },

        {
            id: "tipo_laudo",
            name: "tipo_laudo",
            basedOn: "padrao-centralizado",
            paragraph: {
                alignment: AlignmentType.CENTER,
                spacing: { line: 360, after: convertMillimetersToTwip(2) } 
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
                alignment: AlignmentType.CENTER
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
                alignment: AlignmentType.CENTER
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
                alignment: AlignmentType.RIGHT
            },
        },


        {
            id: "rodape_line",
            name: "rodape_line",
            basedOn: "Normal",
            quickFormat: true,
            paragraph: {
                spacing: { line: 0, before: 0, after: 0 }
            },
        },

        {
            id: "itens",
            name: "itens",
            basedOn: "Normal"
        }
        
    ];
