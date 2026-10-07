import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getImpact, setting } from '@/lib/site-data';
import { esc, header, footer, phones, telHref, paragraphs, icon } from '@/lib/site-html';

export const metadata: Metadata = {
  title: 'Our Impact | Speke Group of Hotels',
  description: 'The environmental initiatives running at Speke Group properties in Uganda today, and how we are measuring the rest.',
};

const AREA_LABEL: Record<string, string> = {
  energy: 'Energy & carbon',
  water: 'Water',
  waste: 'Waste',
  sourcing: 'Purchasing',
  nature: 'Nature',
  community: 'Community',
};

/** What the badge on each card says. The wording matters: a published claim is
 *  not a measured result, and the page should never blur the two. */
const EVIDENCE_LABEL: Record<string, string> = {
  published: 'Published, not yet verified',
  verified: 'Verified against records',
  assessing: 'Being assessed',
};

export default async function ImpactPage() {
  const [{ settings: s, hotels, resorts, apartments, allProperties }, initiatives] =
    await Promise.all([getChrome(), getImpact()]);
  const firstPhone = phones(s)[0];

  const propertyName = (id: number | null) =>
    allProperties.find((p) => p.id === id)?.name ?? 'Across the Group';

  const places = allProperties
    .filter((p) => initiatives.some((i) => i.propertyId === p.id))
    .map((p) => `<option value="p${p.id}">${esc(p.name)}</option>`).join('');

  const cards = initiatives.map((i) => `
        <div class="tile impact-card" data-reveal data-filter-item="impact" data-tags="${i.propertyId ? `p${i.propertyId}` : 'group'}">
          <div class="impact-head">
            <span class="impact-area">${icon(i.area === 'energy' ? 'leaf' : i.area, 14)}${esc(AREA_LABEL[i.area] ?? i.area)}</span>
            <span class="impact-evidence is-${esc(i.evidence)}">${esc(EVIDENCE_LABEL[i.evidence] ?? i.evidence)}</span>
          </div>
          <div class="impact-where">${esc(propertyName(i.propertyId))}</div>
          <div class="impact-title">${esc(i.title)}</div>
          <p class="impact-desc">${esc(i.description)}</p>
          ${i.source ? `<p class="impact-source">${esc(i.source)}</p>` : ''}
        </div>`).join('');

  const steps = [1, 2, 3, 4]
    .map((n) => setting(s, `impact_step_${n}`))
    .filter(Boolean)
    .map((text, i) => `
        <li class="impact-step" data-reveal>
          <span class="impact-step-no">${i + 1}</span>
          <span>${esc(text)}</span>
        </li>`).join('');

  const html = `
  ${header({
    active: 'about',
    cta: { label: 'CALL RESERVATIONS', href: firstPhone ? telHref(firstPhone) : '/contact' },
    hotels, resorts, apartments,
  })}

  <!-- ================= PAGE HEAD ================= -->
  <div style="padding:46px var(--gut) 10px;max-width:820px" data-reveal>
    <div class="eyebrow-line">${esc(setting(s, 'impact_eyebrow', 'Our Impact'))}</div>
    <h1 class="serif" style="font-size:42px;font-weight:600;margin:0 0 14px;color:#3a2020;letter-spacing:-0.015em;line-height:1.12">${esc(setting(s, 'impact_title'))}</h1>
    <p style="font-size:15px;color:#5a4a3a;margin:0;line-height:1.75">${esc(setting(s, 'impact_lead'))}</p>
  </div>

  <!-- ================= WHERE WE STAND ================= -->
  <div style="padding:34px var(--gut) 10px" data-reveal>
    <div class="impact-standing">
      <h2 class="h-sec" style="margin-bottom:14px">${esc(setting(s, 'impact_footprint_title'))}</h2>
      ${paragraphs(setting(s, 'impact_footprint_body'), 'font-size:14.5px;line-height:1.78;color:#5a4a3a;margin:0 0 14px')}
    </div>
  </div>

  <!-- ================= AT EACH PROPERTY ================= -->
  <div id="initiatives" style="background:var(--cream-2);padding:48px var(--gut)">
    <div style="text-align:center;max-width:680px;margin:0 auto 24px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">${esc(setting(s, 'impact_list_eyebrow', "At Each Property"))}</div>
      <h2 class="h-sec">${esc(setting(s, 'impact_list_title', "What Is Running Today"))}</h2>
      <p style="font-size:14px;color:#5a4a3a;margin:12px 0 0;line-height:1.72">Choose a property to see what it does. Where we found nothing specific to publish, we say so rather than leave the impression of more than there is.</p>
    </div>

    <div class="wellness-pick" data-reveal>
      <label class="fl" for="impact-place">Choose a location</label>
      <select id="impact-place" data-filter-select="impact">
        <option value="all">All our locations</option>${places}
      </select>
    </div>

    <div class="g-3${initiatives.length < 3 ? ' g-centered' : ''}" style="gap:20px" data-stagger="0.07">${cards}
    </div>
    <p class="wellness-none" data-filter-none="impact" hidden>We have nothing published for this property yet. It is part of the assessment described above, and we will publish what we find.</p>
  </div>

  <!-- ================= NEXT STEPS ================= -->
  <div style="padding:50px var(--gut)">
    <div style="max-width:820px" data-reveal>
      <div class="eyebrow-line">${esc(setting(s, 'impact_next_eyebrow', "Next"))}</div>
      <h2 class="h-sec" style="margin-bottom:8px">${esc(setting(s, 'impact_next_title'))}</h2>
    </div>
    <ol class="impact-steps" data-stagger="0.07">${steps}
    </ol>
  </div>

  <!-- ================= GUESTS ================= -->
  <div style="background:var(--cream-2);padding:46px var(--gut);text-align:center" data-reveal>
    <h2 class="h-sec" style="margin-bottom:12px">${esc(setting(s, 'impact_guests_title'))}</h2>
    <div style="max-width:700px;margin:0 auto">
      ${paragraphs(setting(s, 'impact_guests_body'), 'font-size:14.5px;line-height:1.78;color:#5a4a3a;margin:0 0 18px')}
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="btn btn-solid" href="/contact"><span>ASK OUR TEAM</span></a>
      <a class="btn btn-ghost" href="/#portfolio"><span>EXPLORE OUR COLLECTION</span></a>
    </div>
  </div>

  ${footer(s)}
`;

  return <Html html={html} />;
}
