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
    # Wikidata P18 Image Lookup
    # ==================================================

    def get_wikidata_p18_image(self, wikidata_id: str) -> dict[str, Any] | None:
        """
        Tier 2: Queries Wikidata entity for P18 (image) property and retrieves Commons photo info.
        """
        if not wikidata_id or not re.match(r"^Q\d+$", wikidata_id.strip()):
            return None

        clean_id = wikidata_id.strip()
        url = f"https://www.wikidata.org/wiki/Special:EntityData/{clean_id}.json"
        headers = {"User-Agent": get_wikimedia_user_agent()}

        t_start = time.perf_counter()
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code != 200:
                return None
            data = resp.json()
            entity = data.get("entities", {}).get(clean_id, {})
            claims = entity.get("claims", {})
            p18_claims = claims.get("P18", [])
            if not p18_claims:
                return None
            filename = p18_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
            if not filename or not isinstance(filename, str):
                return None

            return self.get_image_info(filename)
        except Exception as exc:
            logger.warning("[WIKIMEDIA] Wikidata P18 failed for '%s': %s", clean_id, exc)
            return None
        finally:
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("wikidata_p18", time.perf_counter() - t_start)

    # ==================================================
    # Commons Text Search Fallback
    # ==================================================

    def search_commons_text(self, query: str, limit: int = 4) -> list[dict[str, Any]]:
        """
        Tier 4: Searches Wikimedia Commons by place name text for CC-licensed photography.
        """
        if not query or len(query.strip()) < 2:
            return []

        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query.strip(),
            "gsrnamespace": "6",  # File namespace
            "gsrlimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size",
            "iiurlwidth": "1600",
            "format": "json",
        }
        headers = {"User-Agent": get_wikimedia_user_agent()}

        t_start = time.perf_counter()
        try:
            resp = requests.get(self.COMMONS_API, params=params, headers=headers, timeout=6)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("[WIKIMEDIA] Commons text search failed for '%s': %s", query, exc)
            return []
        finally:
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("commons_text_search", time.perf_counter() - t_start)

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
        place_name: str | None = None,
    ) -> tuple[list[dict[str, Any]], str | None]:
        """
        Engine photo chain:
        1. Wikipedia lead image -> Commons imageinfo.
        2. Wikidata P18 -> Commons imageinfo.
        3. Commons geosearch near coordinates.
        4. Commons text search by place name.
        Logs which tier answered and annotates each photo with photo_tier.
        Returns: (photos, editorial_summary)
        """
        photos: list[dict[str, Any]] = []
        editorial_summary: str | None = None
        answering_tier: str | None = None

        wikipedia_tag = extratags.get("wikipedia")
        wikidata_tag = extratags.get("wikidata")
        commons_tag = extratags.get("wikimedia_commons")

        # --------------------------------------------------
        # Tier 1: Wikipedia lead image
        # --------------------------------------------------
        if wikipedia_tag:
            wiki_summary = self.get_wikipedia_summary(wikipedia_tag)
            if wiki_summary:
                editorial_summary = wiki_summary.get("extract")
                lead_img = wiki_summary.get("originalimage", {}) or wiki_summary.get("thumbnail", {})
                lead_source = lead_img.get("source", "")
                if lead_source:
                    # Clean filename: strip query string and prefix
                    clean_source = lead_source.split("?")[0]
                    file_name = clean_source.split("/")[-1]
                    if re.match(r"^\d+px-", file_name):
                        file_name = file_name.split("-", 1)[1]
                    file_name = urllib.parse.unquote(file_name)
                    photo_info = self.get_image_info(file_name)
                    if photo_info:
                        photo_info["photo_tier"] = "wikipedia_lead_image"
                        photos.append(photo_info)
                        answering_tier = "wikipedia_lead_image"

        # Check explicit wikimedia_commons tag on OSM node if any
        if not photos and commons_tag:
            photo_info = self.get_image_info(commons_tag)
            if photo_info:
                photo_info["photo_tier"] = "wikimedia_commons_tag"
                photos.append(photo_info)
                answering_tier = "wikimedia_commons_tag"

        # --------------------------------------------------
        # Tier 2: Wikidata P18
        # --------------------------------------------------
        if not photos and wikidata_tag:
            p18_info = self.get_wikidata_p18_image(wikidata_tag)
            if p18_info:
                p18_info["photo_tier"] = "wikidata_p18"
                photos.append(p18_info)
                answering_tier = "wikidata_p18"

        # --------------------------------------------------
        # Tier 3: Commons geosearch
        # --------------------------------------------------
        if not photos and latitude is not None and longitude is not None:
            geo_photos = self.geosearch_photos(latitude, longitude, radius=3000, limit=4)
            if geo_photos:
                for p in geo_photos:
                    p["photo_tier"] = "commons_geosearch"
                photos.extend(geo_photos)
                answering_tier = "commons_geosearch"

        # --------------------------------------------------
        # Tier 4: Commons text search by place_name
        # --------------------------------------------------
        if not photos and place_name:
            text_photos = self.search_commons_text(place_name, limit=4)
            if text_photos:
                for p in text_photos:
                    p["photo_tier"] = "commons_text_search"
                photos.extend(text_photos)
                answering_tier = "commons_text_search"

        if answering_tier:
            logger.info(
                "[PHOTO_CHAIN] Tier '%s' answered with %d photos for place '%s'",
                answering_tier,
                len(photos),
                place_name or wikipedia_tag or wikidata_tag or "unknown",
            )
        else:
            logger.info(
                "[PHOTO_CHAIN] No tier found photos for place '%s'; falling back to bundled/slideshow",
                place_name or wikipedia_tag or wikidata_tag or "unknown",
            )

        return photos, editorial_summary
