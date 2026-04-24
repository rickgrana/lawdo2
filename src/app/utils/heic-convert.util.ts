/** MIME ou extensão típicos de fotos iPhone (HEIC/HEIF). */
export function isHeicLikeFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') {
    return true;
  }
  return name.endsWith('.heic') || name.endsWith('.heif') || name.endsWith('.hif');
}

/**
 * Garante um ficheiro que o browser consegue desenhar em canvas (JPEG).
 * HEIC/HEIF é convertido no cliente via heic2any (WASM); demais formatos devolvem o mesmo ficheiro.
 */
export async function ensureJpegFileForCanvas(file: File): Promise<File> {
  if (!isHeicLikeFile(file)) {
    return file;
  }

  const heic2any = (await import('heic2any')).default;
  let result: Blob | Blob[];
  try {
    result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : typeof e === 'string' ? e : String(e);
    throw new Error(
      `Não foi possível converter HEIC/HEIF: ${msg}. Experimente outra foto ou defina a câmara para “Mais compatível” (JPEG).`,
    );
  }

  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob?.size) {
    throw new Error('A conversão HEIC/HEIF não produziu dados válidos.');
  }

  const stem = file.name.replace(/\.(heic|heif|hif)$/i, '') || 'image';
  return new File([blob], `${stem}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
