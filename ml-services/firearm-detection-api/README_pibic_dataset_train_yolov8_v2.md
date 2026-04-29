# Notebook: pibic_dataset_train yolov8_v2

## Objetivo

Treinar, validar e testar um detector de objetos com YOLOv8 usando o dataset `perfuracoes`, alem de demonstrar inferencia em imagem/video, recorte (crop) de deteccoes e tracking.

## Requisitos

- Ambiente com Python (preferencialmente Google Colab, como no notebook).
- Biblioteca `ultralytics` instalada.
- Dataset organizado em formato YOLO com arquivo `data.yaml`.
- Acesso ao Google Drive (quando usar caminhos em `/content/drive/...`).

## Estrutura do notebook

1. **Setup**
   - Limpa saidas anteriores (`runs/`).
   - Instala `ultralytics`.
   - Ajusta configuracao de saida (`runs_dir`).

2. **Dados**
   - Monta o Google Drive.
   - Aponta para o `data.yaml` do dataset:
     - `/content/drive/MyDrive/treinamento/perfuracoes.v2-new_dataset/data.yaml`

3. **Treinamento**
   - Inicializa modelo base: `YOLO('yolov8s')`.
   - Executa `model.train(...)` com hiperparametros e augmentations.

4. **Validacao**
   - Carrega `best.pt` gerado no treino.
   - Executa `model.val(...)` e consulta metricas como `map50`.

5. **Inferencia**
   - Predicao em imagem.
   - Predicao em video.
   - Salvamento de bbox, confianca e crops.

6. **Pos-processamento**
   - Extrai coordenadas `xyxy` das boxes.
   - Faz crop via Pillow e OpenCV.

7. **Tracking**
   - Executa `model.track(...)` para rastreamento em video.

## Parametros principais usados

### Treinamento (`model.train`)

- `epochs=100`
- `patience=8`
- `batch=-1` (AutoBatch)
- `imgsz=640`
- `workers=8`
- `pretrained=True`
- `resume=False`
- `single_cls=False`
- `box=7.5`
- `cls=0.5`
- `dfl=1.5`
- `val=False` (comentario no notebook indica voltar para `True` com dataset completo)

### Augmentations

- `degrees=0.3`
- `hsv_s=0.3`
- `hsv_v=0.3`
- `scale=0.5`
- `fliplr=0.5`

### Validacao (`model.val`)

- `imgsz=640`
- `batch=16`
- `conf=0.001`
- `iou=0.7`
- `split='val'`

## Artefatos esperados

- Pesos treinados em:
  - `runs/detect/train/weights/best.pt`
- Resultados de predicao/validacao em subpastas de `runs/` (conforme configuracoes de `save*`).

## Observacoes

- O notebook e orientado a experimentacao em Colab e contem celulas para diferentes cenarios (imagem, video, crop e tracking).
- Alguns caminhos de arquivos (`IMG.jpg`, `.mp4`, pastas de video) devem ser ajustados para o ambiente/local de execucao.
