/**
 * Geocodificação inversa via OpenStreetMap Nominatim (rede).
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */
export interface NominatimReverseResult {
  bairro?: string;
  logradouro?: string;
  /** Nome bruto do município (para cruzar com listas da app). */
  cidadeNome?: string;
}

export async function reverseGeocodeFromNominatim(
  lat: number,
  lon: number,
): Promise<NominatimReverseResult> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(String(lat))}` +
    `&lon=${encodeURIComponent(String(lon))}&format=json`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'User-Agent': 'Lawdo/2.1 (perícia; geocodificação inversa)',
    },
  });
  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}`);
  }
  const data: { address?: Record<string, string> } = await res.json();
  const a = data.address ?? {};

  const logradouro = [
    a['road'] ?? a['pedestrian'] ?? a['path'],
    a['house_number'],
  ]
    .filter((x) => x && String(x).trim().length > 0)
    .join(', ')
    .trim();

  const bairro = (
    a['suburb'] ??
    a['neighbourhood'] ??
    a['quarter'] ??
    a['city_district'] ??
    ''
  )
    .toString()
    .trim();

  const cidadeNome = (
    a['city'] ??
    a['town'] ??
    a['municipality'] ??
    a['village'] ??
    a['county'] ??
    ''
  )
    .toString()
    .trim();

  const out: NominatimReverseResult = {};
  if (cidadeNome) {
    out.cidadeNome = cidadeNome;
  }
  if (bairro) {
    out.bairro = bairro;
  }
  if (logradouro) {
    out.logradouro = logradouro;
  }
  return out;
}
