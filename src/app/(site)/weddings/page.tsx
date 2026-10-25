import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getHighlights, getVenues, setting } from '@/lib/site-data';
import {
  esc, slot, header, footer, phones, telHref, occasionTiles, venueGrid,
} from '@/lib/site-html';
import { VENUE_IMAGES } from '@/lib/default-images';

export const metadata: Metadata = {
  title: 'Wedding Venues | Speke Group of Hotels',
  description:
    'Lakeside lawns, gardens under the palms and ballrooms for over a thousand guests — the wedding venues of Speke Group in Kampala, with capacities and settings.',
};

export default async function WeddingsPage() {
  const [chrome, venues, occasions] = await Promise.all([
    getChrome(), getVenues(), getHighlights('occasions'),
  ]);
  const { settings: s, hotels, resorts, apartments, allProperties } = chrome;
  const email = setting(s, 'contact_email');
  const firstPhone = phones(s)[0];
  const phoneLine = phones(s).map((p) => esc(p.replace(/[()]/g, ''))).join(' &nbsp;&middot;&nbsp; ');

  const weddingVenues = venues.filter((v) => v.kind === 'wedding');

  const tiles = occasionTiles(occasions);

  const html = `
  ${header({ active: 'events', settings: s, cta: { label: 'CALL RESERVATIONS', href: firstPhone ? telHref(firstPhone) : '/contact' }, hotels, resorts, apartments })}

  <!-- ================= HERO ================= -->
  <div class="hero-tile band" style="height:380px">
    ${slot(setting(s, 'weddings_hero_image', '/images/v-kabira-ballroom.webp'), 'A wedding reception', 'width:100%;height:100%', true)}
    <div class="scrim-side"></div>
    <div class="hero-copy" style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:640px;pointer-events:none">
      <div class="eyebrow-line" style="color:#d4af6a">${esc(setting(s, 'weddings_eyebrow', 'Weddings'))}</div>
      <h1 class="serif" style="color:#fff;font-size:42px;font-weight:600;margin:0 0 14px;line-height:1.1">${esc(setting(s, 'weddings_title', 'A Day on the Shores of Lake Victoria'))}</h1>
      <p style="color:#efe4d2;font-size:14.5px;line-height:1.68;margin:0 0 22px">${esc(setting(s, 'weddings_body', 'Lawns that run down to the water, gardens under the palms and ballrooms for over a thousand guests — each one set for the day you have in mind.'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="#venues"><span>BROWSE VENUES</span></a>
        <a class="btn btn-light" href="/contact"><span>REQUEST A PROPOSAL</span></a>
      </div>
    </div>
  </div>

  ${venueGrid({
    id: 'venues',
    group: 'weddings',
    eyebrow: setting(s, 'events_weddings_eyebrow', 'Celebrate'),
    title: setting(s, 'events_weddings_title', 'Wedding Venues'),
    body: setting(s, 'events_weddings_body', 'From lakeside lawns and gardens under the palms to a ballroom for over a thousand guests — each venue can be set for the day you have in mind.'),
    rows: weddingVenues,
    sites: allProperties,
    fallbackImages: VENUE_IMAGES,
    emptyNote: 'No venue at that location takes a party of this size. <a href="/contact">Tell us about your day</a> and we will find the right setting.',
  })}

  <!-- ================= OCCASIONS ================= -->
  ${tiles ? `
  <div id="occasions" style="background:var(--cream-2);padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:30px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">${esc(setting(s, 'events_occasions_eyebrow', "What We Host"))}</div>
      <h2 class="h-sec">${esc(setting(s, 'events_occasions_title', "Occasions We Host"))}</h2>
    </div>
    <div style="gap:22px" data-stagger="0.09" class="g-3">${tiles}
    </div>
  </div>` : ''}

  <!-- ================= CTA ================= -->
  <div class="hero-tile band" style="height:280px">
    ${slot(setting(s, 'events_cta_image', '/images/meet-cta-bg.webp'), 'A banquet laid for a wedding', 'width:100%;height:100%')}
    <div class="scrim-side"></div>
    <div style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:560px;pointer-events:none" data-reveal>
      <h2 class="serif" style="color:#fff;font-size:30px;font-weight:600;margin:0 0 12px">Plan Your Wedding with Speke Group</h2>
      <p style="color:#efe4d2;font-size:14px;line-height:1.7;margin:0 0 20px">Our events team will walk you through the setting, the catering and the rooms for your guests.</p>
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
