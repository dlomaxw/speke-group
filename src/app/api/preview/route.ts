import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { mfaRequiredFor } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

/** Only same-site paths, so this can never be used to bounce visitors elsewhere. */
function safePath(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

/**
 * GET /api/preview?action=enable&path=/events   switches preview on for this browser
 * GET /api/preview?action=disable&path=/        switches it off
 *
 * Preview shows drafts and changes awaiting approval on the real pages. It
 * needs a signed-in staff member; the site also re-checks the session on
 * every previewed request, so the preview cookie alone reveals nothing.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = safePath(url.searchParams.get('path'));
  const draft = await draftMode();

  if (url.searchParams.get('action') === 'disable') {
    draft.disable();
    return NextResponse.redirect(new URL(path, url.origin), 303);
  }

  const user = await getSession();
  if (!user || !can(user.role, 'content.view') || (mfaRequiredFor(user.role) && !user.totpEnabled)) {
    return NextResponse.redirect(new URL('/admin/login', url.origin), 303);
  }
  draft.enable();
  return NextResponse.redirect(new URL(path, url.origin), 303);
}
