import os
import re
import json
import base64
from typing import Any, Dict
import requests
from .config import MISTRAL_MODEL, MISTRAL_API_KEY
from .text_extractor import PDFTextExtractor

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

RESUME_JSON_SCHEMA = {
    "full_name": None,
    "email": None,
    "phone": None,
    "location": None,
    "links": [],
    "skills": [],
    "education": [],
    "experience": [],
}

SYSTEM_PROMPT = (
    "You are an expert resume parser. Extract a clean JSON object with these keys: "
    "full_name, email, phone, location, links (array of strings), skills (array of strings), "
    "education (array of {institution, degree, start_date, end_date}), "
    "experience (array of {company, role, start_date, end_date, summary}). "
    "Return ONLY valid JSON with no comments or markdown."
)


def _coerce_to_json_object(text: str) -> Dict[str, Any]:
    """Try to parse model response to JSON. If mixed text, extract JSON substring."""
    try:
        return json.loads(text)
    except Exception:
        # Try find JSON object with regex
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
    # Fallback minimal schema
    return RESUME_JSON_SCHEMA.copy()


def _read_pdf_base64(path: str, max_bytes: int = 2_000_000) -> str:
    """Read PDF file and return base64 string, capped to max_bytes before encoding."""
    with open(path, "rb") as f:
        data = f.read(max_bytes)
    return base64.b64encode(data).decode("ascii")


def extract_profile_via_mistral_from_pdf(pdf_path: str) -> Dict[str, Any]:
    if not MISTRAL_API_KEY:
        return {
            **RESUME_JSON_SCHEMA,
            "full_name": None,
            "email": None,
            "skills": [],
        }

    # Use dedicated extractor class
    extractor = PDFTextExtractor()
    resume_text = extractor.extract_text(pdf_path)
    if not resume_text:
        return RESUME_JSON_SCHEMA.copy()

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }
    user_prompt = (
        "Below is the resume text extracted from the PDF. Extract a clean JSON "
        "object following the specified schema. Return ONLY valid JSON with no comments or markdown.\n\n"
        f"RESUME_TEXT:\n{resume_text}"
    )
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    resp = requests.post(MISTRAL_API_URL, headers=headers, json=payload, timeout=90)
    if resp.status_code != 200:
        raise RuntimeError(f"Mistral API error: {resp.status_code} {resp.text}")
    data = resp.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except Exception:
        content = json.dumps(RESUME_JSON_SCHEMA)
    return _coerce_to_json_object(content)