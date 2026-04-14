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
  MapaTipoMarca,
  ferramentaParaTipoMarca,
} from './mapa-ferramenta.enum';
import { MapaMarcaPersistida, parseMapaMarcacoesJson } from './mapa-marcacoes';
import { MapaVisao, campoPafParaVisao, mapaSrcParaVisao, parseMapaVisao } from './mapa-visao.enum';

addIcons({ flashOutline, cutOutline, hammerOutline, ellipse, backspaceOutline });

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Evento com `clientX`/`clientY` (ex.: clique no SVG dentro de `<object>`, outro `Window` que falha em `instanceof MouseEvent`). */
type EventoComCoordenadasCliente = Event & { readonly clientX: number; readonly clientY: number };

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

    const tipo = ferramentaParaTipoMarca(this.ferramentaAtiva);
    if (!tipo) {
      return;
    }

    const pontoMarca =
      tipo === MapaTipoMarca.PAF
        ? aplicarOffsetPistolaNaCoordenada(svg, cx, cy)
        : tipo === MapaTipoMarca.FACA
          ? aplicarOffsetFacaNaCoordenada(svg, cx, cy)
          : { x: cx, y: cy };

    if (tipo === MapaTipoMarca.PAF) {
      this.appendIdAoCampoPaf(campoPafParaVisao(this.visao), id);
    }

    const marca: MapaMarcaPersistida = { visao: this.visao, id, x: pontoMarca.x, y: pontoMarca.y, tipo };
    this.appendMarcaMapa(marca);
    overlay.appendChild(criarMarcaSvg(svg, marca));
  }

  private marcacoesAtuais(): MapaMarcaPersistida[] {
    const v = this.vitima;
    const json = String(this.formularioVitima?.get('paf_mapa_marcacoes')?.value ?? v?.paf_mapa_marcacoes ?? '');
    return parseMapaMarcacoesJson(json);
  }

  private definirMarcacoes(lista: MapaMarcaPersistida[]) {
    const v = this.vitima;
    if (!v) {
      return;
    }
    const novo = JSON.stringify(lista);
    this.formularioVitima?.get('paf_mapa_marcacoes')?.setValue(novo);
    v.paf_mapa_marcacoes = novo;
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

    const campo = campoPafParaVisao(visao);
    for (const rem of removidos) {
      const tipo = rem.tipo ?? MapaTipoMarca.PAF;
      if (tipo === MapaTipoMarca.PAF) {
        this.removerIdDoCampoPaf(campo, rem.id);
      }
    }

    this.definirMarcacoes(restantes);
    this.restaurarMarcasSalvas(svg, overlay);
  }

  private removerIdDoCampoPaf(campo: 'paf_frente' | 'paf_costas', id: string) {
    const v = this.vitima;
    if (!v) {
      return;
    }
    const control = this.formularioVitima?.get(campo);
    const partes = String(control?.value ?? v[campo] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const idx = partes.indexOf(id);
    if (idx >= 0) {
      partes.splice(idx, 1);
    }
    const novo = partes.join(', ');
    control?.setValue(novo);
    v[campo] = novo;
  }

  private appendIdAoCampoPaf(campo: 'paf_frente' | 'paf_costas', id: string) {
    const v = this.vitima;
    if (!v) {
      return;
    }
    const control = this.formularioVitima?.get(campo);
    const atual = String(control?.value ?? v[campo] ?? '')
      .trim()
      .replace(/^,+|,+$/g, '');
    const novo = atual ? `${atual}, ${id}` : id;
    control?.setValue(novo);
    v[campo] = novo;
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

function tipoMarcaDe(m: MapaMarcaPersistida): MapaTipoMarca {
  return m.tipo ?? MapaTipoMarca.PAF;
}

function raioApagarEmUnidadesSvg2(svg: SVGSVGElement, pixelsTela: number): number {
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, pixelsTela);
  const r = Math.max(rx, ry);
  return r * r;
}

function criarMarcaSvg(svg: SVGSVGElement, m: MapaMarcaPersistida): SVGGElement {
  switch (tipoMarcaDe(m)) {
    case MapaTipoMarca.PAF:
      return criarCruzVermelhaCentrada(svg, m.x, m.y);
    case MapaTipoMarca.FACA:
      return criarMarcaFaca(svg, m.x, m.y);
    case MapaTipoMarca.TACO:
      return criarMarcaTaco(svg, m.x, m.y);
    case MapaTipoMarca.HEMATOMA:
      return criarMarcaHematoma(svg, m.x, m.y);
    default:
      return criarCruzVermelhaCentrada(svg, m.x, m.y);
  }
}

function criarMarcaFaca(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 9);
  const g = doc.createElementNS(SVG_NS, 'g');
  const a = doc.createElementNS(SVG_NS, 'line');
  a.setAttribute('x1', String(cx - rx * 0.85));
  a.setAttribute('y1', String(cy + ry * 0.85));
  a.setAttribute('x2', String(cx + rx * 0.85));
  a.setAttribute('y2', String(cy - ry * 0.85));
  const b = doc.createElementNS(SVG_NS, 'line');
  b.setAttribute('x1', String(cx - rx * 0.35));
  b.setAttribute('y1', String(cy - ry * 0.95));
  b.setAttribute('x2', String(cx + rx * 0.95));
  b.setAttribute('y2', String(cy + ry * 0.35));
  for (const linha of [a, b]) {
    linha.setAttribute('stroke', '#0d47a1');
    linha.setAttribute('stroke-width', '2');
    linha.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(linha);
  }
  return g;
}

function criarMarcaTaco(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 10);
  const g = doc.createElementNS(SVG_NS, 'g');
  const linha = doc.createElementNS(SVG_NS, 'line');
  linha.setAttribute('x1', String(cx - rx * 1.1));
  linha.setAttribute('y1', String(cy));
  linha.setAttribute('x2', String(cx + rx * 1.1));
  linha.setAttribute('y2', String(cy));
  linha.setAttribute('stroke', '#5d4037');
  linha.setAttribute('stroke-width', '5');
  linha.setAttribute('stroke-linecap', 'round');
  linha.setAttribute('vector-effect', 'non-scaling-stroke');
  g.appendChild(linha);
  const ponto = doc.createElementNS(SVG_NS, 'circle');
  ponto.setAttribute('cx', String(cx + rx * 1.05));
  ponto.setAttribute('cy', String(cy));
  ponto.setAttribute('r', String(Math.max(rx, ry) * 0.45));
  ponto.setAttribute('fill', '#6d4c41');
  ponto.setAttribute('stroke', 'none');
  g.appendChild(ponto);
  return g;
}

function criarMarcaHematoma(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 11);
  const g = doc.createElementNS(SVG_NS, 'g');
  const el = doc.createElementNS(SVG_NS, 'ellipse');
  el.setAttribute('cx', String(cx));
  el.setAttribute('cy', String(cy));
  el.setAttribute('rx', String(rx * 1.15));
  el.setAttribute('ry', String(ry * 0.85));
  el.setAttribute('fill', '#6a1b9a');
  el.setAttribute('fill-opacity', '0.45');
  el.setAttribute('stroke', '#4a148c');
  el.setAttribute('stroke-width', '1');
  el.setAttribute('vector-effect', 'non-scaling-stroke');
  g.appendChild(el);
  return g;
}

function criarCruzVermelhaCentrada(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 7);

  const g = doc.createElementNS(SVG_NS, 'g');

  const horizontal = doc.createElementNS(SVG_NS, 'line');
  horizontal.setAttribute('x1', String(cx - rx));
  horizontal.setAttribute('y1', String(cy));
  horizontal.setAttribute('x2', String(cx + rx));
  horizontal.setAttribute('y2', String(cy));

  const vertical = doc.createElementNS(SVG_NS, 'line');
  vertical.setAttribute('x1', String(cx));
  vertical.setAttribute('y1', String(cy - ry));
  vertical.setAttribute('x2', String(cx));
  vertical.setAttribute('y2', String(cy + ry));

  for (const linha of [horizontal, vertical]) {
    linha.setAttribute('stroke', '#ff0000');
    linha.setAttribute('stroke-width', '2');
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
