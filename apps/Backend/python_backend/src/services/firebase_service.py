from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import service_account

from src.core.config import settings


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_CREDENTIALS_PATH = BASE_DIR / "firebase-service-account.json"
FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore"


def _credentials_path() -> Path:
    # Prefer the configured path (from backend/.env via src.core.config).
    return Path(settings.firestore_credentials_path)


@lru_cache(maxsize=1)
def _load_credentials() -> service_account.Credentials:
    credentials_path = _credentials_path()

    if not credentials_path.exists():
        raise FileNotFoundError(
            f"Firebase credentials not found at {credentials_path}. "
            "Set FIREBASE_CREDENTIALS_PATH or place firebase-service-account.json in the python_backend folder."
        )

    return service_account.Credentials.from_service_account_file(
        str(credentials_path),
        scopes=[FIRESTORE_SCOPE],
    )


def _refresh_token() -> str:
    credentials = _load_credentials()
    credentials.refresh(GoogleAuthRequest())

    if not credentials.token:
        raise RuntimeError("Failed to obtain a Firebase access token.")

    return credentials.token


def _project_id() -> str:
    credentials = _load_credentials()
    project_id = credentials.project_id

    if not project_id:
        raise RuntimeError("Project ID not found in Firebase service account credentials.")

    return project_id


def _firestore_base_url() -> str:
    return f"https://firestore.googleapis.com/v1/projects/{_project_id()}/databases/(default)/documents"


def _decode_firestore_value(value: dict[str, Any]) -> Any:
    if "stringValue" in value:
        return value["stringValue"]
    if "integerValue" in value:
        return int(value["integerValue"])
    if "doubleValue" in value:
        return float(value["doubleValue"])
    if "booleanValue" in value:
        return bool(value["booleanValue"])
    if "nullValue" in value:
        return None
    if "timestampValue" in value:
        return value["timestampValue"]
    if "mapValue" in value:
        fields = value["mapValue"].get("fields", {})
        return {key: _decode_firestore_value(inner_value) for key, inner_value in fields.items()}
    if "arrayValue" in value:
        values = value["arrayValue"].get("values", [])
        return [_decode_firestore_value(item) for item in values]
    return value


def _decode_firestore_document(document: dict[str, Any]) -> dict[str, Any]:
    fields = document.get("fields") or {}
    decoded = {key: _decode_firestore_value(value) for key, value in fields.items()}
    decoded["id"] = document.get("name", "").split("/")[-1]
    return decoded


def _authorized_request(url: str) -> dict[str, Any]:
    request = Request(url, headers={"Authorization": f"Bearer {_refresh_token()}"})

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get_collection_documents(collection_name: str) -> list[dict[str, Any]]:
    url = f"{_firestore_base_url()}/{quote(collection_name)}"
    response = _authorized_request(url)
    documents = response.get("documents") or []
    return [_decode_firestore_document(document) for document in documents]


def _encode_firestore_value(value: Any) -> dict[str, Any]:
    """Encode a Python value into a Firestore value dict for writes."""
    if value is None:
        return {"nullValue": None}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, int):
        return {"integerValue": str(value)}
    if isinstance(value, float):
        return {"doubleValue": value}
    if isinstance(value, dict):
        return {
            "mapValue": {
                "fields": {
                    str(key): _encode_firestore_value(inner)
                    for key, inner in value.items()
                }
            }
        }
    if isinstance(value, (list, tuple)):
        return {
            "arrayValue": {
                "values": [_encode_firestore_value(item) for item in value]
            }
        }
    return {"stringValue": str(value)}


def _document_url(collection_name: str, document_id: str) -> str:
    return (
        f"{_firestore_base_url()}/{quote(collection_name)}/{quote(document_id)}"
    )


def create_document(
    collection_name: str, document_id: str, data: dict[str, Any]
) -> dict[str, Any]:
    """Create (or overwrite) a document in Firestore. Returns the stored doc."""
    url = _document_url(collection_name, document_id)
    fields = {str(key): _encode_firestore_value(value) for key, value in data.items()}
    body = json.dumps({"fields": fields}).encode("utf-8")
    request = Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {_refresh_token()}",
            "Content-Type": "application/json",
        },
        method="PATCH",
    )
    with urlopen(request, timeout=30) as response:
        document = json.loads(response.read().decode("utf-8"))
    return _decode_firestore_document(document)


def get_document(collection_name: str, document_id: str) -> dict[str, Any] | None:
    url = f"{_firestore_base_url()}/{quote(collection_name)}/{quote(document_id)}"

    try:
        response = _authorized_request(url)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise

    return _decode_firestore_document(response)