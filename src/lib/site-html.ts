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

type Active = 'home' | 'about' | 'events' | 'experiences' | 'news' | 'contact';

/** Pages that carry the booking bar pass this as their header link. */
export const BOOKING_ANCHOR = '#sg-booking';

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
      <div class="item">
        <a href="/about"${active === 'about' || home ? ' class="active"' : ''}>Our Group</a>
        <div class="sg-drop">
          <a href="/about">About Us</a>
          <a href="/about#chairman">Our Chairman</a>
          <a href="/about#history">Our History</a>
          <a href="/#portfolio">Our Properties</a>
        </div>
      </div>
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
    ${cta.href === BOOKING_ANCHOR
      ? `<button class="btn btn-solid sg-bm-toggle" type="button" aria-expanded="false" aria-controls="sg-booking"><span>${esc(cta.label)}</span></button>`
      : `<a class="btn btn-ghost" href="${safeUrl(cta.href)}"><span>${esc(cta.label)}</span></a>`}
  </header>`;
}

/* ------------------------------------------------------------------
   Booking bar
   ------------------------------------------------------------------ */

type BookingProperty = { id: number; name: string; kind: string; bookingUrl?: string | null };

const PIN_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';
const DATE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5v13A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2H7Zm12 7.5v10a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-10h14Z"/></svg>';
const GUEST_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.24-8 5v1.5h16V19c0-2.76-3.58-5-8-5Z"/></svg>';

/**
 * The booking bar that sits at the foot of the hero. It is a plain GET form to
 * the enquiry page, so it works with JavaScript switched off; speke-ui.js adds
 * the stepper, the date guard and the docking behaviour on top.
 */
export function bookingBar(opts: {
  properties: BookingProperty[];
  today: string;
  tomorrow: string;
  phone?: string;
  selected?: number;
}): string {
  const { properties, today, tomorrow, phone, selected } = opts;
  const group = (label: string, kind: string) => {
    const rows = properties.filter((p) => p.kind === kind);
    if (!rows.length) return '';
    return `
            <optgroup label="${esc(label)}">${rows.map((p) =>
              `<option value="${p.id}"${p.bookingUrl ? ` data-booking="${safeUrl(p.bookingUrl, '')}"` : ''}${
                p.id === selected ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`;
  };

  return `
  <div class="sg-bm-anchor" id="sg-booking">
    <form class="sg-bm" action="/contact" method="get" data-sg-bm>
      <input type="hidden" name="type" value="stay">
      <div class="bm-fields">
        <label class="bm-field bm-where">
          <span class="bm-label">Where would you like to stay?</span>
          <span class="bm-value">${PIN_ICON}<select name="property">
            <option value="">Any of our properties</option>${group('Hotels', 'hotel')}${group('Resorts', 'resort')}${group('Convention', 'convention')}${group('Apartments', 'apartment')}
          </select></span>
        </label>
        <label class="bm-field">
          <span class="bm-label">Arrival</span>
          <span class="bm-value">${DATE_ICON}<input type="date" name="arrival" value="${esc(today)}" min="${esc(today)}"></span>
        </label>
        <label class="bm-field">
          <span class="bm-label">Departure</span>
          <span class="bm-value">${DATE_ICON}<input type="date" name="departure" value="${esc(tomorrow)}" min="${esc(tomorrow)}"></span>
        </label>
        <div class="bm-field bm-guests">
          <span class="bm-label">Guests</span>
          <span class="bm-value">${GUEST_ICON}
            <button class="bm-step" type="button" data-step="-1" aria-label="One guest fewer">&#8722;</button>
            <input type="number" name="guests" value="2" min="1" max="60" step="1" inputmode="numeric" aria-label="Number of guests">
            <button class="bm-step" type="button" data-step="1" aria-label="One more guest">&#43;</button>
          </span>
        </div>
      </div>
      <div class="bm-go">
        <button class="btn btn-solid bm-submit" type="submit"><span>CHECK AVAILABILITY</span></button>
        ${phone ? `<a class="bm-alt" href="${telHref(phone)}">or call ${esc(phone)}</a>` : ''}
      </div>
      <button class="bm-close" type="button" aria-label="Close the booking bar">
        <svg viewBox="0 0 15 15" aria-hidden="true"><line x1="1" y1="13" x2="13" y2="1"/><line x1="1" y1="1" x2="13" y2="13"/></svg>
      </button>
    </form>
  </div>`;
}

/* ------------------------------------------------------------------
   Footer
   ------------------------------------------------------------------ */

export function phones(s: SettingsMap): string[] {
  return [setting(s, 'contact_phone_1'), setting(s, 'contact_phone_2'), setting(s, 'contact_phone_3')]
    .filter(Boolean);
}

export function footer(s: SettingsMap): string {
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
        <div style="font-size:12px;line-height:1.8;color:#c8a888;max-width:230px">${esc(setting(s, 'site_tagline', 'Hotels, resorts, serviced apartments and event venues across Uganda.'))}</div>
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
        <div class="col-title">Information</div>
        <div style="font-size:12.5px;line-height:2.05;color:#dcc0a8;display:flex;flex-direction:column">
          <a href="/about">About Us</a>
          <a href="/faq">Questions &amp; Answers</a>
          <a href="/#locations">Find Us</a>
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

/** Text with blank lines between paragraphs, as escaped <p> elements. */
export function paragraphs(text: string, style: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${esc(p)}</p>`)
    .join('\n');
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

/* ------------------------------------------------------------------
   Locations map
   ------------------------------------------------------------------ */

type MapProperty = {
  id: number; name: string; slug: string; area: string | null;
  categoryLabel: string; latitude: number | null; longitude: number | null;
};

/** Web Mercator: longitude/latitude to fractional tile coordinates. */
const tileX = (lng: number, z: number) => ((lng + 180) / 360) * 2 ** z;
const tileY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

/**
 * A still map of every property, drawn as a grid of OpenStreetMap tiles with
 * a numbered pin on each one. No map library and no third-party script: the
 * tiles are plain images, and each pin links out to directions.
 */
export function locationsMap(properties: MapProperty[], opts: { title: string; body: string }): string {
  const pinned = properties.filter((p) => p.latitude != null && p.longitude != null);
  if (!pinned.length) return '';

  const TILE = 256;
  /* Zoom so the spread of properties fills roughly 700px of map. */
  const lats = pinned.map((p) => p.latitude!);
  const lngs = pinned.map((p) => p.longitude!);
  const span = Math.max(
    (tileY(Math.min(...lats), 0) - tileY(Math.max(...lats), 0)) * TILE,
    ((tileX(Math.max(...lngs), 0) - tileX(Math.min(...lngs), 0)) * TILE) / 1.5,
  );
  const zoom = Math.max(10, Math.min(15, Math.floor(Math.log2(700 / Math.max(span, 0.0001)))));

  const px = (p: MapProperty) => ({ x: tileX(p.longitude!, zoom) * TILE, y: tileY(p.latitude!, zoom) * TILE });
  const points = pinned.map(px);
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  /* Crop to the properties with room around them, in a 3:2 frame. */
  const RATIO = 1.5;
  const cropH = (maxY - minY) * 1.22 + 90;
  const cropW = Math.max((maxX - minX) * 1.22 + 90, cropH * RATIO);
  const left = (minX + maxX) / 2 - cropW / 2;
  const top = (minY + maxY) / 2 - cropH / 2;

  /* Whole tiles covering that crop. */
  const tx0 = Math.floor(left / TILE);
  const tx1 = Math.ceil((left + cropW) / TILE);
  const ty0 = Math.floor(top / TILE);
  const ty1 = Math.ceil((top + cropH) / TILE);
  const cols = tx1 - tx0;
  const rows = ty1 - ty0;

  const tiles: string[] = [];
  for (let y = ty0; y < ty1; y++) {
    for (let x = tx0; x < tx1; x++) {
      tiles.push(`<img class="map-tile" src="https://tile.openstreetmap.org/${zoom}/${x}/${y}.png" alt="" aria-hidden="true" loading="lazy" decoding="async">`);
    }
  }
  /* The tile sheet is sized and offset as a share of the crop, so it lines up
     with the pins at any width the layout gives us. */
  const sheet = [
    `grid-template-columns:repeat(${cols},1fr)`,
    `width:${((cols * TILE) / cropW) * 100}%`,
    `height:${((rows * TILE) / cropH) * 100}%`,
    `left:${((tx0 * TILE - left) / cropW) * 100}%`,
    `top:${((ty0 * TILE - top) / cropH) * 100}%`,
  ].join(';');

  const directions = (p: MapProperty) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.name}, Kampala, Uganda`)}`;

  const pins = pinned.map((p, i) => {
    const point = px(p);
    return `
        <a class="map-pin" href="${safeUrl(directions(p), '#')}" style="left:${(((point.x - left) / cropW) * 100).toFixed(3)}%;top:${(((point.y - top) / cropH) * 100).toFixed(3)}%" aria-label="Directions to ${esc(p.name)}">
          <span class="map-pin-no">${i + 1}</span>
          <span class="map-pin-name">${esc(p.name)}</span>
        </a>`;
  }).join('');

  const list = pinned.map((p, i) => `
        <a class="map-row" href="${safeUrl(directions(p), '#')}">
          <span class="map-row-no">${i + 1}</span>
          <span>
            <span class="map-row-name">${esc(p.name)}</span>
            <span class="map-row-area">${esc(p.area || p.categoryLabel)}</span>
          </span>
          <span class="map-row-go">DIRECTIONS &#8599;</span>
        </a>`).join('');

  return `
  <div id="locations" style="padding:52px var(--gut)">
    <div style="text-align:center;max-width:680px;margin:0 auto 30px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Our Locations</div>
      <h2 class="h-sec">${esc(opts.title)}</h2>
      <p style="font-size:14px;color:#5a4a3a;margin:12px 0 0;line-height:1.72">${esc(opts.body)}</p>
    </div>
    <div class="map-wrap" data-reveal>
      <div class="map-canvas" style="aspect-ratio:${cropW} / ${cropH}">
        <div class="map-tiles" style="${sheet}">${tiles.join('')}
        </div>
        ${pins}
      </div>
      <div class="map-list">${list}
      </div>
    </div>
    <p class="map-credit">Map data &copy; <a href="https://www.openstreetmap.org/copyright" rel="nofollow">OpenStreetMap</a> contributors</p>
  </div>`;
}

/* ------------------------------------------------------------------
   Film gallery
   ------------------------------------------------------------------ */

type Film = {
  slug: string; title: string; description: string | null;
  videoUrl: string; posterUrl: string | null; durationLabel: string | null;
};

/**
 * Posters that turn into players. Nothing is fetched until a visitor presses
 * play, so a page carrying films costs no more to open than one without.
 */
export function filmGallery(films: Film[], opts: { eyebrow: string; title: string; body: string; limit?: number }): string {
  const rows = opts.limit ? films.slice(0, opts.limit) : films;
  if (!rows.length) return '';

  const cards = rows.map((f) => `
        <figure class="film" data-film data-reveal>
          <button class="film-play" type="button" data-film-src="${safeUrl(f.videoUrl, '')}" aria-label="Play ${esc(f.title)}">
            ${slot(f.posterUrl, f.title, 'width:100%;height:100%')}
            <span class="film-icon" aria-hidden="true"></span>
            ${f.durationLabel ? `<span class="film-length">${esc(f.durationLabel)}</span>` : ''}
          </button>
          <figcaption class="film-caption">
            <div class="film-title">${esc(f.title)}</div>
            <p class="film-desc">${esc(f.description)}</p>
          </figcaption>
        </figure>`).join('');

  return `
  <div id="films" style="padding:50px var(--gut)">
    <div style="text-align:center;max-width:680px;margin:0 auto 28px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">${esc(opts.eyebrow)}</div>
      <h2 class="h-sec">${esc(opts.title)}</h2>
      <p style="font-size:14px;color:#5a4a3a;margin:12px 0 0;line-height:1.72">${esc(opts.body)}</p>
    </div>
    <div class="${rows.length === 2 ? 'g-2' : 'g-3'}" style="gap:22px" data-stagger="0.08">${cards}
    </div>
  </div>`;
}
