import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getMilestones, setting } from '@/lib/site-data';
import { esc, slot, header, footer, countUp, paragraphs } from '@/lib/site-html';
import { ABOUT_DEFAULTS } from '@/lib/about-content';

export const metadata: Metadata = {
  title: 'About Speke Group of Hotels | Uganda Hospitality Group',
  description: 'Speke Group brings together hotels, resorts, serviced apartments and event venues in Uganda, with distinctive settings, thoughtful service and a warm welcome.',
};

const BODY = 'font-size:14.5px;line-height:1.78;color:#5a4a3a;margin:0 0 14px';
const LIGHT = 'font-size:14.5px;line-height:1.8;color:#e9dccb;margin:0 0 14px';

export default async function AboutPage() {
  const [{ settings: s, hotels, resorts, apartments }, milestones] = await Promise.all([getChrome(), getMilestones()]);
  const get = (key: string) => setting(s, key, ABOUT_DEFAULTS[key] ?? '');

  const timeline = milestones.map((m) => `
        <div class="tile" data-reveal>
          <div class="serif" style="font-size:32px;font-weight:700;color:#c9a227;margin-bottom:8px">${esc(m.year)}</div>
          <div class="serif" style="font-size:18px;font-weight:600;color:#3a2020;margin-bottom:8px">${esc(m.title)}</div>
          <div style="font-size:12.8px;line-height:1.7;color:#5a4a3a">${esc(m.description)}</div>
        </div>`).join('');

  const html = `
  ${header({ active: 'about', cta: { label: 'EXPLORE OUR PROPERTIES', href: '/#portfolio' }, hotels, resorts, apartments })}

  <!-- ================= HERO ================= -->
  <div class="hero-tile band" style="height:420px">
    ${slot(get('about_hero_image'), 'Speke Resort Munyonyo on the shores of Lake Victoria', 'width:100%;height:100%', true)}
    <div class="scrim-side"></div>
    <div class="hero-copy" style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:660px;pointer-events:none">
      <div class="eyebrow-line" style="color:#d4af6a">${esc(get('about_eyebrow'))}</div>
      <h1 class="serif" style="color:#fff;font-size:48px;font-weight:600;margin:0 0 16px;line-height:1.08">${esc(get('about_title'))}</h1>
      <p style="color:#efe4d2;font-size:15px;line-height:1.68;margin:0 0 22px;max-width:560px">${esc(get('about_lead'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto;flex-wrap:wrap">
        <a class="btn btn-solid" href="/#portfolio"><span>EXPLORE OUR PROPERTIES</span></a>
        <a class="btn btn-light" href="#story"><span>OUR STORY</span></a>
      </div>
    </div>
  </div>

  <!-- ================= STATS ================= -->
  <div class="row-stats" style="display:flex;align-items:center;justify-content:center;gap:56px;padding:38px var(--gut);border-bottom:1px solid rgba(111,32,51,0.12)" data-reveal>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_properties', '13'))}</div><div class="lbl">Resorts, Hotels &amp; Apartments</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_rooms', '900'), '+')}</div><div class="lbl">Guest Rooms &amp; Apartments</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${countUp(setting(s, 'stat_conference_rooms', '45'))}</div><div class="lbl">Conference Rooms</div></div>
    <div class="rule-v"></div>
    <div class="stat" style="text-align:center"><div class="num">${esc(setting(s, 'founded_year', '1996'))}</div><div class="lbl">Welcoming Guests Since</div></div>
  </div>

  <!-- ================= OUR STORY ================= -->
  <div id="story" style="padding:46px var(--gut)">
    <div style="gap:48px;align-items:center" class="g-2">
      <div data-reveal>
        <div class="eyebrow-line">Our Story</div>
        <h2 class="h-sec" style="margin-bottom:18px">${esc(get('about_story_title'))}</h2>
        ${paragraphs(get('about_story_body'), BODY)}
      </div>
      <div class="hero-tile about-photo" data-reveal data-reveal-delay="0.12">
        ${slot(get('about_story_image'), 'Speke Apartments', 'width:100%;height:400px')}
      </div>
    </div>
  </div>

  <!-- ================= CHAIRMAN ================= -->
  <section id="chairman" class="chairman" aria-labelledby="chairman-name">
    <div class="chairman-weave" aria-hidden="true"></div>
    <div class="chairman-grid">
      <figure class="chairman-portrait" data-reveal>
        <span class="frame" aria-hidden="true"></span>
        ${slot(get('chairman_image'), get('chairman_name'), 'width:100%;height:100%', false)}
      </figure>
      <div class="chairman-copy" data-reveal data-reveal-delay="0.12">
        <div class="eyebrow-line chairman-role">${esc(get('chairman_role'))}</div>
        <h2 id="chairman-name" class="serif chairman-name">${esc(get('chairman_name'))}</h2>
        <div class="chairman-tagline">${esc(get('chairman_tagline'))}</div>
        <span class="chairman-rule" aria-hidden="true"></span>
        <blockquote class="chairman-quote">
          <p>${esc(get('chairman_quote'))}</p>
        </blockquote>
        ${paragraphs(get('chairman_body'), LIGHT)}
      </div>
    </div>
  </section>

  <!-- ================= OUR HISTORY ================= -->
  <div id="history" style="padding:56px var(--gut)">
    <div style="gap:48px;align-items:center" class="g-2 about-history">
      <figure style="margin:0" data-reveal>
        <div class="hero-tile about-photo sepia">
          ${slot(get('about_history_image'), get('about_history_caption'), 'width:100%;height:420px')}
        </div>
        <figcaption style="font-size:12px;color:#8a7a68;margin-top:10px;letter-spacing:.04em">${esc(get('about_history_caption'))}</figcaption>
      </figure>
      <div data-reveal data-reveal-delay="0.12">
        <div class="eyebrow-line">Our History</div>
        <h2 class="h-sec" style="margin-bottom:18px">${esc(get('about_history_title'))}</h2>
        ${paragraphs(get('about_history_body'), BODY)}
      </div>
    </div>
  </div>

  <!-- ================= MILESTONES ================= -->
  <div style="background:#efe6d6;padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:32px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Our Journey</div>
      <h2 class="h-sec">Milestones in the Speke Story</h2>
    </div>
    <div style="gap:22px" data-stagger="0.08" class="${milestones.length === 5 ? 'g-5' : 'g-4'}">${timeline}
    </div>
  </div>

  <!-- ================= TODAY ================= -->
  <div style="padding:56px var(--gut);text-align:center" data-reveal>
    <div class="eyebrow-line" style="justify-content:center">Speke Group Today</div>
    <h2 class="h-sec" style="margin-bottom:18px">${esc(get('about_today_title'))}</h2>
    <div style="max-width:820px;margin:0 auto">
      ${paragraphs(get('about_today_body'), BODY)}
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px">
      <a class="btn btn-solid" href="/#portfolio"><span>EXPLORE OUR PROPERTIES</span></a>
      <a class="btn btn-ghost" href="/contact"><span>CONTACT OUR TEAM</span></a>
    </div>
  </div>

  ${footer(s, hotels, resorts, apartments)}
`;

  return <Html html={html} />;
}
