import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { AuthLayout } from '@/components/auth-layout';
import { readSession } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };

export default async function SignUpPage() {
  if (await readSession()) redirect('/');

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes about twenty seconds, and you only need one to book."
    >
      <Suspense fallback={<div className="skeleton h-80 rounded-xl" />}>
        <AuthForm mode="sign-up" />
      </Suspense>
    </AuthLayout>
  );
}
