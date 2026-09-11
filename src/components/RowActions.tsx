'use client';

import Link from 'next/link';
import { useTransition, useState } from 'react';
import { deleteRecord, setStatus } from '@/app/admin/actions';

export default function RowActions({
  collection, id, status, canEdit, canDelete, canPublish,
}: {
  collection: string;
  id: number;
  status?: 'draft' | 'published';
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError(null);
      try { await fn(); }
      catch (e) { setError(e instanceof Error ? e.message : 'That did not work.'); }
    });

  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-[12.5px] text-[#5a6474]">Delete for good?</span>
        <button
          type="button" disabled={pending}
          onClick={() => run(() => deleteRecord(collection, id))}
          className="text-[12.5px] font-semibold text-[#b3261e] hover:underline"
        >
          {pending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button type="button" onClick={() => setConfirming(false)}
                className="text-[12.5px] text-[#5a6474] hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      {error && <span className="text-[12px] text-[#b3261e]">{error}</span>}

      {canPublish && status && (
        <button
          type="button" disabled={pending}
          onClick={() => run(() => setStatus(collection, id, status === 'published' ? 'draft' : 'published'))}
          className="text-[12.5px] font-semibold text-[color:var(--color-maroon)] hover:underline"
        >
          {status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
      )}

      {canEdit && (
        <Link href={`/admin/${collection}/${id}`} className="text-[12.5px] font-semibold text-[#38414f] hover:underline">
          Edit
        </Link>
      )}

      {canDelete && (
        <button type="button" onClick={() => setConfirming(true)}
                className="text-[12.5px] text-[#7a8494] hover:text-[#b3261e] hover:underline">
          Delete
        </button>
      )}
    </div>
  );
}
