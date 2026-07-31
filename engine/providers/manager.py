from urllib.parse import urlparse

from engine.providers.instagram.provider import (
    InstagramYtDlpProvider,
)


class ProviderManager:

    def __init__(self):

        self.providers = {

            "instagram": InstagramYtDlpProvider(),

        }

    # ==================================================
    # Detect Platform
    # ==================================================

    def detect_platform(
        self,
        url: str,
    ):

        host = urlparse(
            url,
        ).netloc.lower()

        if "instagram.com" in host:
            return "instagram"

        raise ValueError(
            f"Unsupported platform: {host}"
        )

    # ==================================================
    # Get Provider
    # ==================================================

    def get_provider(
        self,
        platform: str,
    ):

        provider = self.providers.get(
            platform,
        )

        if provider is None:

            raise ValueError(
                f"No provider registered for '{platform}'"
            )

        return provider

    # ==================================================
    # Extract
    # ==================================================

    def extract(
        self,
        url: str,
    ):

        platform = self.detect_platform(
            url,
        )

        provider = self.get_provider(
            platform,
        )

        result = provider.extract(
            url,
        )

        if not isinstance(
            result,
            dict,
        ):

            raise RuntimeError(
                "Provider returned invalid response."
            )

        result.setdefault(
            "platform",
            platform,
        )

        result.setdefault(
            "provider",
            provider.__class__.__name__,
        )

        result.setdefault(
            "success",
            True,
        )

        return result