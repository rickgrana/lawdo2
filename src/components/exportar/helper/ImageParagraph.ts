import { ImageHelper } from './imageHelper';

import { Paragraph, TextRun, ImageRun, ISpacingProperties } from 'docx';

export type ImageParagraphFiguraExtra = {
  /** Espaço antes da figura (ex.: margem superior), em twips. */
  espacoAntesFigura?: number;
};

export class ImageParagraph{

    static get(
      imageData: any,
      legenda: any,
      width: number,
      height: number,
      numeroFigura: number,
      extra?: ImageParagraphFiguraExtra,
    ) {
        return [
            ImageParagraph.paragrafoFigura(imageData, width, height, extra),
            ImageParagraph.paragrafoLegendaFigura(legenda, numeroFigura),
        ];
    }

    /** Só o parágrafo com a imagem (para montar tabelas ou colunas). */
    static paragrafoFigura(
      imageData: any,
      width: number,
      height: number,
      extra?: ImageParagraphFiguraExtra,
    ): Paragraph {
        const spacingFigura: ISpacingProperties | undefined =
          extra?.espacoAntesFigura != null
            ? { before: extra.espacoAntesFigura }
            : undefined;

        return new Paragraph({
          style: 'figura',
          spacing: spacingFigura,
          children: [
            new ImageRun({
              data: imageData,
              type: 'jpg',
              transformation: {
                width: width,
                height: height,
              },
            }),
          ],
        });
    }

    /** Legenda “Figura N: …” numerada em sequência com as demais figuras do documento. */
    static paragrafoLegendaFigura(legenda: string, numeroFigura: number): Paragraph {
      return new Paragraph({
        style: 'legenda_figura',
        children: [
          new TextRun({
            text: 'Figura ',
          }),

          new TextRun({
            text: String(numeroFigura),
          }),

          new TextRun({
            text: legenda.length > 0 ? ': ' + legenda : '',
          }),
        ],
      });
    }

}