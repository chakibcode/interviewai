import json
import re
from typing import Any, Dict

import requests

from .config import OPENAI_API_KEY, OPENAI_MODEL
from .text_extractor import PDFTextExtractor


RESUME_JSON_SCHEMA: Dict[str, Any] = {
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


class OpenAIExtractor:
    """Extractor that uses OpenAI Chat Completions to structure resume text."""

    API_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self, model: str | None = None, api_key: str | None = None):
        self.model = model or OPENAI_MODEL
        self.api_key = api_key or OPENAI_API_KEY

    def _coerce_to_json_object(self, text: str) -> Dict[str, Any]:
        """Try to parse model response to JSON. If mixed text, extract JSON substring."""
        try:
            return json.loads(text)
        except Exception:
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
        return RESUME_JSON_SCHEMA.copy()

    def extract_profile_from_text(self, resume_text: str) -> Dict[str, Any]:
        """Call OpenAI to structure given resume text into the standard schema."""
        if not resume_text or len(resume_text.strip()) < 10:
            return RESUME_JSON_SCHEMA.copy()
        if not self.api_key:
            # No key configured, return minimal schema
            return RESUME_JSON_SCHEMA.copy()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        user_prompt = (
            "Below is the resume text extracted from the PDF. Extract a clean JSON "
            "object following the specified schema. Return ONLY valid JSON with no comments or markdown.\n\n"
            f"RESUME_TEXT:\n{resume_text}"
        )
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
        resp = requests.post(self.API_URL, headers=headers, json=payload, timeout=90)
        if resp.status_code != 200:
            raise RuntimeError(f"OpenAI API error: {resp.status_code} {resp.text}")
        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except Exception:
            content = json.dumps(RESUME_JSON_SCHEMA)
        return self._coerce_to_json_object(content)

    def extract_profile_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Convenience: extract plain text with PDFTextExtractor, then call OpenAI."""
        text = PDFTextExtractor().extract_text(pdf_path)
        if not text:
            return RESUME_JSON_SCHEMA.copy()
        return self.extract_profile_from_text(text)