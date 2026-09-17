'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateEnquiry, deleteEnquiry } from '@/app/admin/actions';

type Stage = 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'spam';

type Enquiry = {
  id: number; reference: string; name: string; email: string | null; phone: string | null;
  subject: string | null; message: string; kind: string; status: Stage;
  assignedTo: number | null; internalNote: string | null;
  propertyName: string; contactMethod: string;
  arrivalDate: string | null; departureDate: string | null; guests: number | null;
  marketingOptIn: boolean; conversionReference: string | null;
  createdAt: string; firstHumanReplyAt: string | null; alertState: string | null;
};

const STAGES: Stage[] = ['new', 'assigned', 'contacted', 'qualified', 'converted', 'lost', 'spam'];

const STAGE_STYLE: Record<Stage, string> = {
  new: 'bg-[#fff1cf] text-[#7a5c00]',
  assigned: 'bg-[#e4edfb] text-[#1f4e8c]',
  contacted: 'bg-[#e8f1fb] text-[#23557f]',
  qualified: 'bg-[#efe6fb] text-[#5a2f8c]',
  converted: 'bg-[#e6f4ea] text-[#1e6b34]',
  lost: 'bg-[#eef1f5] text-[#5a6474]',
  spam: 'bg-[#fdeceb] text-[#b3261e]',
};

/** "2h 14m" style duration. */
function span(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function ReplyClock({ createdAt, repliedAt, closed }: { createdAt: string; repliedAt: string | null; closed: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const start = new Date(createdAt).getTime();
  if (repliedAt) {
    return <span className="text-[#1e6b34]">First reply after {span(new Date(repliedAt).getTime() - start)}</span>;
  }
  if (closed || now === null) return null;
  const waited = now - start;
  const late = waited > 4 * 60 * 60 * 1000;
  return (
    <span className={late ? 'text-[#b3261e] font-semibold' : 'text-[#7a5c00]'}>
      Waiting {span(waited)} for a reply
    </span>
  );
}

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
  const [bookingRef, setBookingRef] = useState(enquiry.conversionReference ?? '');
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
  const closed = ['converted', 'lost', 'spam'].includes(enquiry.status);
  const label = (t: string) => (
    <div className="text-[11px] uppercase tracking-wide text-[#7a8494] font-bold mb-0.5">{t}</div>
  );

  return (
    <div className="card-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#fafbfc] transition-colors"
      >
        <span className={`shrink-0 mt-0.5 text-[10.5px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${STAGE_STYLE[enquiry.status]}`}>
          {enquiry.status}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold truncate">
            {enquiry.reference} · {enquiry.propertyName} · {enquiry.kind}
          </span>
          <span className="block text-[12.5px] text-[#5a6474] truncate">
            {enquiry.name} · {when}
            {enquiry.arrivalDate ? ` · ${enquiry.arrivalDate} → ${enquiry.departureDate ?? '?'}` : ''}
          </span>
          <span className="block text-[12px] mt-0.5">
            <ReplyClock createdAt={enquiry.createdAt} repliedAt={enquiry.firstHumanReplyAt} closed={closed} />
          </span>
        </span>
        <span className="shrink-0 text-[#7a8494] text-[13px]">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-[#eef1f5] px-4 py-4 space-y-4">
          <div className="grid sm:grid-cols-4 gap-3 text-[13px]">
            <div>
              {label('From')}
              <div>{enquiry.name}</div>
              {enquiry.email && (
                <a href={`mailto:${enquiry.email}`} className="text-[color:var(--color-maroon)] hover:underline break-all">
                  {enquiry.email}
                </a>
              )}
              {enquiry.phone && <div className="text-[#5a6474]">{enquiry.phone}</div>}
            </div>
            <div>
              {label('Reply by')}
              <div className="capitalize">{enquiry.contactMethod}</div>
              {label('Marketing')}
              <div>{enquiry.marketingOptIn ? 'Opted in' : 'Not opted in'}</div>
            </div>
            <div>
              {label('Stay')}
              <div>{enquiry.arrivalDate ? `${enquiry.arrivalDate} to ${enquiry.departureDate ?? '?'}` : 'No dates given'}</div>
              <div className="text-[#5a6474]">{enquiry.guests ? `${enquiry.guests} guest${enquiry.guests === 1 ? '' : 's'}` : 'Guests not given'}</div>
            </div>
            <div>
              {label('Staff alert')}
              <div className="capitalize">{enquiry.alertState ?? 'none'}</div>
            </div>
          </div>

          {enquiry.subject && (
            <div className="text-[13px]">{label('Subject')}{enquiry.subject}</div>
          )}

          <div>
            {label('Message')}
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap bg-[#f9fafb] border border-[#eef1f5] rounded-lg p-3">
              {enquiry.message}
            </p>
          </div>

          {canManage && (
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1" htmlFor={`st-${enquiry.id}`}>Stage</label>
                <select
                  id={`st-${enquiry.id}`}
                  className="field" defaultValue={enquiry.status} disabled={pending}
                  onChange={(ev) => {
                    const next = ev.target.value as Stage;
                    run(() => updateEnquiry(enquiry.id, { status: next, conversionReference: bookingRef }));
                  }}
                >
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" htmlFor={`as-${enquiry.id}`}>Owner</label>
                <select
                  id={`as-${enquiry.id}`}
                  className="field" defaultValue={enquiry.assignedTo ?? ''} disabled={pending}
                  onChange={(ev) => run(() => updateEnquiry(enquiry.id, {
                    assignedTo: ev.target.value ? Number(ev.target.value) : null,
                    status: ev.target.value && enquiry.status === 'new' ? 'assigned' : undefined,
                  }))}
                >
                  <option value="">Nobody yet</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1" htmlFor={`br-${enquiry.id}`}>Booking reference</label>
                <input
                  id={`br-${enquiry.id}`} className="field" value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  onBlur={() => bookingRef !== (enquiry.conversionReference ?? '')
                    && run(() => updateEnquiry(enquiry.id, { conversionReference: bookingRef }))}
                  placeholder="Needed to mark converted"
                />
              </div>
            </div>
          )}

          {canManage && (
            <div>
              <label className="block text-[12px] font-semibold mb-1" htmlFor={`nt-${enquiry.id}`}>Internal note</label>
              <textarea
                id={`nt-${enquiry.id}`}
                className="field" rows={2} value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Only staff see this."
              />
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button" className="btn-ghost" disabled={pending}
                  onClick={() => run(() => updateEnquiry(enquiry.id, { internalNote: note }))}
                >
                  {pending ? 'Saving…' : 'Save note'}
                </button>
                {!enquiry.firstHumanReplyAt && (
                  <button
                    type="button" className="btn-ghost" disabled={pending}
                    onClick={() => run(() => updateEnquiry(enquiry.id, {
                      markReplied: true,
                      status: ['new', 'assigned'].includes(enquiry.status) ? 'contacted' : undefined,
                    }))}
                  >
                    I have replied
                  </button>
                )}
                {enquiry.email && (
                  <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: your enquiry ${enquiry.reference}`)}`}
                     className="btn-primary">
                    Reply by email
                  </a>
                )}
                {enquiry.phone && enquiry.contactMethod === 'whatsapp' && (
                  <a href={`https://wa.me/${enquiry.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer"
                     className="btn-ghost">
                    Open WhatsApp
                  </a>
                )}
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
