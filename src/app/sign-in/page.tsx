import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { AuthLayout } from '@/components/auth-layout';
import { readSession } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function SignInPage() {
  if (await readSession()) redirect('/');

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your bookings, favourites and account settings."
      showDemoAccounts
    >
      <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </AuthLayout>
  );
}
