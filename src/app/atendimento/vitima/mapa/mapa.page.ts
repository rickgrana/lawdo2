import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  backspaceOutline,
  cutOutline,
  ellipse,
  flashOutline,
  hammerOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../../atendimento-base.page';
import {
  MapaFerramenta,
  MapaTipoVestigio,
  ferramentaParaTipoVestigio,
} from './mapa-ferramenta.enum';
import { MapaRegiao, parseMapaRegiao } from './mapa-regiao.enum';
import { MapaMarcaPersistida, parseMapaMarcacoesJson } from './mapa-marcacoes';
import { MapaVisao, mapaSrcParaVisao, parseMapaVisao } from './mapa-visao.enum';

addIcons({ flashOutline, cutOutline, hammerOutline, ellipse, backspaceOutline });

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Evento com `clientX`/`clientY` (ex.: clique no SVG dentro de `<object>`, outro `Window` que falha em `instanceof MouseEvent`). */
type EventoComCoordenadasCliente = Event & { readonly clientX: number; readonly clientY: number };
type CoordenadaMapa = { x: number; y: number };

interface MapaVestigioItem {
  visao: MapaVisao;
  regiao: MapaRegiao;
  tipoVestigio: MapaTipoVestigio;
  quantidade: number;
  coordenadas: CoordenadaMapa[];
}

function eSvgRaiz(el: Element | null): el is SVGSVGElement {
  return !!el && el.namespaceURI === SVG_NS && el.localName === 'svg';
}

function eventoTemCoordenadasCliente(ev: Event): ev is EventoComCoordenadasCliente {
  if (!('clientX' in ev) || !('clientY' in ev)) {
    return false;
  }
  const c = ev as { clientX: unknown; clientY: unknown };
  return typeof c.clientX === 'number' && typeof c.clientY === 'number';
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent
  ],
})
export class MapaPage extends AtendimentoBasePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalCtrl = inject(ModalController);

  readonly MapaVisao = MapaVisao;
  readonly MapaFerramenta = MapaFerramenta;

  ferramentaAtiva: MapaFerramenta = MapaFerramenta.PISTOLA;

  /** Quando aberto como modal a partir da vítima (componentProps). */
  @Input() visaoEntrada: string | MapaVisao | null = null;

  /** Formulário da página vítima (modal); quando ausente, só atualiza o modelo em memória. */
  @Input() formularioVitima: FormGroup | null = null;

  visao: MapaVisao | null = null;
  imagemSrc = '';
  cursorFerramentaCss = '';

  private svgInteracaoAbort?: AbortController;
  private svgRaizAtual: SVGSVGElement | null = null;

  get vitima() {
    return this.atendimentoService.vitima;
  }

  override ngOnInit() {
    this.atualizarCursorFerramenta();
    const entrada = this.visaoEntrada;
    if (entrada != null && `${entrada}` !== '') {
      this.aplicarVisao(String(entrada));
    } else {
      this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        this.aplicarVisao(params.get('visao'));
      });
    }
    super.ngOnInit();
    this.destroyRef.onDestroy(() => this.encerrarInteratividadeSvg());
  }

  private aplicarVisao(raw: string | null | undefined) {
    this.encerrarInteratividadeSvg();
    this.visao = parseMapaVisao(raw);
    this.imagemSrc = this.visao ? mapaSrcParaVisao(this.visao) : '';
    this.atualizarCursorFerramenta();
  }

  onCroquiSvgCarregado(event: Event) {
    const alvo = event.target;
    if (!(alvo instanceof HTMLObjectElement)) {
      return;
    }
    const doc = alvo.contentDocument;
    if (!doc || !this.visao) {
      return;
    }
    this.inicializarInteratividadeCroqui(doc);
  }

  private encerrarInteratividadeSvg() {
    this.svgInteracaoAbort?.abort();
    this.svgInteracaoAbort = undefined;
    this.svgRaizAtual = null;
  }

  private inicializarInteratividadeCroqui(svgDoc: Document) {
    this.encerrarInteratividadeSvg();
    const raiz = svgDoc.documentElement;
    if (!eSvgRaiz(raiz)) {
      return;
    }
    const svg = raiz as SVGSVGElement;
    this.svgRaizAtual = svg;
    const ac = new AbortController();
    this.svgInteracaoAbort = ac;
    this.aplicarCursorNoSvgInterativo(svg);

    const overlay = this.garantirGrupoOverlay(svg);

    const areas = svgDoc.querySelectorAll<SVGGraphicsElement>('.area');
    areas.forEach((el) => {
      el.addEventListener(
        'click',
        (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!eventoTemCoordenadasCliente(ev)) {
            return;
          }
          this.registrarCliqueArea(el, svg, overlay, ev);
        },
        { signal: ac.signal, capture: true },
      );
    });

    this.restaurarMarcasSalvas(svg, overlay);
  }

  selecionarFerramenta(f: MapaFerramenta) {
    this.ferramentaAtiva = f;
    this.atualizarCursorFerramenta();
  }

  private atualizarCursorFerramenta() {
    this.cursorFerramentaCss = cursorCssParaFerramenta(this.ferramentaAtiva);
    if (this.svgRaizAtual) {
      this.aplicarCursorNoSvgInterativo(this.svgRaizAtual);
    }
  }

  private aplicarCursorNoSvgInterativo(svg: SVGSVGElement) {
    const cursor = this.cursorFerramentaCss || 'auto';
    svg.style.cursor = cursor;
    svg.querySelectorAll<SVGGraphicsElement>('.area').forEach((el) => {
      el.style.cursor = cursor;
    });
  }

  private garantirGrupoOverlay(svg: SVGSVGElement): SVGGElement {
    const existente = svg.getElementById('mapa-overlay-linhas');
    if (existente?.namespaceURI === SVG_NS && existente.localName === 'g') {
      return existente as SVGGElement;
    }
    const g = svg.ownerDocument!.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', 'mapa-overlay-linhas');
    g.setAttribute('pointer-events', 'none');
    svg.appendChild(g);
    return g;
  }

  private registrarCliqueArea(
    el: SVGGraphicsElement,
    svg: SVGSVGElement,
    overlay: SVGGElement,
    ev: EventoComCoordenadasCliente,
  ) {
    const { x: cx, y: cy } = pontoSvgNoCliente(svg, ev);
    const id = el.getAttribute('data-id')?.trim() ?? '';
    if (!id || !this.visao) {
      return;
    }

    if (this.ferramentaAtiva === MapaFerramenta.BORRACHA) {
      this.apagarMarcaProxima(svg, overlay, cx, cy);
      return;
    }

    const tipo = ferramentaParaTipoVestigio(this.ferramentaAtiva);
    if (!tipo) {
      return;
    }

    const pontoMarca =
      tipo === MapaTipoVestigio.PAF
        ? aplicarOffsetPistolaNaCoordenada(svg, cx, cy)
        : tipo === MapaTipoVestigio.FACA
          ? aplicarOffsetFacaNaCoordenada(svg, cx, cy)
          : { x: cx, y: cy };

    const marca: MapaMarcaPersistida = { visao: this.visao, id, x: pontoMarca.x, y: pontoMarca.y, tipo };
    this.appendMarcaMapa(marca);
    overlay.appendChild(criarMarcaSvg(svg, marca));
  }

  private marcacoesAtuais(): MapaMarcaPersistida[] {
    return extrairMarcacoesDeVestigios(this.vestigiosMapaAtuais());
  }

  private definirMarcacoes(lista: MapaMarcaPersistida[]) {
    const v = this.vitima;
    if (!v) {
      return;
    }
    const vestigios = converterMarcacoesParaVestigios(lista);
    this.formularioVitima?.get('vestigios')?.setValue(vestigios);
    v.vestigios = vestigios;
  }

  private appendMarcaMapa(marca: MapaMarcaPersistida) {
    const lista = this.marcacoesAtuais();
    lista.push(marca);
    this.definirMarcacoes(lista);
  }

  private restaurarMarcasSalvas(svg: SVGSVGElement, overlay: SVGGElement) {
    overlay.replaceChildren();
    if (!this.visao) {
      return;
    }
    for (const m of this.marcacoesAtuais()) {
      if (m.visao !== this.visao) {
        continue;
      }
      overlay.appendChild(criarMarcaSvg(svg, m));
    }
  }

  private apagarMarcaProxima(svg: SVGSVGElement, overlay: SVGGElement, cx: number, cy: number) {
    const visao = this.visao;
    if (!visao) {
      return;
    }
    const lista = this.marcacoesAtuais();
    const lim2 = raioApagarEmUnidadesSvg2(svg, 26);
    const removidos: MapaMarcaPersistida[] = [];
    const restantes = lista.filter((m) => {
      if (m.visao !== visao) {
        return true;
      }
      const dx = m.x - cx;
      const dy = m.y - cy;
      const d2 = dx * dx + dy * dy;
      const manter = d2 > lim2;
      if (!manter) {
        removidos.push(m);
      }
      return manter;
    });

    if (removidos.length === 0) {
      return;
    }

    this.definirMarcacoes(restantes);
    this.restaurarMarcasSalvas(svg, overlay);
  }

  private vestigiosMapaAtuais(): MapaVestigioItem[] {
    const v = this.vitima;
    const fonte = this.formularioVitima?.get('vestigios')?.value ?? v?.vestigios ?? [];
    const parsed = parseVestigiosMapa(fonte);
    if (parsed.length > 0) {
      return parsed;
    }
    const legado = parseMapaMarcacoesJson(v?.paf_mapa_marcacoes ?? '');
    return legado.length > 0 ? converterMarcacoesParaVestigios(legado) : [];
  }

  async fechar() {
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      await modal.dismiss();
    } else {
      this.navCtrl.navigateBack('/atendimento/vitima');
    }
  }

  override loadForm() {
    this.form = this.formBuilder.group({
      _placeholder: new FormControl(''),
    });
    super.loadForm();
  }
}

function parseVestigiosMapa(raw: unknown): MapaVestigioItem[] {
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
    // Formato novo (plano): { visao, regiao, tipoVestigio, quantidade, coordenadas }
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

    // Compatibilidade com formato antigo agrupado:
    // { visao, marcas: [{ tipo, regioes: [{ regiao, quantidade, coordenadas }] }] }
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

function extrairMarcacoesDeVestigios(vestigios: MapaVestigioItem[]): MapaMarcaPersistida[] {
  const out: MapaMarcaPersistida[] = [];
  for (const item of vestigios) {
    for (const c of item.coordenadas) {
      out.push({ visao: item.visao, tipo: item.tipoVestigio, id: item.regiao, x: c.x, y: c.y });
    }
  }
  return out;
}

function converterMarcacoesParaVestigios(lista: MapaMarcaPersistida[]): MapaVestigioItem[] {
  const index = new Map<string, CoordenadaMapa[]>();
  for (const m of lista) {
    const tipo = m.tipo ?? MapaTipoVestigio.PAF;
    const regiao = parseMapaRegiao(String(m.id ?? '').trim());
    if (!regiao) {
      continue;
    }
    const key = `${m.visao}||${tipo}||${regiao}`;
    const coords = index.get(key) ?? [];
    coords.push({ x: m.x, y: m.y });
    index.set(key, coords);
  }

  const out: MapaVestigioItem[] = [];
  for (const [key, coordenadas] of index.entries()) {
    const [visaoRaw, tipoRaw, regiaoRaw] = key.split('||');
    const visao = parseMapaVisao(visaoRaw);
    const tipoVestigio = normalizarTipoMarca(tipoRaw);
    const regiao = parseMapaRegiao(regiaoRaw);
    if (!visao || !tipoVestigio || !regiao) {
      continue;
    }
    out.push({
      visao,
      regiao,
      tipoVestigio,
      quantidade: coordenadas.length,
      coordenadas,
    });
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

function normalizarTipoMarca(value: unknown): MapaTipoVestigio | null {
  const tipo = String(value ?? '').trim().toUpperCase();
  if (!tipo) {
    return null;
  }
  return (Object.values(MapaTipoVestigio) as string[]).includes(tipo) ? (tipo as MapaTipoVestigio) : null;
}

function pontoSvgNoCliente(svg: SVGSVGElement, ev: EventoComCoordenadasCliente): { x: number; y: number } {
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** Metade do braço da cruz em unidades de utilizador do SVG para ~`pixelsTela` no ecrã (horizontal / vertical). */
function metadeBracoCruzEmUnidadesSvg(svg: SVGSVGElement, pixelsTela: number): { rx: number; ry: number } {
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

function tipoMarcaDe(m: MapaMarcaPersistida): MapaTipoVestigio {
  return m.tipo ?? MapaTipoVestigio.PAF;
}

function raioApagarEmUnidadesSvg2(svg: SVGSVGElement, pixelsTela: number): number {
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, pixelsTela);
  const r = Math.max(rx, ry);
  return r * r;
}

function criarMarcaSvg(svg: SVGSVGElement, m: MapaMarcaPersistida): SVGGElement {
  switch (tipoMarcaDe(m)) {
    case MapaTipoVestigio.PAF:
      return criarMarcaPaf(svg, m.x, m.y);
    case MapaTipoVestigio.FACA:
      return criarMarcaFaca(svg, m.x, m.y);
    case MapaTipoVestigio.TACO:
      return criarMarcaTaco(svg, m.x, m.y);
    case MapaTipoVestigio.HEMATOMA:
      return criarMarcaHematoma(svg, m.x, m.y);
    default:
      return criarMarcaPaf(svg, m.x, m.y);
  }
}

function criarMarcaFaca(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 9);
  const w = rx * 1.05;
  const h = ry * 0.72;
  const g = doc.createElementNS(SVG_NS, 'g');
  const path = doc.createElementNS(SVG_NS, 'path');
  path.setAttribute(
    'd',
    `M ${cx - w} ${cy} Q ${cx} ${cy - h} ${cx + w} ${cy} Q ${cx} ${cy + h} ${cx - w} ${cy} Z`,
  );
  path.setAttribute('fill', '#ffcdd2');
  path.setAttribute('fill-opacity', '0.9');
  path.setAttribute('stroke', '#b71c1c');
  path.setAttribute('stroke-width', '1.5');
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

function criarMarcaHematoma(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
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

function cursorCssParaFerramenta(f: MapaFerramenta): string {
  const cursor = cursorParaFerramenta(f);
  return `url("${cursor.url}") ${cursor.hotspotX} ${cursor.hotspotY}, auto`;
}

function cursorParaFerramenta(
  f: MapaFerramenta,
): { url: string; hotspotX: number; hotspotY: number } {
  switch (f) {
    case MapaFerramenta.PISTOLA:
      return { url: '/assets/toolbox/pistola.svg', hotspotX: 22, hotspotY: 17 };
    case MapaFerramenta.FACA:
      return { url: '/assets/toolbox/faca.svg', hotspotX: 8, hotspotY: 20 };
    case MapaFerramenta.TACO:
      return { url: '/assets/toolbox/punho.svg', hotspotX: 12, hotspotY: 12 };
    case MapaFerramenta.HEMATOMA:
      return { url: '/assets/toolbox/hematoma.svg', hotspotX: 12, hotspotY: 12 };
    case MapaFerramenta.BORRACHA:
      return { url: '/assets/toolbox/limpar.svg', hotspotX: 12, hotspotY: 12 };
  }
}

/** Ajusta a marca PAF para acompanhar o hotspot definido no cursor da pistola. */
function aplicarOffsetPistolaNaCoordenada(
  svg: SVGSVGElement,
  x: number,
  y: number,
): { x: number; y: number } {
  // Cursor-base 24x24: centro em (12,12), hotspot da pistola em (23,1).
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
function aplicarOffsetFacaNaCoordenada(
  svg: SVGSVGElement,
  x: number,
  y: number,
): { x: number; y: number } {
  // Cursor-base 24x24: centro em (12,12), hotspot da faca em (1,23).
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
