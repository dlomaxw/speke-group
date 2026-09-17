'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { beginMfaEnrolment, confirmMfaEnrolment, disableOwnMfa } from '@/app/admin/actions';

export default function MfaSetup({ enabled, required }: { enabled: boolean; required: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [enrolment, setEnrolment] = useState<{ sealed: string; qrDataUrl: string; secretBase32: string } | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok?: string; error?: string }>({});

  if (enabled && !enrolment) {
    return (
      <div className="card-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#1e6b34]">On</span>
          <span className="text-[13.5px]">Two-step sign-in is protecting this account.</span>
        </div>
        {message.ok && <p className="text-[13px] text-[#1e6b34]">{message.ok}</p>}
        {!required && (
          <form
            className="flex flex-wrap items-end gap-2"
            action={() => start(async () => {
              const r = await disableOwnMfa(code);
              setMessage(r);
              if (r.ok) router.refresh();
            })}
          >
            <div>
              <label htmlFor="off-code" className="block text-[12px] font-semibold mb-1">Current code to turn it off</label>
              <input id="off-code" className="field w-[140px]" inputMode="numeric" autoComplete="one-time-code"
                     value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button type="submit" className="btn-ghost" disabled={pending}>Turn off</button>
          </form>
        )}
        {message.error && <p role="alert" className="text-[13px] text-[#b3261e]">{message.error}</p>}
      </div>
    );
  }

  if (!enrolment) {
    return (
      <div className="card-surface p-5 space-y-3">
        <p className="text-[13.5px]">Two-step sign-in is off for this account.</p>
        <button
          type="button" className="btn-primary" disabled={pending}
          onClick={() => start(async () => { setMessage({}); setEnrolment(await beginMfaEnrolment()); })}
        >
          {pending ? 'Preparing…' : 'Set up two-step sign-in'}
        </button>
      </div>
    );
  }

  return (
    <div className="card-surface p-5 space-y-4">
      <ol className="list-decimal pl-5 space-y-3 text-[13.5px]">
        <li>
          Scan this code with your authenticator app.
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolment.qrDataUrl} alt="QR code to add the Speke Group dashboard to an authenticator app"
               width={220} height={220} className="mt-2 rounded-lg border border-[#e6e9ee]" />
          <details className="mt-2 text-[12.5px] text-[#5a6474]">
            <summary className="cursor-pointer">Can’t scan? Enter this key instead</summary>
            <code className="block mt-1 break-all bg-[#f4f6f8] rounded px-2 py-1 text-[13px] tracking-wider">
              {enrolment.secretBase32.replace(/(.{4})/g, '$1 ').trim()}
            </code>
          </details>
        </li>
        <li>
          Enter the 6-digit code the app shows.
          <form
            className="flex flex-wrap items-end gap-2 mt-2"
            action={() => start(async () => {
              const r = await confirmMfaEnrolment(enrolment.sealed, code);
              setMessage(r);
              if (r.ok) {
                setEnrolment(null);
                setCode('');
                router.refresh();
              }
            })}
          >
            <input className="field w-[160px] text-center tracking-[0.25em]" aria-label="6-digit code"
                   inputMode="numeric" autoComplete="one-time-code" maxLength={7}
                   value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Checking…' : 'Turn on'}
            </button>
          </form>
        </li>
      </ol>
      {message.error && <p role="alert" className="text-[13px] text-[#b3261e]">{message.error}</p>}
    </div>
  );
}
