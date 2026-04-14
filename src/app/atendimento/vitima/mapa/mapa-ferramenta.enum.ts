/** Ferramenta selecionada na toolbox do mapa (clique no croqui). */
export enum MapaFerramenta {
  PISTOLA = 'PISTOLA',
  FACA = 'FACA',
  TACO = 'TACO',
  HEMATOMA = 'HEMATOMA',
  BORRACHA = 'BORRACHA',
}

/** Tipo persistido em cada marcação no JSON (exceto borracha). */
export enum MapaTipoMarca {
  PAF = 'PAF',
  FACA = 'FACA',
  TACO = 'TACO',
  HEMATOMA = 'HEMATOMA',
}

export function parseMapaTipoMarca(value: string | null | undefined): MapaTipoMarca | null {
  if (value == null || value === '') {
    return null;
  }
  return (Object.values(MapaTipoMarca) as string[]).includes(value) ? (value as MapaTipoMarca) : null;
}

export function ferramentaParaTipoMarca(f: MapaFerramenta): MapaTipoMarca | null {
  switch (f) {
    case MapaFerramenta.PISTOLA:
      return MapaTipoMarca.PAF;
    case MapaFerramenta.FACA:
      return MapaTipoMarca.FACA;
    case MapaFerramenta.TACO:
      return MapaTipoMarca.TACO;
    case MapaFerramenta.HEMATOMA:
      return MapaTipoMarca.HEMATOMA;
    default:
      return null;
  }
}
