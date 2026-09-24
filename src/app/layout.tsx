import type { Metadata } from 'next';

// Every page is rendered per request so each one carries its own CSP nonce (see src/proxy.ts).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Speke Group of Hotels',
  description: 'Hotels, resorts, serviced apartments and event venues across Uganda.',
};

/**
 * `sg-js` switches on the public site's entrance animations (content starts
 * hidden and is revealed on scroll). It is set on the server so there is no
 * flash before scripts run; the site layout undoes it for visitors who have
 * scripts disabled. The dashboard has no rules that use it.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="sg-js" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
