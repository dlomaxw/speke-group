import type { Metadata } from 'next';
import { kampalaToday } from '@/lib/enquiry-rules';
import Html from '@/components/site/Html';
import { getChrome, getVenues, getVideos, setting } from '@/lib/site-data';
import {
  esc, slot, header, footer, countUp, phones, bookingBar, BOOKING_ANCHOR,
  filmGallery, venueGrid,
} from '@/lib/site-html';
import { VENUE_IMAGES } from '@/lib/default-images';

export const metadata: Metadata = {
  title: 'Conference & Meeting Venues | Speke Group of Hotels',
  description:
    'Boardrooms, halls and ballrooms across Speke Group in Kampala, from ten delegates to three thousand — with capacities, floor areas and the property each one sits in.',
};

/** Today and tomorrow in Kampala, for the booking bar's date fields. */
function bookingDates() {
  const today = kampalaToday();
  const next = new Date(today + 'T00:00:00Z');
  next.setUTCDate(next.getUTCDate() + 1);
  return { today, tomorrow: next.toISOString().slice(0, 10) };
}

export default async function ConferencesPage() {
  const [chrome, venues, films] = await Promise.all([getChrome(), getVenues(), getVideos()]);
  const { settings: s, hotels, resorts, apartments, allProperties } = chrome;
  const email = setting(s, 'contact_email');
  const phoneLine = phones(s).map((p) => esc(p.replace(/[()]/g, ''))).join(' &nbsp;&middot;&nbsp; ');

  const meetingVenues = venues.filter((v) => v.kind !== 'wedding');

  const html = `
  ${header({ active: 'events', settings: s, cta: { label: 'BOOK NOW', href: BOOKING_ANCHOR }, hotels, resorts, apartments })}

  <!-- ================= HERO ================= -->
  <div class="hero-tile band" style="height:380px">
    ${slot(setting(s, 'conferences_hero_image', '/images/meet-hero.webp'), 'Convention hall', 'width:100%;height:100%', true)}
    <div class="scrim-side"></div>
    <div class="hero-copy" style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:640px;pointer-events:none">
      <div class="eyebrow-line" style="color:#d4af6a">${esc(setting(s, 'conferences_eyebrow', 'Conferences'))}</div>
      <h1 class="serif" style="color:#fff;font-size:42px;font-weight:600;margin:0 0 14px;line-height:1.1">${esc(setting(s, 'conferences_title', 'Room for Every Kind of Meeting'))}</h1>
      <p style="color:#efe4d2;font-size:14.5px;line-height:1.68;margin:0 0 22px">${esc(setting(s, 'conferences_body', 'From a boardroom for ten to a hall for three thousand, across the convention centre, the Commonwealth block and Kabira Country Club.'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="#venues"><span>BROWSE VENUES</span></a>
        <a class="btn btn-light" href="/contact"><span>REQUEST A PROPOSAL</span></a>
      </div>
    </div>
  </div>

  ${bookingBar({ properties: allProperties, ...bookingDates(), phone: phones(s)[0] })}

  <!-- ================= STATS ================= -->
  <div class="row-stats" style="display:flex;align-items:center;justify-content:center;gap:56px;padding:38px var(--gut);border-bottom:1px solid rgba(111,32,51,0.12)" data-reveal>
    <div class="stat" style="text-align:center"><div class="num">${countUp(String(meetingVenues.length))}</div><div class="lbl">Meeting Venues</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num"><span data-count="3200">0</span></div><div class="lbl">Largest Space Capacity</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_properties', '13'))}</div><div class="lbl">Host Properties</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_rooms', '900'), '+')}</div><div class="lbl">Guest Rooms On Site</div></div>
  </div>

  ${venueGrid({
    id: 'venues',
    group: 'venues',
    eyebrow: setting(s, 'events_venues_eyebrow', 'Explore'),
    title: setting(s, 'events_venues_title', 'Meeting Venues'),
    body: setting(s, 'events_venues_body', 'Each of our venues is unique in its own way and can be set up to suit your particular needs and requirements.'),
    rows: meetingVenues,
    sites: allProperties,
    fallbackImages: VENUE_IMAGES,
    emptyNote: 'No venue at that location takes a party of this size. <a href="/contact">Tell us what you need</a> and we will find the right room.',
  })}

  <!-- ================= FILMS ================= -->
  ${filmGallery(films, { eyebrow: 'Films', title: setting(s, 'films_title', 'See the Venue for Yourself'), body: setting(s, 'films_body') })}

  <!-- ================= CTA ================= -->
  <div class="hero-tile band" style="height:280px">
    ${slot(setting(s, 'events_cta_image', '/images/meet-cta-bg.webp'), 'Banquet setup', 'width:100%;height:100%')}
    <div class="scrim-side"></div>
    <div style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:560px;pointer-events:none" data-reveal>
      <h2 class="serif" style="color:#fff;font-size:30px;font-weight:600;margin:0 0 12px">Plan Your Conference with Speke Group</h2>
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
