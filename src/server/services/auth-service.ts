import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { DUMMY_HASH, hashPassword, verifyPassword } from '@/server/auth/password';
import { badRequest, conflict, notFound, unauthenticated } from '@/server/api/errors';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/lib/validation';
import type { Role } from '@/server/db/schema';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

function toPublicUser(row: {
  id: string; email: string; full_name: string; phone: string | null;
  role: Role; created_at: Date;
}): PublicUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Registration                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `lower()` is applied to BOTH sides of every e-mail comparison here, even
 * though the Zod schema already lowercases the input. The schema protects the
 * HTTP boundary; these functions are also called directly by the test suite and
 * by seeding, and an address should behave identically however it arrives.
 */
export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = await db.execute<{ id: string }>(sql`
    select id from users where lower(email) = lower(${input.email}) limit 1
  `);
  if (existing.length > 0) {
    throw conflict('An account with that e-mail address already exists.');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const [row] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        fullName: input.fullName,
        phone: input.phone ? input.phone : null,
        role: 'USER',
      })
      .returning();

    return toPublicUser({
      id: row!.id,
      email: row!.email,
      full_name: row!.fullName,
      phone: row!.phone,
      role: row!.role,
      created_at: row!.createdAt,
    });
  } catch (error) {
    // The SELECT above is a courtesy; the unique index is the guarantee. Two
    // simultaneous registrations for the same address land here.
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw conflict('An account with that e-mail address already exists.');
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Verifies credentials.
 *
 * A wrong e-mail and a wrong password produce the identical message, and the
 * bcrypt comparison runs against a dummy hash when the account does not exist so
 * that both paths take the same time. Together those close the two channels —
 * message text and response latency — by which an attacker could enumerate which
 * e-mail addresses are registered.
 */
export async function login(input: LoginInput): Promise<PublicUser> {
  const rows = await db.execute<{
    id: string; email: string; full_name: string; phone: string | null;
    role: Role; created_at: Date; password_hash: string;
  }>(sql`
    select id, email, full_name, phone, role, created_at, password_hash
    from users where lower(email) = lower(${input.email}) limit 1
  `);

  const row = rows[0];
  const digest = row?.password_hash ?? DUMMY_HASH;
  const valid = await verifyPassword(input.password, digest);

  if (!row || !valid) {
    throw unauthenticated('That e-mail address and password do not match.');
  }
  return toPublicUser(row);
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

export async function getUserById(id: string): Promise<PublicUser> {
  const rows = await db.execute<{
    id: string; email: string; full_name: string; phone: string | null;
    role: Role; created_at: Date;
  }>(sql`select id, email, full_name, phone, role, created_at from users where id = ${id} limit 1`);
  const row = rows[0];
  if (!row) throw notFound('That account no longer exists.');
  return toPublicUser(row);
}

export async function updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser> {
  await db
    .update(users)
    .set({
      fullName: input.fullName,
      phone: input.phone ? input.phone : null,
      updatedAt: new Date(),
    })
    .where(sql`${users.id} = ${id}`);
  return getUserById(id);
}

export async function changePassword(id: string, input: ChangePasswordInput): Promise<void> {
  const rows = await db.execute<{ password_hash: string }>(sql`
    select password_hash from users where id = ${id} limit 1
  `);
  const row = rows[0];
  if (!row) throw notFound('That account no longer exists.');

  const valid = await verifyPassword(input.currentPassword, row.password_hash);
  if (!valid) throw badRequest('Your current password is not correct.');

  const same = await verifyPassword(input.newPassword, row.password_hash);
  if (same) throw badRequest('Choose a password you have not used here before.');

  const passwordHash = await hashPassword(input.newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(sql`${users.id} = ${id}`);
}
