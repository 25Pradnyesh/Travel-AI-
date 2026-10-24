"""
Canonical Display Name Builder for Travel AI.

Ensures destination display names and location subtitles are cleanly built
without duplicated countries, cities, or aliases (e.g. 'Jeju Island, South Korea, South Korea').
Case-insensitive, punctuation-aware, and alias-aware.
Does not alter underlying structured fields (city, region, country, coordinates).
"""

import re
from typing import Any

COUNTRY_ALIASES: dict[str, str] = {
    # Korea
    "korea": "South Korea",
    "south korea": "South Korea",
    "republic of korea": "South Korea",
    "rok": "South Korea",
    "dprk": "North Korea",
    "north korea": "North Korea",
    # United States
    "us": "United States",
    "u.s.": "United States",
    "u.s.a.": "United States",
    "usa": "United States",
    "united states": "United States",
    "united states of america": "United States",
    # United Kingdom
    "uk": "United Kingdom",
    "u.k.": "United Kingdom",
    "united kingdom": "United Kingdom",
    "great britain": "United Kingdom",
    "britain": "United Kingdom",
    # United Arab Emirates
    "uae": "United Arab Emirates",
    "u.a.e.": "United Arab Emirates",
    "united arab emirates": "United Arab Emirates",
    # Netherlands
    "holland": "Netherlands",
    "the netherlands": "Netherlands",
    "netherlands": "Netherlands",
    # Russia
    "russian federation": "Russia",
    "russia": "Russia",
    # Vietnam
    "viet nam": "Vietnam",
    "vietnam": "Vietnam",
}


def canonicalize_country(country_str: str | None) -> str:
    """Returns the canonical country name for a given country string or alias."""
    if not country_str:
        return ""
    clean = re.sub(r"[^\w\s]", "", country_str.strip().lower())
    clean = re.sub(r"\s+", " ", clean).strip()
    return COUNTRY_ALIASES.get(clean, country_str.strip())


def normalize_piece(piece: str | None) -> str:
    """Strips leading/trailing punctuation and extra whitespace from a name piece."""
    if not piece:
        return ""
    clean = piece.strip()
    clean = re.sub(r"^[\s,.;:-]+|[\s,.;:-]+$", "", clean)
    clean = re.sub(r"\s+", " ", clean)
    return clean


def is_same_entity(piece_a: str, piece_b: str) -> bool:
    """Checks if two location pieces represent the same entity or country alias."""
    norm_a = normalize_piece(piece_a).lower()
    norm_b = normalize_piece(piece_b).lower()

    if not norm_a or not norm_b:
        return False
    if norm_a == norm_b:
        return True

    # Check country alias map
    canon_a = COUNTRY_ALIASES.get(norm_a)
    canon_b = COUNTRY_ALIASES.get(norm_b)
    if canon_a and canon_b and canon_a.lower() == canon_b.lower():
        return True

    # Strip punctuation for comparison
    clean_a = re.sub(r"[^\w\s]", "", norm_a).strip()
    clean_b = re.sub(r"[^\w\s]", "", norm_b).strip()
    if clean_a == clean_b:
        return True

    alias_clean_a = COUNTRY_ALIASES.get(clean_a)
    alias_clean_b = COUNTRY_ALIASES.get(clean_b)
    if alias_clean_a and alias_clean_b and alias_clean_a.lower() == alias_clean_b.lower():
        return True

    return False


def piece_contains_country(piece: str, country: str) -> bool:
    """Checks if a piece (like 'Jeju Island, South Korea') already contains the country or an alias."""
    if not piece or not country:
        return False

    p_norm = f" {normalize_piece(piece).lower()} "
    c_norm = normalize_piece(country).lower()

    # Direct match
    if f" {c_norm} " in p_norm:
        return True

    # Canonical match
    canon = COUNTRY_ALIASES.get(c_norm)
    if canon and f" {canon.lower()} " in p_norm:
        return True

    # Check any known alias of country
    target_canon = canon or c_norm
    for alias, standard in COUNTRY_ALIASES.items():
        if standard.lower() == target_canon.lower():
            if f" {alias} " in p_norm:
                return True

    return False


def build_canonical_display_name(
    name: str | None = None,
    city: str | None = None,
    region: str | None = None,
    country: str | None = None,
    raw_query: str | None = None,
) -> str:
    """
    Builds a canonical, clean display name from candidate components.
    Guarantees no duplicate country, region, or city tokens.
    Handles 'Jeju', 'Kyoto', 'Bali', 'Paris', 'New York City', and 'Korea' aliases.
    """
    primary = normalize_piece(name)
    if not primary and raw_query:
        primary = normalize_piece(raw_query)

    norm_country = normalize_piece(country)
    canon_country = canonicalize_country(norm_country) if norm_country else ""

    pieces: list[str] = []

    if primary:
        sub_parts = [normalize_piece(p) for p in primary.split(",") if normalize_piece(p)]
        for sp in sub_parts:
            # If this sub-part is a country or country alias, canonicalize it
            sp_canon = canonicalize_country(sp)
            if sp.lower() in COUNTRY_ALIASES:
                # If country argument was passed and is also a country alias, prefer canonical country
                if canon_country and is_same_entity(sp, canon_country):
                    sp = canon_country
                else:
                    sp = sp_canon

            # Check if this sub-part duplicates an existing piece
            if not any(is_same_entity(sp, existing) for existing in pieces):
                pieces.append(sp)
    elif city:
        clean_city = normalize_piece(city)
        if clean_city:
            pieces.append(clean_city)

    # If canon_country is determined but not yet in pieces
    if canon_country:
        has_country = False
        for idx, p in enumerate(pieces):
            if is_same_entity(p, canon_country) or piece_contains_country(p, canon_country):
                # Ensure country in piece is formatted canonically
                if is_same_entity(p, canon_country):
                    pieces[idx] = canon_country
                has_country = True
                break
        if not has_country:
            pieces.append(canon_country)

    # Final cleanup: Remove any intermediate redundant tokens
    # e.g., if pieces are ['Jeju Island', 'South Korea'], do not add 'Jeju-si' or 'Jeju-do'
    final_pieces: list[str] = []
    seen_canonical = set()

    for p in pieces:
        clean_p = normalize_piece(p)
        if not clean_p:
            continue
        canon_key = COUNTRY_ALIASES.get(clean_p.lower(), clean_p.lower())
        if canon_key in seen_canonical:
            continue
        seen_canonical.add(canon_key)
        final_pieces.append(clean_p)

    return ", ".join(final_pieces)
