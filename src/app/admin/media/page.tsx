import { desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { media } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { storageConfigured } from '@/lib/storage';
import MediaLibrary from '@/components/MediaLibrary';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const user = await requirePermission('media.view');
  const db = await getDb();
  const files = await db.select().from(media).orderBy(desc(media.createdAt)).limit(200);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="serif text-[25px] font-semibold">Images &amp; video</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[70ch]">
          Everything uploaded here can be picked from any photo field. Images work best at
          about 1600 pixels wide; keep hero video under 3 MB so the homepage stays quick.
        </p>
      </div>

      {!storageConfigured() && (
        <p role="alert" className="text-[13px] text-[#8a5a00] bg-[#fff6e6] border border-[#f0dcb0] rounded-lg px-3 py-2">
          Media storage is not configured on this environment, so uploads will fail. Ask IT to add the storage keys.
        </p>
      )}

      <MediaLibrary
        files={files.map((f) => ({
          id: f.id, url: f.url, filename: f.filename,
          contentType: f.contentType, bytes: f.bytes, alt: f.alt,
          createdAt: f.createdAt.toISOString(),
        }))}
        canUpload={can(user.role, 'media.upload')}
        canDelete={can(user.role, 'media.delete')}
      />
    </div>
  );
}
