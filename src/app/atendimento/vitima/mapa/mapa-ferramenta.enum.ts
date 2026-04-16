/** Ferramenta selecionada na toolbox do mapa (clique no croqui). */
export enum MapaFerramenta {
  PISTOLA = 'PISTOLA',
  FACA = 'FACA',
  TACO = 'TACO',
  HEMATOMA = 'HEMATOMA',
  BORRACHA = 'BORRACHA',
}

/** Tipo persistido em cada marcação no JSON (exceto borracha). */
export enum MapaTipoVestigio {
  PAF = 'PAF',
  FACA = 'FACA',
  TACO = 'TACO',
  HEMATOMA = 'HEMATOMA',
}

export function parseMapaTipoVestigio(value: string | null | undefined): MapaTipoVestigio | null {
  if (value == null || value === '') {
    return null;
  }
  return (Object.values(MapaTipoVestigio) as string[]).includes(value) ? (value as MapaTipoVestigio) : null;
}

export function ferramentaParaTipoVestigio(f: MapaFerramenta): MapaTipoVestigio | null {
  switch (f) {
    case MapaFerramenta.PISTOLA:
      return MapaTipoVestigio.PAF;
    case MapaFerramenta.FACA:
      return MapaTipoVestigio.FACA;
    case MapaFerramenta.TACO:
      return MapaTipoVestigio.TACO;
    case MapaFerramenta.HEMATOMA:
      return MapaTipoVestigio.HEMATOMA;
    default:
      return null;
  }
}
