/**
 * Canonical Display Name Builder for Travel AI Mobile.
 *
 * Ensures destination display names and location subtitles are cleanly built
 * without duplicated countries, cities, or aliases (e.g. 'Jeju Island, South Korea, South Korea').
 * Case-insensitive, punctuation-aware, and alias-aware.
 * Preserves underlying structured fields.
 */

export const COUNTRY_ALIASES: Record<string, string> = {
  // Korea
  korea: 'South Korea',
  'south korea': 'South Korea',
  'republic of korea': 'South Korea',
  rok: 'South Korea',
  dprk: 'North Korea',
  'north korea': 'North Korea',
  // United States
  us: 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  usa: 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  // United Kingdom
  uk: 'United Kingdom',
  'u.k.': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  britain: 'United Kingdom',
  // United Arab Emirates
  uae: 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
  // Netherlands
  holland: 'Netherlands',
  'the netherlands': 'Netherlands',
  netherlands: 'Netherlands',
  // Russia
  'russian federation': 'Russia',
  russia: 'Russia',
  // Vietnam
  'viet nam': 'Vietnam',
  vietnam: 'Vietnam',
};

export function normalizePiece(piece?: string | null): string {
  if (!piece) return '';
  return piece
    .trim()
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function canonicalizeCountry(country?: string | null): string {
  if (!country) return '';
  const clean = country
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return COUNTRY_ALIASES[clean] || normalizePiece(country);
}

export function isSameEntity(pieceA: string, pieceB: string): boolean {
  const normA = normalizePiece(pieceA).toLowerCase();
  const normB = normalizePiece(pieceB).toLowerCase();

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const canonA = COUNTRY_ALIASES[normA];
  const canonB = COUNTRY_ALIASES[normB];
  if (canonA && canonB && canonA.toLowerCase() === canonB.toLowerCase()) return true;

  const cleanA = normA.replace(/[^\w\s]/g, '').trim();
  const cleanB = normB.replace(/[^\w\s]/g, '').trim();
  if (cleanA === cleanB) return true;

  const aliasCleanA = COUNTRY_ALIASES[cleanA];
  const aliasCleanB = COUNTRY_ALIASES[cleanB];
  if (aliasCleanA && aliasCleanB && aliasCleanA.toLowerCase() === aliasCleanB.toLowerCase()) {
    return true;
  }

  return false;
}

export function pieceContainsCountry(piece: string, country: string): boolean {
  if (!piece || !country) return false;
  const pNorm = ` ${normalizePiece(piece).toLowerCase()} `;
  const cNorm = normalizePiece(country).toLowerCase();

  if (pNorm.includes(` ${cNorm} `)) return true;

  const canon = COUNTRY_ALIASES[cNorm];
  if (canon && pNorm.includes(` ${canon.toLowerCase()} `)) return true;

  const targetCanon = canon || cNorm;
  for (const [alias, standard] of Object.entries(COUNTRY_ALIASES)) {
    if (standard.toLowerCase() === targetCanon.toLowerCase()) {
      if (pNorm.includes(` ${alias} `)) return true;
    }
  }

  return false;
}

export interface CanonicalLocationInput {
  name?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  rawQuery?: string | null;
}

/**
 * Builds a canonical, non-duplicating location hierarchy for pills and subtitles.
 * Ensures 'Jeju Island, South Korea' never becomes 'Jeju Island, South Korea, South Korea'.
 */
export function buildCanonicalLocationName(input: CanonicalLocationInput): string {
  const { name, city, region, country, rawQuery } = input;

  const primary = normalizePiece(name) || normalizePiece(rawQuery);
  const normCountry = normalizePiece(country);
  const canonCountry = normCountry ? canonicalizeCountry(normCountry) : '';

  const pieces: string[] = [];

  if (primary) {
    const subParts = primary
      .split(',')
      .map(normalizePiece)
      .filter((p) => p.length > 0);

    for (let sp of subParts) {
      const spLower = sp.toLowerCase();
      if (spLower in COUNTRY_ALIASES) {
        if (canonCountry && isSameEntity(sp, canonCountry)) {
          sp = canonCountry;
        } else {
          sp = canonicalizeCountry(sp);
        }
      }

      if (!pieces.some((existing) => isSameEntity(sp, existing))) {
        pieces.push(sp);
      }
    }
  } else if (city) {
    const cleanCity = normalizePiece(city);
    if (cleanCity) pieces.push(cleanCity);
  }

  // Ensure country is present
  if (canonCountry) {
    let hasCountry = false;
    for (let i = 0; i < pieces.length; i++) {
      if (
        isSameEntity(pieces[i], canonCountry) ||
        pieceContainsCountry(pieces[i], canonCountry)
      ) {
        if (isSameEntity(pieces[i], canonCountry)) {
          pieces[i] = canonCountry;
        }
        hasCountry = true;
        break;
      }
    }
    if (!hasCountry) {
      pieces.push(canonCountry);
    }
  }

  // Deduplicate canonical keys
  const finalPieces: string[] = [];
  const seenCanonical = new Set<string>();

  for (const p of pieces) {
    const cleanP = normalizePiece(p);
    if (!cleanP) continue;
    const canonKey = COUNTRY_ALIASES[cleanP.toLowerCase()] || cleanP.toLowerCase();
    if (seenCanonical.has(canonKey)) continue;
    seenCanonical.add(canonKey);
    finalPieces.push(cleanP);
  }

  return finalPieces.join(', ');
}

/**
 * Builds the location subtitle specifically for the hero pill underneath the title.
 * If title already has the destination name (e.g. 'Jeju Island'), returns 'Jeju, South Korea'
 * or 'South Korea' without repeating the title or duplicate country.
 */
export function buildLocationSubtitle(input: CanonicalLocationInput): string {
  const fullCanonical = buildCanonicalLocationName(input);
  const primaryName = normalizePiece(input.name);

  // If the full canonical string is exactly the primary name, fallback to country or region
  if (primaryName && fullCanonical.toLowerCase() === primaryName.toLowerCase()) {
    return normalizePiece(input.country) || normalizePiece(input.region) || '';
  }

  return fullCanonical;
}
