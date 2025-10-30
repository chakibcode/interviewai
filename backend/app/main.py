from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, PlainTextResponse
from pydantic import BaseModel
import os
import io
import base64
from pathlib import Path
from pdf2image import convert_from_bytes
from PIL import Image
from .text_extractor import PDFTextExtractor
from .openai_extractor import OpenAIExtractor
from .google_drive import get_drive_service, upload_pdf_to_drive, get_drive_service_oauth
from .config import (
    GOOGLE_SERVICE_ACCOUNT_FILE,
    GOOGLE_DRIVE_FOLDER_ID,
    GOOGLE_OAUTH_CLIENT_FILE,
    GOOGLE_OAUTH_TOKEN_FILE,
    get_supabase_client,
    SUPABASE_BUCKET_CVS,
    SUPABASE_BUCKET_DOCS,
    SUPABASE_BUCKET_PROFILE_PHOTOS,
    ALLOWED_UPLOAD_MIME_TYPES,
    MAX_UPLOAD_MB,
    get_s3_client_from_supabase_env,
    SUPABASE_CVS_TABLE,
    OPENAI_MODEL,
)

app = FastAPI(title="InterviewAI Backend", version="0.1.0")

# Allow local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://localhost:8083",
        "http://127.0.0.1:8083",
        "http://localhost:8084",
        "http://127.0.0.1:8084",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

# Serve uploaded files for preview
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")
class Profile(BaseModel):
    user_id: str
    email: str | None = None
    full_name: str | None = None
    plan: str | None = "free"

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/health/openai")
async def health_openai():
    """Quick check that OpenAI key and model are usable.
    Parses a tiny resume-like string and returns status without storing anything.
    """
    try:
      ai = OpenAIExtractor()
      sample_text = (
        "John Doe, email john@example.com, phone +1 234 567 8901, "
        "San Francisco, github.com/johndoe, skills: Python, FastAPI"
      )
      res = ai.extract_profile_from_text(sample_text)
      ok = isinstance(res, dict) and all(k in res for k in [
        "full_name", "email", "phone", "location", "links", "skills", "education", "experience"
      ])
      return {"status": "ok" if ok else "error", "has_key": bool(ai.api_key), "result": res}
    except Exception as e:
      raise HTTPException(status_code=500, detail=f"OpenAI test failed: {e}")

# (moved) /openai/parse_cv endpoint defined later after ParseTextRequest

@app.get("/profile/me")
async def get_profile(user_id: str):
    # Placeholder: in production, validate JWT and fetch from DB
    return {
        "user_id": user_id,
        "email": None,
        "full_name": None,
        "plan": "free",
    }

@app.post("/cv/upload")
async def upload_cv(user_id: str = Form(...), file: UploadFile = File(...)):
  if file.content_type != "application/pdf":
    raise HTTPException(status_code=400, detail="Only PDF files are accepted")
  # Limit size to ~10MB by streaming chunks
  original_filename = file.filename or "cv.pdf"
  name_stem = Path(original_filename).stem
  safe_name = "".join(c for c in name_stem if c.isalnum() or c in ("-", "_")).strip() or "cv"
  dest_dir = UPLOAD_ROOT / user_id / safe_name
  dest_dir.mkdir(parents=True, exist_ok=True)
  dest_path = dest_dir / "cv.pdf"

  try:
    with dest_path.open("wb") as f:
      while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
          break
        f.write(chunk)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

  # Prepare DB insert (no extraction here)
  import uuid
  cv_id = str(uuid.uuid4())
  # Construct a local static URL for the uploaded PDF to satisfy potential NOT NULL constraints
  public_pdf_url = f"http://localhost:8001/uploads/{user_id}/{safe_name}/cv.pdf"
  record = {
    "cv_id": cv_id,
    "user_id": user_id,
    "source_filename": original_filename,
    "pdf_storage_path": str(dest_path),
    "original_pdf_url": public_pdf_url,
    "cv_image_path": None,
    "text_extracted": None,
    "raw_extracted": {},
    "filtered_extracted": {},
    "skills": [],
    "education": [],
    "experiences": [],
    "languages": [],
    "authors": [],
    "status": "uploaded",
    "parse_model": None,
    "parse_confidence": None,
  }

  # Insert into Supabase 'cvs' table (best-effort)
  try:
    supa = get_supabase_client()
    _ = supa.table(SUPABASE_CVS_TABLE).insert(record).execute()
    print(f"✅ Successfully inserted CV record with cv_id: {cv_id}")
  except Exception as e:
    # Don't block the flow if DB insert fails; still return file info
    print(f"❌ Failed to insert CV record: {e}")
    print(f"Record data: {record}")
    

  # Return only identifiers; extraction is a separate endpoint
  return {"user_id": user_id, "cv_id": cv_id, "pdf_storage_path": str(dest_path), "original_pdf_url": public_pdf_url}

# Dedicated extraction endpoint
class ExtractRequest(BaseModel):
  user_id: str
  cv_id: str
  pdf_path: str | None = None
  pdf_url: str | None = None

# Simple path-only request for direct text extraction
class ExtractPathRequest(BaseModel):
  pdf_path: str

class UpdateExtractionRequest(BaseModel):
  user_id: str
  cv_id: str
  extraction: dict

class ParseTextRequest(BaseModel):
  text: str
  user_id: str | None = None

@app.post("/openai/parse_cv")
async def parse_cv_openai(req: ParseTextRequest):
  """Parse raw resume text with OpenAI and return a fixed schema.
  Accepts JSON body: { "text": string }
  Returns keys: full_name, email, phone, location, links, skills, education, experience.
  """
  try:
    text = (req.text or "").strip()
    default_schema = {
      "full_name": None,
      "email": None,
      "phone": None,
      "location": None,
      "links": [],
      "skills": [],
      "education": [],
      "experience": [],
    }
    if not text:
      return default_schema

    ai = OpenAIExtractor()
    result = default_schema.copy()
    try:
      extracted = ai.extract_profile_from_text(text)
      if isinstance(extracted, dict):
        for k in result.keys():
          if k in extracted:
            result[k] = extracted[k]
    except Exception as e:
      msg = str(e)
      if "OpenAI API error: 401" in msg or ("401" in msg and "OpenAI" in msg):
        # Surface an authentication error directly to the client
        raise HTTPException(status_code=401, detail="Invalid OpenAI API key or insufficient permissions. Set OPENAI_API_KEY and restart the backend.")
      # Fallback: return default schema on parse errors
      print(f"Warning: OpenAI parse failed, falling back to default schema: {e}")

    # Optionally save to uploads/<user_id>/info.json when user_id is provided
    try:
      if req.user_id:
        user_dir = UPLOAD_ROOT / str(req.user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        info_path = user_dir / "info.json"
        import json as _json
        with info_path.open("w", encoding="utf-8") as f:
          _json.dump(result, f, ensure_ascii=False, indent=2)
    except Exception as _e:
      # Do not fail the request if saving to file has issues
      print(f"Warning: failed to save parsed result for user {req.user_id}: {_e}")

    return result
  except Exception as e:
    # Unexpected non-OpenAI errors (e.g., request deserialization). Keep as 500.
    raise HTTPException(status_code=500, detail=f"OpenAI parse failed: {e}")

# Alias route to match frontend naming preference: /openai/parse
@app.post("/openai/parse")
async def parse_openai(req: ParseTextRequest):
  # Delegate to the existing implementation
  return await parse_cv_openai(req)

@app.post("/cv/extract")
async def extract_cv(file: UploadFile = File(...)):
  """
  Accept a PDF file upload and return extracted text as plain text.
  Body: multipart/form-data with field name 'file' containing the PDF.
  Response: text/plain containing the extracted text.
  """
  try:
    if not file:
      raise HTTPException(status_code=400, detail="Missing file upload")
    if str(file.content_type).lower() != "application/pdf":
      raise HTTPException(status_code=400, detail="Only application/pdf is supported")

    # Persist to a temporary file for the extractor (which expects a path)
    from uuid import uuid4
    tmp_dir = UPLOAD_ROOT / "temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"tmp_extract_{uuid4()}.pdf"

    data = await file.read()
    if not data:
      raise HTTPException(status_code=400, detail="Uploaded file is empty")
    with open(tmp_path, "wb") as f:
      f.write(data)

    try:
      extractor = PDFTextExtractor(ocr_pages=5, ocr_zoom=2.5)
      plain_text = extractor.extract_text(str(tmp_path))
    except Exception as e:
      raise HTTPException(status_code=500, detail=f"Text extraction failed: {e}")
    finally:
      # Best-effort cleanup
      try:
        if tmp_path.exists():
          tmp_path.unlink()
      except Exception:
        pass

    return PlainTextResponse(content=(plain_text or ""))
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


@app.post("/cv/extract-openai")
async def extract_cv_openai(req: ExtractRequest):
  try:
    supa = get_supabase_client()
    # Fetch record to get stored PDF path when IDs are valid UUIDs
    rows = []
    try:
      from uuid import UUID
      UUID(str(req.user_id))
      UUID(str(req.cv_id))
      res = supa.table(SUPABASE_CVS_TABLE).select("cv_id,user_id,pdf_storage_path").eq("cv_id", req.cv_id).eq("user_id", req.user_id).execute()
      rows = getattr(res, "data", []) if hasattr(res, "data") else (res.get("data") if isinstance(res, dict) else [])
    except Exception:
      rows = []

    pdf_path = None
    if rows:
      row0 = rows[0] if isinstance(rows[0], dict) else rows[0]
      pdf_path = row0.get("pdf_storage_path") if isinstance(row0, dict) else row0["pdf_storage_path"]
    # Fallback: use provided pdf_path when DB lookup fails or field missing
    if not pdf_path and req.pdf_path:
      pdf_path = req.pdf_path
    # Additional fallback: derive local path from pdf_url
    if (not pdf_path or not Path(str(pdf_path)).exists()) and req.pdf_url:
      try:
        from urllib.parse import urlparse
        parsed = urlparse(req.pdf_url)
        url_path = parsed.path or ""
        if url_path.startswith("/uploads/"):
          rel = url_path[len("/uploads/"):]
          derived = UPLOAD_ROOT / rel
          if derived.exists():
            pdf_path = str(derived)
      except Exception:
        pass
    if not pdf_path or not Path(str(pdf_path)).exists():
      raise HTTPException(status_code=404, detail="Stored PDF not found on server")

    # Extract plain text for verification and DB storage
    try:
      extractor = PDFTextExtractor(ocr_pages=5, ocr_zoom=2.5)
      plain_text = extractor.extract_text(pdf_path)
    except Exception:
      plain_text = ""

    # Run OpenAI extraction (prefer text to avoid re-reading PDF)
    try:
      ai = OpenAIExtractor()
      extracted = ai.extract_profile_from_text(plain_text) if plain_text else ai.extract_profile_from_pdf(pdf_path)
    except Exception as e:
      msg = str(e)
      if "OpenAI API error: 401" in msg or ("401" in msg and "OpenAI" in msg):
        raise HTTPException(status_code=401, detail="Invalid OpenAI API key or insufficient permissions. Set OPENAI_API_KEY and restart the backend.")
      raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    # Prepare filtered and derived fields
    try:
      filtered = {k: v for k, v in (extracted or {}).items() if v not in (None, [], "", {})}
    except Exception:
      filtered = {}

    update_payload = {
      "raw_extracted": extracted or {},
      "filtered_extracted": filtered,
      "skills": (extracted or {}).get("skills", []),
      "education": (extracted or {}).get("education", []),
      "experiences": (extracted or {}).get("experience", []),
      "languages": (extracted or {}).get("languages", []),
      "authors": (extracted or {}).get("authors", []),
      "text_extracted": plain_text,
      "status": "parsed",
      "parse_model": OPENAI_MODEL,
    }

    # Generate thumbnail from first page, upload to Supabase Storage, and add to payload
    thumbnail_url = None
    try:
      with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
      images = convert_from_bytes(pdf_bytes, fmt="jpeg")
      if images:
        first_page = images[0]
        buf = io.BytesIO()
        first_page.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        key = f"{req.user_id}/{req.cv_id}/thumb.jpg"
        s3 = get_s3_client_from_supabase_env()
        s3.put_object(Bucket=SUPABASE_BUCKET_CVS, Key=key, Body=buf.getvalue(), ContentType="image/jpeg")
        thumbnail_url = s3.generate_presigned_url("get_object", Params={"Bucket": SUPABASE_BUCKET_CVS, "Key": key}, ExpiresIn=3600)
        update_payload["cv_image_path"] = key
    except Exception as e:
      print(f"❌ Thumbnail generation/upload failed: {e}")

    # Update record in Supabase (best-effort)
    try:
      _ = supa.table(SUPABASE_CVS_TABLE).update(update_payload).eq("cv_id", req.cv_id).execute()
      print(f"✅ Updated CV record with extracted data (OpenAI): {req.cv_id}")
    except Exception as e:
      print(f"❌ Failed to update CV record after extraction (OpenAI): {e}")
      print(f"Update payload: {update_payload}")

    # Also update profiles table to reference this cv_id (best-effort)
    try:
      _ = supa.table("profiles").update({"cv_id": req.cv_id}).eq("user_id", req.user_id).execute()
      print(f"✅ Updated profile with cv_id for user: {req.user_id}")
    except Exception as e:
      print(f"❌ Failed to update profile cv_id: {e}")

    # Delete local PDF now that processing is complete (best-effort)
    try:
      p = Path(str(pdf_path))
      if p.exists():
        p.unlink()
        print(f"🧹 Deleted local PDF: {p}")
    except Exception as e:
      print(f"⚠️ Failed to delete local PDF: {e}")

    return {
      "user_id": req.user_id,
      "cv_id": req.cv_id,
      "extracted_raw": extracted or {},
      "extracted_data": filtered,
      "text_extracted": plain_text,
      "thumbnail_url": thumbnail_url,
    }
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

# Supabase Storage health
@app.get("/storage/supabase/health")
async def supabase_health():
    try:
        supa = get_supabase_client()
        # List buckets as a simple health check (requires service role)
        buckets = supa.storage.list_buckets()
        bucket_names = [b.get("name") if isinstance(b, dict) else getattr(b, "name", None) for b in getattr(buckets, "data", buckets or [])]
        return {"status": "ok", "buckets": bucket_names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase storage health check failed: {e}")




# Profile photo upload to Supabase
@app.post("/profile/photo/upload_s3")
async def photo_upload_s3(user_id: str = Form(...), file: UploadFile = File(...)):
    ct = file.content_type
    if ct not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=415, detail=f"Unsupported image type: {ct}")

    data = await file.read()
    size_mb = len(data) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(status_code=413, detail=f"File too large: {size_mb:.2f}MB > {MAX_UPLOAD_MB}MB")

    import time
    key = f"{user_id}/{int(time.time())}-{file.filename or 'avatar'}"

    try:
        s3 = get_s3_client_from_supabase_env()
        s3.put_object(Bucket=SUPABASE_BUCKET_PROFILE_PHOTOS, Key=key, Body=data, ContentType=ct)
        url = s3.generate_presigned_url("get_object", Params={"Bucket": SUPABASE_BUCKET_PROFILE_PHOTOS, "Key": key}, ExpiresIn=3600)
        return {
            "status": "uploaded",
            "bucket": SUPABASE_BUCKET_PROFILE_PHOTOS,
            "key": key,
            "content_type": ct,
            "presigned_url": url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {e}")


@app.post("/cv/convert-to-image")
async def convert_pdf_to_image(
    file: UploadFile = File(...),
    page: int = 1,
    width: int = 300,
    height: int = 400,
    format: str = "PNG"
):
    """
    Convert a PDF file to an image.
    
    Args:
        file: PDF file to convert
        page: Page number to convert (default: 1, first page)
        width: Output image width in pixels (default: 300)
        height: Output image height in pixels (default: 400)
        format: Output format - PNG, JPEG, or WEBP (default: PNG)
    
    Returns:
        Image file as response
    """
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Validate format
    format = format.upper()
    if format not in ["PNG", "JPEG", "WEBP"]:
        raise HTTPException(status_code=400, detail="Format must be PNG, JPEG, or WEBP")
    
    try:
        # Read PDF content
        pdf_content = await file.read()
        
        # Convert PDF to images (first page only by default)
        images = convert_from_bytes(
            pdf_content,
            first_page=page,
            last_page=page,
            dpi=200  # High quality
        )
        
        if not images:
            raise HTTPException(status_code=400, detail="Could not convert PDF to image")
        
        # Get the first (and only) page
        image = images[0]
        
        # Resize image to specified dimensions
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        
        # Convert to RGB if saving as JPEG (JPEG doesn't support transparency)
        if format == "JPEG" and image.mode in ("RGBA", "LA", "P"):
            # Create white background
            background = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "P":
                image = image.convert("RGBA")
            background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
            image = background
        
        # Save image to bytes
        img_buffer = io.BytesIO()
        image.save(img_buffer, format=format, quality=95 if format == "JPEG" else None)
        img_buffer.seek(0)
        
        # Determine content type
        content_type_map = {
            "PNG": "image/png",
            "JPEG": "image/jpeg", 
            "WEBP": "image/webp"
        }
        
        return Response(
            content=img_buffer.getvalue(),
            media_type=content_type_map[format],
            headers={
                "Content-Disposition": f"inline; filename=cv_page_{page}.{format.lower()}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF conversion failed: {str(e)}")


# Run with: uvicorn app.main:main --reload