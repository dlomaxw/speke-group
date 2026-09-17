'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { restoreVersion } from '@/app/admin/actions';

type Version = {
  id: number; action: string; state: string; userEmail: string | null;
  createdAt: string; note: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  created: 'Created', updated: 'Edited', published: 'Published', unpublished: 'Unpublished',
  deleted: 'Deleted', restored: 'Restored', approved: 'Change approved', proposed: 'Change proposed',
  original: 'Original version',
};

export default function VersionHistory({
  versions, canRestore, title = 'History',
}: { versions: Version[]; canRestore: boolean; title?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok?: string; error?: string }>({});

  return (
    <div className="card-surface p-5 max-w-[760px]">
      <h2 className="font-semibold text-[15px]">{title}</h2>
      <p className="text-[12.5px] text-[#7a8494] mt-0.5 mb-3">
        Every saved state is kept. {canRestore ? 'Restoring puts that version live and keeps the current one in history too.' : 'A manager can restore an earlier version.'}
      </p>

      {versions.length === 0 ? (
        <p className="text-[13px] text-[#7a8494]">No history yet. It starts with the next save.</p>
      ) : (
        <ul className="divide-y divide-[#eef1f5]">
          {versions.map((v, i) => (
            <li key={v.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <span className="font-semibold">{ACTION_LABEL[v.action] ?? v.action}</span>
              {v.state !== 'history' && (
                <span className="text-[10.5px] uppercase font-bold tracking-wide text-[#7a5c00]">{v.state}</span>
              )}
              <span className="text-[#5a6474]">
                {new Date(v.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[#7a8494]">{v.userEmail ?? 'system'}</span>
              {v.note && <span className="text-[#7a8494]">· {v.note}</span>}
              {i === 0 && v.state === 'history' && v.action !== 'deleted' && (
                <span className="text-[11px] text-[#1e6b34] font-semibold">current</span>
              )}
              {canRestore && v.state === 'history' && !(i === 0 && v.action !== 'deleted') && (
                confirm === v.id ? (
                  <span className="ml-auto flex items-center gap-2">
                    <button
                      type="button" disabled={pending}
                      className="text-[12.5px] font-semibold text-[color:var(--color-maroon)] hover:underline"
                      onClick={() => start(async () => {
                        const r = await restoreVersion(v.id);
                        setMessage(r);
                        setConfirm(null);
                        if (r.ok) router.refresh();
                      })}
                    >
                      {pending ? 'Restoring…' : 'Yes, restore'}
                    </button>
                    <button type="button" className="text-[12.5px] text-[#5a6474] hover:underline" onClick={() => setConfirm(null)}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button type="button" className="ml-auto text-[12.5px] font-semibold text-[#38414f] hover:underline"
                          onClick={() => setConfirm(v.id)}>
                    Restore this version
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
      {message.ok && <p className="text-[13px] text-[#1e6b34] mt-2">{message.ok}</p>}
      {message.error && <p role="alert" className="text-[13px] text-[#b3261e] mt-2">{message.error}</p>}
    </div>
  );
}
