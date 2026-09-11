import { requireUser } from '@/lib/auth';
import { ROLE_LABELS, ROLE_BLURB } from '@/lib/rbac';
import PasswordForm from '@/components/PasswordForm';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5 max-w-[560px]">
      <div>
        <h1 className="serif text-[25px] font-semibold">Your account</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1">
          Signed in as {user.email}.
        </p>
      </div>

      <div className="card-surface p-5">
        <div className="text-[13px] font-semibold">{ROLE_LABELS[user.role]}</div>
        <p className="text-[13px] text-[#5a6474] mt-0.5">{ROLE_BLURB[user.role]}</p>
      </div>

      <PasswordForm mustChange={user.mustChangePassword} />
    </div>
  );
}
