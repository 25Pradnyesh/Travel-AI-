"""
Data Redaction and Privacy Filter for Travel AI Observability.

Ensures that no API keys, credentials, session tokens, cookies, or raw private
media leak into logs, telemetry traces, or client-facing diagnostics.
"""

import re
from typing import Any
import urllib.parse

# 1. Google API Keys (e.g. AIzaSy...)
_GOOGLE_KEY_PATTERN = re.compile(r"AIza[0-9A-Za-z\-_]{35}")

# 2. Key-value pairs for secrets, passwords, tokens, API keys
_SECRET_KV_PATTERN = re.compile(
    r"(?i)\b(api[_-]?key|access[_-]?token|auth[_-]?token|bearer|secret|password|passwd|pwd)\b\s*[:=]\s*['\"]?([A-Za-z0-9\-._~+/=]{8,})['\"]?"
)

# 3. Instagram Session & Cookie Identifiers
_COOKIE_PATTERN = re.compile(
    r"(?i)\b(sessionid|csrftoken|ds_user_id)\b\s*=\s*['\"]?([A-Za-z0-9%_-]+)['\"]?"
)

# 4. Bearer tokens in headers or log lines
_BEARER_PATTERN = re.compile(
    r"(?i)\bBearer\s+([A-Za-z0-9\-._~+/]+=*)"
)

# 5. Base64 media data URIs
_DATA_URI_PATTERN = re.compile(
    r"data:image/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=]{20,}"
)

# 6. Sensitive URL Query Parameters
_SENSITIVE_QUERY_PARAMS = {
    "key",
    "api_key",
    "apikey",
    "token",
    "access_token",
    "secret",
    "password",
    "pwd",
}


def redact_sensitive_data(text: Any) -> Any:
    """
    Scans a string or recursively scans structured types (dict, list) to redact
    sensitive credentials, API keys, cookies, and tokens.
    """
    if text is None:
        return None

    if isinstance(text, dict):
        return sanitize_dict(text)

    if isinstance(text, list):
        return [redact_sensitive_data(item) for item in text]

    if not isinstance(text, str):
        return text

    s = text

    # Redact Google API keys: keep prefix 'AIza...' then mask
    s = _GOOGLE_KEY_PATTERN.sub("AIza...[REDACTED_API_KEY]", s)

    # Redact Bearer tokens
    s = _BEARER_PATTERN.sub("Bearer [REDACTED_TOKEN]", s)

    # Redact key-value secrets
    s = _SECRET_KV_PATTERN.sub(r"\1=[REDACTED]", s)

    # Redact session cookies
    s = _COOKIE_PATTERN.sub(r"\1=[REDACTED]", s)

    # Redact raw data URIs
    s = _DATA_URI_PATTERN.sub("data:image/...;base64,[REDACTED_MEDIA]", s)

    return s


def sanitize_url(url: str) -> str:
    """
    Removes sensitive query parameters (e.g. ?key=..., ?token=...) from URLs
    while preserving non-sensitive query routing parameters.
    """
    if not url or not isinstance(url, str):
        return ""

    try:
        parsed = urllib.parse.urlsplit(url)
        if not parsed.query:
            return url

        query_params = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        sanitized_params = []
        for k, v in query_params:
            if k.lower() in _SENSITIVE_QUERY_PARAMS:
                sanitized_params.append((k, "[REDACTED]"))
            else:
                sanitized_params.append((k, v))

        new_query = urllib.parse.urlencode(sanitized_params)
        return urllib.parse.urlunsplit(
            (parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment)
        )
    except Exception:
        return redact_sensitive_data(url)


def sanitize_dict(data: dict) -> dict:
    """
    Recursively clones and sanitizes a dictionary, replacing sensitive keys
    and redacting sensitive string contents.
    """
    if not isinstance(data, dict):
        return data

    sanitized = {}
    for k, v in data.items():
        k_str = str(k)
        if any(sec in k_str.lower() for sec in ["api_key", "secret", "password", "token", "cookie"]):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, str):
            sanitized[k] = redact_sensitive_data(v)
        elif isinstance(v, dict):
            sanitized[k] = sanitize_dict(v)
        elif isinstance(v, list):
            sanitized[k] = [
                sanitize_dict(item) if isinstance(item, dict)
                else (redact_sensitive_data(item) if isinstance(item, str) else item)
                for item in v
            ]
        else:
            sanitized[k] = v
    return sanitized
