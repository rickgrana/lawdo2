/**
 * Mapa geográfico (tiles Carto Voyager / OSM) com marcação no centro.
 * Os tiles usados permitem CORS (`access-control-allow-origin: *`), necessário para o canvas exportar JPEG.
 */

const TILE_PX = 256;
const SUBDOMINIOS = ['a', 'b', 'c', 'd'] as const;

function lonLatParaPxMundo(lon: number, lat: number, zoom: number): { x: number; y: number } {
  const mundo = TILE_PX * 2 ** zoom;
  const x = ((lon + 180) / 360) * mundo;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * mundo;
  return { x, y };
}

function urlTileVoyager(z: number, tx: number, ty: number): string {
  const s = SUBDOMINIOS[(Math.abs(tx) + Math.abs(ty)) % SUBDOMINIOS.length];
  return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}.png`;
}

function carregarTile(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar tile do mapa'));
    img.src = url;
  });
}

function desenharMarcacaoCentro(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const r = 12;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#c62828';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r - 6, cy);
  ctx.lineTo(cx + r + 6, cy);
  ctx.moveTo(cx, cy - r - 6);
  ctx.lineTo(cx, cy + r + 6);
  ctx.strokeStyle = '#c62828';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function blobParaArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (r instanceof ArrayBuffer) {
        resolve(r);
      } else {
        reject(new Error('Leitura do mapa'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Leitura do mapa'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Gera JPEG do mapa centrado em (lat, lon), com marca no centro da imagem.
 */
export async function rasterizarMapaGeografico(
  lat: number,
  lon: number,
  larguraPx: number,
  alturaPx: number,
  zoom = 16,
): Promise<ArrayBuffer> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(larguraPx));
  canvas.height = Math.max(1, Math.round(alturaPx));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas não disponível para exportar o mapa');
  }

  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const z = Math.max(0, Math.min(19, Math.round(zoom)));
  const centro = lonLatParaPxMundo(lon, lat, z);
  const viewLeft = centro.x - canvas.width / 2;
  const viewTop = centro.y - canvas.height / 2;

  const maxTile = 2 ** z;
  const txMin = Math.floor(viewLeft / TILE_PX);
  const txMax = Math.floor((viewLeft + canvas.width - 1) / TILE_PX);
  const tyMin = Math.floor(viewTop / TILE_PX);
  const tyMax = Math.floor((viewTop + canvas.height - 1) / TILE_PX);

  const tarefas: Promise<void>[] = [];

  const tx0 = Math.max(0, txMin);
  const tx1 = Math.min(maxTile - 1, txMax);
  const ty0 = Math.max(0, tyMin);
  const ty1 = Math.min(maxTile - 1, tyMax);

  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const url = urlTileVoyager(z, tx, ty);
      const dx = tx * TILE_PX - viewLeft;
      const dy = ty * TILE_PX - viewTop;

      tarefas.push(
        carregarTile(url).then(
          (img) => {
            ctx.drawImage(img, dx, dy);
          },
          () => {
            ctx.fillStyle = '#bdbdbd';
            ctx.fillRect(dx, dy, TILE_PX, TILE_PX);
          },
        ),
      );
    }
  }

  await Promise.all(tarefas);

  desenharMarcacaoCentro(ctx, canvas.width / 2, canvas.height / 2);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!blob) {
    throw new Error('Não foi possível gerar a imagem do mapa');
  }

  return blobParaArrayBuffer(blob);
}
