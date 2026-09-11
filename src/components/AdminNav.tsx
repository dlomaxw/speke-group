'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type LinkItem = { href: string; label: string };

export default function AdminNav({
  user, contentLinks, newEnquiries,
  showEnquiries, showUsers, showSettings, showActivity,
}: {
  user: { name: string; role: string };
  contentLinks: LinkItem[];
  newEnquiries: number;
  showEnquiries: boolean;
  showUsers: boolean;
  showSettings: boolean;
  showActivity: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const item = (href: string, label: string, badge?: number) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
        isActive(href)
          ? 'bg-[color:var(--color-maroon)] text-white font-semibold'
          : 'text-[#cdd4de] hover:bg-white/10 hover:text-white'
      }`}
    >
      <span>{label}</span>
      {badge ? (
        <span className="rounded-full bg-[color:var(--color-gold)] px-1.5 py-0.5 text-[10px] font-bold text-[#2a1e1e] min-w-[18px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );

  const heading = (text: string) => (
    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a94a4]">
      {text}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu"
        className="lg:hidden fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full bg-[color:var(--color-maroon)] text-white shadow-lg text-xl"
      >
        {open ? '×' : '☰'}
      </button>

      <aside
        className={`w-[236px] shrink-0 bg-[#1f2733] text-white flex-col
          fixed inset-y-0 left-0 z-30 overflow-y-auto transition-transform duration-300
          lg:static lg:translate-x-0 lg:flex
          ${open ? 'flex translate-x-0' : 'flex -translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-4 py-4 border-b border-white/10">
          <Link href="/admin" className="block rounded-lg bg-[color:var(--color-cream)] px-3 py-2 w-fit">
            <Image
              src="/brand/speke-logo.png" alt="Speke Group"
              width={180} height={113} priority
              className="h-[38px] w-auto"
            />
          </Link>
          <div className="text-[11px] text-[#8a94a4] tracking-wide mt-2">Content dashboard</div>
        </div>

        <nav className="p-2 flex-1">
          {item('/admin', 'Overview')}
          {showEnquiries && item('/admin/enquiries', 'Enquiries', newEnquiries)}

          {heading('Content')}
          {contentLinks.map((l) => item(l.href, l.label))}

          {heading('Library')}
          {item('/admin/media', 'Images & video')}

          {(showSettings || showUsers || showActivity) && heading('Manage')}
          {showSettings && item('/admin/settings', 'Site settings')}
          {showUsers && item('/admin/users', 'Staff & roles')}
          {showActivity && item('/admin/activity', 'Activity log')}

          {heading('You')}
          {item('/admin/account', 'Your account')}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 text-[11px] text-[#8a94a4]">
          Signed in as <span className="text-white">{user.name}</span>
        </div>
      </aside>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
