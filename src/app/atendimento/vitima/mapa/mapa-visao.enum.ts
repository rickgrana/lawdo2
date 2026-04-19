export enum MapaVisao {
  CORPO_FRENTE = 'CORPO_FRENTE',
  CORPO_VERSO = 'CORPO_VERSO',
  CABECA_ANTERIOR = 'CABECA_ANTERIOR',
  CABECA_LE = 'CABECA_LE',
  CABECA_LD = 'CABECA_LD',
}

const MAPA_POR_VISAO: Record<MapaVisao, string> = {
  [MapaVisao.CORPO_FRENTE]: '/assets/mapas/corpo-frente/corpo-frente.svg',
  [MapaVisao.CORPO_VERSO]: '/assets/mapas/corpo-verso/corpo-verso.svg',
  [MapaVisao.CABECA_ANTERIOR]: '/assets/mapas/cabeca-anterior/cabeca-anterior.svg',
  [MapaVisao.CABECA_LE]: '/assets/mapas/cabeca-le/cabeca-le.svg',
  [MapaVisao.CABECA_LD]: '/assets/mapas/cabeca-ld/cabeca-ld.svg',
};

/** Ordem fixa das visões no laudo (apêndice de croquis). */
export const ORDEM_VISAO_MAPA: MapaVisao[] = [
  MapaVisao.CORPO_FRENTE,
  MapaVisao.CORPO_VERSO,
  MapaVisao.CABECA_ANTERIOR,
  MapaVisao.CABECA_LE,
  MapaVisao.CABECA_LD,
];

export function mapaSrcParaVisao(visao: MapaVisao): string {
  return MAPA_POR_VISAO[visao];
}

/** Mesmo ficheiro SVG utilizado no ecrã de marcação — para rasterizar o apêndice do laudo. */
export function mapaSvgAssetUrl(visao: MapaVisao): string {
  return mapaSrcParaVisao(visao);
}

export function legendaApendiceParaVisao(visao: MapaVisao): string {
  switch (visao) {
    case MapaVisao.CORPO_FRENTE:
      return 'Croqui do corpo (face anterior)';
    case MapaVisao.CORPO_VERSO:
      return 'Croqui do corpo (dorso)';
    case MapaVisao.CABECA_ANTERIOR:
      return 'Croqui da cabeça (face anterior)';
    case MapaVisao.CABECA_LE:
      return 'Croqui da cabeça (lateral esquerda)';
    case MapaVisao.CABECA_LD:
      return 'Croqui da cabeça (lateral direita)';
    default:
      return 'Croqui';
  }
}

/** Sufixo curto para distinguir visões quando a mesma vítima tem vários croquis no apêndice. */
export function legendaCurtaParaVisao(visao: MapaVisao): string {
  switch (visao) {
    case MapaVisao.CORPO_FRENTE:
      return 'corpo, face anterior';
    case MapaVisao.CORPO_VERSO:
      return 'corpo, dorso';
    case MapaVisao.CABECA_ANTERIOR:
      return 'cabeça, anterior';
    case MapaVisao.CABECA_LE:
      return 'cabeça, lateral esq.';
    case MapaVisao.CABECA_LD:
      return 'cabeça, lateral dir.';
    default:
      return '';
  }
}

export function parseMapaVisao(value: string | null | undefined): MapaVisao | null {
  if (value == null || value === '') {
    return null;
  }
  return (Object.values(MapaVisao) as string[]).includes(value) ? (value as MapaVisao) : null;
}

/** Campo do formulário da vítima onde acumular os `data-id` do croqui desta visão. */
export function campoPafParaVisao(visao: MapaVisao): 'paf_frente' | 'paf_costas' {
  switch (visao) {
    case MapaVisao.CORPO_FRENTE:
    case MapaVisao.CABECA_ANTERIOR:
    case MapaVisao.CABECA_LE:
    case MapaVisao.CABECA_LD:
      return 'paf_frente';
    case MapaVisao.CORPO_VERSO:
      return 'paf_costas';
  }
}
