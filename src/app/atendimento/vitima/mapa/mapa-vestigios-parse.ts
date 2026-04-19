import { MapaTipoVestigio } from './mapa-ferramenta.enum';
import { MapaMarcaPersistida } from './mapa-marcacoes';
import { MapaRegiao, parseMapaRegiao } from './mapa-regiao.enum';
import { MapaVisao, parseMapaVisao } from './mapa-visao.enum';

type CoordenadaMapa = { x: number; y: number };

export interface MapaVestigioItem {
  visao: MapaVisao;
  regiao: MapaRegiao;
  tipoVestigio: MapaTipoVestigio;
  quantidade: number;
  coordenadas: CoordenadaMapa[];
}

export function parseVestigiosMapa(raw: unknown): MapaVestigioItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: MapaVestigioItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const o = item as Record<string, unknown>;
    const visao = parseMapaVisao(String(o['visao'] ?? ''));
    if (!visao) {
      continue;
    }
    if ('regiao' in o || 'tipoVestigio' in o) {
      const regiao = parseMapaRegiao(String(o['regiao'] ?? '').trim());
      const tipoVestigio = normalizarTipoMarca(o['tipoVestigio']);
      const coordenadas = parseCoordenadas(o['coordenadas']);
      if (!regiao || !tipoVestigio || coordenadas.length === 0) {
        continue;
      }
      const quantidadeRaw = Number(o['quantidade']);
      const quantidade = Number.isFinite(quantidadeRaw) ? quantidadeRaw : coordenadas.length;
      out.push({ visao, regiao, tipoVestigio, quantidade, coordenadas });
      continue;
    }

    const marcasRaw = Array.isArray(o['marcas']) ? o['marcas'] : [];
    for (const m of marcasRaw) {
      if (!m || typeof m !== 'object') {
        continue;
      }
      const mm = m as Record<string, unknown>;
      const tipoVestigio = normalizarTipoMarca(mm['tipo']);
      if (!tipoVestigio) {
        continue;
      }
      const regioesRaw = Array.isArray(mm['regioes']) ? mm['regioes'] : [];
      for (const r of regioesRaw) {
        if (!r || typeof r !== 'object') {
          continue;
        }
        const rr = r as Record<string, unknown>;
        const regiao = parseMapaRegiao(String(rr['regiao'] ?? '').trim());
        const coordenadas = parseCoordenadas(rr['coordenadas']);
        if (!regiao || coordenadas.length === 0) {
          continue;
        }
        const quantidadeRaw = Number(rr['quantidade']);
        const quantidade = Number.isFinite(quantidadeRaw) ? quantidadeRaw : coordenadas.length;
        out.push({ visao, regiao, tipoVestigio, quantidade, coordenadas });
      }
    }
  }
  return out;
}

export function extrairMarcacoesDeVestigios(vestigios: MapaVestigioItem[]): MapaMarcaPersistida[] {
  const out: MapaMarcaPersistida[] = [];
  for (const item of vestigios) {
    const manchaPoligono =
      (item.tipoVestigio === MapaTipoVestigio.HEMATOMA || item.tipoVestigio === MapaTipoVestigio.FACA) &&
      item.coordenadas.length > 0;
    if (manchaPoligono) {
      const q = item.quantidade;
      const coords = item.coordenadas;
      if (q === 1 && coords.length >= 3) {
        const cx = coords.reduce((s, c) => s + c.x, 0) / coords.length;
        const cy = coords.reduce((s, c) => s + c.y, 0) / coords.length;
        out.push({
          visao: item.visao,
          id: item.regiao,
          x: cx,
          y: cy,
          tipo: item.tipoVestigio,
          pontos: coords.map((c) => ({ x: c.x, y: c.y })),
        });
        continue;
      }
      for (const c of coords) {
        out.push({ visao: item.visao, tipo: item.tipoVestigio, id: item.regiao, x: c.x, y: c.y });
      }
      continue;
    }
    for (const c of item.coordenadas) {
      out.push({ visao: item.visao, tipo: item.tipoVestigio, id: item.regiao, x: c.x, y: c.y });
    }
  }
  return out;
}

function parseCoordenadas(raw: unknown): CoordenadaMapa[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out: CoordenadaMapa[] = [];
  for (const c of arr) {
    if (!c || typeof c !== 'object') {
      continue;
    }
    const cc = c as Record<string, unknown>;
    const x = Number(cc['x']);
    const y = Number(cc['y']);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      out.push({ x, y });
    }
  }
  return out;
}

export function normalizarTipoMarca(value: unknown): MapaTipoVestigio | null {
  const tipo = String(value ?? '').trim().toUpperCase();
  if (!tipo) {
    return null;
  }
  return (Object.values(MapaTipoVestigio) as string[]).includes(tipo) ? (tipo as MapaTipoVestigio) : null;
}
