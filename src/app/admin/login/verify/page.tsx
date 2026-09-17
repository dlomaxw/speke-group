import { redirect } from 'next/navigation';
import { getMfaChallenge, getSession } from '@/lib/auth';
import MfaVerifyForm from '@/components/MfaVerifyForm';

export const dynamic = 'force-dynamic';

export default async function VerifyPage() {
  if (await getSession()) redirect('/admin');
  const pending = await getMfaChallenge();
  if (!pending) redirect('/admin/login');
  return <MfaVerifyForm email={pending.email} />;
}
