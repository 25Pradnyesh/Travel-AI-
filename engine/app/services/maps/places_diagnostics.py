import json
import logging
import re
from typing import Any

import requests

logger = logging.getLogger(__name__)


def sanitize_secret(text: Any, secret: str | None = None) -> str:
    """
    Sanitizes secrets, API keys, and sensitive tokens from log messages or response dumps.
    Never exposes raw API keys in application logs.
    """
    if text is None:
        return ""

    if not isinstance(text, str):
        try:
            text = json.dumps(text, default=str)
        except Exception:
            text = str(text)

    # Redact explicit secret if provided
    if secret and len(secret) > 4:
        text = text.replace(secret, "[REDACTED_API_KEY]")

    # Redact Google API key pattern (AIzaSy...)
    text = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_API_KEY]", text)

    # Redact Authorization header values / Bearer tokens
    text = re.sub(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*", r"\1[REDACTED_TOKEN]", text, flags=re.IGNORECASE)
    text = re.sub(r"(X-Goog-Api-Key[\"']?\s*:\s*[\"']?)[^\"',\s]+", r"\1[REDACTED_API_KEY]", text, flags=re.IGNORECASE)

    return text


def parse_google_places_error_response(response: requests.Response, secret: str | None = None) -> dict:
    """
    Parses Google Places API error responses safely and categorizes root causes.
    Distinguishes:
    - Billing / permission denied
    - Disabled APIs
    - Invalid credentials
    - API key restrictions (IP, referrer, Android app)
    - Quota / rate limits
    - Malformed requests
    """
    status_code = getattr(response, "status_code", 0)
    google_code = None
    google_status = None
    google_message = None
    google_details = []
    raw_snippet = ""

    # 1. Parse JSON error structure
    try:
        data = response.json()
        if isinstance(data, dict):
            # Format A: Places API (New) / Cloud APIs -> {"error": {"code": 403, "message": "...", "status": "PERMISSION_DENIED", "details": [...]}}
            err_obj = data.get("error")
            if isinstance(err_obj, dict):
                google_code = err_obj.get("code")
                google_message = err_obj.get("message")
                google_status = err_obj.get("status")
                raw_details = err_obj.get("details")
                if isinstance(raw_details, list):
                    google_details = raw_details
            # Format B: Legacy Places API -> {"error_message": "...", "status": "REQUEST_DENIED"}
            elif "error_message" in data or "status" in data:
                google_message = data.get("error_message")
                google_status = data.get("status")
                google_code = status_code
    except Exception:
        pass

    # 2. Extract sanitized snippet of response text
    try:
        raw_val = getattr(response, "text", "")
        raw_text = raw_val if isinstance(raw_val, str) else ""
        raw_snippet = sanitize_secret(raw_text[:600], secret) if raw_text else ""
    except Exception:
        raw_snippet = ""

    sanitized_message = sanitize_secret(google_message, secret) if isinstance(google_message, str) else ""
    sanitized_status = sanitize_secret(google_status, secret) if isinstance(google_status, str) else ""

    # 3. Categorize Root Cause
    combined_diag_text = (
        f"{sanitized_message} {sanitized_status} {raw_snippet} "
        f"{json.dumps(google_details, default=str)}"
    ).lower()

    diagnostic_category = "UNKNOWN_ERROR"
    actionable_hint = ""

    if "not been used in project" in combined_diag_text or "is disabled" in combined_diag_text or "accessnotconfigured" in combined_diag_text:
        diagnostic_category = "API_NOT_ENABLED"
        actionable_hint = (
            "The Places API (New) is not enabled in your Google Cloud Project.\n"
            "  -> Enable API: https://console.cloud.google.com/apis/library/places.googleapis.com"
        )
    elif "api key not valid" in combined_diag_text or "invalid_argument" in combined_diag_text or "key_invalid" in combined_diag_text:
        diagnostic_category = "INVALID_CREDENTIALS"
        actionable_hint = (
            "The configured GOOGLE_PLACES_API_KEY is invalid or deleted.\n"
            "  -> Verify your API key at: https://console.cloud.google.com/apis/credentials"
        )
    elif (
        "ip_filter" in combined_diag_text
        or "referer" in combined_diag_text
        or "blocked" in combined_diag_text
        or "api_key_service_blocked" in combined_diag_text
    ):
        diagnostic_category = "API_KEY_RESTRICTIONS"
        actionable_hint = (
            "The API key restriction settings prevent this request.\n"
            "  -> Check API Key restrictions: https://console.cloud.google.com/apis/credentials"
        )
    elif (
        "billing" in combined_diag_text
        or (
            status_code == 403
            and (
                google_status == "PERMISSION_DENIED"
                or "caller does not have permission" in combined_diag_text
            )
        )
    ):
        diagnostic_category = "BILLING_OR_PROJECT_PERMISSION"
        actionable_hint = (
            "Google Cloud returned PERMISSION_DENIED (HTTP 403). Root causes:\n"
            "  1. Billing is NOT enabled or linked to this Google Cloud Project.\n"
            "     Google Maps Platform APIs strictly require an active Billing Account.\n"
            "     -> Enable Billing: https://console.cloud.google.com/billing\n"
            "  2. 'Places API (New)' is not enabled for this project.\n"
            "     -> Enable API: https://console.cloud.google.com/apis/library/places.googleapis.com\n"
            "  3. API Key Application Restrictions:\n"
            "     If the API key is restricted to 'Android apps' (package name + SHA-1 fingerprint),\n"
            "     the backend Python server requests will be rejected with HTTP 403.\n"
            "     -> Check Key Restrictions: https://console.cloud.google.com/apis/credentials"
        )
    elif status_code == 429 or "resource_exhausted" in combined_diag_text or "rate limit" in combined_diag_text or "over_query_limit" in combined_diag_text:
        diagnostic_category = "QUOTA_OR_RATE_LIMIT"
        actionable_hint = (
            "Google Places API quota or rate limit exceeded.\n"
            "  -> Check API quotas: https://console.cloud.google.com/apis/api/places.googleapis.com/quotas"
        )
    elif status_code == 400:
        diagnostic_category = "MALFORMED_REQUEST"
        actionable_hint = "Google Places rejected the request payload or field mask as invalid."

    # 4. Construct descriptive single-line error message preserving expected substrings
    if status_code == 403:
        error_msg = "Google Places API authentication or permission denied (HTTP 403)"
        extra = " - ".join(filter(None, [sanitized_status, sanitized_message]))
        if extra:
            error_msg = f"{error_msg}: {extra}"
    elif status_code == 429:
        error_msg = "Google Places API quota or rate limit exceeded (HTTP 429)"
        if sanitized_message:
            error_msg = f"{error_msg}: {sanitized_message}"
    else:
        error_msg = f"Upstream request failed with status {status_code}"
        if sanitized_message:
            error_msg = f"{error_msg}: {sanitized_message}"

    return {
        "status_code": status_code,
        "google_code": google_code,
        "google_status": sanitized_status or None,
        "google_message": sanitized_message or None,
        "google_details": google_details,
        "diagnostic_category": diagnostic_category,
        "actionable_hint": actionable_hint,
        "raw_snippet": raw_snippet,
        "error_msg": error_msg,
    }


def log_places_diagnostic_error(
    service_name: str,
    response: requests.Response,
    secret: str | None = None,
    service_logger: logging.Logger | None = None,
) -> dict:
    """
    Logs structured, sanitized diagnostics and prints an actionable banner to stdout.
    Returns the parsed diagnostic dictionary.
    """
    diag = parse_google_places_error_response(response, secret)
    active_logger = service_logger or logger

    # Log structured message via standard Python logger
    active_logger.error(
        "[%s] Upstream Google Places HTTP %s | Category: %s | Status: %s | Message: %s",
        service_name,
        diag["status_code"],
        diag["diagnostic_category"],
        diag["google_status"] or "N/A",
        diag["google_message"] or "N/A",
    )

    # Print clear diagnostic banner for developer visibility
    print(f"\n========== GOOGLE PLACES API ERROR [{service_name}] ==========")
    print(f"HTTP Status : {diag['status_code']}")
    print(f"Category    : {diag['diagnostic_category']}")
    print(f"Google Stat : {diag['google_status'] or 'N/A'}")
    print(f"Google Msg  : {diag['google_message'] or 'N/A'}")
    if diag["actionable_hint"]:
        print("\n--- ACTIONABLE DIAGNOSIS & FIX ---")
        print(diag["actionable_hint"])
    if diag["raw_snippet"]:
        print("\n--- SANITIZED RAW RESPONSE ---")
        print(diag["raw_snippet"])
    print("=================================================================\n")

    return diag
