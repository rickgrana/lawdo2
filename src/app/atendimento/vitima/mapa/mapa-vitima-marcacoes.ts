import { Vitima } from 'src/app/models/vitima.model';

import { MapaMarcaPersistida, parseMapaMarcacoesJson } from './mapa-marcacoes';
import { extrairMarcacoesDeVestigios, parseVestigiosMapa } from './mapa-vestigios-parse';

/** Marcações do croqui corporal para exportação e relatórios (novo formato `vestigios` ou legado `paf_mapa_marcacoes`). */
export function obterMarcacoesMapaVitima(vitima: Vitima): MapaMarcaPersistida[] {
  const fonte = vitima.vestigios ?? [];
  const parsed = parseVestigiosMapa(fonte);
  if (parsed.length > 0) {
    return extrairMarcacoesDeVestigios(parsed);
  }
  return parseMapaMarcacoesJson(vitima.paf_mapa_marcacoes ?? '');
}
