export enum MapaVisao {
  CORPO_FRENTE = 'CORPO_FRENTE',
  CORPO_VERSO = 'CORPO_VERSO',
  CABECA_POSTERIOR = 'CABECA_POSTERIOR',
  CABECA_ANTERIOR = 'CABECA_ANTERIOR',
  CABECA_LE = 'CABECA_LE',
  CABECA_LD = 'CABECA_LD',
}

const MAPA_POR_VISAO: Record<MapaVisao, string> = {
  [MapaVisao.CORPO_FRENTE]: '/assets/mapas/corpo-frente/corpo-frente.png',
  [MapaVisao.CORPO_VERSO]: '/assets/mapas/corpo-verso/corpo-verso.png',
  [MapaVisao.CABECA_POSTERIOR]: '/assets/mapas/cabeca-posterior/cabeca-posterior.png',
  [MapaVisao.CABECA_ANTERIOR]: '/assets/mapas/cabeca-anterior/cabeca-anterior.png',
  [MapaVisao.CABECA_LE]: '/assets/mapas/cabeca-le/cabeca-le.png',
  [MapaVisao.CABECA_LD]: '/assets/mapas/cabeca-ld/cabeca-ld.png',
};

export function mapaSrcParaVisao(visao: MapaVisao): string {
  return MAPA_POR_VISAO[visao];
}

export function parseMapaVisao(value: string | null | undefined): MapaVisao | null {
  if (value == null || value === '') {
    return null;
  }
  return (Object.values(MapaVisao) as string[]).includes(value) ? (value as MapaVisao) : null;
}
