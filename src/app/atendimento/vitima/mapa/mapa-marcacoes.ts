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
  /** Hematoma ou faca em polígono (arrasto); se definido, a marca é o polígono fechado (quantidade 1). */
  pontos?: { x: number; y: number }[];
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
      const pontos = parsePontosMarca(o['pontos']);
      if (!visao || !id) {
        continue;
      }
      if (pontos && pontos.length >= 3) {
        let cx = Number(o['x']);
        let cy = Number(o['y']);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
          cx = pontos.reduce((s, p) => s + p.x, 0) / pontos.length;
          cy = pontos.reduce((s, p) => s + p.y, 0) / pontos.length;
        }
        out.push({ visao, id, x: cx, y: cy, tipo, pontos });
        continue;
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }
      out.push({ visao, id, x, y, tipo });
    }
    return out;
  } catch {
    return [];
  }
}

function parsePontosMarca(raw: unknown): { x: number; y: number }[] | undefined {
  if (!Array.isArray(raw) || raw.length < 3) {
    return undefined;
  }
  const out: { x: number; y: number }[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') {
      return undefined;
    }
    const cc = c as Record<string, unknown>;
    const x = Number(cc['x']);
    const y = Number(cc['y']);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return undefined;
    }
    out.push({ x, y });
  }
  return out;
}
