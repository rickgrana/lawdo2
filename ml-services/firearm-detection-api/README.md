# Firearm Detection API

API HTTP em [FastAPI](https://fastapi.tiangolo.com/) que expõe um modelo **YOLO** (Ultralytics) para **detecção de armas de fogo em imagens**. O serviço recebe uma imagem e pode devolver **JSON com caixas e classes** (`POST /predict/json`) ou uma **imagem JPEG** com as detecções desenhadas (`POST /predict`).

## Requisitos

- **Python 3.10+** (alinhado ao `Dockerfile`)
- Arquivo de pesos **`best.pt`** na raiz do projeto (mesmo diretório que `main.py`). Este arquivo não está versionado no repositório; deve ser obtido do treinamento do modelo ou de um artefato interno.

## Dependências

| Pacote | Uso |
|--------|-----|
| `fastapi` | Framework da API |
| `uvicorn` | Servidor ASGI |
| `ultralytics` | Carregamento e inferência YOLO |
| `opencv-python-headless` | Codificação da imagem de saída em JPEG |
| `pillow` | Abertura e conversão da imagem de entrada |
| `python-multipart` | Upload de arquivos (`multipart/form-data`) |

Instalação local:

```bash
pip install -r requirements.txt
```

## Execução local

```bash
python main.py
```

- **Host:** `0.0.0.0`
- **Porta:** variável de ambiente `PORT` ou **8080** por padrão

Alternativa explícita com uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

## Documentação interativa (OpenAPI / Swagger)

Com o servidor em execução (ex.: `http://localhost:8080`):

| URL | Descrição |
|-----|-----------|
| [`/docs`](http://localhost:8080/docs) | **Swagger UI** — experimentar endpoints e enviar ficheiros |
| [`/redoc`](http://localhost:8080/redoc) | **ReDoc** — leitura da especificação |
| [`/openapi.json`](http://localhost:8080/openapi.json) | Esquema OpenAPI 3 em JSON |

A app define título, versão, tags (**Health**, **Inference**), modelos de resposta (`DetectionResponse`, etc.) e o tipo de resposta `image/jpeg` para `POST /predict`.

## Endpoints

### `GET /`

Verificação de saúde do serviço.

**Resposta:** `200 OK`, corpo JSON:

```json
{ "status": "ok" }
```

### `POST /predict/json`

Inferência com resposta estruturada (coordenadas no espaço da **imagem original**).

| Aspecto | Detalhe |
|---------|---------|
| **Content-Type** | `multipart/form-data` |
| **Campo** | `file` (arquivo de imagem) |
| **Resposta** | `200 OK`, JSON |

Exemplo de corpo (formato ilustrativo):

```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "firearm",
      "confidence": 0.91,
      "box": { "x1": 120.5, "y1": 80.0, "x2": 340.0, "y2": 210.0 }
    }
  ],
  "image_width": 1920,
  "image_height": 1080
}
```

Os nomes de classe vêm do mapa do modelo (`best.pt`). `image_width` / `image_height` correspondem à imagem de entrada após abertura pelo PIL.

### `POST /predict`

Mesma inferência que `/predict/json`, mas a resposta é **`image/jpeg`**: imagem com caixas plotadas.

| Aspecto | Detalhe |
|---------|---------|
| **Content-Type** | `multipart/form-data` |
| **Campo** | `file` (arquivo de imagem) |
| **Resposta** | `200 OK`, corpo binário **`image/jpeg`** |

**Parâmetros de inferência (constantes em `main.py`):**

| Parâmetro | Valor | Significado |
|-----------|-------|-------------|
| `conf` | `0.5` | Limiar mínimo de confiança |
| `iou` | `0.7` | IoU para NMS |
| `imgsz` | `640` | Tamanho de entrada redimensionado |

A imagem de entrada é convertida para **RGB** antes da predição.

## Docker

Build e execução:

```bash
docker build -t firearm-detection-api .
docker run -p 8080:8080 firearm-detection-api
```

O `Dockerfile`:

- Usa imagem base `python:3.10-slim`
- Instala bibliotecas de sistema necessárias para OpenCV/Ultralytics (`libgl1`, `libglib2.0-0`, etc.)
- Define `YOLO_CONFIG_DIR=/tmp/Ultralytics` para evitar problemas de escrita em ambientes somente leitura
- Comando padrão: shell que executa `uvicorn` com **`--port ${PORT:-8080}`**, alinhado ao **Cloud Run** e a outros ambientes que definem `PORT`

**Importante:** inclua `best.pt` no contexto de build (por exemplo, `COPY` no estágio final) ou monte o arquivo em runtime, caso contrário o container falhará ao carregar o modelo no `startup`.

## Deploy (Cloud Run)

O **Dockerfile** usa `PORT` com fallback **8080**. No Cloud Run, defina a porta do container para o valor que a plataforma injeta (em geral coincide com `PORT`). O bloco `if __name__ == "__main__"` em `main.py` também lê `PORT` para execução local sem Docker.

## Estrutura do projeto

```
firearm-detection-api/
├── main.py           # Aplicação FastAPI e lógica de predição
├── requirements.txt  # Dependências Python
├── Dockerfile        # Imagem de produção
├── best.pt           # Pesos YOLO (fornecido externamente)
└── README.md         # Esta documentação
```

## Fluxo resumido

1. No **startup**, o modelo `YOLO("best.pt")` é carregado uma vez (variável global `model`).
2. Nos endpoints **`POST /predict`** e **`POST /predict/json`**, o arquivo é lido, convertido para RGB e passado a `_run_predict` (mesmos hiperparâmetros).
3. **`/predict/json`**: extrai caixas, confiança e classe de `result.boxes` e devolve JSON.
4. **`/predict`**: plota com `result.plot()`, codifica em JPEG e devolve bytes.

## Limitações e observações

- Não há validação explícita de tipo MIME ou extensão do arquivo; formatos suportados dependem do que o **PIL** conseguir abrir.
- Erros de modelo ausente, imagem inválida ou falha na inferência não são tratados com handlers dedicados; em produção convém adicionar tratamento e códigos HTTP apropriados.
