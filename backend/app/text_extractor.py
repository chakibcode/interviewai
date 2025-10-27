import typing as t

class PDFTextExtractor:
    """Layered PDF text extractor with graceful fallbacks and optional OCR.

    Order of attempts:
    1) pdfminer.six
    2) PyMuPDF (fitz)
    3) pdfplumber
    4) OCR via PyMuPDF rendering + pytesseract (first N pages)
    """

    def __init__(self, min_length: int = 50, ocr_pages: int = 3, ocr_zoom: float = 2.0):
        self.min_length = min_length
        self.ocr_pages = ocr_pages
        self.ocr_zoom = ocr_zoom

    def extract_text(self, pdf_path: str) -> str:
        text = self._try_pdfminer(pdf_path)
        if self._insufficient(text):
            text = self._try_pymupdf(pdf_path)
        if self._insufficient(text):
            text = self._try_pdfplumber(pdf_path)
        if self._insufficient(text):
            text = self._try_ocr(pdf_path)
        return (text or "").strip()

    def _insufficient(self, text: str | None) -> bool:
        return not text or len(text.strip()) < self.min_length

    def _try_pdfminer(self, pdf_path: str) -> str:
        try:
            from pdfminer.high_level import extract_text  # type: ignore
            return (extract_text(pdf_path) or "").strip()
        except Exception:
            return ""

    def _try_pymupdf(self, pdf_path: str) -> str:
        try:
            import fitz  # type: ignore
            doc = fitz.open(pdf_path)
            parts: list[str] = []
            for page in doc:
                parts.append(page.get_text())
            doc.close()
            return "\n".join(parts).strip()
        except Exception:
            return ""

    def _try_pdfplumber(self, pdf_path: str) -> str:
        try:
            import pdfplumber  # type: ignore
            parts: list[str] = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    parts.append(page.extract_text() or "")
            return "\n".join(parts).strip()
        except Exception:
            return ""

    def _try_ocr(self, pdf_path: str) -> str:
        try:
            import fitz  # type: ignore
            from PIL import Image
            import pytesseract  # type: ignore
            doc = fitz.open(pdf_path)
            parts: list[str] = []
            for i, page in enumerate(doc):
                if i >= self.ocr_pages:
                    break
                mat = fitz.Matrix(self.ocr_zoom, self.ocr_zoom)
                pix = page.get_pixmap(matrix=mat)
                mode = "RGBA" if pix.alpha else "RGB"
                img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
                if img.mode == "RGBA":
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[-1])
                    img = bg
                parts.append(pytesseract.image_to_string(img))
            doc.close()
            return "\n".join(parts).strip()
        except Exception:
            return ""