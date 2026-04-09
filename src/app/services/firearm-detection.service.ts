import { Injectable } from '@angular/core';
import { DetectionImageResponse } from '../interfaces/detection.interface';

@Injectable({
  providedIn: 'root'
})
export class FirearmDetectionService {

  async detect(imageSrc: string): Promise<DetectionImageResponse> {
    // pega a imagem do src
    const response = await fetch(imageSrc);
    const blob = await response.blob();

    // monta formData
    const formData = new FormData();
    formData.append("file", blob, "image.jpg");

    const res = await fetch("https://firearm-detection-api-54853285455.southamerica-east1.run.app/predict", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Erro na API");

    
    const count = res.headers.get("X-Detections-Count");
    console.log('Resposta da API:', count);
    const resultBlob = await res.blob();

    return {
      imageSrc: URL.createObjectURL(resultBlob),
      blob: resultBlob,
      quantidade: count ? parseInt(count) : 0
    };
  }
}
