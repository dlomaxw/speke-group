'use client';

import { useState, useTransition } from 'react';
import { retryAlerts } from '@/app/admin/actions';

type Problem = {
  id: number; reference: string; state: string; attempts: number;
  lastError: string | null; nextAttemptAt: string;
};

/** Staff alert delivery: how many went out, what is waiting, what failed. */
export default function AlertQueue({
  configured, summary, problems, canRetry,
}: {
  configured: boolean;
  summary: { pending: number; processing: number; sent: number; failed: number };
  problems: Problem[];
  canRetry: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok?: string; error?: string }>({});
  const failed = problems.filter((p) => p.state === 'failed');
  const tone = !configured || summary.failed > 0
    ? 'bg-[#fff6e6] border-[#f0dcb0] text-[#6b5527]'
    : 'bg-white border-[#e6e9ee] text-[#38414f]';

  return (
    <div className={`rounded-xl border px-4 py-3 text-[13px] ${tone}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">Staff alerts</span>
        {!configured && <span>Email sending is not set up yet, so alerts are queued and nothing is sent.</span>}
        <span>{summary.sent} sent</span>
        <span>{summary.pending + summary.processing} waiting</span>
        <span className={summary.failed ? 'font-semibold text-[#b3261e]' : ''}>{summary.failed} failed</span>
        {problems.length > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="underline ml-auto">
            {open ? 'Hide' : 'Show'} queue
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {problems.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-white/70 rounded-lg px-3 py-2 border border-black/5">
              <span className="font-semibold">{p.reference}</span>
              <span className="uppercase text-[10.5px] font-bold tracking-wide">{p.state}</span>
              <span>{p.attempts} attempt{p.attempts === 1 ? '' : 's'}</span>
              {p.state === 'pending' && p.attempts > 0 && (
                <span>next try {new Date(p.nextAttemptAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {p.lastError && <span className="text-[#8a3a33] break-all">{p.lastError}</span>}
            </div>
          ))}
          {canRetry && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button" className="btn-ghost" disabled={pending}
                onClick={() => start(async () => setMessage(await retryAlerts(problems.map((p) => p.id))))}
              >
                {pending ? 'Retrying…' : `Retry ${failed.length ? `${failed.length} failed and ` : ''}waiting alerts now`}
              </button>
              {message.ok && <span className="text-[#1e6b34]">{message.ok}</span>}
              {message.error && <span className="text-[#b3261e]">{message.error}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
