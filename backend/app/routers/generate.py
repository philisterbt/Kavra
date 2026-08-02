import io
from fastapi import APIRouter, File, UploadFile, HTTPException
from pypdf import PdfReader
from app.schemas.generate import SimulationGenerateRequest, SimulationGenerateResponse
from app.services.wiro_ai import wiro_ai_service

router = APIRouter()


@router.post("/simulate", response_model=SimulationGenerateResponse)
async def generate_simulation(req: SimulationGenerateRequest):
    """
    Core 'Simüle Et' endpoint. Takes a student prompt/topic and output_type.
    If output_type == '3d', executes Wiro AI 3D Pipeline (nano-banana-2 -> trellis-2).
    Otherwise, enriches via Gemini 3.1 Pro & generates code via GPT-5.6 Sol.
    """
    if req.output_type == "3d":
        res = await wiro_ai_service.generate_3d_pipeline(req.topic)
    else:
        enriched = await wiro_ai_service.enrich_prompt(req.topic)
        res = await wiro_ai_service.generate_simulation_code(enriched)

    return SimulationGenerateResponse(
        status="success",
        topic=req.topic,
        content_type=res["content_type"],
        html_code=res["html_code"],
        validation_status=res["validation_status"]
    )


@router.post("/generate-3d")
async def generate_3d_model(req: SimulationGenerateRequest):
    """
    Dedicated 3D Generation Endpoint.
    1. Text-to-Image via google/nano-banana-2
    2. Image-to-3D via microsoft/trellis-2
    Returns interactive 3D GLB model and HTML viewer.
    """
    res = await wiro_ai_service.generate_3d_pipeline(req.topic)
    return {
        "status": "success",
        "topic": req.topic,
        "content_type": "3d",
        "image_url": res.get("image_url"),
        "model_3d_url": res.get("model_3d_url"),
        "html_code": res["html_code"],
        "validation_status": "approved"
    }


@router.post("/parse-pdf")
async def parse_pdf_and_extract_topics(file: UploadFile = File(...)):
    """
    Instantly extracts text from uploaded PDF lecture note and detects 2-4 sub-topics.
    Does NOT generate simulation immediately, allowing instant note saving.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir PDF dosyası yükleyin.")

    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)

        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        if not extracted_text.strip():
            extracted_text = f"Ders Notu Dosyası: {file.filename}"

        filename_clean = file.filename.replace(".pdf", "").replace("_", " ").replace("-", " ")
        subtopics = await wiro_ai_service.extract_subtopics(f"{filename_clean}\n{extracted_text}")

        return {
            "status": "success",
            "filename": file.filename,
            "topic": filename_clean,
            "extracted_text_preview": extracted_text[:400],
            "topics": subtopics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF okuma veya konu çıkarma hatası: {str(e)}")

