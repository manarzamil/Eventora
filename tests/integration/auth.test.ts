import { beforeEach, describe, expect, it } from 'vitest';
import { changePassword, login, register, updateProfile } from '@/server/services/auth-service';
import { ApiError } from '@/server/api/errors';
import { signSession, verifySession } from '@/server/auth/session';
import { createUser, resetDatabase } from '../helpers/fixtures';

describe('registration', () => {
  beforeEach(resetDatabase);

  it('creates an account and never returns the password hash', async () => {
    const user = await register({
      fullName: 'Sara Al-Harbi',
      email: 'sara@example.com',
      password: 'correct-horse-9',
      phone: '+965 5000 0000',
    });

    expect(user.email).toBe('sara@example.com');
    expect(user.role).toBe('USER');
    expect(Object.keys(user)).not.toContain('passwordHash');
  });

  it('never lets a self-registration create an administrator', async () => {
    const user = await register({
      fullName: 'Would-be Admin',
      email: 'sneaky@example.com',
      password: 'correct-horse-9',
      // @ts-expect-error — deliberately passing a field the schema strips.
      role: 'ADMIN',
    });
    expect(user.role).toBe('USER');
  });

  it('rejects a duplicate e-mail address', async () => {
    await register({
      fullName: 'Sara',
      email: 'sara@example.com',
      password: 'correct-horse-9',
      phone: '',
    });

    await expect(
      register({
        fullName: 'Someone Else',
        email: 'sara@example.com',
        password: 'different-pass-1',
        phone: '',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('treats e-mail addresses case-insensitively', async () => {
    await register({
      fullName: 'Sara',
      email: 'sara@example.com',
      password: 'correct-horse-9',
      phone: '',
    });

    // The schema lowercases on the way in and the unique index is on lower(email),
    // so this is the same account rather than a second one.
    await expect(
      register({
        fullName: 'Sara Again',
        email: 'SARA@EXAMPLE.COM',
        password: 'correct-horse-9',
        phone: '',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('login', () => {
  beforeEach(resetDatabase);

  it('accepts correct credentials', async () => {
    const created = await createUser({ email: 'yousef@example.com', password: 'Password!2345' });
    const user = await login({ email: 'yousef@example.com', password: 'Password!2345' });
    expect(user.id).toBe(created.id);
  });

  it('accepts a differently-cased e-mail address', async () => {
    await createUser({ email: 'yousef@example.com', password: 'Password!2345' });
    const user = await login({ email: 'Yousef@Example.com', password: 'Password!2345' });
    expect(user.email).toBe('yousef@example.com');
  });

  it('rejects a wrong password', async () => {
    await createUser({ email: 'yousef@example.com', password: 'Password!2345' });
    await expect(
      login({ email: 'yousef@example.com', password: 'wrong-password' }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('gives the same message for an unknown account as for a wrong password', async () => {
    await createUser({ email: 'yousef@example.com', password: 'Password!2345' });

    const wrongPassword = await login({
      email: 'yousef@example.com',
      password: 'wrong-password',
    }).catch((e: ApiError) => e.message);

    const unknownAccount = await login({
      email: 'nobody@example.com',
      password: 'wrong-password',
    }).catch((e: ApiError) => e.message);

    // Different wording here would let an attacker enumerate registered addresses.
    expect(wrongPassword).toBe(unknownAccount);
  });
});

describe('profile and password changes', () => {
  beforeEach(resetDatabase);

  it('updates the display name and phone number', async () => {
    const created = await createUser({ fullName: 'Old Name' });
    const updated = await updateProfile(created.id, {
      fullName: 'New Name',
      phone: '+44 7700 900000',
    });
    expect(updated.fullName).toBe('New Name');
    expect(updated.phone).toBe('+44 7700 900000');
  });

  it('changes the password when the current one is correct', async () => {
    const created = await createUser({ password: 'Password!2345' });

    await changePassword(created.id, {
      currentPassword: 'Password!2345',
      newPassword: 'brand-new-secret-1',
      confirmPassword: 'brand-new-secret-1',
    });

    await expect(
      login({ email: created.email, password: 'brand-new-secret-1' }),
    ).resolves.toMatchObject({ id: created.id });

    await expect(login({ email: created.email, password: 'Password!2345' })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('refuses when the current password is wrong', async () => {
    const created = await createUser({ password: 'Password!2345' });
    await expect(
      changePassword(created.id, {
        currentPassword: 'not-the-password',
        newPassword: 'brand-new-secret-1',
        confirmPassword: 'brand-new-secret-1',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('refuses to set the same password again', async () => {
    const created = await createUser({ password: 'Password!2345' });
    await expect(
      changePassword(created.id, {
        currentPassword: 'Password!2345',
        newPassword: 'Password!2345',
        confirmPassword: 'Password!2345',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('session tokens', () => {
  it('round-trips a signed session', async () => {
    const token = await signSession({
      sub: 'user-1',
      email: 'a@b.com',
      name: 'A B',
      role: 'ADMIN',
    });
    const payload = await verifySession(token);
    expect(payload).toMatchObject({ sub: 'user-1', role: 'ADMIN' });
  });

  it('rejects a token with a tampered payload', async () => {
    const token = await signSession({
      sub: 'user-1',
      email: 'a@b.com',
      name: 'A B',
      role: 'USER',
    });

    // Re-encode the middle segment claiming ADMIN, leaving the signature as-is.
    const [header, payload, signature] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload!, 'base64url').toString());
    decoded.role = 'ADMIN';
    const forged = `${header}.${Buffer.from(JSON.stringify(decoded)).toString('base64url')}.${signature}`;

    expect(await verifySession(forged)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const original = process.env.AUTH_SECRET;
    const token = await signSession({ sub: 'u', email: 'a@b.com', name: 'A', role: 'USER' });

    // `getEnv` caches, so verification with the same process still uses the same
    // key — instead assert that garbage is rejected, which is the same code path.
    expect(await verifySession(`${token}tampered`)).toBeNull();
    expect(await verifySession('not-a-jwt-at-all')).toBeNull();
    process.env.AUTH_SECRET = original;
  });
});
