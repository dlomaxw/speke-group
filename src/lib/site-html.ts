import 'server-only';
import { setting, type SettingsMap, type NavProperty } from '@/lib/site-data';

/**
 * The public pages are a faithful port of the original static design. Their
 * markup is built as HTML strings so it stays byte-for-byte comparable with
 * the design files, and so the shared speke-ui.js behaviour (reveals, filters,
 * tabs, the hero video) can own those nodes without React re-rendering them.
 * Every value that comes from the database goes through esc().
 */

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow link targets that are plain web, mail, phone or in-site paths. */
export function safeUrl(value: unknown, fallback = '#'): string {
  const v = String(value ?? '').trim();
  if (!v) return fallback;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(v)) return esc(v);
  return fallback;
}

/** A photo frame. Keeps the original <image-slot> tag so the stylesheet applies unchanged. */
export function slot(src: string | null | undefined, alt: string, style: string, eager = false): string {
  const img = src
    ? `<img src="${safeUrl(src, '')}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`
    : '';
  return `<image-slot style="${style}">${img}</image-slot>`;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/* ------------------------------------------------------------------
   Header
   ------------------------------------------------------------------ */

type Active = 'home' | 'events' | 'experiences' | 'news' | 'contact';

export function header(opts: {
  active: Active;
  cta: { label: string; href: string };
  hotels: NavProperty[];
  resorts: NavProperty[];
  apartments: NavProperty[];
}): string {
  const { active, cta, hotels, resorts, apartments } = opts;
  const home = active === 'home';
  const cls = (key: Active) => (active === key ? ' class="active"' : '');
  const links = (list: NavProperty[]) =>
    list.map((p) => `\n          <a href="${safeUrl(p.url)}">${esc(p.name)}</a>`).join('');

  return `
  <header class="sg-header">
    <a href="/"><img class="logo" src="/brand/speke-logo.png" alt="Speke Group"></a>
    <nav class="sg-nav">
      <div class="item"><a href="${home ? '#our-group' : '/#our-group'}"${cls('home')}>Our Group</a></div>
      <div class="item">
        <a href="${home ? '#portfolio' : '/#portfolio'}">Find &amp; Book</a>
        <div class="sg-drop">
          <div class="grp">Hotels</div>${links(hotels)}
          <div class="grp">Resorts</div>${links(resorts)}
          <div class="grp">Apartments</div>${links(apartments)}
        </div>
      </div>
      <div class="item">
        <a href="/events"${cls('events')}>Events &amp; Meetings</a>
        <div class="sg-drop">
          <a href="/events#venues">Conferences</a>
          <a href="/events#occasions">Weddings</a>
          <a href="/events#venues">Meeting Venues</a>
        </div>
      </div>
      <div class="item">
        <a href="/experiences"${cls('experiences')}>Experiences</a>
        <div class="sg-drop">
          <a href="/experiences#restaurants">Dining</a>
          <a href="/experiences#spas">Spas &amp; Salons</a>
          <a href="/experiences#gyms">Gyms</a>
          <a href="/experiences#marina">Marina Experience</a>
          <a href="/experiences#equestrian">Equestrian</a>
          <a href="/experiences#lakeside">Lakeside</a>
        </div>
      </div>
      <div class="item"><a href="/news"${cls('news')}>News</a></div>
      <div class="item"><a href="/contact"${cls('contact')}>Contact</a></div>
    </nav>
    <a class="btn btn-ghost" href="${safeUrl(cta.href)}"><span>${esc(cta.label)}</span></a>
  </header>`;
}

/* ------------------------------------------------------------------
   Footer
   ------------------------------------------------------------------ */

export function phones(s: SettingsMap): string[] {
  return [setting(s, 'contact_phone_1'), setting(s, 'contact_phone_2'), setting(s, 'contact_phone_3')]
    .filter(Boolean);
}

export function footer(s: SettingsMap, hotels: NavProperty[], resorts: NavProperty[], apartments: NavProperty[]): string {
  const col = (list: NavProperty[]) =>
    list.map((p) => `\n          <a href="${safeUrl(p.url)}">${esc(p.name)}</a>`).join('');
  const email = setting(s, 'contact_email');
  const facebook = setting(s, 'social_facebook');
  const twitter = setting(s, 'social_twitter');

  return `
  <footer class="sg-footer">
    <div style="gap:30px;padding-bottom:34px" class="g-footer">
      <div>
        <div style="margin-bottom:16px;background:#f2e2c8;display:inline-block;padding:9px 13px;border-radius:8px">
          <img src="/brand/speke-logo.png" alt="Speke Group" style="height:48px;width:auto;display:block">
        </div>
        <div style="font-size:12px;line-height:1.8;color:#c8a888;max-width:230px">${esc(setting(s, 'site_tagline', 'Unparalleled luxurious experiences in the Pearl of Africa.'))}</div>
      </div>
      <div>
        <div class="col-title">Address</div>
        <div style="font-size:12.5px;line-height:2;color:#dcc0a8">
          <div>${esc(setting(s, 'contact_address_1'))}</div>
          <div>${esc(setting(s, 'contact_address_2'))}</div>
        </div>
        <div class="col-title" style="margin-top:20px">Reservations</div>
        <div style="font-size:12.5px;line-height:2;color:#dcc0a8;display:flex;flex-direction:column">${phones(s)
          .map((p) => `\n          <a href="${esc(telHref(p))}">${esc(p)}</a>`).join('')}${email ? `
          <a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}
        </div>
      </div>
      <div>
        <div class="col-title">Hotels &amp; Resorts</div>
        <div style="font-size:12.5px;line-height:2.05;color:#dcc0a8;display:flex;flex-direction:column">${col(hotels)}${col(resorts)}
        </div>
      </div>
      <div>
        <div class="col-title">Apartments</div>
        <div style="font-size:12.5px;line-height:2.05;color:#dcc0a8;display:flex;flex-direction:column">${col(apartments)}
        </div>
      </div>
      <div>
        <div class="col-title">Information</div>
        <div style="font-size:12.5px;line-height:2.05;color:#dcc0a8;display:flex;flex-direction:column">
          <a href="https://spekegroup.com/about-us/">About Us</a>
          <a href="https://spekegroup.com/contact/">Careers</a>
          <a href="https://spekegroup.com/contact/">SOPs</a>
          <a href="https://spekegroup.com/contact/">Terms &amp; Conditions</a>
          <a href="/events">Events &amp; Meetings</a>
          <a href="/experiences">Experiences</a>
        </div>
      </div>
      <div>
        <div class="col-title">Socials</div>
        <div style="display:flex;gap:10px">${facebook ? `
          <a class="social" href="${safeUrl(facebook)}">f</a>` : ''}${twitter ? `
          <a class="social" href="${safeUrl(twitter)}">X</a>` : ''}
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(242,226,200,0.2);padding-top:20px;font-size:11.5px;color:#c8a888;text-align:center">${esc(setting(s, 'footer_copyright', 'Copyright © 2026. All Rights Reserved to Speke Group of Hotels.'))}</div>
  </footer>`;
}

/* ------------------------------------------------------------------
   Woven band (homepage, between the hero and the story)
   ------------------------------------------------------------------ */

function weaveSvg(): string {
  let paths = '';
  for (let i = 0; i < 26; i++) {
    const cx = 30 + i * 60;
    const x0 = i * 60;
    paths +=
      `<path class="draw" style="--len:150" d="M${cx}.0 8 L${cx + 24} 29 L${cx}.0 50 L${cx - 24} 29 Z"/>` +
      `<path class="draw" style="--len:92" d="M${cx}.0 17 L${cx + 14} 29 L${cx}.0 41 L${cx - 14} 29 Z"/>` +
      `<circle class="solid" cx="${cx}.0" cy="29" r="2.6"/>` +
      `<path class="draw" style="--len:44" d="M${x0} 29 L${x0 + 6} 22 M${x0} 29 L${x0 + 6} 36"/>`;
  }
  return `<svg viewBox="0 0 1560 58" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`;
}

export function wovenBand(): string {
  const svg = weaveSvg();
  return `
  <div class="woven-band" aria-hidden="true">
    <div class="weave">${svg}${svg}</div>
    <div class="sheen"></div>
  </div>`;
}

/* ------------------------------------------------------------------
   Formatting
   ------------------------------------------------------------------ */

export function monthYear(date: Date | string | null | undefined, style: 'long' | 'short'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const month = d.toLocaleString('en-GB', { month: style, timeZone: 'UTC' });
  const text = `${month} ${d.getUTCFullYear()}`;
  return style === 'short' ? text.toUpperCase() : text;
}

/** The count-up number, split into target and suffix ("900+" → 900, "+"). */
export function countUp(value: string, suffix = ''): string {
  const n = parseFloat(String(value).replace(/[^\d.]/g, ''));
  const target = Number.isFinite(n) ? n : 0;
  return `<span data-count="${target}"${suffix ? ` data-suffix="${esc(suffix)}"` : ''}>0</span>`;
}

/* ------------------------------------------------------------------
   Offers link to the property that runs them
   ------------------------------------------------------------------ */

/** Offer labels that name an outlet rather than a property. */
const OFFER_ALIASES: Record<string, string> = {
  'calabash spa': 'speke resort munyonyo',
};

/** Where a group-wide offer sends people, by tab. */
const GROUP_WIDE_TARGETS: Record<string, string> = {
  accommodation: '#portfolio',
  dining: '/experiences#restaurants',
  events: '/events',
  spa: '/experiences#spas',
};

export function offerHref(
  offer: { linkUrl: string | null; propertyLabel: string | null; category: string },
  properties: { name: string; slug: string; websiteUrl: string | null }[],
): string {
  if (offer.linkUrl) return offer.linkUrl;
  const label = (offer.propertyLabel ?? '').trim().toLowerCase();
  const wanted = OFFER_ALIASES[label] ?? label;
  if (wanted && wanted !== 'group wide') {
    const match =
      properties.find((p) => p.name.toLowerCase() === wanted) ??
      properties.find((p) => p.name.toLowerCase().startsWith(wanted));
    if (match) return match.websiteUrl || `https://spekegroup.com/${match.slug}/`;
  }
  return GROUP_WIDE_TARGETS[offer.category] ?? '/contact';
}
