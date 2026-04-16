import { MapaTipoVestigio, parseMapaTipoVestigio } from './mapa-ferramenta.enum';
import { MapaVisao, parseMapaVisao } from './mapa-visao.enum';

/** Marcação de clique no croqui (coordenadas no espaço de utilizador do SVG). */
export interface MapaMarcaPersistida {
  visao: MapaVisao;
  id: string;
  x: number;
  y: number;
  /** Ausente em dados antigos: tratar como PAF (cruz). */
  tipo?: MapaTipoVestigio;
}

export function parseMapaMarcacoesJson(json: string | null | undefined): MapaMarcaPersistida[] {
  const s = json?.trim();
  if (!s) {
    return [];
  }
  try {
    const raw = JSON.parse(s) as unknown;
    if (!Array.isArray(raw)) {
      return [];
    }
    const out: MapaMarcaPersistida[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const o = item as Record<string, unknown>;
      const visao = parseMapaVisao(o['visao'] != null ? String(o['visao']) : '');
      const id = String(o['id'] ?? '').trim();
      const x = Number(o['x']);
      const y = Number(o['y']);
      const tipoRaw = o['tipo'] != null ? String(o['tipo']) : '';
      const tipo = parseMapaTipoVestigio(tipoRaw) ?? MapaTipoVestigio.PAF;
      if (!visao || !id || !Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }
      out.push({ visao, id, x, y, tipo });
    }
    return out;
  } catch {
    return [];
  }
}
