import clsx from 'clsx';
import { ShieldCheck } from 'lucide-react';
import { listUsers } from '@/server/services/admin-service';
import { readSession } from '@/server/auth/session';
import { ApiActionButton } from '@/components/admin/api-action-button';
import { AdminUserSearch } from '@/components/admin/admin-user-search';
import { formatLongDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Users' };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await readSession();

  const users = await listUsers(typeof params.q === 'string' ? params.q : undefined);
  const admins = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-950">Users</h2>
        <p className="mt-0.5 text-sm text-mist-600">
          {users.length} accounts · {admins} with administrator access
        </p>
      </div>

      <AdminUserSearch />

      <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-mist-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                <th scope="col" className="px-5 py-3 font-semibold">E-mail</th>
                <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Bookings</th>
                <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-mist-500">
                    No accounts match that search.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === session?.sub;
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-mist-50">
                      <td className="px-5 py-3 font-medium text-ink-900">
                        {user.fullName}
                        {isSelf && (
                          <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-700">
                            you
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-mist-700">{user.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold',
                            user.role === 'ADMIN'
                              ? 'bg-ink-900 text-white'
                              : 'bg-mist-200 text-mist-700',
                          )}
                        >
                          {user.role === 'ADMIN' && <ShieldCheck className="h-3 w-3" aria-hidden />}
                          {user.role.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                        {user.bookingCount}
                      </td>
                      <td className="px-5 py-3 text-xs text-mist-500">
                        {formatLongDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isSelf ? (
                          <span className="text-xs text-mist-400">—</span>
                        ) : (
                          <ApiActionButton
                            endpoint={`/api/admin/users/${user.id}`}
                            method="PATCH"
                            body={{ role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' }}
                            label={user.role === 'ADMIN' ? 'Revoke admin' : 'Make admin'}
                            variant="ghost"
                            confirmLabel={user.role === 'ADMIN' ? 'Revoke' : 'Promote'}
                            confirmMessage={
                              user.role === 'ADMIN'
                                ? 'Remove administrator access?'
                                : 'Grant full administrator access?'
                            }
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-mist-500">
        The API refuses to demote the last remaining administrator, and refuses to let an
        administrator remove their own access — both would lock everyone out of this dashboard.
      </p>
    </div>
  );
}
