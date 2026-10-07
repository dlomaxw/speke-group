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
          <a href="/impact">Sustainability</a>
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
        <div class="col-title">${icon('pin', 14)}Address</div>
        <div class="foot-lines">
          <div>${esc(setting(s, 'contact_address_1'))}</div>
          <div>${esc(setting(s, 'contact_address_2'))}</div>
          <a class="foot-go" href="/#locations">Find us on the map &#8599;</a>
        </div>
      </div>
      <div>
        <div class="col-title">${icon('phone', 14)}Contact</div>
        <div class="foot-lines foot-links">${phones(s)
          .map((p) => `
          <a href="${esc(telHref(p))}">${esc(p)}</a>`).join('')}${email ? `
          <a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}
        </div>
      </div>
      <div>
        <div class="col-title">Information</div>
        <div class="foot-lines foot-links">
          <a href="/about">About Us</a>
          <a href="/impact">Our Impact</a>
          <a href="/faq">Questions &amp; Answers</a>
          <a href="/events">Events &amp; Meetings</a>
          <a href="/experiences">Experiences</a>
          <a href="https://spekegroup.com/contact/">Careers</a>
          <a href="https://spekegroup.com/contact/">Terms &amp; Conditions</a>
        </div>
      </div>
      <div>
        <div class="col-title">Socials</div>
        <div style="display:flex;gap:10px">${facebook ? `
          <a class="social" href="${safeUrl(facebook)}" aria-label="Speke Group on Facebook">${icon('facebook', 17)}</a>` : ''}${twitter ? `
          <a class="social" href="${safeUrl(twitter)}" aria-label="Speke Group on X">${icon('x', 17)}</a>` : ''}
        </div>
        <a class="btn btn-ghost foot-cta" href="/contact"><span>CONTACT US</span></a>
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

  /* Crop close to the properties. The spread is tall and narrow, so a wide
     frame would be mostly empty map either side. */
  const RATIO = 1.28;
  const cropH = (maxY - minY) * 1.1 + 64;
  const cropW = Math.max((maxX - minX) * 1.1 + 64, cropH * RATIO);
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

  /* Properties sharing a point — the three at Munyonyo — are spread into a
     small fan so each one can be seen and clicked. */
  const atPoint = new Map<string, number[]>();
  points.forEach((pt, i) => {
    const key = `${Math.round(pt.x)}:${Math.round(pt.y)}`;
    atPoint.set(key, [...(atPoint.get(key) ?? []), i]);
  });
  const nudge = (i: number) => {
    const key = `${Math.round(points[i].x)}:${Math.round(points[i].y)}`;
    const group = atPoint.get(key) ?? [i];
    if (group.length < 2) return { dx: 0, dy: 0 };
    const seat = group.indexOf(i);
    const angle = (seat / group.length) * Math.PI * 2 - Math.PI / 2;
    return { dx: Math.cos(angle) * 17, dy: Math.sin(angle) * 17 };
  };

  const pins = pinned.map((p, i) => {
    const point = points[i];
    const { dx, dy } = nudge(i);
    const x = (((point.x + dx - left) / cropW) * 100).toFixed(3);
    const y = (((point.y + dy - top) / cropH) * 100).toFixed(3);
    return `
        <a class="map-pin" href="${safeUrl(directions(p), '#')}" data-pin="${i + 1}" style="left:${x}%;top:${y}%" aria-label="Directions to ${esc(p.name)}">
          <span class="map-pin-no">${i + 1}</span>
          <span class="map-pin-name">${esc(p.name)}</span>
        </a>`;
  }).join('');

  const list = pinned.map((p, i) => `
        <a class="map-row" href="${safeUrl(directions(p), '#')}" data-pin-row="${i + 1}">
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

/* ------------------------------------------------------------------
   Icons
   ------------------------------------------------------------------ */

/**
 * One line-drawn set for the whole site, in the weight the brand's rules and
 * hairlines already use: a single stroke, rounded ends, no fill. They take
 * their colour from the text around them, so gold on cream and cream on
 * maroon both work without a second copy.
 */
const ICON_PATHS: Record<string, string> = {
  /* A round table seen from above: four seats around it reads as a meeting
     at any size, where two half-drawn figures did not. */
  conference: '<circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="4.4" r="1.7"/><circle cx="12" cy="19.6" r="1.7"/><circle cx="4.4" cy="12" r="1.7"/><circle cx="19.6" cy="12" r="1.7"/>',
  spa: '<path d="M12 21c0-5 2.5-8 7-9-1 5-3.5 8-7 9Z"/><path d="M12 21c0-5-2.5-8-7-9 1 5 3.5 8 7 9Z"/><path d="M12 21c0-4 1-7 3-9.5C13.5 8 12.5 5.5 12 3c-.5 2.5-1.5 5-3 8.5C11 14 12 17 12 21Z"/>',
  salon: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 19 18"/><path d="M8 16.5 19 6"/>',
  gym: '<path d="M4 9v6"/><path d="M20 9v6"/><path d="M7 7v10"/><path d="M17 7v10"/><path d="M7 12h10"/>',
  pool: '<path d="M3 17c1.5 0 1.5 1.2 3 1.2s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2"/><path d="M7 15V6a2 2 0 0 1 4 0"/><path d="M15 15V6a2 2 0 0 1 4 0"/><path d="M7 10h4"/>',
  dining: '<path d="M6 3v8a2 2 0 0 0 4 0V3"/><path d="M8 11v10"/><path d="M17 3c-1.5 1.5-2 3-2 5s.5 2.5 2 2.5V3Z"/><path d="M17 10.5V21"/>',
  wedding: '<circle cx="9" cy="14" r="4.5"/><circle cx="15" cy="14" r="4.5"/><path d="m12 6 1.6-2.2h-3.2L12 6Z"/>',
  bed: '<path d="M3 18V7"/><path d="M3 12h18v6"/><path d="M21 18v-3"/><circle cx="7.5" cy="9.5" r="1.8"/><path d="M11 12V9.5a.5.5 0 0 1 .5-.5H19a2 2 0 0 1 2 2V12"/>',
  marina: '<path d="M12 3v15"/><path d="M8.5 6.5h7"/><path d="M4 13c0 4.4 3.6 8 8 8s8-3.6 8-8"/><path d="M4 13l3-1.5"/><path d="M20 13l-3-1.5"/>',
  equestrian: '<path d="M5 20c0-4 2-6 5-7l2-4 3-4 2 2-1.5 2.5L19 10c1 4-1 8-4 10"/><path d="M10 13 7 20"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 1 9-4 14-11 14H5Z"/><path d="M5 19c4-5 7-7 11-9"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5A2.5 2.5 0 0 0 7 9.5"/><path d="M17 6h2.5A2.5 2.5 0 0 1 17 9.5"/><path d="M12 14v3"/><path d="M8.5 20h7"/><path d="M9.5 20c0-1.6 1-3 2.5-3s2.5 1.4 2.5 3"/>',
  water: '<path d="M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3Z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
  waste: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  sourcing: '<path d="M4 7h16l-1.2 12.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  community: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20v-1a4 4 0 0 1 6-3.4"/>',
  pin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  guests: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20v-.8A5.2 5.2 0 0 1 10.2 14h3.6A5.2 5.2 0 0 1 19 19.2V20"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.8 7 7.1 5.4a2 2 0 0 0 2.2 0L20.2 7"/>',
  /* Drawn in the same single stroke as the rest, rather than the solid mark
     outlined, which reads as a hollow letter at this size. */
  facebook: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M14.6 8.2h-1.3c-.9 0-1.4.5-1.4 1.4v1.5h2.6l-.4 2.7h-2.2v4.9"/><path d="M9.6 11.1h2.3"/>',
  x: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 8l8 8"/><path d="M16 8l-8 8"/>',
};

export function icon(name: string, size = 22): string {
  const body = ICON_PATHS[name];
  if (!body) return '';
  return `<svg class="sg-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

/** Content names an icon by what it is; this maps those names onto the set. */
const ICON_BY_SUBJECT: Record<string, string> = {
  conferences: 'conference', meetings: 'conference', 'meeting venues': 'conference',
  'spas & salons': 'spa', spas: 'spa', salon: 'salon', spa: 'spa',
  restaurants: 'dining', dining: 'dining', 'world-class catering': 'dining',
  'fitness centres': 'gym', gyms: 'gym', gym: 'gym',
  'swimming pools': 'pool', pool: 'pool',
  weddings: 'wedding', 'marina experience': 'marina', equestrian: 'equestrian',
  lakeside: 'water', energy: 'leaf', water: 'water', waste: 'waste',
  sourcing: 'sourcing', purchasing: 'sourcing', nature: 'leaf', community: 'community',
};

/** The icon for a block, by its title. Falls back to the decorative character
 *  the editor typed, so nothing disappears if a name is not in the map. */
export function subjectIcon(name: string, fallback?: string | null, size = 26): string {
  const key = String(name || '').trim().toLowerCase();
  const found = ICON_BY_SUBJECT[key];
  if (found) return icon(found, size);
  return fallback ? `<span class="sg-icon-glyph">${esc(fallback)}</span>` : '';
}
