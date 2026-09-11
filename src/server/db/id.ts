import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Collision-resistant, URL-safe, sortable-enough identifier.
 *
 * Format: `<base36 timestamp><16 random base36 chars>` — 24 characters.
 * The timestamp prefix keeps freshly created rows physically clustered in the
 * primary-key B-tree, which UUIDv4 does not do; the random suffix makes the
 * identifier unguessable, which a bare auto-increment integer is not.
 */
export function createId(): string {
  const time = Date.now().toString(36).padStart(8, '0');
  const bytes = randomBytes(16);
  let random = '';
  for (const byte of bytes) {
    random += ALPHABET[byte % ALPHABET.length];
  }
  return `${time}${random}`;
}

/**
 * Human-facing booking reference, e.g. `EVT-7K2QX4`.
 * Uses an alphabet without the visually ambiguous 0/O/1/I characters so the
 * reference can be read aloud or copied from a printed confirmation.
 */
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createBookingReference(): string {
  const bytes = randomBytes(6);
  let code = '';
  for (const byte of bytes) {
    code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `EVT-${code}`;
}
