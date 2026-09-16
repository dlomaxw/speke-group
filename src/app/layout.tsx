import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speke Group of Hotels',
  description: 'Unparalleled luxurious experiences in the Pearl of Africa.',
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
