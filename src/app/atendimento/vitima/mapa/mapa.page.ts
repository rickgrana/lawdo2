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
import { CommonModule } from '@angular/common';
import { AtendimentoBasePage } from '../../atendimento-base.page';
import { MapaVisao, mapaSrcParaVisao, parseMapaVisao } from './mapa-visao.enum';

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
    IonContent,
  ],
})
export class MapaPage extends AtendimentoBasePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalCtrl = inject(ModalController);

  readonly MapaVisao = MapaVisao;

  /** Quando aberto como modal a partir da vítima (componentProps). */
  @Input() visaoEntrada: string | MapaVisao | null = null;

  visao: MapaVisao | null = null;
  imagemSrc = '';

  private svgInteracaoAbort?: AbortController;
  private readonly cruzPorArea = new WeakMap<SVGGraphicsElement, SVGGElement>();
  /** Chave estável por elemento `.area` (índice na lista ao carregar o SVG). */
  private readonly contagensPorRegiao = new Map<string, number>();

  override ngOnInit() {
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
    this.contagensPorRegiao.clear();
    this.visao = parseMapaVisao(raw);
    this.imagemSrc = this.visao ? mapaSrcParaVisao(this.visao) : '';
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
  }

  private inicializarInteratividadeCroqui(svgDoc: Document) {
    this.encerrarInteratividadeSvg();
    this.contagensPorRegiao.clear();
    const raiz = svgDoc.documentElement;
    if (!eSvgRaiz(raiz)) {
      return;
    }
    const svg = raiz as SVGSVGElement;
    const ac = new AbortController();
    this.svgInteracaoAbort = ac;

    this.garantirEstiloSelecao(svgDoc);
    const overlay = this.garantirGrupoOverlay(svg);

    const areas = svgDoc.querySelectorAll<SVGGraphicsElement>('.area');
    areas.forEach((el, indice) => {
      el.addEventListener(
        'click',
        (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!eventoTemCoordenadasCliente(ev)) {
            return;
          }
          this.registrarCliqueArea(el, svg, overlay, ev, indice);
        },
        { signal: ac.signal, capture: true },
      );
    });
  }

  private garantirEstiloSelecao(svgDoc: Document) {
    if (svgDoc.getElementById('mapa-estilo-selecao')) {
      return;
    }
    const no = svgDoc.createElementNS(SVG_NS, 'style');
    no.setAttribute('id', 'mapa-estilo-selecao');
    no.textContent = `
      .area.area-selecionada {
        fill: rgba(255, 0, 0, 0.35);
        stroke: #c62828;
        stroke-width: 1.5;
      }
    `;
    svgDoc.documentElement.insertBefore(no, svgDoc.documentElement.firstChild);
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

  private chaveRegiao(el: SVGGraphicsElement, indice: number): string {
    const id = el.getAttribute('data-id') ?? 'sem-id';
    return `${this.visao ?? '?'}:${id}#${indice}`;
  }

  /** Extrai visão e `data-id` da chave interna `VISAO:id#indice`. */
  private visaoEIdDaChaveRegiao(chave: string): { visao: string; id: string } | null {
    const m = /^([^:]+):(.+)#(\d+)$/.exec(chave);
    return m ? { visao: m[1], id: m[2] } : null;
  }

  private registrarCliqueArea(
    el: SVGGraphicsElement,
    svg: SVGSVGElement,
    overlay: SVGGElement,
    ev: EventoComCoordenadasCliente,
    indice: number,
  ) {
    const chave = this.chaveRegiao(el, indice);
    const vezes = (this.contagensPorRegiao.get(chave) ?? 0) + 1;
    this.contagensPorRegiao.set(chave, vezes);

    if (!this.cruzPorArea.has(el)) {
      const { x: cx, y: cy } = pontoSvgNoCliente(svg, ev);
      const cruz = criarCruzVermelhaCentrada(svg, cx, cy);
      overlay.appendChild(cruz);
      this.cruzPorArea.set(el, cruz);
      el.classList.add('area-selecionada');
    }

    this.logRegioesClicadas();
  }

  /**
   * Emite no consola, por visão, os `data-id` e o total de cliques por ID
   * (soma se o mesmo ID existir em mais do que uma forma na mesma visão).
   */
  private logRegioesClicadas() {
    const porVisao: Record<string, Record<string, number>> = {};
    for (const [chave, cliques] of this.contagensPorRegiao) {
      const partes = this.visaoEIdDaChaveRegiao(chave);
      if (!partes) {
        continue;
      }
      const { visao, id } = partes;
      if (!porVisao[visao]) {
        porVisao[visao] = {};
      }
      const ids = porVisao[visao];
      ids[id] = (ids[id] ?? 0) + cliques;
    }
    console.log('[Mapa]', porVisao);
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

function criarCruzVermelhaCentrada(svg: SVGSVGElement, cx: number, cy: number): SVGGElement {
  const doc = svg.ownerDocument!;
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 14);

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
