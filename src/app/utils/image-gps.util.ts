import exifr from 'exifr';

/** Lê GPS (EXIF) do ficheiro original; deve ser chamado antes de redimensionar via canvas (o JPEG resultante perde EXIF). */
export async function readGpsFromImageFile(file: File): Promise<{ lat: number; long: number } | null> {
  try {
    const gps = await exifr.gps(file);
    if (
      !gps ||
      typeof (gps as { latitude?: unknown }).latitude !== 'number' ||
      typeof (gps as { longitude?: unknown }).longitude !== 'number'
    ) {
      return null;
    }
    const lat = (gps as { latitude: number }).latitude;
    const long = (gps as { longitude: number }).longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(long)) {
      return null;
    }
    return { lat, long };
  } catch {
    return null;
  }
}

/** Texto para UI: `Coordenadas: (lat, long)` com 6 casas decimais (pt-BR). */
export function formatCoordenadasLatLong(lat: number | undefined, long: number | undefined): string | null {
  if (lat == null || long == null || !Number.isFinite(lat) || !Number.isFinite(long)) {
    return null;
  }
  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  return `Coordenadas: (${fmt(lat)}, ${fmt(long)})`;
}
