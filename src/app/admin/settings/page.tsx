import { asc } from 'drizzle-orm';
import { getDb } from '@/db';
import { settings, media } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can } from '@/lib/rbac';
import SettingsForm from '@/components/SettingsForm';
import VersionHistory from '@/components/VersionHistory';
import { listHistory } from '@/lib/versions';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const GROUP_LABELS: Record<string, { title: string; blurb: string }> = {
  homepage: { title: 'Homepage', blurb: 'The hero film, headline and the numbers in the story strip.' },
  contact:  { title: 'Contact details', blurb: 'Shown in the footer and on the contact page across the whole site.' },
  events:   { title: 'Events page', blurb: 'Headline and introduction for events and meetings.' },
  experiences: { title: 'Experiences page', blurb: 'Headline and introduction for dining and leisure.' },
  about:    { title: 'About us page', blurb: 'Story, history, the chairman’s message and photos. Leave a blank line between paragraphs.' },
  general:  { title: 'General', blurb: 'Site name, tagline and where enquiry alerts go. Separate several alert addresses with commas.' },
};

export default async function SettingsPage() {
  const user = await requirePermission('settings.view');
  const db = await getDb();

  const rows = await db.select().from(settings).orderBy(asc(settings.group), asc(settings.sortOrder));
  const library = await db
    .select({ url: media.url, filename: media.filename, alt: media.alt })
    .from(media).where(eq(media.rightsStatus, 'approved')).orderBy(desc(media.createdAt)).limit(60);
  const history = await listHistory('settings', 0);

  const groups = [...new Set(rows.map((r) => r.group))];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="serif text-[25px] font-semibold">Site settings</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[70ch]">
          Text and details that appear across the public site. A change here shows up everywhere
          that detail is used.
        </p>
      </div>

      <SettingsForm
        groups={groups.map((g) => ({
          key: g,
          title: GROUP_LABELS[g]?.title ?? g,
          blurb: GROUP_LABELS[g]?.blurb ?? '',
          items: rows.filter((r) => r.group === g).map((r) => ({
            key: r.key, label: r.label, value: r.value ?? '',
            valueType: r.valueType, helpText: r.helpText,
          })),
        }))}
        canEdit={can(user.role, 'settings.edit')}
        mediaOptions={library}
      />

      <VersionHistory
        title="Settings history"
        versions={history.map((v) => ({
          id: v.id, action: v.action, state: v.state, userEmail: v.userEmail,
          createdAt: v.createdAt.toISOString(), note: v.note,
        }))}
        canRestore={can(user.role, 'settings.edit')}
      />
    </div>
  );
}
