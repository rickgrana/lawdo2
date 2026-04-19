export class ImageHelper{

    /**
     * Caminhos como `/assets/…` devem resolver em relação a `<base href>`.
     * Um `fetch('/assets/x')` ignora subpastas do app e pode falhar com TypeError \"Failed to fetch\".
     */
    static resolveUrlForFetch(url: string): string {
        const t = (url ?? '').trim();
        if (!t) {
            return t;
        }
        if (
            t.startsWith('blob:') ||
            t.startsWith('data:') ||
            t.startsWith('http://') ||
            t.startsWith('https://')
        ) {
            return t;
        }
        const path = t.startsWith('/') ? t.slice(1) : t;
        try {
            return new URL(path, document.baseURI).href;
        } catch {
            return t;
        }
    }

    static async getBufferFromURL(url: string)
    {
        const resolved = ImageHelper.resolveUrlForFetch(url);
        let response: Response;
        try {
            response = await fetch(resolved);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(
                `Não foi possível obter a imagem: ${msg}` +
                    (resolved !== url ? ` (${resolved})` : ''),
            );
        }
        if (!response.ok) {
            throw new Error(
                `Imagem retornou HTTP ${response.status} (${resolved})`,
            );
        }
        return response.arrayBuffer();
    }

    // função para obter altura e largura da imagem
    static loadFromURL(src: string)
    {
        const resolved = ImageHelper.resolveUrlForFetch(src);
        return new Promise((resolve, reject) => {
          let img = new Image()
          img.onload = () => resolve([img.width, img.height])
          img.onerror = reject
          img.src = resolved
        })
    }
}