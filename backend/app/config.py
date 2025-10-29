import os
from pathlib import Path

# Load environment variables from root .env if present
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

# Path to Google service account JSON key file
DEFAULT_GOOGLE_JSON = str(Path(__file__).resolve().parent / "google.json")
GOOGLE_SERVICE_ACCOUNT_FILE = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE", DEFAULT_GOOGLE_JSON)

# Optional: Drive folder ID to upload into. Leave empty to use root or
# set to a Shared Drive folder ID that the service account can access.
GOOGLE_DRIVE_FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "1o0lSF6e8QGrqybCldK0YMIfcEnjxkPb4")

# Maximum upload size safeguard (in MB)
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "2"))

# Allow non-CV PDFs to be uploaded (otherwise returns 422)
ALLOW_NON_CV = os.environ.get("ALLOW_NON_CV", "true").lower() == "true"

# Optional OAuth 2.0 configuration for Drive uploads when service accounts lack quota
GOOGLE_OAUTH_CLIENT_FILE = os.environ.get("GOOGLE_OAUTH_CLIENT_FILE", str(Path(__file__).resolve().parent / "google.json"))
GOOGLE_OAUTH_TOKEN_FILE = os.environ.get("GOOGLE_OAUTH_TOKEN_FILE", str(Path(__file__).resolve().parent / "token.json"))

# Frontend-provided Supabase envs as fallbacks
VITE_SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL","https://rwgurwnglnxihjswjute.supabase.co")
VITE_SUPABASE_PUBLISHABLE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
VITE_SUPABASE_PROJECT_ID = os.environ.get("VITE_SUPABASE_PROJECT_ID","rwgurwnglnxihjswjute")

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", VITE_SUPABASE_URL or "")
# Prefer service role key for backend inserts; fallback to anon key or frontend publishable key
SUPABASE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.environ.get("SUPABASE_ANON_KEY", VITE_SUPABASE_PUBLISHABLE_KEY or "")
)
SUPABASE_UPLOADS_TABLE = os.environ.get("SUPABASE_UPLOADS_TABLE", "cv_uploads")
SUPABASE_ANALYSIS_TABLE = os.environ.get("SUPABASE_ANALYSIS_TABLE", "analysis_sections")
SUPABASE_CVS_TABLE = os.environ.get("SUPABASE_CVS_TABLE", "cvs")
# Supabase Storage buckets (private buckets recommended)
SUPABASE_BUCKET_CVS = os.environ.get("SUPABASE_BUCKET_CVS", "cv2interviewBucket")
SUPABASE_BUCKET_DOCS = os.environ.get("SUPABASE_BUCKET_DOCS", "documents")
SUPABASE_BUCKET_PROFILE_PHOTOS = os.environ.get("SUPABASE_BUCKET_PROFILE_PHOTOS", "cv2interviewBucket")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3Vyd25nbG54aWhqc3dqdXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxOTMxNiwiZXhwIjoyMDc2ODk1MzE2fQ.jACshANvH_JGZquqMUqNFNT-pIAe5rZqQbjtCEmm08U")

# Optional: S3-compatible upload via env-provided endpoint/keys
SUPABASE_ENDPOINT = os.environ.get(
    "SUPABASE_ENDPOINT","https://rwgurwnglnxihjswjute.storage.supabase.co/storage/v1/s3")
ACCESS_KEY_ID = os.environ.get("ACCESS_KEY_ID", "55690d7de5c182a3461137ba9b0c00eb")
# Support the provided variable name (typo preserved intentionally)
SERCET_ACCESS_KEY = os.environ.get("SERCET_ACCESS_KEY", "7469fb507a3bb029a0149da978c050c81a8cadc0ecc52c357ea8b63dbbfa368e")

def get_s3_client_from_supabase_env():
    if not SUPABASE_ENDPOINT or not ACCESS_KEY_ID or not SERCET_ACCESS_KEY:
        raise RuntimeError("Missing SUPABASE_ENDPOINT, ACCESS_KEY_ID or SERCET_ACCESS_KEY")
    import boto3  # imported lazily to avoid dependency unless used
    return boto3.client(
        "s3",
        endpoint_url=SUPABASE_ENDPOINT,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SERCET_ACCESS_KEY,
    )
# OpenAI configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "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")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

# Mistral configuration (use standard env var names)
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
MISTRAL_MODEL = os.environ.get("MISTRAL_MODEL", "mistral-large-latest")

# Allowed upload MIME types for documents and profile photos
ALLOWED_UPLOAD_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}

# Supabase client helper (lazy import to avoid import-time failures)

def get_supabase_client():
    if not SUPABASE_URL:
        raise RuntimeError("Missing SUPABASE_URL (or VITE_SUPABASE_URL)")
    if not SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE keys (SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY)")
    from supabase import create_client  # type: ignore
    return create_client(SUPABASE_URL, SUPABASE_KEY)
