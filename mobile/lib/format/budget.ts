/**
 * VAMO — Travel Budget Formatting Utilities
 *
 * Formats daily travel budget estimates truthfully:
 * - Ranges: "€280 – €420 / day" (en dash, currency on both ends, no thousands separator between min and max)
 * - Min-only: "from €280 / day"
 * - Max-only: "up to €420 / day"
 * - Equal values: "€280 / day"
 * - Free admission: "Free admission"
 */

/**
 * Resolve currency symbol from ISO currency code or raw string
 */
export function getCurrencySymbol(currencyCode?: string, rawStr?: string): string {
  const clean = (currencyCode || '').trim().toUpperCase();
  if (clean === 'EUR') return '€';
  if (clean === 'USD') return '$';
  if (clean === 'GBP') return '£';
  if (clean === 'JPY') return '¥';
  if (clean === 'CAD') return 'CA$';
  if (clean === 'AUD') return 'AU$';
  if (clean === 'CHF') return 'CHF ';

  if (clean.length === 3) {
    try {
      const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: clean }).formatToParts(0);
      const curr = parts.find((p) => p.type === 'currency');
      if (curr?.value) return curr.value;
    } catch {
      return `${clean} `;
    }
  }

  if (rawStr) {
    if (rawStr.includes('€')) return '€';
    if (rawStr.includes('$')) return '$';
    if (rawStr.includes('£')) return '£';
    if (rawStr.includes('¥')) return '¥';
  }

  return clean ? `${clean} ` : '€';
}

/**
 * Safely format budget ranges as "€280 – €420 / day" (en dash, currency on both ends,
 * no thousands separator between min and max).
 * Also handles min-only ("from €280 / day"), max-only ("up to €420 / day"),
 * and equal values ("€280 / day").
 */
export function formatBudget(budget?: string | number, currencyCode?: string): string {
  if (!budget && budget !== 0) return '';
  const rawStr = String(budget).trim();
  if (!rawStr) return '';

  // Free admission edge case
  if (rawStr.toLowerCase().includes('free') || rawStr === '0' || rawStr === '$0' || rawStr === '€0') {
    return 'Free admission';
  }

  const symbol = getCurrencySymbol(currencyCode, rawStr);

  // 1. Detect range: "280 - 420", "$280 – $420", "€280 to €420", "280...420"
  const rangeMatch = rawStr.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:[-–—]|to|\.{2,3})\s*[^0-9\s]*\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  if (rangeMatch) {
    const num1 = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const num2 = parseFloat(rangeMatch[2].replace(/,/g, ''));
    if (!isNaN(num1) && !isNaN(num2)) {
      if (num1 === num2) {
        return `${symbol}${Math.round(num1)} / day`;
      }
      const min = Math.min(num1, num2);
      const max = Math.max(num1, num2);
      return `${symbol}${Math.round(min)} \u2013 ${symbol}${Math.round(max)} / day`;
    }
  }

  // 2. Detect min-only: "from 280", "min 280", "280+", ">= 280", "starting at 280"
  const minOnlyMatch = rawStr.match(/(?:from|min\.?|minimum|starting\s+at|at\s+least|[+>≥])\s*(?:[^\d]*?)(\d+(?:,\d{3})*(?:\.\d+)?)|(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\+|and\s+up)/i);
  if (minOnlyMatch) {
    const val = parseFloat((minOnlyMatch[1] || minOnlyMatch[2]).replace(/,/g, ''));
    if (!isNaN(val)) {
      return `from ${symbol}${Math.round(val)} / day`;
    }
  }

  // 3. Detect max-only: "up to 420", "max 420", "under 420", "<= 420"
  const maxOnlyMatch = rawStr.match(/(?:up\s+to|max\.?|maximum|under|at\s+most|[<≤])\s*(?:[^\d]*?)(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  if (maxOnlyMatch) {
    const val = parseFloat(maxOnlyMatch[1].replace(/,/g, ''));
    if (!isNaN(val)) {
      return `up to ${symbol}${Math.round(val)} / day`;
    }
  }

  // 4. Single numeric value: "280", "$280", "€280"
  const singleMatch = rawStr.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1].replace(/,/g, ''));
    if (!isNaN(val)) {
      return `${symbol}${Math.round(val)} / day`;
    }
  }

  // Fallback: strip leading symbols and append / day if not present
  const cleanFallback = rawStr.replace(/^\$+/, '').replace(/\/ day$/i, '').trim();
  return `${symbol}${cleanFallback} / day`;
}
