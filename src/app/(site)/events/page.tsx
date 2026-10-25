import type { Metadata } from 'next';
import { kampalaToday } from '@/lib/enquiry-rules';
import Html from '@/components/site/Html';
import { getChrome, getHighlights, getVenues, getVideos, setting } from '@/lib/site-data';
import { esc, slot, header, footer, countUp, phones, bookingBar, BOOKING_ANCHOR, filmGallery, subjectIcon } from '@/lib/site-html';

export const metadata: Metadata = {
  title: 'Events & Meeting Venues | Speke Group of Hotels',
};

/** Today and tomorrow in Kampala, for the booking bar's date fields. */
function bookingDates() {
  const today = kampalaToday();
  const next = new Date(today + 'T00:00:00Z');
  next.setUTCDate(next.getUTCDate() + 1);
  return { today, tomorrow: next.toISOString().slice(0, 10) };
}

export default async function EventsPage() {
  const [chrome, venues, occasions, films] = await Promise.all([
    getChrome(), getVenues(), getHighlights('occasions'), getVideos(),
  ]);
  const { settings: s, hotels, resorts, apartments, allProperties } = chrome;
  const email = setting(s, 'contact_email');
  const phoneLine = phones(s).map((p) => esc(p.replace(/[()]/g, ''))).join(' &nbsp;&middot;&nbsp; ');

  const meetingCount = venues.filter((v) => v.kind !== 'wedding').length;
  const weddingCount = venues.filter((v) => v.kind === 'wedding').length;

  const occasionTiles = occasions.map((o) => `
        <div class="tile" data-reveal>
          <div class="tile-icon">${subjectIcon(o.name, o.icon)}</div>
          <div class="serif" style="font-size:21px;font-weight:600;color:#3a2020;margin-bottom:10px">${esc(o.name)}</div>
          <div style="font-size:13.2px;line-height:1.7;color:#5a4a3a">${esc(o.description)}</div>
        </div>`).join('');

  const html = `
  ${header({ active: 'events', settings: s, cta: { label: 'BOOK NOW', href: BOOKING_ANCHOR }, hotels, resorts, apartments })}

  <!-- ================= HERO ================= -->
  <div class="hero-tile band" style="height:400px">
    ${slot(setting(s, 'events_hero_image', '/images/meet-hero.webp'), 'Convention hall', 'width:100%;height:100%', true)}
    <div class="scrim-side"></div>
    <div class="hero-copy" style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:640px;pointer-events:none">
      <div class="eyebrow-line" style="color:#d4af6a">Events &amp; Meetings</div>
      <h1 class="serif" style="color:#fff;font-size:44px;font-weight:600;margin:0 0 14px;line-height:1.1">${esc(setting(s, 'events_title', 'Redefining Meeting Spaces for Your Events'))}</h1>
      <p style="color:#efe4d2;font-size:15px;line-height:1.68;margin:0 0 22px">${esc(setting(s, 'events_body'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="/conferences"><span>CONFERENCE VENUES</span></a>
        <a class="btn btn-light" href="/weddings"><span>WEDDING VENUES</span></a>
      </div>
    </div>
  </div>

  ${bookingBar({ properties: allProperties, ...bookingDates(), phone: phones(s)[0] })}

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

  <!-- ================= THE TWO WAYS IN ================= -->
  <div style="padding:44px var(--gut) 10px">
    <div class="event-row" data-reveal>
      <a class="event-card" href="/conferences">
        <div class="event-photo" data-zoom>
          ${slot(setting(s, 'conferences_hero_image', '/images/meet-hero.webp'), 'A conference hall', 'width:100%;height:100%')}
        </div>
        <div class="event-body">
          <div class="eyebrow">Events &amp; Meetings</div>
          <div class="event-title">Conferences &amp; Meetings</div>
          <p class="event-desc">${esc(setting(s, 'conferences_body', 'From a boardroom for ten to a hall for three thousand, across the convention centre, the Commonwealth block and Kabira Country Club.'))}</p>
          <span class="link-arrow">${meetingCount} VENUES <i>&rarr;</i></span>
        </div>
      </a>
      <a class="event-card" href="/weddings">
        <div class="event-photo" data-zoom>
          ${slot(setting(s, 'weddings_hero_image', '/images/v-kabira-ballroom.webp'), 'A wedding reception', 'width:100%;height:100%')}
        </div>
        <div class="event-body">
          <div class="eyebrow">Events &amp; Meetings</div>
          <div class="event-title">Weddings &amp; Celebrations</div>
          <p class="event-desc">${esc(setting(s, 'weddings_body', 'Lawns that run down to the water, gardens under the palms and ballrooms for over a thousand guests — each one set for the day you have in mind.'))}</p>
          <span class="link-arrow">${weddingCount} VENUES <i>&rarr;</i></span>
        </div>
      </a>
    </div>
  </div>

  <!-- ================= FILMS ================= -->
  ${filmGallery(films, { eyebrow: 'Films', title: setting(s, 'films_title', 'See the Venue for Yourself'), body: setting(s, 'films_body') })}

  <!-- ================= OCCASIONS ================= -->
  <div id="occasions" style="background:var(--cream-2);padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:30px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">${esc(setting(s, 'events_occasions_eyebrow', "What We Host"))}</div>
      <h2 class="h-sec">${esc(setting(s, 'events_occasions_title', "Occasions We Host"))}</h2>
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

  ${footer(s)}
`;

  return <Html html={html} />;
}
