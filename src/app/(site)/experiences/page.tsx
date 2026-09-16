import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getDining, getExperiences, setting, splitHighlights } from '@/lib/site-data';
import { esc, slot, header, footer, phones } from '@/lib/site-html';
import { DINING_IMAGES, EXPERIENCE_ANCHORS, EXPERIENCE_IMAGES } from '@/lib/default-images';

export const metadata: Metadata = {
  title: 'Dining & Experiences | Speke Group of Hotels',
};

const LABEL = 'color:#b8935a;font-weight:700;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase';

export default async function ExperiencesPage() {
  const [chrome, restaurants, bars, leisure] = await Promise.all([
    getChrome(), getDining('restaurant'), getDining('bar'), getExperiences(),
  ]);
  const { settings: s, hotels, resorts, apartments } = chrome;
  const email = setting(s, 'contact_email');
  const phoneLine = phones(s).map((p) => esc(p.replace(/[()]/g, ''))).join(' &nbsp;&middot;&nbsp; ');

  // The Lake Grill feature reads its practical details from the restaurant record.
  const lakeGrill = restaurants.find((r) => r.slug === 'lake-grill');
  const reservations = [lakeGrill?.phone, lakeGrill?.email || setting(s, 'contact_dining_email')]
    .filter(Boolean).map(esc).join(' &middot; ');

  const restaurantCards = restaurants.map((d) => `
        <div class="card" data-reveal>
          <div class="media" style="height:168px">
            <div class="badge">${esc(d.cuisine)}</div>
            ${slot(d.imageUrl || DINING_IMAGES[d.slug], d.imageAlt || d.name, 'width:100%;height:168px')}
          </div>
          <div class="body">
            <div class="eyebrow">${esc(d.cuisine)}</div>
            <div class="title">${esc(d.name)}</div>
            <div class="desc">${esc(d.description)}</div>
          </div>
        </div>`).join('');

  const barCards = bars.map((b) => `
        <div class="card" data-reveal>
          <div class="media" style="height:150px">
            <div class="badge">Bar</div>
            ${slot(b.imageUrl || DINING_IMAGES[b.slug], b.imageAlt || b.name, 'width:100%;height:150px')}
          </div>
          <div class="body">
            <div class="title">${esc(b.name)}</div>
            <div class="desc" style="margin-bottom:0">${esc(b.description)}</div>
          </div>
        </div>`).join('');

  const leisureCards = leisure.map((l) => `
        <div class="card" id="${esc(EXPERIENCE_ANCHORS[l.slug] || l.slug)}" data-reveal>
          <div class="media" style="height:160px">
            ${slot(l.imageUrl || EXPERIENCE_IMAGES[l.slug], l.imageAlt || l.name, 'width:100%;height:160px')}
          </div>
          <div class="body">
            <div class="title">${esc(l.name)}</div>
            <div class="desc">${esc(l.description)}</div>
            <div style="font-size:12.2px;line-height:1.9;color:#7a6a5a">${esc(splitHighlights(l.highlights).join(' · '))}</div>
          </div>
        </div>`).join('');

  const html = `
  ${header({ active: 'experiences', cta: { label: 'MAKE A RESERVATION', href: '#reservations' }, hotels, resorts, apartments })}

  <!-- ================= HERO ================= -->
  <div class="hero-tile band" style="height:400px">
    ${slot(setting(s, 'experiences_hero_image', '/images/dine-hero.webp'), 'Fine dining', 'width:100%;height:100%', true)}
    <div class="scrim-side"></div>
    <div class="hero-copy" style="position:absolute;left:var(--gut);top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;max-width:620px;pointer-events:none">
      <div class="eyebrow-line" style="color:#d4af6a">Experiences</div>
      <h1 class="serif" style="color:#fff;font-size:46px;font-weight:600;margin:0 0 14px;line-height:1.08">${esc(setting(s, 'experiences_title', 'Exquisite Culinary Experiences'))}</h1>
      <p style="color:#efe4d2;font-size:15px;line-height:1.68;margin:0 0 22px">${esc(setting(s, 'experiences_body'))}</p>
      <div style="display:flex;gap:12px;pointer-events:auto">
        <a class="btn btn-solid" href="#restaurants"><span>EXPLORE RESTAURANTS</span></a>
        <a class="btn btn-light" href="#bars"><span>EXPLORE BARS</span></a>
      </div>
    </div>
  </div>

  <!-- ================= THREE PILLARS ================= -->
  <div style="gap:22px;padding:var(--gut) var(--gut) 10px" data-stagger="0.08" class="g-3">
    <a class="tile" href="#restaurants" data-reveal>
      <div class="serif" style="font-size:30px;color:#c9a227;margin-bottom:10px">◆</div>
      <div class="serif" style="font-size:21px;font-weight:600;color:#3a2020;margin-bottom:9px">Restaurants</div>
      <div style="font-size:13.2px;line-height:1.7;color:#5a4a3a;margin-bottom:12px">Explore specially curated menus featuring authentic Asian and Continental specialities with a modern twist. Indulge in seasonal creations that make for an exceptional culinary experience.</div>
      <span class="link-arrow">EXPLORE RESTAURANTS <i>&rarr;</i></span>
    </a>
    <a class="tile" href="#bars" data-reveal>
      <div class="serif" style="font-size:30px;color:#c9a227;margin-bottom:10px">❖</div>
      <div class="serif" style="font-size:21px;font-weight:600;color:#3a2020;margin-bottom:9px">Bars</div>
      <div style="font-size:13.2px;line-height:1.7;color:#5a4a3a;margin-bottom:12px">From trendy nightlife hot spots to cool and refined high-class menu-focused bars, you will find one that suits your style. Let our well-trained staff take charge of your palate.</div>
      <span class="link-arrow">EXPLORE BARS <i>&rarr;</i></span>
    </a>
    <a class="tile" href="/events" data-reveal>
      <div class="serif" style="font-size:30px;color:#c9a227;margin-bottom:10px">◈</div>
      <div class="serif" style="font-size:21px;font-weight:600;color:#3a2020;margin-bottom:9px">Private Event Spaces</div>
      <div style="font-size:13.2px;line-height:1.7;color:#5a4a3a;margin-bottom:12px">Lounges, decks, pools or unique client setups. Book unique spaces for meetings, events, film and professional photo shoots.</div>
      <span class="link-arrow">EXPLORE SPACES <i>&rarr;</i></span>
    </a>
  </div>

  <!-- ================= RESTAURANTS ================= -->
  <div id="restaurants" style="padding:38px var(--gut) 12px">
    <div style="margin-bottom:24px" data-reveal>
      <div class="eyebrow-line">Speke Group Restaurants</div>
      <h2 class="h-sec">Unique Cuisines to Choose From</h2>
    </div>
    <div style="gap:22px" data-stagger="0.06" class="g-4">${restaurantCards}
    </div>
  </div>

  <!-- ================= BARS ================= -->
  <div id="bars" style="padding:34px var(--gut) 12px">
    <div style="margin-bottom:24px" data-reveal>
      <div class="eyebrow-line">Speke Group Bars</div>
      <h2 class="h-sec">Relax at Unique Hotspots</h2>
    </div>
    <div style="gap:22px" data-stagger="0.07" class="g-4">${barCards}
    </div>
  </div>

  <!-- ================= LEISURE & WELLNESS ================= -->
  <div id="leisure" style="background:#efe6d6;padding:50px var(--gut);margin-top:34px">
    <div style="text-align:center;margin-bottom:30px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Experiences</div>
      <h2 class="h-sec">Relax or Enjoy Memorable Breathtaking Thrills</h2>
      <p style="font-size:14px;color:#5a4a3a;max-width:720px;margin:12px auto 0;line-height:1.7">Our guests indulge in unique experiences and memorable moments that live with them long after they have returned home, whether a love for the outdoors, engaging with the locals, or making emotional connections with the places they visit.</p>
    </div>
    <div style="gap:22px" data-stagger="0.07" class="g-3">${leisureCards}
    </div>
  </div>

  <!-- ================= LAKESIDE DETAIL ================= -->
  <div id="lakeside" style="padding:48px var(--gut)">
    <div style="gap:40px;align-items:center" data-reveal class="g-2">
      <div>
        <div class="eyebrow-line">Lakeside</div>
        <h2 class="h-sec" style="margin-bottom:14px">Lake Grill, Under the African Sky</h2>
        <p style="font-size:14px;line-height:1.72;color:#5a4a3a;margin:0 0 18px">Situated in the vast expanse of a neatly manicured lawn on the shores of Lake Victoria, Lake Grill offers a family-friendly cuisine under the African sky. With themed Sundays that include a market fair, acrobats, children's activities and a jazz band, Lake Grill is the perfect way to spend a Sunday afternoon. Main attractions include fresh whole Tilapia fish and hog on the spit.</p>
        <div style="gap:14px 26px;font-size:13px;color:#5a4a3a;line-height:1.75;padding-top:18px;border-top:1px solid rgba(111,32,51,0.15)" class="g-2">
          <div><span style="${LABEL}">Location</span><br>Next to the Lobby, Ground Floor</div>
          <div><span style="${LABEL}">Cuisine</span><br>Whole Tilapia, fish, hog on the spit</div>
          <div><span style="${LABEL}">Times Open</span><br>${esc(lakeGrill?.openingTimes || 'Sunday and Public Holidays')}</div>
          <div><span style="${LABEL}">Covers</span><br>Picnic and barnyard</div>
          <div><span style="${LABEL}">Dress Code</span><br>${esc(lakeGrill?.dressCode || 'Casual')}</div>
          <div><span style="${LABEL}">Reservations</span><br>${reservations}</div>
        </div>
      </div>
      <div class="hero-tile" style="border-radius:10px;overflow:hidden">
        ${slot(setting(s, 'experiences_lakeside_image', '/images/lakeside-photo.webp'), 'Lake Grill on the shores of Lake Victoria', 'width:100%;height:340px;border-radius:10px')}
      </div>
    </div>
  </div>

  <!-- ================= RESERVATIONS CTA ================= -->
  <div id="reservations" style="background:#5c1728;padding:46px var(--gut);text-align:center" data-reveal>
    <div class="eyebrow-line" style="justify-content:center;color:#d4af6a">For Reservations</div>
    <h2 class="serif" style="color:#fff;font-size:30px;font-weight:600;margin:0 0 16px">Rich Cuisines &amp; Classic Cocktails to Kindle Your Taste Buds</h2>
    <div style="font-size:14.5px;color:#f2e2c8;line-height:2.1;margin-bottom:22px">
      <div>${esc(email)}</div>
      <div>${phoneLine}</div>
    </div>
    <a class="btn btn-light" href="/contact"><span>BOOK WITH US TODAY</span></a>
  </div>

  ${footer(s, hotels, resorts, apartments)}
`;

  return <Html html={html} />;
}
