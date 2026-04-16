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
import { MapaVisao, mapaSrcParaVisao, parseMapaVisao } from './mapa-visao.enum';

addIcons({
  flashOutline,
  cutOutline,
  hammerOutline,
  ellipse,
  backspaceOutline,
  arrowUndoOutline,
});

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

    const overlay = this.garantirGrupoOverlay(svg);

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

  private garantirGrupoOverlay(svg: SVGSVGElement): SVGGElement {
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
      const overlay = this.garantirGrupoOverlay(svg);
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
    const manchaPoligono =
      (item.tipoVestigio === MapaTipoVestigio.HEMATOMA || item.tipoVestigio === MapaTipoVestigio.FACA) &&
      item.coordenadas.length > 0;
    if (manchaPoligono) {
      const q = item.quantidade;
      const coords = item.coordenadas;
      // Um polígono: quantidade 1 com ≥3 vértices. Vários marcos antigos na mesma região: quantidade = nº de marcas.
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

function limitesSvgLocal(svg: SVGSVGElement): { x: number; y: number; width: number; height: number } {
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

function clampPontoAoSvg(svg: SVGSVGElement, p: CoordenadaMapa): CoordenadaMapa {
  const b = limitesSvgLocal(svg);
  return {
    x: Math.min(Math.max(p.x, b.x), b.x + b.width),
    y: Math.min(Math.max(p.y, b.y), b.y + b.height),
  };
}

/** `clipPath` = união das geometrias `.area` do croqui (marcas só visíveis dentro das regiões). */
function garantirClipUniaoAreas(svg: SVGSVGElement): void {
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
function garantirDefesMapaOverlay(svg: SVGSVGElement): void {
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

/** Mesmos parâmetros do traço de arrasto e da marca final (polígono hematoma). */
function estiloTracoHematomaArrasto(svg: SVGSVGElement): {
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
function distanciaMinimaAmostragemSvg(svg: SVGSVGElement): number {
  const { rx, ry } = metadeBracoCruzEmUnidadesSvg(svg, 2.5);
  return Math.max(rx, ry, 0.8);
}

/** Comprimento da polilinha aberta (não fecha o último ao primeiro). */
function comprimentoPolylineAberta(pts: CoordenadaMapa[]): number {
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

function pontoDentroPoligono(px: number, py: number, pts: CoordenadaMapa[]): boolean {
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

function distanciaMinimaPontoAristasPoligono(px: number, py: number, pts: CoordenadaMapa[]): number {
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
