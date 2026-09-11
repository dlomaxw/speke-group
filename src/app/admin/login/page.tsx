import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Someone already signed in has no business on the sign-in screen; without
  // this the form renders inside the dashboard chrome.
  const session = await getSession();
  if (session) redirect('/admin');

  return <LoginForm />;
}
