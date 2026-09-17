import { requirePermission } from '@/lib/auth';
import PreviewFrame from '@/components/PreviewFrame';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({
  searchParams,
}: { searchParams: Promise<{ path?: string }> }) {
  await requirePermission('content.view');
  const { path } = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="serif text-[25px] font-semibold">Preview the site</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[75ch]">
          The real pages, including drafts and changes waiting for approval. Only signed-in staff
          can see this; visitors still see the published site.
        </p>
      </div>
      <PreviewFrame initialPath={path && path.startsWith('/') && !path.startsWith('//') ? path : '/'} />
    </div>
  );
}
