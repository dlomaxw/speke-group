'use client';

import { useActionState } from 'react';
import { changeOwnPassword } from '@/app/admin/actions';

export default function PasswordForm({ mustChange }: { mustChange: boolean }) {
  const [state, formAction, pending] = useActionState(changeOwnPassword, {});

  return (
    <form action={formAction} className="card-surface p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-[16px]">Change your password</h2>
        {mustChange && (
          <p className="text-[13px] text-[#8a5a00] mt-1">
            This account is still on the password IT issued. Please set your own.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="current" className="block text-[13px] font-semibold mb-1.5">Current password</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
      </div>

      <div>
        <label htmlFor="next" className="block text-[13px] font-semibold mb-1.5">New password</label>
        <input id="next" name="next" type="password" required autoComplete="new-password" className="field"
               minLength={10} />
        <p className="text-[12px] text-[#7a8494] mt-1">At least 10 characters. Longer is better than complicated.</p>
      </div>

      <div>
        <label htmlFor="confirm" className="block text-[13px] font-semibold mb-1.5">New password again</label>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="field" />
      </div>

      {state.error && (
        <p role="alert" className="text-[13px] text-[#b3261e] bg-[#fdeceb] border border-[#f6c9c5] rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-[13px] text-[#1e6b34] bg-[#e6f4ea] border border-[#bfe0c9] rounded-lg px-3 py-2">
          {state.ok}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
