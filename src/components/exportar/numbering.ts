import { convertMillimetersToTwip, LevelFormat, AlignmentType, LevelSuffix } from "docx";

/** Mesmo recuo do nível 1 (título 2 na hierarquia: A.1 - …): nível 3 sem recuo extra. */
const TITULO_SUBSEC_LEFT_MM = 0.1;
const TITULO_SUBSEC_HANG_MM = 0.1;

export const NUMBERING = 
[
    {
        reference: "titulo-reference",
        levels: [
            {
                level: 0,
                format: LevelFormat.UPPER_ROMAN,
                text: "%1 - ",
                suffix: LevelSuffix.NOTHING,
                alignment: AlignmentType.START,
                style: {
                    paragraph: {
                        indent: { 
                            left: convertMillimetersToTwip(0),
                            hanging: convertMillimetersToTwip(0) 
                        }
                    } 
                },
            },
            {
                level: 1,
                format: LevelFormat.UPPER_LETTER,
                text: "%1. %2 - ",
                suffix: LevelSuffix.NOTHING,
                alignment: AlignmentType.START,
                style: {
                    paragraph: {
                        indent: {
                            left: convertMillimetersToTwip(TITULO_SUBSEC_LEFT_MM),
                            hanging: convertMillimetersToTwip(TITULO_SUBSEC_HANG_MM),
                        },
                    },
                },
            },
            {
                level: 2,
                format: LevelFormat.DECIMAL,
                text: "%1. %2. %3 - ",
                suffix: LevelSuffix.NOTHING,
                alignment: AlignmentType.START,
                style: {
                    paragraph: {
                        indent: {
                            left: convertMillimetersToTwip(TITULO_SUBSEC_LEFT_MM),
                            hanging: convertMillimetersToTwip(TITULO_SUBSEC_HANG_MM),
                        },
                    },
                },
            },
        ]
    }
    
];
