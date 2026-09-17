'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveChange, rejectChange } from '@/app/admin/actions';

type Item = {
  id: number; collectionLabel: string; href: string; title: string; by: string; at: string;
  deleted: boolean; changes: { field: string; before: string; after: string }[];
};

export default function ReviewItem({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ ok?: string; error?: string }>({});

  const done = (r: { ok?: string; error?: string }) => {
    setMessage(r);
    if (r.ok) router.refresh();
  };

  return (
    <div className="card-surface p-4 space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] uppercase tracking-wide font-bold text-[#7a8494]">{item.collectionLabel}</span>
        <Link href={item.href} className="font-semibold text-[15px] text-[color:var(--color-maroon)] hover:underline">{item.title}</Link>
        <span className="text-[12.5px] text-[#5a6474]">
          by {item.by} · {new Date(item.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {item.deleted ? (
        <p className="text-[13px] text-[#b3261e]">The item was deleted after this change was proposed.</p>
      ) : item.changes.length === 0 ? (
        <p className="text-[13px] text-[#5a6474]">No visible differences from the live version.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#e6e9ee] text-[11px] uppercase tracking-wide text-[#7a8494]">
                <th className="py-1.5 pr-3 font-bold">Field</th>
                <th className="py-1.5 pr-3 font-bold">Live now</th>
                <th className="py-1.5 font-bold">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {item.changes.map((c) => (
                <tr key={c.field} className="border-b border-[#f1f3f6] align-top">
                  <td className="py-1.5 pr-3 font-semibold whitespace-nowrap">{c.field}</td>
                  <td className="py-1.5 pr-3 text-[#8a3a33] break-words max-w-[36ch]"><del>{c.before}</del></td>
                  <td className="py-1.5 text-[#1e6b34] break-words max-w-[36ch]">{c.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!item.deleted && (
          <button type="button" className="btn-primary" disabled={pending}
                  onClick={() => start(async () => done(await approveChange(item.id)))}>
            {pending ? 'Working…' : 'Approve and publish'}
          </button>
        )}
        {rejecting ? (
          <>
            <input className="field max-w-[320px]" placeholder="Why? The author sees this in the history."
                   aria-label="Reason for rejecting" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="btn-ghost" disabled={pending}
                    onClick={() => start(async () => done(await rejectChange(item.id, note)))}>
              Reject
            </button>
            <button type="button" className="text-[12.5px] text-[#5a6474] hover:underline" onClick={() => setRejecting(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn-ghost" onClick={() => setRejecting(true)}>Reject…</button>
        )}
        {message.error && <span role="alert" className="text-[13px] text-[#b3261e]">{message.error}</span>}
        {message.ok && <span className="text-[13px] text-[#1e6b34]">{message.ok}</span>}
      </div>
    </div>
  );
}
