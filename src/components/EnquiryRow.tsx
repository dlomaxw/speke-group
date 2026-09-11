'use client';

import { useState, useTransition } from 'react';
import { updateEnquiry, deleteEnquiry } from '@/app/admin/actions';

type Enquiry = {
  id: number; name: string; email: string; phone: string | null;
  subject: string | null; message: string; kind: string;
  status: 'new' | 'assigned' | 'answered' | 'closed' | 'spam';
  assignedTo: number | null; internalNote: string | null; createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-[#fff1cf] text-[#7a5c00]',
  assigned: 'bg-[#e4edfb] text-[#1f4e8c]',
  answered: 'bg-[#e6f4ea] text-[#1e6b34]',
  closed: 'bg-[#eef1f5] text-[#5a6474]',
  spam: 'bg-[#fdeceb] text-[#b3261e]',
};

export default function EnquiryRow({
  enquiry, staff, canManage, canDelete,
}: {
  enquiry: Enquiry;
  staff: { id: number; name: string }[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [note, setNote] = useState(enquiry.internalNote ?? '');
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError(null);
      try { await fn(); } catch (e) {
        setError(e instanceof Error ? e.message : 'That did not work.');
      }
    });

  const when = new Date(enquiry.createdAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="card-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#fafbfc] transition-colors"
      >
        <span className={`shrink-0 mt-0.5 text-[10.5px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[enquiry.status]}`}>
          {enquiry.status}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold truncate">
            {enquiry.subject || 'No subject'}
          </span>
          <span className="block text-[12.5px] text-[#5a6474] truncate">
            {enquiry.name} · {enquiry.email} · {when}
          </span>
        </span>
        <span className="shrink-0 text-[#7a8494] text-[13px]">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-[#eef1f5] px-4 py-4 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-[13px]">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#7a8494] font-bold mb-0.5">From</div>
              <div>{enquiry.name}</div>
              <a href={`mailto:${enquiry.email}`} className="text-[color:var(--color-maroon)] hover:underline break-all">
                {enquiry.email}
              </a>
              {enquiry.phone && <div className="text-[#5a6474]">{enquiry.phone}</div>}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#7a8494] font-bold mb-0.5">Type</div>
              <div className="capitalize">{enquiry.kind}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#7a8494] font-bold mb-0.5">Received</div>
              <div>{when}</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#7a8494] font-bold mb-1">Message</div>
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap bg-[#f9fafb] border border-[#eef1f5] rounded-lg p-3">
              {enquiry.message}
            </p>
          </div>

          {canManage && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1">Status</label>
                <select
                  className="field" defaultValue={enquiry.status} disabled={pending}
                  onChange={(ev) => run(() => updateEnquiry(enquiry.id, { status: ev.target.value as Enquiry['status'] }))}
                >
                  {['new', 'assigned', 'answered', 'closed', 'spam'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Assigned to</label>
                <select
                  className="field" defaultValue={enquiry.assignedTo ?? ''} disabled={pending}
                  onChange={(ev) => run(() => updateEnquiry(enquiry.id, {
                    assignedTo: ev.target.value ? Number(ev.target.value) : null,
                    status: ev.target.value ? 'assigned' : undefined,
                  }))}
                >
                  <option value="">Nobody yet</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {canManage && (
            <div>
              <label className="block text-[12px] font-semibold mb-1">Internal note</label>
              <textarea
                className="field" rows={2} value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Only staff see this."
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button" className="btn-ghost" disabled={pending}
                  onClick={() => run(() => updateEnquiry(enquiry.id, { internalNote: note }))}
                >
                  {pending ? 'Saving…' : 'Save note'}
                </button>
                <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent('Re: ' + (enquiry.subject ?? 'Your enquiry'))}`}
                   className="btn-primary">
                  Reply by email
                </a>
                {canDelete && (
                  <button
                    type="button" disabled={pending}
                    onClick={() => run(() => deleteEnquiry(enquiry.id))}
                    className="text-[12.5px] text-[#7a8494] hover:text-[#b3261e] hover:underline ml-auto"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <p role="alert" className="text-[12.5px] text-[#b3261e]">{error}</p>}
        </div>
      )}
    </div>
  );
}
