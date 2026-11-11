import html
import logging
import math
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


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


DISALLOWED_IMAGE_TERMS = {
    "map", "carte", "karte", "plan", "locator", "location", "flag", "drapeau",
    "flagge", "logo", "coat of arms", "blason", "wappen", "insignia", "emblem",
    "diagram", "schema", "chart", "graph", "icon", "symbol", "drawing",
    "illustration", "sketch", "stamp", "signature", "seal", "currency", "banknote",
    "coin", "portrait", "headshot",
}


def is_rejected_image(
    file_title: str,
    description: str | None = None,
    width: int | None = None,
    height: int | None = None,
    mime: str | None = None,
) -> bool:
    """
    Relevance guard:
    - Rejects SVGs.
    - Rejects portraits (height > width).
    - Rejects images < 1200px wide.
    - Rejects maps, logos, flags, diagrams, coats of arms, headshots.
    """
    clean_title = (file_title or "").lower()
    clean_desc = (description or "").lower()

    # Reject SVGs
    if clean_title.endswith(".svg") or (mime and "svg" in mime.lower()):
        return True

    # Reject portraits & low-res images
    if width is not None:
        if width < 1200:
            return True
        if height is not None and height > width:
            return True

    # Check disallowed keywords in title or description
    combined = f"{clean_title} {clean_desc}"
    for term in DISALLOWED_IMAGE_TERMS:
        pattern = rf"(^|[^a-z0-9]){re.escape(term)}([^a-z0-9]|$)"
        if re.search(pattern, combined):
            return True

    return False


def passes_relevance_check(
    file_title: str,
    categories: list[str] | None = None,
    image_coords: tuple[float, float] | None = None,
    destination_coords: tuple[float, float] | None = None,
    place_name: str | None = None,
    wikidata_id: str | None = None,
) -> bool:
    """
    Relevance check for destination photography:
    - If a Commons file is geotagged (prop=coordinates) and destination coordinates are known:
      Must be within ~100 km of destination (haversine_km <= 100.0).
      If geotagged > 100 km away, STRICTLY REJECT (e.g. Colosseum for Jeju).
    - If geotags are absent:
      Title or categories must match the place name or Wikidata id.
    - Reject anything else.
    """
    categories = categories or []
    clean_title = (file_title or "").lower()
    clean_cats = [c.lower() for c in categories]
    combined_meta = f"{clean_title} {' '.join(clean_cats)}"

    # 1. Geographic check: If image has coordinates and destination coordinates are provided
    if image_coords and destination_coords:
        dist = haversine_km(
            destination_coords[0], destination_coords[1],
            image_coords[0], image_coords[1],
        )
        if dist <= 100.0:
            return True
        # Geotagged too far (>100 km) -> reject
        return False

    # 2. Textual / Wikidata match if coordinates are absent on file or destination
    if wikidata_id:
        clean_qid = wikidata_id.strip().lower()
        if clean_qid and clean_qid in combined_meta:
            return True

    if place_name:
        clean_name = place_name.strip().lower()
        # Direct substring match
        if clean_name and (clean_name in clean_title or any(clean_name in cat for cat in clean_cats)):
            return True

        # Check significant tokens (e.g. "jeju" from "Jeju Island")
        stopwords = {
            "the", "and", "or", "of", "in", "at", "is", "republic", "south", "north",
            "province", "city", "island", "islands", "state", "region", "district",
            "town", "village", "county", "prefecture", "area", "destination",
        }
        tokens = [
            t.lower() for t in re.findall(r"[A-Za-z0-9]+", clean_name)
            if len(t) >= 3 and t.lower() not in stopwords
        ]
        if not tokens:
            tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9]+", clean_name) if len(t) >= 3]

        if tokens:
            for tok in tokens:
                pattern = rf"(^|[^a-z0-9]){re.escape(tok)}([^a-z0-9]|$)"
                if re.search(pattern, combined_meta):
                    return True

    if not destination_coords and not place_name and not wikidata_id:
        return True

    return False


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

    def get_image_info(
        self,
        file_title: str,
        destination_coords: tuple[float, float] | None = None,
        place_name: str | None = None,
        wikidata_id: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Queries Wikimedia Commons imageinfo for URL (~1600px thumb), Artist, License, and source page.
        Validates license against CC whitelist and relevance guard (no svg, maps, logos, portraits, <1200px).
        Enforces relevance check: coordinates within ~100 km or title/categories match place_name/wikidata_id.
        """
        if not file_title:
            return None

        # Clean title
        if not file_title.startswith("File:"):
            file_title = f"File:{file_title}"

        params = {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo|coordinates|categories",
            "iiprop": "url|extmetadata|size|mime",
            "iiurlwidth": "1600",
            "cllimit": "20",
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
                logger.debug("[WIKIMEDIA] Disallowed license '%s' for '%s'", license_short, file_title)
                return None

            artist_raw = extmeta.get("Artist", {}).get("value", "")
            author = strip_html_tags(artist_raw) or "Wikimedia Commons contributor"
            license_url = extmeta.get("LicenseUrl", {}).get("value", "")
            source_url = info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(file_title)}"

            # Prefer ~1600px width thumbnail
            photo_url = info.get("thumburl") or info.get("url")
            width = info.get("thumbwidth") or info.get("width")
            height = info.get("thumbheight") or info.get("height")
            orig_width = info.get("width") or width
            orig_height = info.get("height") or height
            mime = info.get("mime", "")

            desc = extmeta.get("ObjectName", {}).get("value") or extmeta.get("ImageDescription", {}).get("value") or ""
            if is_rejected_image(file_title, description=desc, width=orig_width, height=orig_height, mime=mime):
                logger.debug("[WIKIMEDIA] Rejected non-qualifying image '%s' (w=%s, h=%s, mime=%s)", file_title, orig_width, orig_height, mime)
                return None

            # Relevance check: distance <= 100km or title/categories match place
            coords = page.get("coordinates", [])
            p_lat = coords[0].get("lat") if coords else None
            p_lon = coords[0].get("lon") if coords else None
            img_coords = (p_lat, p_lon) if (p_lat is not None and p_lon is not None) else None
            dist_km = (
                haversine_km(destination_coords[0], destination_coords[1], p_lat, p_lon)
                if (destination_coords and img_coords)
                else 0.0
            )

            cats = [c.get("title", "") for c in page.get("categories", [])]
            if destination_coords or place_name or wikidata_id:
                if not passes_relevance_check(
                    file_title=file_title,
                    categories=cats,
                    image_coords=img_coords,
                    destination_coords=destination_coords,
                    place_name=place_name,
                    wikidata_id=wikidata_id,
                ):
                    logger.debug(
                        "[WIKIMEDIA] Image '%s' failed relevance check for place='%s' (coords=%s)",
                        file_title,
                        place_name,
                        destination_coords,
                    )
                    return None

            return {
                "file_title": file_title,
                "url": photo_url,
                "width": width,
                "height": height,
                "author": author,
                "license": license_short,
                "license_url": license_url,
                "source_url": source_url,
                "distance_km": round(dist_km, 2),
            }

        return None

    # ==================================================
    # Wikimedia Commons Geosearch Fallback
    # ==================================================

    def geosearch_photos(
        self,
        latitude: float,
        longitude: float,
        radius: int = 25000,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Fallback: searches Wikimedia Commons for geotagged images near coordinates.
        Relevance guard: strictly within ~25 km of the coordinates;
        Rejects portraits, maps, logos, flags, diagrams, svg, images < 1200px wide.
        """
        if latitude is None or longitude is None:
            return []

        # Cap radius to 25,000 meters (25 km relevance guard)
        effective_radius = min(radius, 25000)

        params = {
            "action": "query",
            "generator": "geosearch",
            "ggscoord": f"{latitude}|{longitude}",
            "ggsradius": str(effective_radius),
            "ggslimit": str(limit * 2),
            "prop": "imageinfo|coordinates",
            "iiprop": "url|extmetadata|size|mime",
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

            title = page.get("title", "")
            width = info.get("thumbwidth") or info.get("width")
            height = info.get("thumbheight") or info.get("height")
            orig_width = info.get("width") or width
            orig_height = info.get("height") or height
            mime = info.get("mime", "")
            desc = extmeta.get("ObjectName", {}).get("value") or extmeta.get("ImageDescription", {}).get("value") or ""

            if is_rejected_image(title, description=desc, width=orig_width, height=orig_height, mime=mime):
                continue

            # Calculate distance from destination coordinates (relevance guard: <= 25km)
            coords = page.get("coordinates", [])
            dist_km = 0.0
            if coords:
                p_lat = coords[0].get("lat")
                p_lon = coords[0].get("lon")
                if p_lat is not None and p_lon is not None:
                    dist_km = haversine_km(latitude, longitude, p_lat, p_lon)
                    if dist_km > 25.0:
                        continue

            artist_raw = extmeta.get("Artist", {}).get("value", "")
            author = strip_html_tags(artist_raw) or "Wikimedia Commons contributor"
            license_url = extmeta.get("LicenseUrl", {}).get("value", "")
            source_url = info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}"

            photo_url = info.get("thumburl") or info.get("url")

            if photo_url:
                photos.append({
                    "file_title": title,
                    "url": photo_url,
                    "width": width,
                    "height": height,
                    "author": author,
                    "license": license_short,
                    "license_url": license_url,
                    "source_url": source_url,
                    "distance_km": round(dist_km, 2),
                })
                if len(photos) >= limit:
                    break

        return photos

    # ==================================================
    # Wikidata Entity & P18 Image Lookup
    # ==================================================

    def get_wikidata_entity(self, wikidata_id: str) -> dict[str, Any] | None:
        """Fetches Wikidata entity JSON for QID."""
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
            return data.get("entities", {}).get(clean_id, {})
        except Exception as exc:
            logger.warning("[WIKIMEDIA] Wikidata entity fetch failed for '%s': %s", clean_id, exc)
            return None
        finally:
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("wikidata_entity", time.perf_counter() - t_start)

    def get_wikidata_p18_image(
        self,
        wikidata_id: str,
        destination_coords: tuple[float, float] | None = None,
        place_name: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Tier 2: Queries Wikidata entity for P18 (image) property and retrieves Commons photo info.
        Relevance guard: the entity matches the resolved place.
        """
        entity = self.get_wikidata_entity(wikidata_id)
        if not entity:
            return None

        claims = entity.get("claims", {})
        p18_claims = claims.get("P18", [])
        if not p18_claims:
            return None
        filename = p18_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
        if not filename or not isinstance(filename, str):
            return None

        return self.get_image_info(
            filename,
            destination_coords=destination_coords,
            place_name=place_name,
            wikidata_id=wikidata_id,
        )

    # ==================================================
    # Commons Text Search Fallback
    # ==================================================

    def search_commons_text(
        self,
        query: str,
        limit: int = 4,
        destination_coords: tuple[float, float] | None = None,
        wikidata_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Tier 4: Searches Wikimedia Commons by place name text for CC-licensed photography.
        Relevance guard: geotagged within ~100 km, or title/categories match place name or Wikidata id.
        Rejects portraits, maps, logos, flags, diagrams, svg, images < 1200px wide.
        """
        if not query or len(query.strip()) < 2:
            return []

        clean_query = query.strip()
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": clean_query,
            "gsrnamespace": "6",  # File namespace
            "gsrlimit": str(limit * 3),
            "prop": "imageinfo|coordinates|categories",
            "iiprop": "url|extmetadata|size|mime",
            "iiurlwidth": "1600",
            "cllimit": "20",
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

            title = page.get("title", "")
            desc = extmeta.get("ObjectName", {}).get("value") or extmeta.get("ImageDescription", {}).get("value") or ""
            width = info.get("thumbwidth") or info.get("width")
            height = info.get("thumbheight") or info.get("height")
            orig_width = info.get("width") or width
            orig_height = info.get("height") or height
            mime = info.get("mime", "")

            # Quality and type filter
            if is_rejected_image(title, description=desc, width=orig_width, height=orig_height, mime=mime):
                continue

            coords = page.get("coordinates", [])
            p_lat = coords[0].get("lat") if coords else None
            p_lon = coords[0].get("lon") if coords else None
            img_coords = (p_lat, p_lon) if (p_lat is not None and p_lon is not None) else None
            dist_km = (
                haversine_km(destination_coords[0], destination_coords[1], p_lat, p_lon)
                if (destination_coords and img_coords)
                else 0.0
            )

            cats = [c.get("title", "") for c in page.get("categories", [])]

            # Strict relevance check: must be <= 100km or title/categories match place_name/wikidata_id
            if destination_coords or clean_query or wikidata_id:
                if not passes_relevance_check(
                    file_title=title,
                    categories=cats,
                    image_coords=img_coords,
                    destination_coords=destination_coords,
                    place_name=clean_query,
                    wikidata_id=wikidata_id,
                ):
                    continue

            artist_raw = extmeta.get("Artist", {}).get("value", "")
            author = strip_html_tags(artist_raw) or "Wikimedia Commons contributor"
            license_url = extmeta.get("LicenseUrl", {}).get("value", "")
            source_url = info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}"

            photo_url = info.get("thumburl") or info.get("url")

            if photo_url:
                photos.append({
                    "file_title": title,
                    "url": photo_url,
                    "width": width,
                    "height": height,
                    "author": author,
                    "license": license_short,
                    "license_url": license_url,
                    "source_url": source_url,
                    "distance_km": round(dist_km, 2),
                })
                if len(photos) >= limit:
                    break

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
        wikidata_id: str | None = None,
        wikipedia_tag: str | None = None,
    ) -> tuple[list[dict[str, Any]], str | None]:
        """
        Engine photo chain:
        1. Wikipedia lead image -> Commons imageinfo.
        2. Wikidata P18 -> Commons imageinfo.
        3. Commons geosearch near coordinates (<= 25 km).
        4. Commons text search by place name (title/desc matching, <= 100 km relevance guard).

        Logs: tier that answered, chosen file title, source URL, license, distance from destination coordinates (debug logs only).
        Returns: (photos, editorial_summary)
        """
        photos: list[dict[str, Any]] = []
        editorial_summary: str | None = None
        answering_tier: str | None = None

        wikipedia_tag = extratags.get("wikipedia") or wikipedia_tag
        wikidata_tag = extratags.get("wikidata") or wikidata_id
        commons_tag = extratags.get("wikimedia_commons")
        dest_coords = (latitude, longitude) if (latitude is not None and longitude is not None) else None

        # Check if we can get English Wikipedia article from Wikidata sitelinks
        enwiki_tag: str | None = None
        if wikidata_tag:
            entity = self.get_wikidata_entity(wikidata_tag)
            if entity:
                en_title = entity.get("sitelinks", {}).get("enwiki", {}).get("title")
                if en_title:
                    enwiki_tag = f"en:{en_title}"

        # --------------------------------------------------
        # Tier 1: Wikipedia lead image (prefer English article)
        # --------------------------------------------------
        tag_to_try = enwiki_tag or wikipedia_tag
        if tag_to_try:
            wiki_summary = self.get_wikipedia_summary(tag_to_try)
            if wiki_summary:
                editorial_summary = wiki_summary.get("extract")
                lead_img = wiki_summary.get("originalimage", {}) or wiki_summary.get("thumbnail", {})
                lead_source = lead_img.get("source", "")
                if lead_source:
                    clean_source = lead_source.split("?")[0]
                    file_name = clean_source.split("/")[-1]
                    if re.match(r"^\d+px-", file_name):
                        file_name = file_name.split("-", 1)[1]
                    file_name = urllib.parse.unquote(file_name)
                    photo_info = self.get_image_info(
                        file_name,
                        destination_coords=dest_coords,
                        place_name=place_name or (tag_to_try.split(":", 1)[-1] if ":" in tag_to_try else tag_to_try),
                        wikidata_id=wikidata_tag,
                    )
                    if photo_info:
                        photo_info["photo_tier"] = "wikipedia_lead_image"
                        photos.append(photo_info)
                        answering_tier = "wikipedia_lead_image"

        # If enwiki didn't find photos and original wikipedia_tag is different, try original
        if not photos and wikipedia_tag and wikipedia_tag != tag_to_try:
            wiki_summary = self.get_wikipedia_summary(wikipedia_tag)
            if wiki_summary:
                if not editorial_summary:
                    editorial_summary = wiki_summary.get("extract")
                lead_img = wiki_summary.get("originalimage", {}) or wiki_summary.get("thumbnail", {})
                lead_source = lead_img.get("source", "")
                if lead_source:
                    clean_source = lead_source.split("?")[0]
                    file_name = clean_source.split("/")[-1]
                    if re.match(r"^\d+px-", file_name):
                        file_name = file_name.split("-", 1)[1]
                    file_name = urllib.parse.unquote(file_name)
                    photo_info = self.get_image_info(
                        file_name,
                        destination_coords=dest_coords,
                        place_name=place_name or (wikipedia_tag.split(":", 1)[-1] if ":" in wikipedia_tag else wikipedia_tag),
                        wikidata_id=wikidata_tag,
                    )
                    if photo_info:
                        photo_info["photo_tier"] = "wikipedia_lead_image"
                        photos.append(photo_info)
                        answering_tier = "wikipedia_lead_image"

        # Check explicit wikimedia_commons tag on OSM node if any
        if not photos and commons_tag:
            photo_info = self.get_image_info(
                commons_tag,
                destination_coords=dest_coords,
                place_name=place_name,
                wikidata_id=wikidata_tag,
            )
            if photo_info:
                photo_info["photo_tier"] = "wikimedia_commons_tag"
                photos.append(photo_info)
                answering_tier = "wikimedia_commons_tag"

        # --------------------------------------------------
        # Tier 2: Wikidata P18
        # --------------------------------------------------
        if not photos and wikidata_tag:
            p18_info = self.get_wikidata_p18_image(
                wikidata_tag,
                destination_coords=dest_coords,
                place_name=place_name,
            )
            if p18_info:
                p18_info["photo_tier"] = "wikidata_p18"
                photos.append(p18_info)
                answering_tier = "wikidata_p18"

        # --------------------------------------------------
        # Tier 3: Commons geosearch (<= 25 km relevance guard)
        # --------------------------------------------------
        if not photos and latitude is not None and longitude is not None:
            geo_photos = self.geosearch_photos(latitude, longitude, radius=25000, limit=4)
            if geo_photos:
                for p in geo_photos:
                    p["photo_tier"] = "commons_geosearch"
                photos.extend(geo_photos)
                answering_tier = "commons_geosearch"

        # --------------------------------------------------
        # Tier 4: Commons text search by place_name (<= 100 km relevance guard)
        # --------------------------------------------------
        if not photos and place_name:
            text_photos = self.search_commons_text(
                place_name,
                limit=4,
                destination_coords=dest_coords,
                wikidata_id=wikidata_tag,
            )
            if text_photos:
                for p in text_photos:
                    p["photo_tier"] = "commons_text_search"
                photos.extend(text_photos)
                answering_tier = "commons_text_search"

        # Mandatory per-analysis logging in debug logs only
        if photos:
            chosen = photos[0]
            logger.debug(
                "[PHOTO_CHAIN] Tier '%s' answered for place '%s': file_title='%s', source_url='%s', license='%s', distance_km=%.2f",
                chosen.get("photo_tier", answering_tier),
                place_name or wikipedia_tag or wikidata_tag or "unknown",
                chosen.get("file_title") or chosen.get("source_url", "").split("/")[-1],
                chosen.get("source_url") or chosen.get("url"),
                chosen.get("license"),
                chosen.get("distance_km", 0.0),
            )
        else:
            logger.debug(
                "[PHOTO_CHAIN] No tier found qualifying photos for place '%s'; falling back to bundled/neutral gradient",
                place_name or wikipedia_tag or wikidata_tag or "unknown",
            )

        return photos, editorial_summary
