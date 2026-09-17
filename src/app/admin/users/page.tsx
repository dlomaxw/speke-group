import { asc } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, properties, userProperties } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can, ROLE_LABELS, ROLE_BLURB } from '@/lib/rbac';
import UserManager from '@/components/UserManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const me = await requirePermission('users.view');
  const db = await getDb();
  const rows = await db.select().from(users).orderBy(asc(users.name));
  const propertyRows = await db.select({ id: properties.id, name: properties.name })
    .from(properties).orderBy(asc(properties.sortOrder));
  const links = await db.select().from(userProperties);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="serif text-[25px] font-semibold">Staff &amp; roles</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[70ch]">
          Who can sign in to this dashboard and what each of them may do.
        </p>
      </div>

      <div className="card-surface p-5">
        <h2 className="font-semibold text-[15px] mb-3">What the roles mean</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((r) => (
            <div key={r} className="text-[13px]">
              <dt className="font-semibold">{ROLE_LABELS[r]}</dt>
              <dd className="text-[#5a6474]">{ROLE_BLURB[r]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <UserManager
        users={rows.map((u) => ({
          id: u.id, email: u.email, name: u.name, role: u.role,
          department: u.department, isActive: u.isActive,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          propertyScope: u.propertyScope,
          propertyIds: links.filter((l) => l.userId === u.id).map((l) => l.propertyId),
          totpEnabled: Boolean(u.totpEnabledAt),
        }))}
        properties={propertyRows}
        canManage={can(me.role, 'users.manage')}
        currentUserId={me.id}
      />
    </div>
  );
}
