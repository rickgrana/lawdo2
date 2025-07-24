import { convertMillimetersToTwip, LevelFormat, AlignmentType, TabStopType } from "docx";

export const NUMBERING = 
[
    {
        reference: "titulo-reference",
        levels: [
            {
                level: 0,
                format: LevelFormat.UPPER_ROMAN,
                text: "%1 - ",
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
                text: "%1.%2 - ",
                alignment: AlignmentType.START,
                style: {
                    paragraph: {
                        indent: { left: convertMillimetersToTwip(0.1), hanging: convertMillimetersToTwip(0.1) },
                    },
                },
            },

            {
                level: 2,
                format: LevelFormat.DECIMAL,
                text: "%1.%2.%3 - ",
                alignment: AlignmentType.START,
                style: {
                    paragraph: {
                        indent: { left: convertMillimetersToTwip(0), hanging: convertMillimetersToTwip(0) },
                    },
                },
            },
        ]
    }
    
];