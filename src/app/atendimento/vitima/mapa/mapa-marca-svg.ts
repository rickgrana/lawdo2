import { MapaMarcaPersistida } from './mapa-marcacoes';
import { MapaTipoVestigio } from './mapa-ferramenta.enum';

export const SVG_NS = 'http://www.w3.org/2000/svg';

type CoordenadaMapa = { x: number; y: number };

export function limitesSvgLocal(svg: SVGSVGElement): { x: number; y: number; width: number; height: number } {
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
  }
  try {
    const bb = svg.getBBox();
    if (bb.width > 0 && bb.height > 0 && Number.isFinite(bb.x) && Number.isFinite(bb.y)) {
      return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
    }
  } catch {
    /* ignore */
  }
  return { x: 0, y: 0, width: 10000, height: 10000 };
}

export function clampPontoAoSvg(svg: SVGSVGElement, p: CoordenadaMapa): CoordenadaMapa {
  const b = limitesSvgLocal(svg);
  return {
    x: Math.min(Math.max(p.x, b.x), b.x + b.width),
    y: Math.min(Math.max(p.y, b.y), b.y + b.height),
  };
}

/** `clipPath` = união das geometrias `.area` do croqui (marcas só visíveis dentro das regiões). */
export function garantirClipUniaoAreas(svg: SVGSVGElement): void {
  const doc = svg.ownerDocument!;
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }
  svg.getElementById('mapa-overlay-clip')?.remove();

  const cp = doc.createElementNS(SVG_NS, 'clipPath');
  cp.setAttribute('id', 'mapa-overlay-clip');
  cp.setAttribute('clipPathUnits', 'userSpaceOnUse');

  const areas = svg.querySelectorAll<SVGGraphicsElement>('.area');
  if (areas.length > 0) {
    areas.forEach((el) => {
      const clone = el.cloneNode(true) as SVGGraphicsElement;
      clone.removeAttribute('class');
      clone.removeAttribute('style');
      clone.removeAttribute('data-id');
      clone.removeAttribute('id');
      cp.appendChild(clone);
    });
  } else {
    const b = limitesSvgLocal(svg);
    const rect = doc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(b.x));
    rect.setAttribute('y', String(b.y));
    rect.setAttribute('width', String(b.width));
    rect.setAttribute('height', String(b.height));
    cp.appendChild(rect);
  }
  defs.appendChild(cp);
}

/** Filtros de mancha (uma vez por documento SVG do croqui). */
export function garantirDefesMapaOverlay(svg: SVGSVGElement): void {
  const doc = svg.ownerDocument!;
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }
  const padFiltro = () => {
    const b = limitesSvgLocal(svg);
    return Math.max(b.width, b.height) * 0.08 + 24;
  };
  if (!svg.getElementById('mapa-mancha-hem-soft')) {
    const b = limitesSvgLocal(svg);
    const pad = padFiltro();
    const filter = doc.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', 'mapa-mancha-hem-soft');
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('x', String(b.x - pad));
    filter.setAttribute('y', String(b.y - pad));
    filter.setAttribute('width', String(b.width + pad * 2));
    filter.setAttribute('height', String(b.height + pad * 2));
    const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '5.5');
    filter.appendChild(blur);
    defs.appendChild(filter);
  }
  if (!svg.getElementById('mapa-mancha-hem-preview')) {
    const b = limitesSvgLocal(svg);
    const pad = padFiltro();
    const filter = doc.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', 'mapa-mancha-hem-preview');
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('x', String(b.x - pad));
    filter.setAttribute('y', String(b.y - pad));
    filter.setAttribute('width', String(b.width + pad * 2));
    filter.setAttribute('height', String(b.height + pad * 2));
    const blur = doc.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '2.1');
    filter.appendChild(blur);
    defs.appendChild(filter);
  }
}

export function garantirGrupoOverlayMarcas(svg: SVGSVGElement): SVGGElement {
  garantirDefesMapaOverlay(svg);
  garantirClipUniaoAreas(svg);
  const existente = svg.getElementById('mapa-overlay-linhas');
  if (existente?.namespaceURI === SVG_NS && existente.localName === 'g') {
    const g = existente as SVGGElement;
    g.setAttribute('clip-path', 'url(#mapa-overlay-clip)');
    return g;
  }
  const g = svg.ownerDocument!.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', 'mapa-overlay-linhas');
  g.setAttribute('pointer-events', 'none');
  g.setAttribute('clip-path', 'url(#mapa-overlay-clip)');
  svg.appendChild(g);
  return g;
}

/** Mesmos parâmetros do traço de arrasto e da marca final (polígono hematoma). */
export function estiloTracoHematomaArrasto(svg: SVGSVGElement): {
  largura: number;
  cor: string;
  opacidade: string;
} {
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 15);
  return {
    largura: Math.max(rx, ry) * 1.475,
    cor: '#c62828',
    opacidade: '0.82',
  };
}

/** Espaçamento mínimo entre amostras do arrasto (coordenadas de utilizador do SVG). */
export function distanciaMinimaAmostragemSvg(svg: SVGSVGElement): number {
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 2.5);
  return Math.max(rx, ry, 0.8);
}

/** Comprimento da polilinha aberta (não fecha o último ao primeiro). */
export function comprimentoPolylineAberta(pts: CoordenadaMapa[]): number {
  if (pts.length < 2) {
    return 0;
  }
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}

export function pontoDentroPoligono(px: number, py: number, pts: CoordenadaMapa[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i]!.x;
    const yi = pts[i]!.y;
    const xj = pts[j]!.x;
    const yj = pts[j]!.y;
    if ((yi > py) !== (yj > py)) {
      const dy = yj - yi;
      if (Math.abs(dy) > 1e-12) {
        const xInt = ((xj - xi) * (py - yi)) / dy + xi;
        if (px < xInt) {
          inside = !inside;
        }
      }
    }
  }
  return inside;
}

function distanciaPontoSegmento(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const nx = x1 + t * dx;
  const ny = y1 + t * dy;
  return Math.hypot(px - nx, py - ny);
}

export function distanciaMinimaPontoAristasPoligono(px: number, py: number, pts: CoordenadaMapa[]): number {
  let min = Infinity;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    min = Math.min(min, distanciaPontoSegmento(px, py, p1.x, p1.y, p2.x, p2.y));
  }
  return min;
}

/** Metade do braço da cruz em unidades de utilizador do SVG para ~`pixelsTela` no ecrã (horizontal / vertical). */
export function metadeBracoCruzEmUnidadesSvg(
  svg: SVGSVGElement,
  pixelsTela: number,
): { rx: number; ry: number } {
  const inv = svg.getScreenCTM()?.inverse();
  if (!inv) {
    return { rx: pixelsTela, ry: pixelsTela };
  }
  const o = new DOMPoint(0, 0).matrixTransform(inv);
  const hx = new DOMPoint(pixelsTela, 0).matrixTransform(inv);
  const vy = new DOMPoint(0, pixelsTela).matrixTransform(inv);
  return {
    rx: Math.abs(hx.x - o.x),
    ry: Math.abs(vy.y - o.y),
  };
}

export function tipoMarcaDe(m: MapaMarcaPersistida): MapaTipoVestigio {
  return m.tipo ?? MapaTipoVestigio.PAF;
}

export function raioApagarEmUnidadesSvg2(svg: SVGSVGElement, pixelsTela: number): number {
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, pixelsTela);
  const r = Math.max(rx, ry);
  return r * r;
}

export function criarMarcaSvg(svg: SVGSVGElement, m: MapaMarcaPersistida): SVGGElement {
  switch (tipoMarcaDe(m)) {
    case MapaTipoVestigio.PAF:
      return criarMarcaPaf(svg, m.x, m.y);
    case MapaTipoVestigio.FACA:
      return criarMarcaFaca(svg, m);
    case MapaTipoVestigio.TACO:
      return criarMarcaTaco(svg, m.x, m.y);
    case MapaTipoVestigio.HEMATOMA:
      return criarMarcaHematoma(svg, m);
    default:
      return criarMarcaPaf(svg, m.x, m.y);
  }
}

function criarMarcaFaca(svg: SVGSVGElement, m: MapaMarcaPersistida): SVGGElement {
  if (m.pontos && m.pontos.length >= 3) {
    return criarMarcaFacaPoligono(svg, m.pontos);
  }
  return criarMarcaFacaPonto(svg, m.x, m.y);
}

/** Polígono da faca: contorno em risco (traço), sem preenchimento. */
function criarMarcaFacaPoligono(svg: SVGSVGElement, pontos: CoordenadaMapa[]): SVGGElement {
  const doc = svg.ownerDocument!;
  const g = doc.createElementNS(SVG_NS, 'g');
  const poly = doc.createElementNS(SVG_NS, 'polygon');
  const pts = pontos.map((p) => clampPontoAoSvg(svg, p));
  poly.setAttribute('points', pts.map((p) => `${p.x},${p.y}`).join(' '));
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', '#ff1744');
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 1.3);
  poly.setAttribute('stroke-width', String(Math.max(rx, ry) * 1.4));
  poly.setAttribute('stroke-opacity', '1');
  poly.setAttribute('stroke-linejoin', 'round');
  poly.setAttribute('stroke-linecap', 'round');
  poly.setAttribute('vector-effect', 'non-scaling-stroke');
  g.appendChild(poly);
  return g;
}

/** Marca única (clique): lente biconvexa em vermelho vivo. */
function criarMarcaFacaPonto(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 10);
  const w = rx * 1.22;
  const h = ry * 0.98;
  const g = doc.createElementNS(SVG_NS, 'g');
  const path = doc.createElementNS(SVG_NS, 'path');
  path.setAttribute(
    'd',
    `M ${cx - w} ${cy} Q ${cx} ${cy - h} ${cx + w} ${cy} Q ${cx} ${cy + h} ${cx - w} ${cy} Z`,
  );
  path.setAttribute('fill', '#ff1744');
  path.setAttribute('fill-opacity', '0.94');
  path.setAttribute('stroke', '#d50000');
  path.setAttribute('stroke-width', '0.95');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  g.appendChild(path);
  return g;
}

function criarMarcaTaco(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 12);
  const r = Math.max(rx, ry) * 1.15;
  const g = doc.createElementNS(SVG_NS, 'g');
  const area = doc.createElementNS(SVG_NS, 'circle');
  area.setAttribute('cx', String(cx));
  area.setAttribute('cy', String(cy));
  area.setAttribute('r', String(r));
  area.setAttribute('fill', '#e1bee7');
  area.setAttribute('fill-opacity', '0.92');
  area.setAttribute('stroke', '#7b1fa2');
  area.setAttribute('stroke-width', '1');
  area.setAttribute('vector-effect', 'non-scaling-stroke');
  g.appendChild(area);
  return g;
}

function criarMarcaHematoma(svg: SVGSVGElement, m: MapaMarcaPersistida): SVGGElement {
  if (m.pontos && m.pontos.length >= 3) {
    return criarMarcaHematomaPoligono(svg, m.pontos);
  }
  return criarMarcaHematomaBlob(svg, m.x, m.y);
}

function criarMarcaHematomaPoligono(svg: SVGSVGElement, pontos: CoordenadaMapa[]): SVGGElement {
  const doc = svg.ownerDocument!;
  garantirDefesMapaOverlay(svg);
  const { largura, cor, opacidade } = estiloTracoHematomaArrasto(svg);
  const g = doc.createElementNS(SVG_NS, 'g');
  const poly = doc.createElementNS(SVG_NS, 'polygon');
  const pts = pontos.map((p) => clampPontoAoSvg(svg, p));
  poly.setAttribute('points', pts.map((p) => `${p.x},${p.y}`).join(' '));
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', cor);
  poly.setAttribute('stroke-width', String(largura));
  poly.setAttribute('stroke-opacity', opacidade);
  poly.setAttribute('stroke-linejoin', 'round');
  poly.setAttribute('stroke-linecap', 'round');
  poly.setAttribute('vector-effect', 'non-scaling-stroke');
  poly.setAttribute('filter', 'url(#mapa-mancha-hem-preview)');
  g.appendChild(poly);
  return g;
}

function criarMarcaHematomaBlob(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 11);
  const ax = rx * 1.2;
  const by = ry * 1.12;
  const g = doc.createElementNS(SVG_NS, 'g');
  const mancha = doc.createElementNS(SVG_NS, 'path');
  mancha.setAttribute(
    'd',
    [
      `M ${cx + ax * 0.85} ${cy + by * 0.15}`,
      `C ${cx + ax * 1.05} ${cy - by * 0.22} ${cx + ax * 0.52} ${cy - by * 1.02} ${cx} ${cy - by * 0.88}`,
      `C ${cx - ax * 0.48} ${cy - by * 1.04} ${cx - ax * 1.02} ${cy - by * 0.38} ${cx - ax * 0.9} ${cy + by * 0.06}`,
      `C ${cx - ax * 0.98} ${cy + by * 0.48} ${cx - ax * 0.38} ${cy + by * 1.0} ${cx + ax * 0.32} ${cy + by * 0.93}`,
      `C ${cx + ax * 0.72} ${cy + by * 1.0} ${cx + ax * 1.02} ${cy + by * 0.42} ${cx + ax * 0.85} ${cy + by * 0.15}`,
      'Z',
    ].join(' '),
  );
  mancha.setAttribute('fill', '#ff1744');
  mancha.setAttribute('fill-opacity', '0.9');
  mancha.setAttribute('stroke', '#d50000');
  mancha.setAttribute('stroke-width', '0.75');
  mancha.setAttribute('vector-effect', 'non-scaling-stroke');
  g.appendChild(mancha);
  const gota = doc.createElementNS(SVG_NS, 'ellipse');
  gota.setAttribute('cx', String(cx + ax * 0.62));
  gota.setAttribute('cy', String(cy - by * 0.52));
  gota.setAttribute('rx', String(rx * 0.28));
  gota.setAttribute('ry', String(ry * 0.22));
  gota.setAttribute('transform', `rotate(-22 ${cx + ax * 0.62} ${cy - by * 0.52})`);
  gota.setAttribute('fill', '#ff5252');
  gota.setAttribute('fill-opacity', '0.72');
  gota.setAttribute('stroke', 'none');
  g.appendChild(gota);
  return g;
}

/** Marca PAF: X em azul escuro. */
function criarMarcaPaf(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 3.5);
  const g = doc.createElementNS(SVG_NS, 'g');
  const azul = '#0d47a1';
  const diag1 = doc.createElementNS(SVG_NS, 'line');
  diag1.setAttribute('x1', String(cx - rx));
  diag1.setAttribute('y1', String(cy - ry));
  diag1.setAttribute('x2', String(cx + rx));
  diag1.setAttribute('y2', String(cy + ry));
  const diag2 = doc.createElementNS(SVG_NS, 'line');
  diag2.setAttribute('x1', String(cx - rx));
  diag2.setAttribute('y1', String(cy + ry));
  diag2.setAttribute('x2', String(cx + rx));
  diag2.setAttribute('y2', String(cy - ry));
  for (const linha of [diag1, diag2]) {
    linha.setAttribute('stroke', azul);
    linha.setAttribute('stroke-width', '2');
    linha.setAttribute('stroke-linecap', 'square');
    linha.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(linha);
  }
  return g;
}

/** Ajusta a marca PAF para acompanhar o hotspot definido no cursor da pistola. */
export function aplicarOffsetPistolaNaCoordenada(svg: SVGSVGElement, x: number, y: number): { x: number; y: number } {
  const dxTela = 11;
  const dyTela = -11;
  const inv = svg.getScreenCTM()?.inverse();
  if (!inv) {
    return { x, y };
  }
  const o = new DOMPoint(0, 0).matrixTransform(inv);
  const d = new DOMPoint(dxTela, dyTela).matrixTransform(inv);
  return {
    x: x + (d.x - o.x),
    y: y + (d.y - o.y),
  };
}

/** Ajusta a marca FACA para acompanhar o hotspot no canto inferior esquerdo. */
export function aplicarOffsetFacaNaCoordenada(svg: SVGSVGElement, x: number, y: number): { x: number; y: number } {
  const dxTela = -11;
  const dyTela = 11;
  const inv = svg.getScreenCTM()?.inverse();
  if (!inv) {
    return { x, y };
  }
  const o = new DOMPoint(0, 0).matrixTransform(inv);
  const d = new DOMPoint(dxTela, dyTela).matrixTransform(inv);
  return {
    x: x + (d.x - o.x),
    y: y + (d.y - o.y),
  };
}
