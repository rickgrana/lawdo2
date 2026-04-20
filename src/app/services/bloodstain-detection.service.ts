import { Injectable } from '@angular/core';
import { DetectionImageResponse } from '../interfaces/detection.interface';
import { environment } from '../../environments/environment';

/** Query `conf` alinhada ao notebook / treino (padrão 0.25). */
const DEFAULT_CONF = 0.25;

/** Cloud Run cold start pode responder 503/504 na primeira requisição após ociosidade. */
const COLD_START_RETRY_MS = 3500;

@Injectable({
  providedIn: 'root'
})
export class BloodstainDetectionService {

  async detect(imageSrc: string, conf = DEFAULT_CONF): Promise<DetectionImageResponse> {
    const response = await fetch(imageSrc);
    const blob = await response.blob();

    const url = new URL(environment.bloodstainDetectionPredictUrl);
    url.searchParams.set('conf', String(conf));

    const postPredict = () => {
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      return fetch(url.toString(), {
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

    const count = res.headers.get('X-Detections-Count');
    const resultBlob = await res.blob();

    return {
      imageSrc: URL.createObjectURL(resultBlob),
      blob: resultBlob,
      quantidade: count ? parseInt(count, 10) : 0
    };
  }
}
