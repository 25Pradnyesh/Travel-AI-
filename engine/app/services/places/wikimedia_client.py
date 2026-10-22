import html
import logging
import os
import re
import urllib.parse
from pathlib import Path
import time
from typing import Any

import requests

from engine.observability.context import get_current_context

logger = logging.getLogger(__name__)


def get_wikimedia_user_agent() -> str:
    """Returns User-Agent for Wikimedia APIs using APP_CONTACT."""
    app_contact = os.getenv("APP_CONTACT", "").strip()
    if not app_contact:
        raise RuntimeError(
            "APP_CONTACT environment variable must be set (e.g. 'contact@yourdomain.com' or "
            "'https://yourdomain.com/contact') to comply with Wikimedia API policies. Never invent one."
        )
    return f"TravelAI/1.0 ({app_contact})"


def is_allowed_license(license_str: str | None) -> bool:
    """
    Accepts ONLY CC0, public domain, CC BY, and CC BY-SA licenses.
    Strictly filters out All Rights Reserved, Fair Use, Non-Commercial (NC), and No-Derivatives (ND).
    """
    if not license_str:
        return False
    clean = license_str.strip().lower().replace("-", " ")

    # Explicit reject: non-commercial or no-derivatives
    if "nc" in clean.split() or "noncommercial" in clean or "nd" in clean.split() or "noderivs" in clean:
        return False
    if "all rights reserved" in clean or "copyright" in clean or "fair use" in clean:
        return False

    # Accept CC0 / Public Domain
    if "cc0" in clean or "public domain" in clean or clean == "pd" or clean.startswith("pd "):
        return True

    # Accept CC BY and CC BY-SA
    if "cc by sa" in clean or "cc by" in clean:
        return True

    return False


def strip_html_tags(text: str | None) -> str:
    """Strips HTML formatting from Wikimedia extmetadata fields (e.g. Artist credits)."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", "", text)
    return html.unescape(clean).strip()


class WikimediaClient:
    """
    Client for Wikipedia REST APIs and Wikimedia Commons ImageInfo / Geosearch.
    Retrieves CC-licensed photography, author attributions, license URLs, and summaries.
    """

    COMMONS_API = "https://commons.wikimedia.org/w/api.php"
    WIKIPEDIA_SUMMARY_URL = "https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"

    # ==================================================
    # Wikipedia REST Summary
    # ==================================================

    def get_wikipedia_summary(self, wikipedia_tag: str) -> dict[str, Any] | None:
        """
        Fetches page summary, extract (editorial summary), and lead image from Wikipedia.
        Tag format: 'en:Lake Como' or 'Lake Como'.
        """
        if not wikipedia_tag:
            return None

        lang = "en"
        title = wikipedia_tag.strip()
        if ":" in title:
            parts = title.split(":", 1)
            if len(parts[0]) <= 3:
                lang = parts[0]
                title = parts[1]

        url = self.WIKIPEDIA_SUMMARY_URL.format(lang=lang, title=urllib.parse.quote(title))
        headers = {"User-Agent": get_wikimedia_user_agent()}

        t_start = time.perf_counter()
        try:
            resp = requests.get(url, headers=headers, timeout=8)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.warning("[WIKIMEDIA] Wikipedia summary failed for '%s': %s", wikipedia_tag, exc)
            return None
        finally:
            dur = time.perf_counter() - t_start
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("wikipedia_summary", dur)

    # ==================================================
    # Wikimedia Commons Imageinfo
    # ==================================================

    def get_image_info(self, file_title: str) -> dict[str, Any] | None:
        """
        Queries Wikimedia Commons imageinfo for URL (~1600px thumb), Artist, License, and source page.
        Validates license against CC whitelist.
        """
        if not file_title:
            return None

        # Clean title
        if not file_title.startswith("File:"):
            file_title = f"File:{file_title}"

        params = {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size",
            "iiurlwidth": "1600",
            "format": "json",
        }
        headers = {"User-Agent": get_wikimedia_user_agent()}

        t_start = time.perf_counter()
        try:
            resp = requests.get(self.COMMONS_API, params=params, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("[WIKIMEDIA] Commons imageinfo failed for '%s': %s", file_title, exc)
            return None
        finally:
            dur = time.perf_counter() - t_start
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("wikimedia_commons", dur)

        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            imageinfo = page.get("imageinfo", [])
            if not imageinfo:
                continue
            info = imageinfo[0]
            extmeta = info.get("extmetadata", {})

            # Extract license and check whitelist
            license_short = extmeta.get("LicenseShortName", {}).get("value", "")
            if not is_allowed_license(license_short):
                logger.info("[WIKIMEDIA] Disallowed license '%s' for '%s'", license_short, file_title)
                return None

            artist_raw = extmeta.get("Artist", {}).get("value", "")
            author = strip_html_tags(artist_raw) or "Wikimedia Commons contributor"
            license_url = extmeta.get("LicenseUrl", {}).get("value", "")
            source_url = info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(file_title)}"

            # Prefer ~1600px width thumbnail
            photo_url = info.get("thumburl") or info.get("url")
            width = info.get("thumbwidth") or info.get("width")
            height = info.get("thumbheight") or info.get("height")

            return {
                "url": photo_url,
                "width": width,
                "height": height,
                "author": author,
                "license": license_short,
                "license_url": license_url,
                "source_url": source_url,
            }

        return None

    # ==================================================
    # Wikimedia Commons Geosearch Fallback
    # ==================================================

    def geosearch_photos(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1500,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Fallback: searches Wikimedia Commons for geotagged images near coordinates.
        Returns only images passing CC whitelist check.
        """
        if latitude is None or longitude is None:
            return []

        params = {
            "action": "query",
            "generator": "geosearch",
            "ggscoord": f"{latitude}|{longitude}",
            "ggsradius": str(radius),
            "ggslimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size",
            "iiurlwidth": "1600",
            "format": "json",
        }
        headers = {"User-Agent": get_wikimedia_user_agent()}

        t_start = time.perf_counter()
        data = {}
        try:
            resp = requests.get(self.COMMONS_API, params=params, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("[WIKIMEDIA] Commons geosearch failed for (%f, %f): %s", latitude, longitude, exc)
            return []
        finally:
            dur = time.perf_counter() - t_start
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("wikimedia_commons", dur)

        pages = data.get("query", {}).get("pages", {})
        photos = []
        for _, page in pages.items():
            imageinfo = page.get("imageinfo", [])
            if not imageinfo:
                continue
            info = imageinfo[0]
            extmeta = info.get("extmetadata", {})

            license_short = extmeta.get("LicenseShortName", {}).get("value", "")
            if not is_allowed_license(license_short):
                continue

            artist_raw = extmeta.get("Artist", {}).get("value", "")
            author = strip_html_tags(artist_raw) or "Wikimedia Commons contributor"
            license_url = extmeta.get("LicenseUrl", {}).get("value", "")
            title = page.get("title", "")
            source_url = info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}"

            photo_url = info.get("thumburl") or info.get("url")
            width = info.get("thumbwidth") or info.get("width")
            height = info.get("thumbheight") or info.get("height")

            if photo_url:
                photos.append({
                    "url": photo_url,
                    "width": width,
                    "height": height,
                    "author": author,
                    "license": license_short,
                    "license_url": license_url,
                    "source_url": source_url,
                })

        return photos

    # ==================================================
    # Unified Photo & Editorial Resolution
    # ==================================================

    def resolve_destination_photos(
        self,
        extratags: dict[str, Any],
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> tuple[list[dict[str, Any]], str | None]:
        """
        Resolves photos and editorial summary:
        1. Checks extratags wikipedia -> summary & lead image -> Commons imageinfo.
        2. Checks extratags wikidata / wikimedia_commons.
        3. Fallback: Commons geosearch near coordinates.
        Returns: (photos, editorial_summary)
        """
        photos: list[dict[str, Any]] = []
        editorial_summary: str | None = None

        wikipedia_tag = extratags.get("wikipedia")
        if wikipedia_tag:
            wiki_summary = self.get_wikipedia_summary(wikipedia_tag)
            if wiki_summary:
                editorial_summary = wiki_summary.get("extract")
                # Try lead image from summary
                lead_img = wiki_summary.get("originalimage", {}) or wiki_summary.get("thumbnail", {})
                lead_source = lead_img.get("source", "")
                if lead_source:
                    # Extract filename from upload.wikimedia.org URL
                    # e.g. https://upload.wikimedia.org/wikipedia/commons/a/ab/Filename.jpg
                    file_name = lead_source.split("/")[-1]
                    # If thumbnail url with width, filename is before the last width part
                    if re.match(r"^\d+px-", file_name):
                        file_name = file_name.split("-", 1)[1]
                    file_name = urllib.parse.unquote(file_name)
                    photo_info = self.get_image_info(file_name)
                    if photo_info:
                        photos.append(photo_info)

        # Check explicit wikimedia_commons tag on OSM node if any
        commons_tag = extratags.get("wikimedia_commons")
        if commons_tag and not photos:
            photo_info = self.get_image_info(commons_tag)
            if photo_info:
                photos.append(photo_info)

        # Fallback to geosearch near coordinates if needed
        if not photos and latitude is not None and longitude is not None:
            geo_photos = self.geosearch_photos(latitude, longitude, radius=1500, limit=4)
            if geo_photos:
                photos.extend(geo_photos)

        return photos, editorial_summary
