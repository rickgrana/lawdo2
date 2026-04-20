from typing import Optional

from fastapi import FastAPI, UploadFile, File, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ultralytics import YOLO
from PIL import Image
import io
import cv2
import os

DEFAULT_CONF = float(os.environ.get("CONF", "0.25"))
DEFAULT_IOU = float(os.environ.get("IOU", "0.7"))
DEFAULT_IMGSZ = int(os.environ.get("IMGSZ", "640"))

TAGS_METADATA = [
    {"name": "Health", "description": "Estado e disponibilidade do serviço."},
    {"name": "Inference", "description": "Inferência YOLO: envio de imagem, resposta JSON ou JPEG."},
]

app = FastAPI(
    title="Bloodstain Detection API",
    description=(
        "Identificação de **manchas de sangue** em imagens com **YOLO** (Ultralytics). "
        "Padrões: `conf` (query ou env `CONF`) **0.25**, `iou` **0.7**, `imgsz` **640**. "
        "Modelos de **segmentação** incluem `polygon_xy` no JSON.\n\n"
        "**Swagger UI:** esta página. **ReDoc:** [`/redoc`](/redoc). **OpenAPI JSON:** [`/openapi.json`](/openapi.json)."
    ),
    version="1.0.0",
    openapi_tags=TAGS_METADATA,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Detections-Count"]
)

model = None


@app.on_event("startup")
def load_model():
    global model
    model = YOLO("best.pt")


# =========================
# MODELS
# =========================

class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float = Field(..., description="Confiança do modelo (0–1).")
    box: BoundingBox
    polygon_xy: Optional[list[list[float]]] = Field(
        default=None,
        description="Polígono da máscara (YOLO-seg), pontos em px na imagem original.",
    )


class DetectionResponse(BaseModel):
    detections: list[Detection]
    total_detections: int = Field(..., description="Quantidade de objetos detectados.")
    image_width: int = Field(..., description="Largura da imagem de entrada (px).")
    image_height: int = Field(..., description="Altura da imagem de entrada (px).")


# =========================
# HEALTH
# =========================

@app.get(
    "/",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check",
)
def home():
    return HealthResponse(status="ok")


# =========================
# CORE
# =========================

def _run_predict(image: Image.Image, conf: float, iou: float, imgsz: int):
    return model.predict(
        source=image,
        conf=conf,
        iou=iou,
        imgsz=imgsz,
        stream=False,
    )


def _detections_from_result(result):
    detections = []

    masks_xy = None
    if getattr(result, "masks", None) is not None and result.masks is not None:
        masks_xy = result.masks.xy

    if result.boxes is not None and len(result.boxes):
        boxes = result.boxes
        for i in range(len(boxes)):
            box = boxes[i]
            xyxy = box.xyxy[0].tolist()
            cls_id = int(box.cls[0])

            item = {
                "class_id": cls_id,
                "class_name": result.names.get(cls_id, str(cls_id)),
                "confidence": float(box.conf[0]),
                "box": {
                    "x1": xyxy[0],
                    "y1": xyxy[1],
                    "x2": xyxy[2],
                    "y2": xyxy[3],
                },
                "polygon_xy": None,
            }

            if masks_xy is not None and i < len(masks_xy):
                item["polygon_xy"] = masks_xy[i].tolist()

            detections.append(item)

    h, w = result.orig_shape

    return {
        "detections": detections,
        "total_detections": len(detections),
        "image_width": w,
        "image_height": h,
    }


JPEG_RESPONSE = {
    200: {
        "description": "Imagem JPEG com caixas de detecção desenhadas.",
        "content": {
            "image/jpeg": {
                "schema": {"type": "string", "format": "binary"},
            }
        },
    }
}


# =========================
# ENDPOINT JSON
# =========================

@app.post(
    "/predict/json",
    response_model=DetectionResponse,
    tags=["Inference"],
    summary="Predição (JSON)",
)
async def predict_json(
    file: UploadFile = File(...),
    conf: float = Query(default=DEFAULT_CONF, ge=0.0, le=1.0),
    iou: float = Query(default=DEFAULT_IOU, ge=0.0, le=1.0),
    imgsz: int = Query(default=DEFAULT_IMGSZ, ge=32, le=4096),
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    results = _run_predict(image, conf=conf, iou=iou, imgsz=imgsz)
    data = _detections_from_result(results[0])

    return DetectionResponse.model_validate(data)


# =========================
# ENDPOINT IMAGEM + HEADER
# =========================

@app.post(
    "/predict",
    response_class=Response,
    responses=JPEG_RESPONSE,
    tags=["Inference"],
    summary="Predição (imagem JPEG + header com contagem)",
)
async def predict(
    file: UploadFile = File(...),
    conf: float = Query(default=DEFAULT_CONF, ge=0.0, le=1.0),
    iou: float = Query(default=DEFAULT_IOU, ge=0.0, le=1.0),
    imgsz: int = Query(default=DEFAULT_IMGSZ, ge=32, le=4096),
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    results = _run_predict(image, conf=conf, iou=iou, imgsz=imgsz)
    result = results[0]

    data = _detections_from_result(result)
    total = data["total_detections"]

    plotted = result.plot(labels=False)
    _, img_encoded = cv2.imencode(".jpg", plotted)

    return Response(
        content=img_encoded.tobytes(),
        media_type="image/jpeg",
        headers={
            "X-Detections-Count": str(total)
        },
    )


# =========================
# ENTRYPOINT
# =========================

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
    )
