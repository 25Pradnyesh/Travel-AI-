import html
import logging
import re
import time
from typing import Any
import urllib.parse
import requests

from engine.app.services.places.wikimedia_client import get_wikimedia_user_agent
from engine.observability.context import get_current_context

logger = logging.getLogger(__name__)


def build_destination_overview(
    wikidata_id: str | None = None,
    wikipedia_tag: str | None = None,
    place_data: dict[str, Any] | None = None,
    climate_summary: str | None = None,
) -> dict[str, str]:
    """
    Builds a max 5 labeled line Overview dictionary from Wikidata/Wikipedia and Open-Meteo normals:
      1. Where: instance of + country
      2. Size: area (km²)
      3. Main city / landmark: capital / largest city, highest point + elevation
      4. Recognition: heritage designations with year
      5. Climate: from Open-Meteo normals
    Omits any line without real data. Never invents facts.
    """
    place_data = place_data or {}
    overview: dict[str, str] = {}
    entity_claims: dict[str, Any] = {}
    labels: dict[str, str] = {}

    # 1. Fetch Wikidata claims if wikidata_id provided
    clean_qid = (wikidata_id or "").strip()
    if clean_qid and re.match(r"^Q\d+$", clean_qid):
        url = f"https://www.wikidata.org/wiki/Special:EntityData/{clean_qid}.json"
        headers = {"User-Agent": get_wikimedia_user_agent()}
        t_start = time.perf_counter()
        try:
            resp = requests.get(url, headers=headers, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                entity = data.get("entities", {}).get(clean_qid, {})
                entity_claims = entity.get("claims", {})
        except Exception as exc:
            logger.warning("[OVERVIEW] Wikidata fetch failed for %s: %s", clean_qid, exc)
        finally:
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("wikidata_entity", time.perf_counter() - t_start)

    # Resolve QIDs for labels in one batch request
    qids_to_resolve: set[str] = set()

    # P31: instance of
    p31_ids = [
        c["mainsnak"]["datavalue"]["value"]["id"]
        for c in entity_claims.get("P31", [])
        if "datavalue" in c.get("mainsnak", {}) and "id" in c["mainsnak"]["datavalue"].get("value", {})
    ]
    qids_to_resolve.update(p31_ids[:2])

    # P17: country
    p17_ids = [
        c["mainsnak"]["datavalue"]["value"]["id"]
        for c in entity_claims.get("P17", [])
        if "datavalue" in c.get("mainsnak", {}) and "id" in c["mainsnak"]["datavalue"].get("value", {})
    ]
    qids_to_resolve.update(p17_ids[:1])

    # P36: capital / largest city
    p36_ids = [
        c["mainsnak"]["datavalue"]["value"]["id"]
        for c in entity_claims.get("P36", [])
        if "datavalue" in c.get("mainsnak", {}) and "id" in c["mainsnak"]["datavalue"].get("value", {})
    ]
    qids_to_resolve.update(p36_ids[:1])

    # P610: highest point
    p610_ids = [
        c["mainsnak"]["datavalue"]["value"]["id"]
        for c in entity_claims.get("P610", [])
        if "datavalue" in c.get("mainsnak", {}) and "id" in c["mainsnak"]["datavalue"].get("value", {})
    ]
    qids_to_resolve.update(p610_ids[:1])

    # P1435: heritage designation
    p1435_ids = [
        c["mainsnak"]["datavalue"]["value"]["id"]
        for c in entity_claims.get("P1435", [])
        if "datavalue" in c.get("mainsnak", {}) and "id" in c["mainsnak"]["datavalue"].get("value", {})
    ]
    qids_to_resolve.update(p1435_ids[:2])

    if qids_to_resolve:
        wb_url = (
            f"https://www.wikidata.org/w/api.php?action=wbgetentities"
            f"&ids={'|'.join(qids_to_resolve)}&props=labels&languages=en&format=json"
        )
        headers = {"User-Agent": get_wikimedia_user_agent()}
        try:
            wb_resp = requests.get(wb_url, headers=headers, timeout=3.5)
            if wb_resp.status_code == 200:
                for q, ent in wb_resp.json().get("entities", {}).items():
                    lbl = ent.get("labels", {}).get("en", {}).get("value")
                    if lbl:
                        labels[q] = lbl
        except Exception as exc:
            logger.warning("[OVERVIEW] Wikidata label resolution failed: %s", exc)

    # -------------------------------------------------------------
    # 1. Line: Where (instance of + country)
    # -------------------------------------------------------------
    where_parts: list[str] = []
    instance_name = labels.get(p31_ids[0]) if p31_ids and p31_ids[0] in labels else None
    if not instance_name and place_data.get("category"):
        instance_name = place_data["category"]

    country_name = labels.get(p17_ids[0]) if p17_ids and p17_ids[0] in labels else None
    if not country_name and place_data.get("country"):
        country_name = place_data["country"]

    if instance_name:
        where_parts.append(instance_name.capitalize())
    if country_name:
        where_parts.append(country_name)

    if where_parts:
        overview["where"] = ", ".join(where_parts)

    # -------------------------------------------------------------
    # 2. Line: Size (area in km²)
    # -------------------------------------------------------------
    if "P2046" in entity_claims:
        try:
            val_obj = entity_claims["P2046"][0].get("mainsnak", {}).get("datavalue", {}).get("value", {})
            amt = val_obj.get("amount")
            if amt:
                num = float(amt.lstrip("+"))
                if num >= 10:
                    overview["size"] = f"{num:,.0f} km²"
                else:
                    overview["size"] = f"{num:,.1f} km²"
        except (ValueError, IndexError, KeyError):
            pass

    # -------------------------------------------------------------
    # 3. Line: Main city / landmark (capital/largest city, highest point + elevation)
    # -------------------------------------------------------------
    landmark_parts: list[str] = []
    if p36_ids and p36_ids[0] in labels:
        landmark_parts.append(labels[p36_ids[0]])

    if p610_ids and p610_ids[0] in labels:
        hp_name = labels[p610_ids[0]]
        elev_str = None
        if "P2044" in entity_claims:
            try:
                elev_val = entity_claims["P2044"][0].get("mainsnak", {}).get("datavalue", {}).get("value", {})
                elev_amt = elev_val.get("amount")
                if elev_amt:
                    elev_num = int(float(elev_amt.lstrip("+")))
                    elev_str = f"{elev_num:,} m"
            except (ValueError, IndexError, KeyError):
                pass
        if elev_str:
            landmark_parts.append(f"{hp_name} ({elev_str})")
        else:
            landmark_parts.append(hp_name)

    if landmark_parts:
        overview["main_city_landmark"] = " • ".join(landmark_parts)

    # -------------------------------------------------------------
    # 4. Line: Recognition (heritage designations with year)
    # -------------------------------------------------------------
    recognition_items: list[str] = []
    for claim in entity_claims.get("P1435", []):
        try:
            desig_id = claim.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
            desig_name = labels.get(desig_id)
            if not desig_name:
                continue
            # Look for qualifiers (e.g. start time P580 or point in time P585)
            year = None
            qualifiers = claim.get("qualifiers", {})
            for time_prop in ("P585", "P580"):
                if time_prop in qualifiers:
                    t_val = qualifiers[time_prop][0].get("datavalue", {}).get("value", {}).get("time", "")
                    match = re.search(r"([+-]?\d{4})", t_val)
                    if match:
                        year = match.group(1).lstrip("+")
                        break
            if year:
                recognition_items.append(f"{desig_name} ({year})")
            else:
                recognition_items.append(desig_name)
        except Exception:
            continue

    if recognition_items:
        overview["recognition"] = " • ".join(recognition_items[:2])
    elif "world heritage" in (place_data.get("editorial_summary") or "").lower():
        overview["recognition"] = "UNESCO World Heritage Site"

    # -------------------------------------------------------------
    # 5. Line: Climate (from Open-Meteo normals)
    # -------------------------------------------------------------
    if climate_summary:
        overview["climate"] = climate_summary.strip()

    return overview
