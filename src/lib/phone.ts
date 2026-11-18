export interface LiberianPhoneResult {
  valid: boolean;
  normalized: string;
  display: string;
  telHref: string;
  error?: string;
}

/**
 * Validates and normalizes Liberian telephone numbers into E.164 (+231XXXXXXXXX).
 * Supported inputs:
 * - 0770123456 / 0886123456 / 0555123456 (10 digits starting with 0)
 * - +231770123456 / 231770123456 / 00231770123456 (with or without spaces/hyphens)
 * - 770123456 (9 local digits without leading 0)
 */
export function normalizeLiberianPhone(rawInput: string | null | undefined): LiberianPhoneResult {
  const raw = typeof rawInput === 'string' ? rawInput.trim() : '';
  if (!raw) {
    return {valid: false, normalized: '', display: '', telHref: ''};
  }

  // Strip spaces, hyphens, parentheses, and dots
  let cleaned = raw.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('00231')) {
    cleaned = '+231' + cleaned.slice(5);
  } else if (cleaned.startsWith('+2310')) {
    cleaned = '+231' + cleaned.slice(5);
  } else if (cleaned.startsWith('+231')) {
    // already +231...
  } else if (cleaned.startsWith('231')) {
    cleaned = '+231' + cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = '+231' + cleaned.slice(1);
  } else if (/^[2-9]\d{8}$/.test(cleaned)) {
    cleaned = '+231' + cleaned;
  }

  // Must match +231 followed by 9 local digits starting 2..9 (e.g., 77, 88, 55, 22, 33)
  if (!/^\+231[2-9]\d{8}$/.test(cleaned)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      telHref: '',
      error: 'Enter a valid Liberian phone number (e.g., 077 012 3456 or +231 77 012 3456).',
    };
  }

  const local = cleaned.slice(4); // 9 digits
  const display = `+231 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  return {
    valid: true,
    normalized: cleaned,
    display,
    telHref: `tel:${cleaned}`,
  };
}
