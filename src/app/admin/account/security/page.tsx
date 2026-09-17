import { requireUser } from '@/lib/auth';
import { mfaRequiredFor } from '@/lib/mfa';
import MfaSetup from '@/components/MfaSetup';

export const dynamic = 'force-dynamic';

export default async function SecurityPage({
  searchParams,
}: { searchParams: Promise<{ required?: string }> }) {
  const user = await requireUser({ allowWithoutMfa: true });
  const { required } = await searchParams;
  const mustHave = mfaRequiredFor(user.role);

  return (
    <div className="space-y-5 max-w-[620px]">
      <div>
        <h1 className="serif text-[25px] font-semibold">Two-step sign-in</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1">
          After your password, the dashboard asks for a 6-digit code from an authenticator app
          on your phone (Google Authenticator, Microsoft Authenticator, 1Password and similar).
          Someone who learns your password still cannot get in.
        </p>
      </div>

      {required && mustHave && !user.totpEnabled && (
        <p role="alert" className="text-[13px] text-[#8a5a00] bg-[#fff6e6] border border-[#f0dcb0] rounded-lg px-3 py-2">
          Administrator accounts must use two-step sign-in. Set it up to continue to the dashboard.
        </p>
      )}

      <MfaSetup enabled={user.totpEnabled} required={mustHave} />
    </div>
  );
}
