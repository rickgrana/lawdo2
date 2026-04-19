import { Component, DestroyRef, Input, NgZone, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowUndoOutline,
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
import {
  aplicarOffsetFacaNaCoordenada,
  aplicarOffsetPistolaNaCoordenada,
  clampPontoAoSvg,
  comprimentoPolylineAberta,
  criarMarcaSvg,
  distanciaMinimaAmostragemSvg,
  estiloTracoHematomaArrasto,
  garantirDefesMapaOverlay,
  garantirGrupoOverlayMarcas,
  metadeBracoCruzEmUnidadesSvg,
  pontoDentroPoligono,
  distanciaMinimaPontoAristasPoligono,
  raioApagarEmUnidadesSvg2,
  tipoMarcaDe,
  SVG_NS,
} from './mapa-marca-svg';
import { MapaVisao, mapaSrcParaVisao, parseMapaVisao } from './mapa-visao.enum';
import {
  extrairMarcacoesDeVestigios,
  MapaVestigioItem,
  normalizarTipoMarca,
  parseVestigiosMapa,
} from './mapa-vestigios-parse';

addIcons({
  flashOutline,
  cutOutline,
  hammerOutline,
  ellipse,
  backspaceOutline,
  arrowUndoOutline,
});

/** Evento com `clientX`/`clientY` (ex.: clique no SVG dentro de `<object>`, outro `Window` que falha em `instanceof MouseEvent`). */
type EventoComCoordenadasCliente = Event & { readonly clientX: number; readonly clientY: number };
type CoordenadaMapa = { x: number; y: number };

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
    IonIcon,
    IonContent
  ],
})
export class MapaPage extends AtendimentoBasePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
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

  private readonly pilhaDesfazerMax = 40;
  /** Lista plana de marcações antes de cada alteração (mesmo formato que `definirMarcacoes`). */
  private pilhaDesfazer: MapaMarcaPersistida[][] = [];

  /** Arrasto livre para mancha poligonal (hematoma ou faca). */
  private manchaPoligonoArrasto: {
    svg: SVGSVGElement;
    overlay: SVGGElement;
    areaId: string;
    tipoVestigio: MapaTipoVestigio.HEMATOMA | MapaTipoVestigio.FACA;
    pontos: CoordenadaMapa[];
    preview: SVGPolylineElement;
    ac: AbortController;
  } | null = null;

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
    this.cancelarArrastoManchaPoligono();
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

    const overlay = garantirGrupoOverlayMarcas(svg);

    const areas = svgDoc.querySelectorAll<SVGGraphicsElement>('.area');
    areas.forEach((el) => {
      el.addEventListener(
        'click',
        (ev) => {
          // O SVG está num documento do <object>: o evento corre fora da NgZone e o template
          // (ex.: botão Desfazer) não atualiza até ao próximo ciclo fora do croqui.
          this.ngZone.run(() => {
            if (
              this.ferramentaAtiva === MapaFerramenta.HEMATOMA ||
              this.ferramentaAtiva === MapaFerramenta.FACA
            ) {
              return;
            }
            ev.preventDefault();
            ev.stopPropagation();
            if (!eventoTemCoordenadasCliente(ev)) {
              return;
            }
            this.registrarCliqueArea(el, svg, overlay, ev);
          });
        },
        { signal: ac.signal, capture: true },
      );
      el.addEventListener(
        'pointerdown',
        (ev) => {
          this.ngZone.run(() => {
            const f = this.ferramentaAtiva;
            if (f !== MapaFerramenta.HEMATOMA && f !== MapaFerramenta.FACA) {
              return;
            }
            if (ev.button !== 0) {
              return;
            }
            ev.preventDefault();
            ev.stopPropagation();
            if (!eventoTemCoordenadasCliente(ev)) {
              return;
            }
            const tipo =
              f === MapaFerramenta.FACA ? MapaTipoVestigio.FACA : MapaTipoVestigio.HEMATOMA;
            this.iniciarArrastoManchaPoligono(el, svg, overlay, ev, tipo);
          });
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

  get podeDesfazer(): boolean {
    return this.pilhaDesfazer.length > 0 && !!this.vitima;
  }

  desfazer(ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    if (!this.podeDesfazer) {
      return;
    }
    const anterior = this.pilhaDesfazer.pop()!;
    this.aplicarMarcacoesSnapshot(anterior);
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

  private iniciarArrastoManchaPoligono(
    el: SVGGraphicsElement,
    svg: SVGSVGElement,
    overlay: SVGGElement,
    ev: EventoComCoordenadasCliente,
    tipoVestigio: MapaTipoVestigio.HEMATOMA | MapaTipoVestigio.FACA,
  ) {
    if (this.manchaPoligonoArrasto) {
      return;
    }
    const id = el.getAttribute('data-id')?.trim() ?? '';
    if (!id || !this.visao) {
      return;
    }
    const p0 = clampPontoAoSvg(svg, pontoSvgNoCliente(svg, ev));
    const doc = svg.ownerDocument!;
    garantirDefesMapaOverlay(svg);
    const preview = doc.createElementNS(SVG_NS, 'polyline');
    preview.setAttribute('pointer-events', 'none');
    preview.setAttribute('fill', 'none');
    preview.setAttribute('stroke-linejoin', 'round');
    preview.setAttribute('stroke-linecap', 'round');
    preview.setAttribute('vector-effect', 'non-scaling-stroke');
    if (tipoVestigio === MapaTipoVestigio.FACA) {
      const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 1.25);
      const riscoW = Math.max(rx, ry) * 1.35;
      preview.setAttribute('stroke', '#ff1744');
      preview.setAttribute('stroke-width', String(riscoW));
      preview.setAttribute('stroke-opacity', '1');
    } else {
      const { largura, cor, opacidade } = estiloTracoHematomaArrasto(svg);
      preview.setAttribute('stroke', cor);
      preview.setAttribute('stroke-width', String(largura));
      preview.setAttribute('stroke-opacity', opacidade);
      preview.setAttribute('filter', 'url(#mapa-mancha-hem-preview)');
    }
    preview.setAttribute('points', `${p0.x},${p0.y}`);
    overlay.appendChild(preview);

    const ac = new AbortController();
    this.manchaPoligonoArrasto = {
      svg,
      overlay,
      areaId: id,
      tipoVestigio,
      pontos: [{ x: p0.x, y: p0.y }],
      preview,
      ac,
    };

    const ptr = ev as PointerEvent;
    try {
      el.setPointerCapture(ptr.pointerId);
    } catch {
      /* ignore */
    }

    const minDist = distanciaMinimaAmostragemSvg(svg);
    const mover = (e: Event) => {
      if (!this.manchaPoligonoArrasto || !eventoTemCoordenadasCliente(e)) {
        return;
      }
      const p = clampPontoAoSvg(svg, pontoSvgNoCliente(svg, e));
      const pts = this.manchaPoligonoArrasto.pontos;
      const ult = pts[pts.length - 1];
      const dx = p.x - ult.x;
      const dy = p.y - ult.y;
      if (dx * dx + dy * dy < minDist * minDist) {
        return;
      }
      pts.push({ x: p.x, y: p.y });
      this.manchaPoligonoArrasto.preview.setAttribute('points', pts.map((q) => `${q.x},${q.y}`).join(' '));
    };

    const finalizar = (e: Event) => {
      this.ngZone.run(() => {
        if (!this.manchaPoligonoArrasto) {
          return;
        }
        const st = this.manchaPoligonoArrasto;
        this.manchaPoligonoArrasto = null;
        ac.abort();
        try {
          el.releasePointerCapture((e as PointerEvent).pointerId);
        } catch {
          /* ignore */
        }
        st.preview.remove();
        const pts = st.pontos.map((q) => clampPontoAoSvg(svg, q));
        const minD = distanciaMinimaAmostragemSvg(svg);

        if (st.tipoVestigio === MapaTipoVestigio.FACA) {
          const comp = comprimentoPolylineAberta(pts);
          const arrastoRisco = pts.length >= 3 && comp >= minD * 8;
          if (!arrastoRisco) {
            const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
            const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
            const { x, y } = aplicarOffsetFacaNaCoordenada(svg, cx, cy);
            const marcaLente: MapaMarcaPersistida = {
              visao: this.visao!,
              id: st.areaId,
              x,
              y,
              tipo: MapaTipoVestigio.FACA,
            };
            this.appendMarcaMapa(marcaLente);
            overlay.appendChild(criarMarcaSvg(svg, marcaLente));
            return;
          }
          const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
          const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
          const marcaRisco: MapaMarcaPersistida = {
            visao: this.visao!,
            id: st.areaId,
            x: cx,
            y: cy,
            tipo: MapaTipoVestigio.FACA,
            pontos: pts.map((q) => ({ x: q.x, y: q.y })),
          };
          this.appendMarcaMapa(marcaRisco);
          overlay.appendChild(criarMarcaSvg(svg, marcaRisco));
          return;
        }

        if (pts.length < 3) {
          return;
        }
        const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
        const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
        const marca: MapaMarcaPersistida = {
          visao: this.visao!,
          id: st.areaId,
          x: cx,
          y: cy,
          tipo: st.tipoVestigio,
          pontos: pts.map((q) => ({ x: q.x, y: q.y })),
        };
        this.appendMarcaMapa(marca);
        overlay.appendChild(criarMarcaSvg(svg, marca));
      });
    };

    const docRoot = doc;
    docRoot.addEventListener('pointermove', mover, { signal: ac.signal, capture: true });
    docRoot.addEventListener('pointerup', finalizar, { signal: ac.signal, capture: true });
    docRoot.addEventListener('pointercancel', finalizar, { signal: ac.signal, capture: true });
  }

  private cancelarArrastoManchaPoligono() {
    const st = this.manchaPoligonoArrasto;
    if (!st) {
      return;
    }
    this.manchaPoligonoArrasto = null;
    st.ac.abort();
    st.preview.remove();
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
    // `vestigiosMapaAtuais()` volta ao legado quando o array está vazio; sem limpar,
    // desfazer ou apagar todas as marcas PAF reapareciam a partir de `paf_mapa_marcacoes`.
    const legadoCtrl = this.formularioVitima?.get('paf_mapa_marcacoes');
    if (legadoCtrl) {
      legadoCtrl.setValue('');
    }
    v.paf_mapa_marcacoes = '';
  }

  private clonarMarcacoes(marcacoes: MapaMarcaPersistida[]): MapaMarcaPersistida[] {
    return JSON.parse(JSON.stringify(marcacoes)) as MapaMarcaPersistida[];
  }

  private registrarHistoricoAntesAlteracao() {
    if (!this.vitima) {
      return;
    }
    const atual = this.clonarMarcacoes(this.marcacoesAtuais());
    this.pilhaDesfazer.push(atual);
    while (this.pilhaDesfazer.length > this.pilhaDesfazerMax) {
      this.pilhaDesfazer.shift();
    }
  }

  /** Restaura o mesmo caminho que qualquer edição no mapa: `definirMarcacoes` + redesenho. */
  private aplicarMarcacoesSnapshot(marcacoes: MapaMarcaPersistida[]) {
    if (!this.vitima) {
      return;
    }
    const clone = this.clonarMarcacoes(marcacoes);
    this.definirMarcacoes(clone);
    const svg = this.svgRaizAtual;
    if (svg) {
      const overlay = garantirGrupoOverlayMarcas(svg);
      this.restaurarMarcasSalvas(svg, overlay);
    }
  }

  private appendMarcaMapa(marca: MapaMarcaPersistida) {
    this.registrarHistoricoAntesAlteracao();
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
    const limLinha = Math.sqrt(lim2) * 1.35;
    const restantes = lista.filter((m) => {
      if (m.visao !== visao) {
        return true;
      }
      const poligonoMancha =
        (tipoMarcaDe(m) === MapaTipoVestigio.HEMATOMA || tipoMarcaDe(m) === MapaTipoVestigio.FACA) &&
        m.pontos &&
        m.pontos.length >= 3;
      if (poligonoMancha) {
        const dentro = pontoDentroPoligono(cx, cy, m.pontos!);
        const dArista = distanciaMinimaPontoAristasPoligono(cx, cy, m.pontos!);
        const manter = !dentro && dArista > limLinha;
        if (!manter) {
          removidos.push(m);
        }
        return manter;
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

    this.registrarHistoricoAntesAlteracao();
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

function converterMarcacoesParaVestigios(lista: MapaMarcaPersistida[]): MapaVestigioItem[] {
  const index = new Map<string, CoordenadaMapa[]>();
  const poligonosQuantidadeUm: MapaVestigioItem[] = [];

  for (const m of lista) {
    const tipo = m.tipo ?? MapaTipoVestigio.PAF;
    const regiao = parseMapaRegiao(String(m.id ?? '').trim());
    if (!regiao) {
      continue;
    }
    if (
      (tipo === MapaTipoVestigio.HEMATOMA || tipo === MapaTipoVestigio.FACA) &&
      m.pontos &&
      m.pontos.length >= 3
    ) {
      poligonosQuantidadeUm.push({
        visao: m.visao,
        regiao,
        tipoVestigio: tipo,
        quantidade: 1,
        coordenadas: m.pontos.map((p) => ({ x: p.x, y: p.y })),
      });
      continue;
    }
    const key = `${m.visao}||${tipo}||${regiao}`;
    const coords = index.get(key) ?? [];
    coords.push({ x: m.x, y: m.y });
    index.set(key, coords);
  }

  const out: MapaVestigioItem[] = [...poligonosQuantidadeUm];
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

function pontoSvgNoCliente(svg: SVGSVGElement, ev: EventoComCoordenadasCliente): { x: number; y: number } {
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
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
