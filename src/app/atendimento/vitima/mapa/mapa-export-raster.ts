import { MapaMarcaPersistida } from './mapa-marcacoes';
import { criarMarcaSvg, garantirGrupoOverlayMarcas } from './mapa-marca-svg';
import { ImageHelper } from 'src/components/exportar/helper/imageHelper';

const XLINK_NS = 'http://www.w3.org/1999/xlink';

function resolverUrlAbsoluta(baseDoSvg: string, href: string): string {
  const h = href.trim();
  if (!h || h.startsWith('data:')) {
    return h;
  }
  if (h.startsWith('http://') || h.startsWith('https://')) {
    return h;
  }
  if (h.startsWith('/')) {
    return ImageHelper.resolveUrlForFetch(h);
  }
  return baseDoSvg + h;
}

/** Incorpora PNG/JPEG referenciados no SVG como data URL — necessário para o drawImage após blob URL não esperar sub-recursos. */
async function inlineImagensSvg(doc: Document, baseDoSvg: string): Promise<void> {
  const lista = doc.querySelectorAll('image');
  for (const el of Array.from(lista)) {
    const raw =
      el.getAttribute('href') ||
      el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
      el.getAttributeNS(XLINK_NS, 'href') ||
      '';
    const absoluta = resolverUrlAbsoluta(baseDoSvg, raw);
    if (!absoluta || absoluta.startsWith('data:')) {
      continue;
    }
    try {
      const resp = await fetch(absoluta);
      if (!resp.ok) {
        continue;
      }
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      el.setAttribute('href', dataUrl);
      el.removeAttributeNS(XLINK_NS, 'href');
    } catch {
      /* mantém href original */
    }
  }
}

/**
 * Rasteriza o croqui na resolução do próprio SVG (viewBox = tamanho em px, 1 unidade = 1 px no canvas),
 * sem redimensionar para largura fixa.
 */
export async function rasterizarMapaVisaoComMarcacoes(
  svgAssetUrl: string,
  marcacoesDaVisao: MapaMarcaPersistida[],
): Promise<ArrayBuffer> {
  const svgAbsoluto = resolverUrlAbsoluta(`${document.baseURI}`, svgAssetUrl);
  const resp = await fetch(svgAbsoluto);
  if (!resp.ok) {
    throw new Error(`Não foi possível carregar o croqui: ${svgAssetUrl}`);
  }
  const text = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement as unknown as SVGSVGElement;

  const baseUrl = svgAbsoluto.substring(0, svgAbsoluto.lastIndexOf('/') + 1);
  await inlineImagensSvg(doc, baseUrl);

  const vb = svg.viewBox?.baseVal;
  const vw = vb && vb.width > 0 ? vb.width : 424;
  const vh = vb && vb.height > 0 ? vb.height : vw * (941 / 424);
  const wPx = Math.max(1, Math.round(vw));
  const hPx = Math.max(1, Math.round(vh));

  svg.setAttribute('width', String(wPx));
  svg.setAttribute('height', String(hPx));

  const overlay = garantirGrupoOverlayMarcas(svg);
  for (const m of marcacoesDaVisao) {
    overlay.appendChild(criarMarcaSvg(svg, m));
  }

  document.body.appendChild(svg);

  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const imgEl = new Image();
    imgEl.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      imgEl.onload = () => resolve();
      imgEl.onerror = () => reject(new Error('Falha ao rasterizar o croqui.'));
      imgEl.src = blobUrl;
    });

    try {
      await imgEl.decode();
    } catch {
      /* alguns browsers não expõem decode para SVG */
    }

    let w = imgEl.naturalWidth || wPx;
    let h = imgEl.naturalHeight || hPx;
    if (!w || !h) {
      w = wPx;
      h = hPx;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(blobUrl);
      throw new Error('Canvas não disponível.');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(imgEl, 0, 0);
    URL.revokeObjectURL(blobUrl);

    return await new Promise<ArrayBuffer>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error('toBlob falhou'));
            return;
          }
          void b.arrayBuffer().then(resolve, reject);
        },
        'image/jpeg',
        0.92,
      );
    });
  } finally {
    svg.remove();
  }
}
