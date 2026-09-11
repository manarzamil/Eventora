import { compare, hash } from 'bcryptjs';

/**
 * bcrypt work factor. 12 is roughly 250 ms on current server hardware — slow
 * enough to make offline cracking expensive, fast enough that a login request
 * still feels instant.
 */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, COST);
}

export function verifyPassword(plain: string, digest: string): Promise<boolean> {
  return compare(plain, digest);
}

/**
 * A bcrypt digest of a throwaway value, used to burn the same amount of CPU on
 * a login attempt for an e-mail that does not exist as one for an e-mail that
 * does. Without it, response timing tells an attacker which accounts are real.
 */
export const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.NtjcMdM/RUYK5Rt9U0mQ9rEBb5fSNVe';
