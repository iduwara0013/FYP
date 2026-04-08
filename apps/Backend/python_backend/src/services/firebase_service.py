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


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_CREDENTIALS_PATH = BASE_DIR / "firebase-service-account.json"
FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore"


def _credentials_path() -> Path:
    return Path(os.getenv("FIREBASE_CREDENTIALS_PATH", str(DEFAULT_CREDENTIALS_PATH)))


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


def get_document(collection_name: str, document_id: str) -> dict[str, Any] | None:
    url = f"{_firestore_base_url()}/{quote(collection_name)}/{quote(document_id)}"

    try:
        response = _authorized_request(url)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise

    return _decode_firestore_document(response)