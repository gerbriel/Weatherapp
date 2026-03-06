/**
 * sanitize.ts
 * Central input sanitization utilities.
 *
 * Rules applied by sanitizeText():
 *  - Trims leading/trailing whitespace
 *  - Collapses internal runs of whitespace to a single space
 *  - Strips all HTML/script tags
 *  - Removes null bytes and other C0/C1 control characters (except normal newlines/tabs)
 *  - Enforces an optional maximum length
 *
 * None of these functions escape for SQL — Supabase's JS client uses
 * parameterised queries, so SQL injection is already prevented at the
 * driver level. The goal here is XSS / stored-script prevention and
 * basic data hygiene.
 */

/** Strip HTML / script tags and dangerous characters from a plain-text field. */
export function sanitizeText(value: string, maxLength = 1000): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')           // strip all HTML tags
    .replace(/[^\x09\x0A\x0D\x20-\x7E\x80-\xFF\u0100-\uFFFF]/g, '') // remove control chars except tab/LF/CR
    .replace(/[ \t]+/g, ' ')           // collapse runs of spaces/tabs
    .trim()
    .slice(0, maxLength);
}

/** Sanitize a name field (single line, no newlines). */
export function sanitizeName(value: string, maxLength = 100): string {
  return sanitizeText(value.replace(/[\r\n]/g, ' '), maxLength);
}

/** Sanitize a multi-line notes / description field. */
export function sanitizeNotes(value: string, maxLength = 2000): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\x80-\xFF\u0100-\uFFFF]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Sanitize an email address — lowercase and strip whitespace. */
export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 254);
}

/** Sanitize a numeric string — allow digits, one decimal point, optional leading minus. */
export function sanitizeNumericString(value: string): string {
  return value.replace(/[^0-9.\-]/g, '').slice(0, 20);
}

/**
 * Clamp a parsed float to a valid Kc range [0, 2].
 * Returns NaN if the string is not a valid number.
 */
export function sanitizeKc(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(n)) return NaN;
  return Math.min(2, Math.max(0, n));
}

/** Clamp latitude to [-90, 90]. */
export function sanitizeLatitude(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(n)) return NaN;
  return Math.min(90, Math.max(-90, n));
}

/** Clamp longitude to [-180, 180]. */
export function sanitizeLongitude(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(n)) return NaN;
  return Math.min(180, Math.max(-180, n));
}

/** Sanitize a slug / org handle — lowercase alphanumeric + hyphens only. */
export function sanitizeSlug(value: string, maxLength = 60): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, maxLength);
}
