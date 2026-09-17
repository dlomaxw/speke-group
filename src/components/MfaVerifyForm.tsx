'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { verifyMfaAction } from '@/app/admin/actions';

export default function MfaVerifyForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(verifyMfaAction, {});

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[#1f2733]">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <span className="inline-block rounded-xl bg-[color:var(--color-cream)] px-4 py-3 shadow-lg">
            <Image src="/brand/speke-logo.png" alt="Speke Group" width={180} height={113} priority className="h-[54px] w-auto" />
          </span>
          <div className="text-[12px] tracking-[0.2em] uppercase text-[#8a94a4] mt-4">Two-step sign-in</div>
        </div>

        <form action={formAction} className="card-surface p-6 space-y-4">
          <p className="text-[13.5px] text-[#38414f]">
            Open your authenticator app and enter the 6-digit code for <strong>{email}</strong>.
          </p>
          <div>
            <label htmlFor="code" className="block text-[13px] font-semibold mb-1.5">Code</label>
            <input
              id="code" name="code" required autoFocus
              inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7}
              className="field text-center text-[20px] tracking-[0.3em]" placeholder="123456"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-[13px] text-[#b3261e] bg-[#fdeceb] border border-[#f6c9c5] rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Checking…' : 'Continue'}
          </button>
          <p className="text-[12px] text-[#7a8494] text-center pt-1">
            Lost your phone? Ask IT to reset two-step sign-in. <Link href="/admin/login" className="underline">Start again</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
