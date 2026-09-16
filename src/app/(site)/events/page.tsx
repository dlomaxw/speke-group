import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getHighlights, getVenueGroups, getVenues, setting } from '@/lib/site-data';
import { esc, slot, header, footer, countUp, phones } from '@/lib/site-html';
import { VENUE_IMAGES } from '@/lib/default-images';

export const metadata: Metadata = {
  title: 'Events & Meeting Venues | Speke Group of Hotels',
};

export default async function EventsPage() {
  const [chrome, venues, groups, occasions] = await Promise.all([
    getChrome(), getVenues(), getVenueGroups(), getHighlights('occasions'),
  ]);
  const { settings: s, hotels, resorts, apartments } = chrome;
  const email = setting(s, 'contact_email');
  const phoneLine = phones(s).map((p) => esc(p.replace(/[()]/g, ''))).join(' &nbsp;&middot;&nbsp; ');

  const venueCards = venues.map((v) => `
        <div class="card" data-reveal data-filter-item="venues" data-tags="${esc(v.sizeTag)}">
          <div class="media" style="height:178px">
            <div class="badge">${esc(v.location)}</div>
            ${slot(v.imageUrl || VENUE_IMAGES[v.slug], v.imageAlt || v.name, 'width:100%;height:178px')}
          </div>
          <div class="body">
            <div class="eyebrow">${esc(v.location)}</div>
            <div class="title">${esc(v.name)}</div>
            <div style="display:flex;gap:18px;font-size:12.5px;color:#5a4a3a;margin-bottom:12px">
              <div><span style="color:#b8935a;font-weight:700">Capacity</span><br>${esc(v.capacity)}</div>
              <div><span style="color:#b8935a;font-weight:700">Venue Size</span><br>${esc(v.venueSize)}</div>
            </div>
            <a class="link-arrow" href="/contact">VIEW VENUE <i>&rarr;</i></a>
          </div>
        </div>`).join('');

  const indexCols = groups.map((g) => `
          <div>
            <div class="eyebrow" style="font-size:10px;letter-spacing:.14em;color:#b8935a;font-weight:700;text-transform:uppercase;margin-bottom:10px">${esc(g.groupName)}</div>
            <div style="font-size:12.8px;line-height:2.05;color:#5a4a3a">${esc(g.venueList)}</div>
          </div>`).join('');

  const occasionTiles = occasions.map((o) => `
        <div class="tile" data-reveal>
          <div class="serif" style="font-size:30px;color:#c9a227;margin-bottom:10px">${esc(o.icon)}</div>
          <div class="serif" style="font-size:21px;font-weight:600;color:#3a2020;margin-bottom:10px">${esc(o.name)}</div>
          <div style="font-size:13.2px;line-height:1.7;color:#5a4a3a">${esc(o.description)}</div>
        </div>`).join('');

  const html = `
  ${header({ active: 'events', cta: { label: 'ENQUIRE NOW', href: '/contact' }, hotels, resorts, apartments })}

  <!-- ================= HERO ================= -->
  <div class="hero-tile band" style="height:400px">
    ${slot(setting(s, 'events_hero_image', '/images/meet-hero.webp'), 'Convention hall', 'width:100%;height:100%', true)}
    <div class="scrim-side"></div>
    <div class="hero-copy" style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:640px;pointer-events:none">
      <div class="eyebrow-line" style="color:#d4af6a">Events &amp; Meetings</div>
      <h1 class="serif" style="color:#fff;font-size:44px;font-weight:600;margin:0 0 14px;line-height:1.1">${esc(setting(s, 'events_title', 'Redefining Meeting Spaces for Your Events'))}</h1>
      <p style="color:#efe4d2;font-size:15px;line-height:1.68;margin:0 0 22px">${esc(setting(s, 'events_body'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="#venues"><span>BROWSE VENUES</span></a>
        <a class="btn btn-light" href="/contact"><span>REQUEST A PROPOSAL</span></a>
      </div>
    </div>
  </div>

  <!-- ================= STATS ================= -->
  <div class="row-stats" style="display:flex;align-items:center;justify-content:center;gap:56px;padding:38px var(--gut);border-bottom:1px solid rgba(111,32,51,0.12)" data-reveal>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_conference_rooms', '45'))}</div><div class="lbl">Event Spaces</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num"><span data-count="1400">0</span></div><div class="lbl">Largest Space Capacity</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_properties', '13'))}</div><div class="lbl">Host Properties</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_rooms', '900'), '+')}</div><div class="lbl">Guest Rooms On Site</div></div>
  </div>

  <!-- ================= VENUES ================= -->
  <div id="venues" style="padding:48px var(--gut) 20px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:26px;flex-wrap:wrap;gap:16px" data-reveal>
      <div>
        <div class="eyebrow-line">Explore</div>
        <h2 class="h-sec">Meeting Venues</h2>
        <p style="font-size:13.5px;color:#5a4a3a;margin:10px 0 0;max-width:560px;line-height:1.65">Each of our venues is unique in its own way and can be set up to suit your particular needs and requirements.</p>
      </div>
      <div data-filter-group="venues" style="display:flex;gap:9px;flex-wrap:wrap;max-width:560px;justify-content:flex-end">
        <button class="chip active" data-filter="all">All Venues</button>
        <button class="chip" data-filter="s10">10 &ndash; 35 Guests</button>
        <button class="chip" data-filter="s50">50 &ndash; 100 Guests</button>
        <button class="chip" data-filter="s120">120 &ndash; 400 Guests</button>
        <button class="chip" data-filter="s1000">1000 &ndash; 1400 Guests</button>
      </div>
    </div>

    <div style="gap:22px" data-stagger="0.06" class="g-3">${venueCards}
    </div>
  </div>

  <!-- ================= FULL VENUE INDEX ================= -->
  <div style="padding:14px var(--gut) 48px">
    <div class="tile" data-reveal style="padding:28px 30px">
      <div class="serif" style="font-size:20px;font-weight:600;color:#3a2020;margin-bottom:6px">The Complete Venue Index</div>
      <p style="font-size:13px;color:#5a4a3a;margin:0 0 20px;line-height:1.6">Forty-five state-of-the-art conference and banqueting spaces across the Group, from intimate boardrooms to ballrooms, gardens, poolsides and sports grounds.</p>
      <div style="gap:24px" class="g-4">${indexCols}
      </div>
      <div style="margin-top:22px">
        <a class="link-arrow" href="https://spekegroup.com/meeting-venues/">SEE ALL VENUES ON SPEKEGROUP.COM <i>&rarr;</i></a>
      </div>
    </div>
  </div>

  <!-- ================= OCCASIONS ================= -->
  <div id="occasions" style="background:#efe6d6;padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:30px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">What We Host</div>
      <h2 class="h-sec">Occasions We Host</h2>
    </div>
    <div style="gap:22px" data-stagger="0.09" class="g-3">${occasionTiles}
    </div>
  </div>

  <!-- ================= CTA ================= -->
  <div class="hero-tile band" style="height:280px">
    ${slot(setting(s, 'events_cta_image', '/images/meet-cta-bg.webp'), 'Banquet setup', 'width:100%;height:100%')}
    <div class="scrim-side"></div>
    <div style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:560px;pointer-events:none" data-reveal>
      <h2 class="serif" style="color:#fff;font-size:30px;font-weight:600;margin:0 0 12px">Plan Your Event with Speke Group</h2>
      <p style="color:#efe4d2;font-size:14px;line-height:1.7;margin:0 0 20px">Talk to our events team about venue selection, catering and accommodation for your delegates.</p>
      <div style="font-size:13.5px;color:#f2e2c8;line-height:2;margin-bottom:20px">
        <div>${esc(email)}</div>
        <div>${phoneLine}</div>
      </div>
      <a class="btn btn-light" href="/contact" style="pointer-events:auto;width:max-content"><span>CONTACT THE EVENTS TEAM</span></a>
    </div>
  </div>

  ${footer(s, hotels, resorts, apartments)}
`;

  return <Html html={html} />;
}
