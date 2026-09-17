import '../globals.css';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { COLLECTIONS } from '@/lib/collections';
import { getDb } from '@/db';
import { enquiries, contentVersions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { signOutAction } from './actions';
import AdminNav from '@/components/AdminNav';

export const metadata = { title: 'Speke Group — Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  // The login screen renders inside this layout but without the chrome.
  if (!user) return <div className="admin-surface min-h-screen">{children}</div>;

  let newEnquiries = 0;
  try {
    const db = await getDb();
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enquiries)
      .where(eq(enquiries.status, 'new'));
    newEnquiries = Number(row?.count ?? 0);
  } catch { /* a fresh database with no tables yet shouldn't break the shell */ }

  let pendingChanges = 0;
  if (can(user.role, 'content.publish')) {
    try {
      const db = await getDb();
      const [row] = await db.select({ count: sql<number>`count(*)` }).from(contentVersions)
        .where(eq(contentVersions.state, 'pending'));
      pendingChanges = Number(row?.count ?? 0);
    } catch { /* see above */ }
  }

  const contentLinks = COLLECTIONS.map((c) => ({ href: `/admin/${c.slug}`, label: c.label }));

  return (
    <div className="admin-surface min-h-screen flex">
      <AdminNav
        user={user}
        contentLinks={contentLinks}
        newEnquiries={newEnquiries}
        pendingChanges={pendingChanges}
        showReview={can(user.role, 'content.publish')}
        showEnquiries={can(user.role, 'enquiries.view')}
        showUsers={can(user.role, 'users.view')}
        showSettings={can(user.role, 'settings.view')}
        showActivity={can(user.role, 'activity.view')}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-[#e6e9ee] bg-white flex items-center justify-between px-5 gap-4 sticky top-0 z-20">
          <Link href="/" target="_blank" className="text-[13px] text-[#5a6474] hover:text-[color:var(--color-maroon)]">
            View the live site ↗
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-[13px] font-semibold">{user.name}</div>
              <div className="text-[11px] text-[#7a8494] capitalize">{user.role}</div>
            </div>
            <form action={signOutAction}>
              <button className="btn-ghost" type="submit">Sign out</button>
            </form>
          </div>
        </header>

        {user.mustChangePassword && (
          <div className="bg-[#fff6e6] border-b border-[#f0dcb0] px-5 py-2.5 text-[13px] text-[#6b5527]">
            Please{' '}
            <Link href="/admin/account" className="underline font-semibold">set a new password</Link>
            {' '}— this account is still using the one IT issued.
          </div>
        )}

        <main className="flex-1 p-5 sm:p-7 max-w-[1400px] w-full">{children}</main>
      </div>
    </div>
  );
}
