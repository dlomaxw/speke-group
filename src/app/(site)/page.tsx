import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getHighlights, getOffers, setting } from '@/lib/site-data';
import { esc, safeUrl, slot, header, footer, wovenBand, countUp, offerHref } from '@/lib/site-html';
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

export default async function HomePage() {
  const [chrome, pillars, offers] = await Promise.all([
    getChrome(), getHighlights('pillars'), getOffers(),
  ]);
  const { settings: s, hotels, resorts, apartments, allProperties } = chrome;

  const portfolio = allProperties.map((p) => `
        <a class="card" href="${safeUrl(p.websiteUrl, `https://spekegroup.com/${esc(p.slug)}/`)}" data-reveal data-filter-item="portfolio" data-tags="${esc(p.kind)}">
          <div class="media" style="height:168px">
            <div class="badge">${esc(p.categoryLabel)}</div>
            ${slot(p.imageUrl || PROPERTY_IMAGES[p.slug], p.imageAlt || p.name, 'width:100%;height:168px')}
          </div>
          <div class="body">
            <div class="eyebrow">${esc(p.categoryLabel)}</div>
            <div class="title">${esc(p.name)}</div>
            <div class="desc">${esc(p.description)}</div>
            <span class="link-arrow">VIEW PROPERTY <i>&rarr;</i></span>
          </div>
        </a>`).join('');

  const pillarTiles = pillars.map((w) => `
        <a class="tile" href="${safeUrl(w.linkUrl)}" data-reveal style="text-align:center">
          <div class="serif" style="font-size:32px;color:#c9a227;margin-bottom:10px">${esc(w.icon)}</div>
          <div class="serif" style="font-size:19px;font-weight:600;color:#3a2020;margin-bottom:8px">${esc(w.name)}</div>
          <div style="font-size:12.8px;line-height:1.65;color:#5a4a3a">${esc(w.description)}</div>
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
  ${header({ active: 'home', cta: { label: 'EXPLORE OUR PROPERTIES', href: '#portfolio' }, hotels, resorts, apartments })}

  <!-- ================= HERO (video) ================= -->
  <div class="hero-video">
    <video class="hero-media" poster="${safeUrl(setting(s, 'hero_poster_url', '/assets/hero-poster.webp'), '')}"
           autoplay muted loop playsinline preload="metadata"
           aria-hidden="true" tabindex="-1">
      <source src="${safeUrl(setting(s, 'hero_video_url', '/assets/hero.mp4'), '')}" type="video/mp4">
    </video>
    <div class="scrim"></div>
    <div class="hero-copy">
      <div class="eyebrow-line" style="color:#d4af6a">${esc(setting(s, 'hero_eyebrow', 'Speke Group of Hotels'))}</div>
      <h1 class="serif" style="color:#fff;font-size:56px;line-height:1.06;font-weight:600;margin:0 0 18px;letter-spacing:-0.015em">${esc(setting(s, 'hero_title', 'Unparalleled Luxurious Experiences'))}<br><span style="color:#d4af6a">${esc(setting(s, 'hero_title_accent', 'in the Pearl of Africa'))}</span></h1>
      <p style="color:#f2e9db;font-size:16px;line-height:1.62;max-width:540px;margin:0 0 26px">${esc(setting(s, 'hero_body'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="#our-group"><span>DISCOVER SPEKE GROUP</span></a>
        <a class="btn btn-light" href="#portfolio"><span>VIEW OUR PORTFOLIO</span></a>
      </div>
    </div>
    <button class="video-toggle" type="button" aria-label="Pause background video" aria-pressed="false">
      <span class="bars"></span>
    </button>
    <a class="scroll-cue" href="#our-group" aria-label="Scroll to content"><span></span></a>
  </div>

  <!-- ================= WOVEN BAND ================= -->
  ${wovenBand()}

  <!-- ================= OUR STORY + STATS ================= -->
  <div id="our-group" class="row-split" style="display:flex;align-items:center;justify-content:space-between;padding:46px var(--gut);border-bottom:1px solid rgba(111,32,51,0.12);gap:50px">
    <div style="max-width:560px" data-reveal>
      <div class="eyebrow-line">Our Story</div>
      <h2 class="h-sec" style="margin-bottom:12px">${esc(setting(s, 'story_title', 'A Legacy of Ugandan Hospitality'))}</h2>
      <p style="font-size:14px;line-height:1.72;color:#5a4a3a;margin:0 0 14px">${esc(setting(s, 'story_body'))}</p>
      <a class="link-arrow" href="https://spekegroup.com/about-us/">READ OUR FULL STORY <i>&rarr;</i></a>
    </div>
    <div style="display:flex;align-items:center;gap:30px;flex:none" data-reveal data-reveal-delay="0.12">
      <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_properties', '13'))}</div><div class="lbl">Properties</div></div>
      <div class="rule-v"></div>
      <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_rooms', '900'), '+')}</div><div class="lbl">Modern Rooms</div></div>
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
        <h2 class="h-sec">Our Portfolio</h2>
      </div>
      <div data-filter-group="portfolio" style="display:flex;gap:9px">
        <button class="chip active" data-filter="all">All</button>
        <button class="chip" data-filter="hotel">Hotels</button>
        <button class="chip" data-filter="resort">Resorts</button>
        <button class="chip" data-filter="convention">Convention Centre</button>
        <button class="chip" data-filter="apartment">Apartments</button>
      </div>
    </div>

    <div style="gap:22px" data-stagger="0.06" class="g-4">${portfolio}
    </div>
  </div>

  <!-- ================= WHY STAY WITH US ================= -->
  <div style="background:#efe6d6;padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:32px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Why Stay With Us</div>
      <h2 class="h-sec">Where Simple Luxury &amp; Tranquility Meet</h2>
      <p style="font-size:14px;color:#5a4a3a;max-width:620px;margin:12px auto 0;line-height:1.7">Start your day or cool off your busy week with our five-star leisure facilities.</p>
    </div>
    <div style="gap:20px" data-stagger="0.09" class="g-4">${pillarTiles}
    </div>
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

  ${footer(s, hotels, resorts, apartments)}
`;

  return <Html html={html} />;
}
