import { Secao } from '../secao';
import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlignTable,
  WidthType,
  TableLayoutType,
  HeightRule,
} from 'docx';

import { ImageHelper } from '../helper/imageHelper';
import { ESPACO_ENTRE_LINHAS_1 } from '../styles';
import { ImageCell } from '../helper/imageCell';
import { ImageParagraph } from '../helper/ImageParagraph';
import { NumberHelper } from 'src/app/extensions/numberHelper';
import { Vitima } from 'src/app/models/vitima.model';
import {
  legendaCurtaParaVisao,
  mapaSvgAssetUrl,
  ORDEM_VISAO_MAPA,
  MapaVisao,
} from 'src/app/atendimento/vitima/mapa/mapa-visao.enum';
import { MapaMarcaPersistida } from 'src/app/atendimento/vitima/mapa/mapa-marcacoes';
import { MapaTipoVestigio } from 'src/app/atendimento/vitima/mapa/mapa-ferramenta.enum';
import { obterMarcacoesMapaVitima } from 'src/app/atendimento/vitima/mapa/mapa-vitima-marcacoes';
import { rasterizarMapaVisaoComMarcacoes } from 'src/app/atendimento/vitima/mapa/mapa-export-raster';
import { rasterizarMapaGeografico } from '../helper/mapa-geografico-raster';
import { Atendimento } from 'src/app/models/atendimento.model';

export class SecaoAnexo extends Secao {
  cells: any[] = [];
  rows: any[] = [];
  total = 0;

  override isSecaoDisponivel() {
    const a = this.documento.atendimento;
    return (
      a.imagens.length > 0 ||
      SecaoAnexo.temCroquiExportavel(a.fields.vitimas) ||
      SecaoAnexo.coordenadasParaApendice(a)
    );
  }

  /** Coordenadas informadas na identificação (exclui 0,0 reservado a “sem coordenada”). */
  private static coordenadasParaApendice(atendimento: Atendimento): boolean {
    const c = atendimento.fields.coordenadas;
    const lat = Number(c?.lat);
    const lon = Number(c?.long);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return false;
    }
    if (lat === 0 && lon === 0) {
      return false;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return false;
    }
    return true;
  }

  private static temCroquiExportavel(vitimas: Vitima[]): boolean {
    for (const v of vitimas) {
      if (obterMarcacoesMapaVitima(v).length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Total de figuras citado no laudo: fotos do apêndice + croquis exportados (uma por visão com marcação)
   * + mapa de coordenada geográfica quando `coordenadasParaApendice` se aplica.
   */
  static contagemImagensLaudo(atendimento: Atendimento): number {
    let n = atendimento.imagens.length;
    n += SecaoAnexo.contarCroquisPorVitimas(atendimento.fields.vitimas);
    if (SecaoAnexo.coordenadasParaApendice(atendimento)) {
      n += 1;
    }
    return n;
  }

  /** Mesma regra de `getBlocosCroquiUmaVitima`: uma imagem rasterizada por visão com marcações. */
  private static contarCroquisPorVitimas(vitimas: Vitima[]): number {
    let n = 0;
    for (const vitima of vitimas) {
      const marcacoes = obterMarcacoesMapaVitima(vitima);
      if (marcacoes.length === 0) {
        continue;
      }
      for (const visao of ORDEM_VISAO_MAPA) {
        if (marcacoes.some((m) => m.visao === visao)) {
          n += 1;
        }
      }
    }
    return n;
  }

  override async runInternal(): Promise<any[]> {
    const blocos: any[] = [];
    let indiceApendice = 1;

    const temFotos = this.documento.atendimento.imagens.length > 0;
    const temCroquis = SecaoAnexo.temCroquiExportavel(this.documento.atendimento.fields.vitimas);

    if (temFotos) {
      const linhasFotos = await this.getImagens();
      blocos.push(
        new Paragraph({
          style: 'titulo_apendice',
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
          children: [
            new TextRun({
              text: (
                'APÊNDICE ' +
                NumberHelper.getRomano(indiceApendice) +
                ' - REGISTRO FOTOGRÁFICO'
              ).toLocaleUpperCase('pt-BR'),
            }),
          ],
        }),
        new Table({
          rows: linhasFotos,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          columnWidths: [4000, 4000],
          layout: TableLayoutType.AUTOFIT,
        }),
      );
      indiceApendice++;
    }

    if (temCroquis) {
      const vitimas = this.documento.atendimento.fields.vitimas;
      for (let i = 0; i < vitimas.length; i++) {
        const vitima = vitimas[i]!;
        if (obterMarcacoesMapaVitima(vitima).length === 0) {
          continue;
        }
        const rotuloVitima = 'VÍTIMA ' + NumberHelper.getRomano(i + 1);
        const tituloApendice = (
          'APÊNDICE ' +
          NumberHelper.getRomano(indiceApendice) +
          ' - ' +
          rotuloVitima +
          ': CROQUI DOS VESTÍGIOS'
        ).toLocaleUpperCase('pt-BR');
        const blocosVitima = await this.getBlocosCroquiUmaVitima(i, vitima);
        blocos.push(
          new Paragraph({
            style: 'titulo_apendice',
            alignment: AlignmentType.CENTER,
            pageBreakBefore: true,
            children: [
              new TextRun({
                text: tituloApendice,
              }),
            ],
          }),
          ...blocosVitima,
        );
        indiceApendice++;
      }
    }

    if (SecaoAnexo.coordenadasParaApendice(this.documento.atendimento)) {
      const blocosGeo = await this.getBlocosMapaGeografico();
      blocos.push(
        new Paragraph({
          style: 'titulo_apendice',
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
          children: [
            new TextRun({
              text:
                'APÊNDICE ' +
                NumberHelper.getRomano(indiceApendice) +
                ' - GEOLOCALIZAÇÃO DA OCORRÊNCIA',
            }),
          ],
        }),
        ...blocosGeo,
      );
    }

    return blocos;
  }

  /** Subtítulo, figura do mapa (marca no centro), legenda e menção à fonte dos tiles. */
  private async getBlocosMapaGeografico(): Promise<any[]> {
    const a = this.documento.atendimento;
    const lat = Number(a.fields.coordenadas.lat);
    const lon = Number(a.fields.coordenadas.long);

    const buf = await rasterizarMapaGeografico(lat, lon, 960, 540, 16);
    const blob = new Blob([buf], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    try {
      const dims: any = await ImageHelper.loadFromURL(url);
      let width = Number(dims[0]);
      let height = Number(dims[1]);
      if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height)) {
        width = 960;
        height = 540;
      }
      const dimPagina = SecaoAnexo.escalarDimensoesCroquiParaPagina(width, height);
      const data = new Uint8Array(buf);

      const legendaFigura =
        ('Coordenadas do local: ' + lat.toFixed(6) + ', ' + lon.toFixed(6)).toLocaleUpperCase('pt-BR');

      return [
        ImageParagraph.paragrafoFigura(data, dimPagina.w, dimPagina.h),
        ImageParagraph.paragrafoLegendaFigura(legendaFigura, this.documento.proximoNumeroFigura()),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 0, ...ESPACO_ENTRE_LINHAS_1 },
          children: [
            new TextRun({
              text: 'Fonte do mapa: © OpenStreetMap contributors, © CARTO',
              size: 18,
            }),
          ],
        }),
      ];
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Margem superior acima de cada croqui no documento (1 cm). */
  private static readonly MARGEM_SUPERIOR_CROQUI_TWIPS = convertMillimetersToTwip(10);

  /** Altura alvo dos croquis de corpo (frente/dorso) na exportação. */
  private static readonly ALTURA_CROQUI_CORPO_MM = 160;

  /** Largura útil do corpo do texto (twips), alinhada a `escalarDimensoesCroquiParaPagina`. */
  private static corpoLarguraUtilTwips(): number {
    const PAGE_WIDTH_TWIPS = 11906;
    const MARGIN_LEFT = (1133.144 * 3) / 2;
    const MARGIN_RIGHT = 1133.144;
    return PAGE_WIDTH_TWIPS - MARGIN_LEFT - MARGIN_RIGHT;
  }

  /**
   * Mesmas margens do laudo (`documento.factory.ts`) e página A4 (11906×16838 twips).
   */
  private static escalarDimensoesCroquiParaPagina(widthPx: number, heightPx: number): { w: number; h: number } {
    const PAGE_WIDTH_TWIPS = 11906;
    const PAGE_HEIGHT_TWIPS = 16838;
    const MARGIN_LEFT = (1133.144 * 3) / 2;
    const MARGIN_RIGHT = 1133.144;
    const MARGIN_TOP = 1133.144 / 2;
    const MARGIN_BOTTOM = 1133.144;

    const corpoWTwip = PAGE_WIDTH_TWIPS - MARGIN_LEFT - MARGIN_RIGHT;
    const corpoHTwip = PAGE_HEIGHT_TWIPS - MARGIN_TOP - MARGIN_BOTTOM;

    const reservaRodapeELegendasTwip = convertMillimetersToTwip(38);
    const maxAlturaFiguraTwip = Math.max(400, corpoHTwip - reservaRodapeELegendasTwip);

    const twipParaPx = 96 / 1440;
    const maxWPx = corpoWTwip * twipParaPx;
    const maxHPx = maxAlturaFiguraTwip * twipParaPx;

    const sx = maxWPx / widthPx;
    const sy = maxHPx / heightPx;
    const escala = Math.min(sx, sy, 1);

    let w = Math.max(1, Math.round(widthPx * escala));
    let h = Math.max(1, Math.round(heightPx * escala));

    return { w, h };
  }

  /**
   * Croquis de corpo: altura 16 cm (proporção mantida); se a largura exceder a área útil, reduz proporcionalmente.
   */
  private static aplicarDimensaoCroquiCorpo(
    visao: MapaVisao,
    widthPx: number,
    heightPx: number,
    dimPagina: { w: number; h: number },
  ): { w: number; h: number } {
    if (visao !== MapaVisao.CORPO_FRENTE && visao !== MapaVisao.CORPO_VERSO) {
      return dimPagina;
    }
    const alturaAlvoPx = Math.round((SecaoAnexo.ALTURA_CROQUI_CORPO_MM / 25.4) * 96);
    let scale = alturaAlvoPx / heightPx;
    let w = Math.round(widthPx * scale);
    let h = Math.round(heightPx * scale);
    if (w > dimPagina.w) {
      scale = dimPagina.w / widthPx;
      w = dimPagina.w;
      h = Math.max(1, Math.round(heightPx * scale));
    }
    return { w: Math.max(1, w), h: Math.max(1, h) };
  }

  private static rotulosTipoLegenda(): Record<MapaTipoVestigio, string> {
    return {
      [MapaTipoVestigio.PAF]: 'PAF (perfuração por arma de fogo)',
      [MapaTipoVestigio.FACA]: 'Instrumento perfuro-cortante',
      [MapaTipoVestigio.TACO]: 'CONTUNDENTE',
      [MapaTipoVestigio.HEMATOMA]: 'Hematoma',
    };
  }

  /** Cores usadas no croqui SVG (`mapa-marca-svg.ts`), para identificação no Word. */
  private static coresHexTipoVestigio(): Record<MapaTipoVestigio, string> {
    return {
      [MapaTipoVestigio.PAF]: '0d47a1',
      [MapaTipoVestigio.FACA]: 'ff1744',
      [MapaTipoVestigio.TACO]: '7b1fa2',
      [MapaTipoVestigio.HEMATOMA]: 'c62828',
    };
  }

  private static tiposVestigioNaVisao(ms: MapaMarcaPersistida[]): MapaTipoVestigio[] {
    const ordem: MapaTipoVestigio[] = [
      MapaTipoVestigio.PAF,
      MapaTipoVestigio.FACA,
      MapaTipoVestigio.TACO,
      MapaTipoVestigio.HEMATOMA,
    ];
    const presentes = new Set(ms.map((m) => m.tipo ?? MapaTipoVestigio.PAF));
    return ordem.filter((t) => presentes.has(t));
  }

  private static readonly ESPACO_LINHA_LEGENDA_TWIPS = 240;

  private static legendaTabelaBordasOmissas() {
    const e = { style: BorderStyle.NIL };
    return {
      top: e,
      bottom: e,
      left: e,
      right: e,
      insideHorizontal: e,
      insideVertical: e,
    };
  }

  private static legendaCelulaBordasOmissas() {
    const e = { style: BorderStyle.NIL };
    return { top: e, bottom: e, left: e, right: e };
  }

  /**
   * Legenda de cores (tipos presentes em `ms`): duas colunas centralizadas (tabela sem bordas).
   * Usada antes de cada croqui no apêndice — só inclui os tipos com marcação naquele croqui.
   * O Word não trata bem tabulações em parágrafo centrado; a grelha replica o efeito sem tab após o último item da linha.
   */
  private static paragrafosLegendaCoresParaMarcacoes(
    ms: MapaMarcaPersistida[],
    opts?: { espacoAntesPrimeiraLinha?: number },
  ): (Paragraph | Table)[] {
    const labels = SecaoAnexo.rotulosTipoLegenda();
    const cores = SecaoAnexo.coresHexTipoVestigio();
    const tipos = SecaoAnexo.tiposVestigioNaVisao(ms);
    if (tipos.length === 0) {
      return [];
    }

    const espacoAntes =
      opts?.espacoAntesPrimeiraLinha ?? SecaoAnexo.ESPACO_LINHA_LEGENDA_TWIPS;

    const larguraMetadeTwip = Math.round(SecaoAnexo.corpoLarguraUtilTwips() / 2);
    const texto = (s: string) => s.toLocaleUpperCase('pt-BR');

    const runsItem = (tipo: MapaTipoVestigio): TextRun[] => [
      new TextRun({
        text: '■ ',
        color: cores[tipo],
        font: 'Times New Roman',
        size: 22,
      }),
      new TextRun({
        text: texto(labels[tipo]),
        font: 'Times New Roman',
        size: 20,
      }),
    ];

    const rows: TableRow[] = [];

    for (let i = 0; i < tipos.length; i += 2) {
      const t1 = tipos[i]!;
      const t2 = tipos[i + 1];
      const primeiraLinha = i === 0;
      const ultimaLinha = i + 2 >= tipos.length;
      const spacingAfter = ultimaLinha ? SecaoAnexo.ESPACO_LINHA_LEGENDA_TWIPS : 80;

      if (t2 != null) {
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                verticalAlign: VerticalAlignTable.CENTER,
                borders: SecaoAnexo.legendaCelulaBordasOmissas(),
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: {
                      before: primeiraLinha ? espacoAntes : undefined,
                      after: spacingAfter,
                      ...ESPACO_ENTRE_LINHAS_1,
                    },
                    children: runsItem(t1),
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlignTable.CENTER,
                borders: SecaoAnexo.legendaCelulaBordasOmissas(),
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: spacingAfter, ...ESPACO_ENTRE_LINHAS_1 },
                    children: runsItem(t2),
                  }),
                ],
              }),
            ],
          }),
        );
      } else {
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                verticalAlign: VerticalAlignTable.CENTER,
                borders: SecaoAnexo.legendaCelulaBordasOmissas(),
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: {
                      before: primeiraLinha ? espacoAntes : undefined,
                      after: spacingAfter,
                      ...ESPACO_ENTRE_LINHAS_1,
                    },
                    children: runsItem(t1),
                  }),
                ],
              }),
            ],
          }),
        );
      }
    }

    return [
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [larguraMetadeTwip, larguraMetadeTwip],
        layout: TableLayoutType.FIXED,
        borders: SecaoAnexo.legendaTabelaBordasOmissas(),
        rows,
      }),
    ];
  }

  /** Imagem do croqui e legenda numerada “Figura N”. */
  private async montarBlocoCroquiComLegendaLateral(
    buffer: ArrayBuffer,
    legenda: string,
    visao: MapaVisao,
  ): Promise<any[]> {
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    try {
      const dims: any = await ImageHelper.loadFromURL(url);
      let width = Number(dims[0]);
      let height = Number(dims[1]);
      if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height)) {
        width = 424;
        height = 941;
      }
      const dimPagina = SecaoAnexo.escalarDimensoesCroquiParaPagina(width, height);
      const nat = SecaoAnexo.aplicarDimensaoCroquiCorpo(visao, width, height, dimPagina);

      const data = new Uint8Array(buffer);
      const figPara = ImageParagraph.paragrafoFigura(data, nat.w, nat.h);
      const legendaNumerada = ImageParagraph.paragrafoLegendaFigura(
        legenda,
        this.documento.proximoNumeroFigura(),
        { pageBreakAfter: true },
      );

      return [figPara, legendaNumerada];
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Conteúdo de um apêndice dedicado a uma vítima: subtítulo e croquis empilhados
   * (margem de 1 cm acima de cada bloco).
   */
  private async getBlocosCroquiUmaVitima(indiceVitima: number, vitima: Vitima): Promise<any[]> {
    const marcacoes = obterMarcacoesMapaVitima(vitima);
    const blocos: any[] = [];

    const rotuloVitima = 'VÍTIMA ' + NumberHelper.getRomano(indiceVitima + 1);

    let primeiraVisaoComMarcacoes = true;
    for (const visao of ORDEM_VISAO_MAPA) {
      const ms = marcacoes.filter((m) => m.visao === visao);
      if (ms.length === 0) {
        continue;
      }
      blocos.push(
        ...SecaoAnexo.paragrafosLegendaCoresParaMarcacoes(ms, {
          espacoAntesPrimeiraLinha: primeiraVisaoComMarcacoes
            ? SecaoAnexo.ESPACO_LINHA_LEGENDA_TWIPS
            : SecaoAnexo.MARGEM_SUPERIOR_CROQUI_TWIPS,
        }),
      );
      primeiraVisaoComMarcacoes = false;

      const buf = await rasterizarMapaVisaoComMarcacoes(mapaSvgAssetUrl(visao), ms);
      let legenda = rotuloVitima + ' - Croqui';
      const sufixoVisao = legendaCurtaParaVisao(visao);
      if (sufixoVisao.length > 0) {
        legenda += ' (' + sufixoVisao + ')';
      }
      legenda = legenda.toLocaleUpperCase('pt-BR');
      const bloco = await this.montarBlocoCroquiComLegendaLateral(buf, legenda, visao);
      blocos.push(...bloco);
    }

    return blocos;
  }

  getImagens() {
    let imagens = this.documento.atendimento.imagens;

    this.cells = [];
    this.rows = [];
    this.total = 0;

    const promises: Promise<void>[] = [];
    const paragraphs: Paragraph[] = [];
    var i = 0;

    for (const imagem of imagens) {
      /** Número reservado já na ordem da galeria; não usar `proximoNumeroFigura` dentro do async,
       * senão Promise.all numera pela ordem em que cada fetch termina. */
      const numeroFigura = this.documento.proximoNumeroFigura();
      promises.push(this.addParagraph(paragraphs, i, imagem, numeroFigura));
      i++;
    }

    return Promise.all(promises).then(async () => {
      for (let paragraph of paragraphs) {
        this.total += 1;

        await this.addCell(paragraph);
      }

      return this.rows;
    });
  }

  addParagraph(paragraphs: any[], ordem: number, imagem: any, numeroFigura: number) {
    return this.getImageParagraph(imagem, numeroFigura).then(function (paragraph) {
      paragraphs[ordem] = paragraph;
    });
  }

  isPrimeiraImagem() {
    return this.total == 1;
  }

  isUltimaImagem() {
    return this.total == this.documento.atendimento.imagens.length;
  }

  isSemImagens() {
    return this.total == 0;
  }

  isFimLinha() {
    return this.total % 2;
  }

  getImageParagraph(imagem: any, numeroFigura: number) {
    return ImageHelper.getBufferFromURL(imagem.imagem).then((buffer) => {
      return ImageHelper.loadFromURL(imagem.imagem)
        .then((img: any) => {
          return [img[0], img[1]];
        })
        .then((result) => {
          const width = result[0];
          const height = result[1];

          return ImageParagraph.get(
            buffer,
            imagem.legenda,
            (200 * width) / height,
            200,
            numeroFigura,
          );
        });
    });
  }

  async addCell(imageParagraph: any) {
    let colSpan = 1;

    if (this.isPrimeiraImagem() || this.isUltimaImagem()) {
      colSpan = 2;
    }

    let cell = await ImageCell.get(imageParagraph, colSpan);

    if (cell) {
      await this.cells!.push(cell);
    }

    await this.addCellsToRows();
  }

  async addCellsToRows() {
    if (this.isFimLinha() || this.isUltimaImagem()) {
      await this.rows.push(
        new TableRow({
          children: this.cells,
          height: {
            value: 250,
            rule: HeightRule.AUTO,
          },
        }),
      );

      this.cells = [];
    }
  }
}
