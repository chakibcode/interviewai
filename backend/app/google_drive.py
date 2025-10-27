from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.service_account import Credentials
from google.oauth2.credentials import Credentials as UserCredentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
]


def get_drive_service(credentials_file: str):
    """Create a Drive service using a service account key file."""
    creds = Credentials.from_service_account_file(credentials_file, scopes=SCOPES)
    service = build("drive", "v3", credentials=creds)
    return service


def get_drive_service_oauth(client_secrets_file: str, token_file: str):
    """Create a Drive service using OAuth user credentials.

    If a token file exists, it will be used; otherwise an interactive browser
    flow will run to obtain consent and generate the token file.
    """
    creds = None
    if os.path.exists(token_file):
        creds = UserCredentials.from_authorized_user_file(token_file, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and getattr(creds, "refresh_token", None):
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file, "w") as token:
            token.write(creds.to_json())

    service = build("drive", "v3", credentials=creds)
    return service


def upload_pdf_to_drive(service, file_path: str, filename: str, folder_id: str | None = None) -> str:
    """Upload a PDF to Google Drive. Returns the file ID."""
    metadata: dict[str, object] = {"name": filename}
    if folder_id:
        metadata["parents"] = [folder_id]

    media = MediaFileUpload(file_path, mimetype="application/pdf", resumable=False)
    created = (
        service.files()
        .create(body=metadata, media_body=media, fields="id", supportsAllDrives=True)
        .execute()
    )
    return created.get("id")