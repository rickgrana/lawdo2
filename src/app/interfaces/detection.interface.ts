export interface DetectionImageResponse {
  imageSrc: string;        // Src da imagem para exibir no <img>
  blob: Blob;              // imagem original retornada
  quantidade: number;     // número de detecções
}