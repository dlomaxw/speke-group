'use client';

import { useActionState } from 'react';
import { signInAction } from '../actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[#1f2733]">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <div className="serif text-[26px] font-semibold text-white">Speke Group</div>
          <div className="text-[12px] tracking-[0.2em] uppercase text-[#8a94a4] mt-1">
            Content dashboard
          </div>
        </div>

        <form action={formAction} className="card-surface p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold mb-1.5">Work email</label>
            <input
              id="email" name="email" type="email" required autoComplete="username"
              className="field" placeholder="you@spekegroup.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-semibold mb-1.5">Password</label>
            <input
              id="password" name="password" type="password" required autoComplete="current-password"
              className="field" placeholder="Your password"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-[13px] text-[#b3261e] bg-[#fdeceb] border border-[#f6c9c5] rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-[12px] text-[#7a8494] text-center pt-1">
            Trouble signing in? Contact IT.
          </p>
        </form>
      </div>
    </div>
  );
}
