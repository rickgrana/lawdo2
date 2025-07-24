export class ImageHelper{

    static async getBufferFromURL(url)
    {
        let response = await fetch(url); // obtem os dados da url
        let buffer = await response.arrayBuffer(); // obtem buffer da imagem

        await Promise.all([response, buffer]);
    
        return buffer;
    }

    // função para obter altura e largura da imagem
    static loadFromURL(src)
    {
        return new Promise((resolve, reject) => {
          let img = new Image()
          img.onload = () => resolve([img.width, img.height])
          img.onerror = reject
          img.src = src
        })
    }
}