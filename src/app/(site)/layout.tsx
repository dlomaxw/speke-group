import Script from 'next/script';
import { isPreview } from '@/lib/site-data';
import './speke-ui.css';

// Content is edited in the dashboard, so pages are rendered per request.
export const dynamic = 'force-dynamic';

const WORD = 'SPEKE GROUP';

/**
 * The animated logo loader, rendered on the server so it covers the page
 * from the first paint. speke-ui.js dismisses it once the page is ready.
 */
const loaderInner =
  '<div class="curtain top"></div>' +
  '<div class="curtain bot"></div>' +
  '<div class="glow"></div>' +
  '<div class="mark">' +
    '<div class="ring-wrap">' +
      '<svg viewBox="0 0 172 172" aria-hidden="true">' +
        '<circle class="ring-track" cx="86" cy="86" r="81"></circle>' +
        '<circle class="ring-draw"  cx="86" cy="86" r="81"></circle>' +
      '</svg>' +
      '<div class="bead"></div>' +
      '<div class="logo-badge"><img src="/brand/speke-logo.png" alt="Speke Group"></div>' +
    '</div>' +
    '<div class="word">' +
      WORD.split('').map((ch, i) =>
        `<span style="animation-delay:${(0.75 + i * 0.055).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`,
      ).join('') +
    '</div>' +
    '<div class="tag">Hotels &middot; Apartments &middot; Resorts</div>' +
    '<div class="bar"><i></i></div>' +
  '</div>';

/** Without scripts nothing would ever be revealed, so show everything at once. */
const NO_SCRIPT_STYLE =
  '<style>#speke-loader{display:none!important}' +
  '.sg-js .page-shell,.sg-js [data-reveal],.sg-js .hero-copy > *' +
  '{opacity:1!important;transform:none!important;animation:none!important}</style>';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const preview = await isPreview();
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
      />

      <div className="page-shell" style={{ margin: '0 auto', background: '#f7f2e9' }}>
        {children}
      </div>

      <div id="speke-loader" dangerouslySetInnerHTML={{ __html: loaderInner }} />
      <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT_STYLE }} />
      {preview && (
        <div className="sg-preview-bar" role="status">
          <span><strong>Preview.</strong> Showing drafts and changes waiting for approval. Visitors do not see these.</span>
          <a href="/api/preview?action=disable&amp;path=/">Exit preview</a>
        </div>
      )}
      <Script src="/site/speke-ui.js" strategy="afterInteractive" />
    </>
  );
}
