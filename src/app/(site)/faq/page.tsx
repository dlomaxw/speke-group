import type { Metadata } from 'next';
import Html from '@/components/site/Html';
import { getChrome, getFaqs, setting } from '@/lib/site-data';
import { esc, header, footer, phones, telHref, paragraphs } from '@/lib/site-html';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Speke Group of Hotels',
  description: 'Booking, stays, events and directions across the thirteen hotels, resorts and serviced apartments of Speke Group in Kampala, Uganda.',
};

/** The order the sections read in, and what each one is called. */
const SECTIONS: { key: string; label: string }[] = [
  { key: 'booking', label: 'Booking' },
  { key: 'stay', label: 'Your stay' },
  { key: 'events', label: 'Events & meetings' },
  { key: 'group', label: 'About the Group' },
];

export default async function FaqPage() {
  const [{ settings: s, hotels, resorts, apartments }, questions] = await Promise.all([getChrome(), getFaqs()]);
  const firstPhone = phones(s)[0];

  const groups = SECTIONS.map(({ key, label }) => {
    const rows = questions.filter((q) => q.category === key);
    if (!rows.length) return '';
    return `
      <section class="faq-group" data-reveal>
        <h3>${esc(label)}</h3>
        ${rows.map((q) => `
        <details class="faq-item">
          <summary>${esc(q.question)}</summary>
          <p class="faq-answer">${esc(q.answer)}</p>
        </details>`).join('')}
      </section>`;
  }).join('');

  /* Search engines read this as a FAQ; it carries the same text as the page. */
  const structured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  });

  const html = `
  ${header({
    active: 'contact',
    cta: { label: 'CALL RESERVATIONS', href: firstPhone ? telHref(firstPhone) : '/contact' },
    hotels, resorts, apartments,
  })}

  <!-- ================= PAGE HEAD ================= -->
  <div style="padding:46px var(--gut) 10px" data-reveal>
    <div class="eyebrow-line">Help</div>
    <h1 class="serif" style="font-size:42px;font-weight:600;margin:0 0 12px;color:#3a2020;letter-spacing:-0.015em">Frequently Asked Questions</h1>
    <p style="font-size:14.5px;color:#5a4a3a;margin:0;max-width:640px;line-height:1.7">Booking, staying, meeting and finding us. If your question is not here, our team will answer it.</p>
  </div>

  <!-- ================= QUESTIONS ================= -->
  <div style="padding:20px var(--gut) 40px;max-width:860px">${groups}
  </div>

  <!-- ================= STILL ASKING ================= -->
  <div style="background:#efe6d6;padding:44px var(--gut);text-align:center" data-reveal>
    <h2 class="h-sec" style="margin-bottom:10px">Still have a question?</h2>
    <div style="max-width:620px;margin:0 auto">
      ${paragraphs('Our reservations team answers enquiries every day, and can arrange stays, events and longer bookings across the Group.', 'font-size:14px;line-height:1.72;color:#5a4a3a;margin:0 0 18px')}
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="btn btn-solid" href="/contact"><span>ASK OUR TEAM</span></a>
      ${firstPhone ? `<a class="btn btn-ghost" href="${telHref(firstPhone)}"><span>CALL ${esc(firstPhone)}</span></a>` : ''}
    </div>
  </div>

  ${footer(s)}
`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structured }} />
      <Html html={html} />
    </>
  );
}
