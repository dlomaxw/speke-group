import type { Metadata } from 'next';
import { kampalaToday } from '@/lib/enquiry-rules';
import Html from '@/components/site/Html';
import { getChrome, getHighlights, getOffers, getWellness, setting, splitHighlights } from '@/lib/site-data';
import { esc, safeUrl, slot, header, footer, wovenBand, countUp, offerHref, bookingBar, BOOKING_ANCHOR, phones } from '@/lib/site-html';
import { PROPERTY_IMAGES } from '@/lib/default-images';

export const metadata: Metadata = {
  title: 'Speke Group Hotels, Resorts & Apartments in Kampala, Uganda',
};

const OFFER_TABS = [
  { key: 'accommodation', label: 'Accommodation', grid: 'g-4' },
  { key: 'dining', label: 'Dining', grid: 'g-4' },
  { key: 'events', label: 'Events', grid: 'g-3' },
  { key: 'spa', label: 'Spa', grid: 'g-3' },
];

/** Today and tomorrow in Kampala, for the booking bar's date fields. */
function bookingDates() {
  const today = kampalaToday();
  const next = new Date(today + 'T00:00:00Z');
  next.setUTCDate(next.getUTCDate() + 1);
  return { today, tomorrow: next.toISOString().slice(0, 10) };
}

export default async function HomePage() {
  const [chrome, offers, spas, occasions] = await Promise.all([
    getChrome(), getOffers(), getWellness(), getHighlights('occasions'),
  ]);
  const { settings: s, hotels, resorts, apartments, allProperties } = chrome;

  const portfolio = allProperties.map((p) => `
        <a class="card" href="${safeUrl(p.websiteUrl, `https://spekegroup.com/${esc(p.slug)}/`)}" data-reveal data-filter-item="portfolio" data-tags="${esc(p.kind)}">
          <div class="media" style="aspect-ratio:1/1">
            <div class="badge">${esc(p.categoryLabel)}</div>
            ${slot(p.imageUrl || PROPERTY_IMAGES[p.slug], p.imageAlt || p.name, 'width:100%;height:100%')}
          </div>
          <div class="body">
            <div class="eyebrow">${esc(p.categoryLabel)}</div>
            <div class="title">${esc(p.name)}</div>
            <div class="desc">${esc(p.description)}</div>
            <span class="link-arrow">VIEW PROPERTY <i>&rarr;</i></span>
          </div>
        </a>`).join('');

  /* Wellness: the cards, plus the locations that actually have a facility, so
     the selector only ever offers somewhere with something to show. */
  const KIND_LABEL: Record<string, string> = { spa: 'Spa', salon: 'Salon', gym: 'Gym', pool: 'Swimming pool' };
  const propertyName = (id: number | null) =>
    allProperties.find((p) => p.id === id)?.name ?? 'Across the Group';
  const wellnessPlaces = allProperties
    .filter((p) => spas.some((w) => w.propertyId === p.id))
    .map((p) => `<option value="p${p.id}">${esc(p.name)}</option>`).join('');
  const wellnessCards = spas.map((w) => `
        <div class="card wellness-card" data-reveal data-filter-item="wellness" data-tags="${w.propertyId ? `p${w.propertyId}` : 'group'}">
          <div class="media" style="aspect-ratio:4/3">
            <div class="badge">${esc(KIND_LABEL[w.kind] ?? w.kind)}</div>
            ${slot(w.imageUrl, w.imageAlt || w.name, 'width:100%;height:100%')}
          </div>
          <div class="body">
            <div class="eyebrow">${esc(propertyName(w.propertyId))}</div>
            <div class="title">${esc(w.name)}</div>
            <div class="desc">${esc(w.description)}</div>
            ${w.highlights ? `<div class="wellness-tags">${splitHighlights(w.highlights)
              .map((h) => `<span>${esc(h)}</span>`).join('')}</div>` : ''}
            ${w.location ? `<div class="wellness-where">${esc(w.location)}</div>` : ''}
          </div>
        </div>`).join('');

  /* Two ways in to Events & Meetings: a meeting, and a celebration. */
  const OCCASION_IMAGES: Record<string, string> = {
    Meetings: '/images/v-victoria.webp',
    Weddings: '/images/v-kabira-ballroom.webp',
  };
  const eventCards = occasions.slice(0, 2).map((o) => `
        <a class="card" href="/events${o.name === 'Weddings' ? '#occasions' : '#venues'}" data-reveal>
          <div class="media" style="aspect-ratio:16/10">
            ${slot(o.imageUrl || OCCASION_IMAGES[o.name], o.imageAlt || `${o.name} at Speke Group`, 'width:100%;height:100%')}
          </div>
          <div class="body">
            <div class="eyebrow">Events &amp; Meetings</div>
            <div class="title">${esc(o.name)}</div>
            <div class="desc">${esc(o.description)}</div>
            <span class="link-arrow">FIND OUT MORE <i>&rarr;</i></span>
          </div>
        </a>`).join('');

  const tabs = OFFER_TABS.filter((t) => offers.some((o) => o.category === t.key));
  const offerPanels = tabs.map((t, i) => {
    const first = i === 0;
    const tiles = offers.filter((o) => o.category === t.key).map((o) => `
          <a class="tile offer-tile" href="${safeUrl(offerHref(o, allProperties))}"${first ? ' data-reveal' : ''}>
            <div class="eyebrow" style="font-size:10px;letter-spacing:.14em;color:#b8935a;font-weight:700;text-transform:uppercase;margin-bottom:7px">${esc(o.propertyLabel)}</div>
            <div class="serif" style="font-size:18px;font-weight:600;color:#3a2020;margin-bottom:8px">${esc(o.name)}</div>
            <div style="font-size:12.8px;line-height:1.6;color:#5a4a3a">${esc(o.description)}</div>
            <span class="link-arrow offer-go">VIEW OFFER <i>&rarr;</i></span>
          </a>`).join('');
    return `
    <div data-tab-panel="offers" data-tab-key="${t.key}"${first ? '' : ' hidden'}>
      <div style="gap:20px"${first ? ' data-stagger="0.06"' : ''} class="${t.grid}">${tiles}
      </div>
    </div>`;
  }).join('');

  const html = `
  ${header({ active: 'home', cta: { label: 'BOOK NOW', href: BOOKING_ANCHOR }, hotels, resorts, apartments })}

  <!-- ================= HERO (video) ================= -->
  <div class="hero-video">
    <video class="hero-media" poster="${safeUrl(setting(s, 'hero_poster_url', '/assets/hero-properties-poster.webp'), '')}"
           data-mobile-src="${safeUrl(setting(s, 'hero_video_mobile_url', '/assets/hero-properties-mobile.mp4'), '')}"
           data-mobile-poster="${safeUrl(setting(s, 'hero_poster_mobile_url', '/assets/hero-properties-mobile-poster.webp'), '')}"
           autoplay muted loop playsinline preload="metadata"
           aria-hidden="true" tabindex="-1">
      <source src="${safeUrl(setting(s, 'hero_video_url', '/assets/hero-properties.mp4'), '')}" type="video/mp4">
    </video>
    <div class="scrim"></div>
    <div class="hero-copy">
      <div class="eyebrow-line" style="color:#d4af6a">${esc(setting(s, 'hero_eyebrow', 'Speke Group of Hotels'))}</div>
      <h1 class="serif" style="color:#fff;font-size:56px;line-height:1.06;font-weight:600;margin:0 0 18px;letter-spacing:-0.015em">${esc(setting(s, 'hero_title', 'Distinctive Places Across Uganda'))}<br><span style="color:#d4af6a">${esc(setting(s, 'hero_title_accent', 'One Warm Welcome'))}</span></h1>
      <p style="color:#f2e9db;font-size:16px;line-height:1.62;max-width:540px;margin:0 0 26px">${esc(setting(s, 'hero_body'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="#our-group"><span>DISCOVER SPEKE GROUP</span></a>
        <a class="btn btn-light" href="#portfolio"><span>VIEW OUR COLLECTION</span></a>
      </div>
    </div>
    <button class="video-toggle" type="button" aria-label="Pause background video" aria-pressed="false">
      <span class="bars"></span>
    </button>
    <a class="scroll-cue" href="#our-group" aria-label="Scroll to content"><span></span></a>
  </div>

  ${bookingBar({ properties: allProperties, ...bookingDates(), phone: phones(s)[0] })}

  <!-- ================= WOVEN BAND ================= -->
  ${wovenBand()}

  <!-- ================= OUR GROUP ================= -->
  <div id="our-group" style="padding:54px var(--gut) 44px;text-align:center" data-reveal>
    <div class="eyebrow-line" style="justify-content:center">Our Group</div>
    <h2 class="h-sec" style="max-width:820px;margin:0 auto">${esc(setting(s, 'group_title', 'Thirteen Places to Stay, Meet and Celebrate'))}</h2>
    <p style="font-size:15px;color:#5a4a3a;line-height:1.8;max-width:760px;margin:16px auto 0">${esc(setting(s, 'group_body', 'Speke Group brings together city hotels, lakeside resorts, serviced apartments and a convention centre across Uganda — each with its own character, and the same attentive welcome.'))}</p>
  </div>

  <!-- ================= OUR STORY + STATS ================= -->
  <div id="our-story" class="row-split" style="display:flex;align-items:center;justify-content:space-between;padding:46px var(--gut);border-bottom:1px solid rgba(111,32,51,0.12);gap:50px">
    <div style="max-width:560px" data-reveal>
      <div class="eyebrow-line">Our Story</div>
      <h2 class="h-sec" style="margin-bottom:12px">${esc(setting(s, 'story_title', 'A Collection Built on Ugandan Hospitality'))}</h2>
      <p style="font-size:14px;line-height:1.72;color:#5a4a3a;margin:0 0 14px">${esc(setting(s, 'story_body'))}</p>
      <a class="link-arrow" href="/about">READ OUR FULL STORY <i>&rarr;</i></a>
    </div>
    <div style="display:flex;align-items:center;gap:30px;flex:none" data-reveal data-reveal-delay="0.12">
      <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_properties', '13'))}</div><div class="lbl">Properties</div></div>
      <div class="rule-v"></div>
      <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_rooms', '900'), '+')}</div><div class="lbl">Guest Rooms &amp; Apartments</div></div>
      <div class="rule-v"></div>
      <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_conference_rooms', '45'))}</div><div class="lbl">Conference Rooms</div></div>
      <div class="rule-v"></div>
      <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_years', '25'), '+')}</div><div class="lbl">Years of Service</div></div>
    </div>
  </div>

  <!-- ================= PORTFOLIO ================= -->
  <div id="portfolio" style="padding:48px var(--gut) 54px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:16px" data-reveal>
      <div>
        <div class="eyebrow-line">Find &amp; Book</div>
        <h2 class="h-sec">Our Collection</h2>
      </div>
      <div data-filter-group="portfolio" style="display:flex;gap:9px">
        <button class="chip active" data-filter="all">All</button>
        <button class="chip" data-filter="hotel">Hotels</button>
        <button class="chip" data-filter="resort">Resorts</button>
        <button class="chip" data-filter="convention">Convention Centre</button>
        <button class="chip" data-filter="apartment">Apartments</button>
      </div>
    </div>

    <div class="sg-carousel" data-carousel>
      <div class="carousel-track" data-stagger="0.06" tabindex="0" role="group" aria-label="Our collection, scrollable">${portfolio}
      </div>
      <button class="carousel-arrow prev" type="button" aria-label="Previous properties">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg>
      </button>
      <button class="carousel-arrow next" type="button" aria-label="More properties">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>
      </button>
    </div>
    <div class="carousel-dots" data-carousel-dots aria-hidden="true"></div>
  </div>

  <!-- ================= WELLNESS ================= -->
  <div id="wellness" style="background:#efe6d6;padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:26px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Wellness</div>
      <h2 class="h-sec">${esc(setting(s, 'wellness_title', 'Spa, Experience & Wellness'))}</h2>
      <p style="font-size:14px;color:#5a4a3a;max-width:660px;margin:12px auto 0;line-height:1.7">${esc(setting(s, 'wellness_body', 'Massages, facials and steam baths, hair and beauty salons, gyms and pools — choose a location to see what is on offer there.'))}</p>
    </div>

    <div class="wellness-pick" data-reveal>
      <label class="fl" for="wellness-place">Choose a location</label>
      <select id="wellness-place" data-filter-select="wellness">
        <option value="all">All our locations</option>${wellnessPlaces}
      </select>
    </div>

    <div class="g-3" style="gap:22px" data-stagger="0.08" data-filter-empty="wellness">${wellnessCards}
    </div>
    <p class="wellness-none" data-filter-none="wellness" hidden>We have nothing listed here yet. <a href="/contact">Ask our team</a> and we will point you to the nearest spa or salon.</p>
  </div>

  <!-- ================= MEETINGS BANNER ================= -->
  <div class="hero-tile band" style="height:260px">
    ${slot(setting(s, 'home_meetings_image', '/images/meetings-bg.webp'), 'Conference hall', 'width:100%;height:100%')}
    <div class="scrim-side"></div>
    <div style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;pointer-events:none" data-reveal>
      <div class="eyebrow-line" style="color:#d4af6a">Events &amp; Meetings</div>
      <h2 class="serif" style="color:#fff;font-size:34px;font-weight:600;margin:0 0 12px">${esc(setting(s, 'events_title', 'Redefining Meeting Spaces for Your Events'))}</h2>
      <p style="color:#efe4d2;font-size:14px;max-width:470px;line-height:1.65;margin:0 0 20px">Our facilities welcome thousands of visitors attending major national and international conventions, meetings, concerts and competitions, making them the premier conferencing venues in Uganda.</p>
      <a class="btn btn-solid" href="/events" style="pointer-events:auto;width:max-content"><span>EXPLORE MEETINGS &amp; EVENTS</span></a>
    </div>
  </div>

  <div style="padding:44px var(--gut) 10px">
    <div class="g-2" style="gap:24px">${eventCards}
    </div>
  </div>

  <!-- ================= PACKAGES & OFFERS ================= -->
  <div style="padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:28px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Our Specials</div>
      <h2 class="h-sec">Enjoy Packages &amp; Offers</h2>
    </div>
    <div data-tabs="offers" style="display:flex;justify-content:center;gap:9px;margin-bottom:28px" data-reveal>
      ${tabs.map((t, i) => `<button class="chip${i === 0 ? ' active' : ''}" data-tab="${t.key}">${t.label}</button>`).join('\n      ')}
    </div>
${offerPanels}
  </div>

  <!-- ================= CAREERS + NEWS ================= -->
  <div style="border-top:1px solid rgba(111,32,51,0.12);border-bottom:1px solid rgba(111,32,51,0.12)" class="g-2">
    <div style="align-items:center" data-reveal class="g-split-a">
      <div style="padding:34px 42px">
        <h3 class="serif" style="font-size:23px;font-weight:600;margin:0 0 10px;color:#3a2020">Careers at Speke Group</h3>
        <p style="font-size:13.5px;line-height:1.62;color:#5a4a3a;margin:0 0 16px">A place to grow your career while creating exceptional experiences. Join our team and be part of our legacy.</p>
        <a class="link-arrow" href="https://spekegroup.com/contact/">VIEW CAREERS <i>&rarr;</i></a>
      </div>
      <div class="hero-tile" style="height:200px">${slot(setting(s, 'home_careers_image', '/images/careers-photo.webp'), 'Speke Group team', 'width:100%;height:200px')}</div>
    </div>
    <div style="align-items:center;border-left:1px solid rgba(111,32,51,0.12)" data-reveal data-reveal-delay="0.1" class="g-split-a">
      <div style="padding:34px 42px">
        <h3 class="serif" style="font-size:23px;font-weight:600;margin:0 0 10px;color:#3a2020">Group News &amp; Updates</h3>
        <p style="font-size:13.5px;line-height:1.62;color:#5a4a3a;margin:0 0 16px">Stay informed with the latest announcements, achievements and stories from across Speke Group.</p>
        <a class="link-arrow" href="/news">READ LATEST NEWS <i>&rarr;</i></a>
      </div>
      <div class="hero-tile" style="height:200px">${slot(setting(s, 'home_news_image', '/images/news-photo.webp'), 'Resort at sunset', 'width:100%;height:200px')}</div>
    </div>
  </div>

  ${footer(s)}
`;

  return <Html html={html} />;
}
