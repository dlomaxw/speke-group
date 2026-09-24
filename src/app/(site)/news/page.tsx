import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getMilestones, getNews, setting } from '@/lib/site-data';
import { esc, slot, header, footer, monthYear, phones } from '@/lib/site-html';
import { NEWS_IMAGES } from '@/lib/default-images';

export const metadata: Metadata = {
  title: 'News & Updates | Speke Group of Hotels',
};

export default async function NewsPage() {
  const [chrome, posts, milestones] = await Promise.all([getChrome(), getNews(), getMilestones()]);
  const { settings: s, hotels, resorts, apartments } = chrome;
  const email = setting(s, 'contact_email');
  const phoneLine = phones(s).slice(0, 2).map((p) => esc(p.replace(/[()]/g, ''))).join(' &nbsp;&middot;&nbsp; ');

  const featured = posts.find((p) => p.isFeatured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);
  const image = (p: (typeof posts)[number]) => p.imageUrl || NEWS_IMAGES[p.slug];

  const featuredHtml = featured ? `
  <!-- ================= FEATURED STORY ================= -->
  <div style="padding:0 var(--gut) 40px" data-reveal>
    <div class="card g-split-b" style="align-items:stretch">
      <div class="media" style="height:330px">
        <div class="badge">Featured</div>
        ${slot(image(featured), featured.imageAlt || featured.title, 'width:100%;height:330px', true)}
      </div>
      <div style="padding:38px 40px;display:flex;flex-direction:column;justify-content:center">
        <div class="eyebrow" style="font-size:10px;letter-spacing:.14em;color:#b8935a;font-weight:700;text-transform:uppercase;margin-bottom:10px">${esc(monthYear(featured.publishedAt, 'long'))} &nbsp;&middot;&nbsp; ${esc(featured.propertyLabel)}</div>
        <h2 class="serif" style="font-size:30px;font-weight:600;color:#3a2020;margin:0 0 14px;line-height:1.18">${esc(featured.title)}</h2>
        <p style="font-size:14px;line-height:1.72;color:#5a4a3a;margin:0 0 20px">${esc(featured.excerpt)}</p>
        <a class="link-arrow" href="#stories">READ THE FULL STORY <i>&rarr;</i></a>
      </div>
    </div>
  </div>` : '';

  const storyCards = rest.map((n) => `
        <a class="card" href="#stories" data-reveal data-filter-item="news" data-tags="${esc(n.tag)}">
          <div class="media" style="height:190px">
            <div class="badge">${esc(n.propertyLabel)}</div>
            ${slot(image(n), n.imageAlt || n.title, 'width:100%;height:190px')}
          </div>
          <div class="body">
            <div class="eyebrow">${esc(monthYear(n.publishedAt, 'short'))} &nbsp;&middot;&nbsp; ${esc(n.propertyLabel)}</div>
            <div class="title" style="font-size:18px;line-height:1.3">${esc(n.title)}</div>
            <div class="desc">${esc(n.excerpt)}</div>
            <span class="link-arrow">READ MORE <i>&rarr;</i></span>
          </div>
        </a>`).join('');

  const milestoneTiles = milestones.map((m) => `
        <div class="tile" data-reveal>
          <div class="serif" style="font-size:32px;font-weight:700;color:#c9a227;margin-bottom:8px">${esc(m.year)}</div>
          <div class="serif" style="font-size:18px;font-weight:600;color:#3a2020;margin-bottom:8px">${esc(m.title)}</div>
          <div style="font-size:12.8px;line-height:1.7;color:#5a4a3a">${esc(m.description)}</div>
        </div>`).join('');

  const html = `
  ${header({ active: 'news', cta: { label: 'PRESS ENQUIRIES', href: '/contact' }, hotels, resorts, apartments })}

  <!-- ================= PAGE HEAD ================= -->
  <div style="padding:46px var(--gut) 26px" data-reveal>
    <div class="eyebrow-line">Newsroom</div>
    <h1 class="serif" style="font-size:42px;font-weight:600;margin:0 0 12px;color:#3a2020;letter-spacing:-0.015em">Group News &amp; Updates</h1>
    <p style="font-size:14.5px;color:#5a4a3a;margin:0;max-width:640px;line-height:1.7">Announcements, achievements and stories from across our thirteen resorts, hotels and apartments.</p>
  </div>
${featuredHtml}

  <!-- ================= STORY GRID ================= -->
  <div id="stories" style="padding:0 var(--gut) 48px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;gap:16px;flex-wrap:wrap" data-reveal>
      <h2 class="h-sec" style="font-size:26px">Latest Stories</h2>
      <div data-filter-group="news" style="display:flex;gap:9px">
        <button class="chip active" data-filter="all">All</button>
        <button class="chip" data-filter="group">Group</button>
        <button class="chip" data-filter="property">Properties</button>
        <button class="chip" data-filter="events">Events</button>
      </div>
    </div>

    <div style="gap:24px" data-stagger="0.07" class="g-3">${storyCards}
    </div>
  </div>

  <!-- ================= HERITAGE STRIP ================= -->
  <div style="background:#efe6d6;padding:50px var(--gut)">
    <div style="text-align:center;margin-bottom:32px" data-reveal>
      <div class="eyebrow-line" style="justify-content:center">Our History</div>
      <h2 class="h-sec">Milestones in the Speke Story</h2>
    </div>
    <div style="gap:22px" data-stagger="0.08" class="${milestones.length === 5 ? 'g-5' : milestones.length === 6 ? 'g-3' : 'g-4'}">${milestoneTiles}
    </div>
  </div>

  <!-- ================= PRESS CTA ================= -->
  <div style="background:#5c1728;padding:var(--gut);text-align:center" data-reveal>
    <div class="eyebrow-line" style="justify-content:center;color:#d4af6a">Media</div>
    <h2 class="serif" style="color:#fff;font-size:28px;font-weight:600;margin:0 0 14px">Press &amp; Media Enquiries</h2>
    <div style="font-size:14px;color:#f2e2c8;line-height:2;margin-bottom:22px">
      <div>${esc(email)}</div>
      <div>${phoneLine}</div>
    </div>
    <a class="btn btn-light" href="/contact"><span>CONTACT OUR TEAM</span></a>
  </div>

  ${footer(s, hotels, resorts, apartments)}
`;

  return <Html html={html} />;
}
