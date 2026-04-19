import { Injectable } from '@angular/core';
import { DetectionImageResponse } from '../interfaces/detection.interface';

const PREDICT_URL =
  'https://firearm-detection-api-54853285455.southamerica-east1.run.app/predict';

/** Cloud Run cold start pode responder 503/504 na primeira requisição após ociosidade. */
const COLD_START_RETRY_MS = 3500;

@Injectable({
  providedIn: 'root'
})
export class FirearmDetectionService {

  async detect(imageSrc: string): Promise<DetectionImageResponse> {
    const response = await fetch(imageSrc);
    const blob = await response.blob();

    const postPredict = () => {
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      return fetch(PREDICT_URL, {
        method: 'POST',
        body: formData,
      });
    };

    let res = await postPredict();

    if (res.status === 503 || res.status === 504) {
      await new Promise((r) => setTimeout(r, COLD_START_RETRY_MS));
      res = await postPredict();
    }

    if (!res.ok) {
      throw new Error(`Erro na API (${res.status})`);
    }

    
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
