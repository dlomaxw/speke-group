import type { Metadata } from 'next';
import { randomUUID } from 'node:crypto';
import { ENQUIRY_TYPES, kampalaToday } from '@/lib/enquiry-rules';
import Html from '@/components/site/Html';
import { getChrome, setting } from '@/lib/site-data';
import { esc, safeUrl, slot, header, footer, phones, telHref } from '@/lib/site-html';

export const metadata: Metadata = {
  title: 'Contact | Speke Group of Hotels',
};

export default async function ContactPage({
  searchParams,
}: { searchParams: Promise<{ sent?: string; error?: string; property?: string; type?: string }> }) {
  const { settings: s, hotels, resorts, apartments, allProperties } = await getChrome();
  const query = await searchParams;
  const today = kampalaToday();
  const preselect = Number(query.property);
  const preType = ENQUIRY_TYPES.some((t) => t.value === query.type) ? query.type : 'stay';

  // Shown when the form was posted without JavaScript and came back here.
  const status = query.sent
    ? `<p class="form-status ok" role="status">Thank you. Your message has reached our team. Your reference is ${esc(query.sent)}.</p>`
    : query.error
      ? `<p class="form-status err" role="alert">${esc(query.error)}</p>`
      : '<p class="form-status" role="status" aria-live="polite"></p>';

  const propertyOptions = allProperties.map((p) =>
    `<option value="${p.id}"${p.id === preselect ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  const typeOptions = ENQUIRY_TYPES.map((t) =>
    `<option value="${t.value}"${t.value === preType ? ' selected' : ''}>${esc(t.label)}</option>`).join('');
  const address = `${esc(setting(s, 'contact_address_1'))}<br>${esc(setting(s, 'contact_address_2'))}`;
  const email = setting(s, 'contact_email');
  const diningEmail = setting(s, 'contact_dining_email');
  const facebook = setting(s, 'social_facebook');
  const twitter = setting(s, 'social_twitter');
  const firstPhone = phones(s)[0];

  const directory = allProperties.map((p) => `
          <a class="tile" href="${safeUrl(p.websiteUrl, `https://spekegroup.com/${esc(p.slug)}/`)}" data-reveal style="padding:16px 18px">
            <div class="eyebrow" style="font-size:9.5px;letter-spacing:.14em;color:#b8935a;font-weight:700;text-transform:uppercase;margin-bottom:5px">${esc(p.categoryLabel)}</div>
            <div style="font-size:14.5px;font-weight:600;color:#3a2020;margin-bottom:5px">${esc(p.name)}</div>
            <div style="font-size:12px;color:#7a6a5a;line-height:1.65">${esc(p.area)}</div>
            <div style="font-size:12px;color:#6f2033;font-weight:600;margin-top:7px">VIEW PROPERTY &#8599;</div>
          </a>`).join('');

  const html = `
  ${header({
    active: 'contact',
    cta: { label: 'CALL RESERVATIONS', href: firstPhone ? telHref(firstPhone) : '/contact' },
    hotels, resorts, apartments,
  })}

  <!-- ================= PAGE HEAD ================= -->
  <div style="padding:46px var(--gut) 10px" data-reveal>
    <div class="eyebrow-line">Speke Group of Hotels</div>
    <h1 class="serif" style="font-size:42px;font-weight:600;margin:0 0 12px;color:#3a2020;letter-spacing:-0.015em">Contact</h1>
    <p style="font-size:14.5px;color:#5a4a3a;margin:0;max-width:620px;line-height:1.7">Reach our head office on Kampala Road, or connect directly with any of our thirteen resorts, hotels and apartments.</p>
  </div>

  <!-- ================= CONTACT CARDS ================= -->
  <div style="gap:22px;padding:28px var(--gut) 10px" data-stagger="0.08" class="g-3">
    <div class="tile" data-reveal>
      <div class="serif" style="font-size:26px;color:#c9a227;margin-bottom:10px">⌂</div>
      <div class="col-title" style="color:#b8935a;margin-bottom:10px">Address</div>
      <div style="font-size:14px;line-height:1.9;color:#3a2020">
        ${address}
      </div>
    </div>
    <div class="tile" data-reveal>
      <div class="serif" style="font-size:26px;color:#c9a227;margin-bottom:10px">✆</div>
      <div class="col-title" style="color:#b8935a;margin-bottom:10px">Reservations</div>
      <div style="font-size:14px;line-height:1.95;color:#3a2020;display:flex;flex-direction:column">${phones(s).map((p) => `
        <a href="${esc(telHref(p))}" style="color:#3a2020">${esc(p)}</a>`).join('')}
      </div>
    </div>
    <div class="tile" data-reveal>
      <div class="serif" style="font-size:26px;color:#c9a227;margin-bottom:10px">✉</div>
      <div class="col-title" style="color:#b8935a;margin-bottom:10px">Email &amp; Socials</div>
      <div style="font-size:14px;line-height:1.95;color:#3a2020;display:flex;flex-direction:column;margin-bottom:14px">${email ? `
        <a href="mailto:${esc(email)}" style="color:#3a2020">${esc(email)}</a>` : ''}${diningEmail ? `
        <a href="mailto:${esc(diningEmail)}" style="color:#3a2020">${esc(diningEmail)} &mdash; dining</a>` : ''}
      </div>
      <div style="display:flex;gap:10px">${facebook ? `
        <a class="social" style="border-color:rgba(111,32,51,.3);color:#6f2033" href="${safeUrl(facebook)}">f</a>` : ''}${twitter ? `
        <a class="social" style="border-color:rgba(111,32,51,.3);color:#6f2033" href="${safeUrl(twitter)}">X</a>` : ''}
      </div>
    </div>
  </div>

  <!-- ================= FORM + DIRECTORY ================= -->
  <div style="padding:30px var(--gut) 48px;gap:48px" class="g-split-c">
    <div data-reveal>
      <div class="eyebrow-line">Enquiries</div>
      <h2 class="h-sec" style="font-size:24px;margin-bottom:18px">Send a Message</h2>
      <form class="sg-form" id="enquiry" data-enquiry action="/api/enquiries" method="post" novalidate>
        <input type="hidden" name="idempotencyKey" value="${randomUUID()}">
        <input type="hidden" name="sourcePage" value="/contact">
        <div class="row2">
          <div>
            <label class="fl" for="f-property">Property</label>
            <select id="f-property" name="propertyId">
              <option value="">Not sure yet, or the whole group</option>${propertyOptions}
            </select>
          </div>
          <div>
            <label class="fl" for="f-kind">Your enquiry is about</label>
            <select id="f-kind" name="kind">${typeOptions}</select>
          </div>
        </div>
        <div>
          <label class="fl" for="f-name">Full name</label>
          <input id="f-name" type="text" name="name" autocomplete="name" required maxlength="160">
        </div>
        <fieldset class="methods">
          <legend class="fl">Reply to me by</legend>
          <label><input type="radio" name="contactMethod" value="email" checked> Email</label>
          <label><input type="radio" name="contactMethod" value="phone"> Phone call</label>
          <label><input type="radio" name="contactMethod" value="whatsapp"> WhatsApp</label>
        </fieldset>
        <div class="row2">
          <div>
            <label class="fl" for="f-email">Email address</label>
            <input id="f-email" type="email" name="email" autocomplete="email" maxlength="255">
          </div>
          <div>
            <label class="fl" for="f-phone">Phone number</label>
            <input id="f-phone" type="tel" name="phone" autocomplete="tel" maxlength="60" placeholder="+256 …">
          </div>
        </div>
        <div class="row3">
          <div>
            <label class="fl" for="f-arrival">Arrival <span class="opt">optional</span></label>
            <input id="f-arrival" type="date" name="arrivalDate" min="${today}">
          </div>
          <div>
            <label class="fl" for="f-departure">Departure <span class="opt">optional</span></label>
            <input id="f-departure" type="date" name="departureDate" min="${today}">
          </div>
          <div>
            <label class="fl" for="f-guests">Guests <span class="opt">optional</span></label>
            <input id="f-guests" type="number" name="guests" min="1" max="2000" inputmode="numeric">
          </div>
        </div>
        <div>
          <label class="fl" for="f-subject">Subject <span class="opt">optional</span></label>
          <input id="f-subject" type="text" name="subject" maxlength="250">
        </div>
        <div>
          <label class="fl" for="f-message">Your message</label>
          <textarea id="f-message" name="message" rows="5" style="resize:vertical" required maxlength="5000"></textarea>
        </div>
        <label class="consent">
          <input type="checkbox" name="marketingOptIn">
          <span>Send me offers and news from Speke Group by email. This is separate from your enquiry, and you can unsubscribe at any time.</span>
        </label>
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn btn-solid" type="submit"><span>SEND MESSAGE</span></button>
        ${status}
        <p class="form-note">We only use these details to answer your enquiry. Please do not send card or passport details.</p>
      </form>
      <div style="margin-top:30px;padding-top:22px;border-top:1px solid rgba(111,32,51,0.15)">
        <h3 class="serif" style="font-size:18px;font-weight:600;margin:0 0 10px;color:#3a2020">Information</h3>
        <div style="font-size:13.5px;line-height:2;display:flex;flex-direction:column">
          <a href="https://spekegroup.com/about-us/">About Us</a>
          <a href="https://spekegroup.com/contact/">Careers</a>
          <a href="https://spekegroup.com/contact/">SOPs</a>
          <a href="https://spekegroup.com/contact/">Terms &amp; Conditions</a>
        </div>
      </div>
    </div>

    <div data-reveal data-reveal-delay="0.1">
      <div class="eyebrow-line">Directory</div>
      <h2 class="h-sec" style="font-size:24px;margin-bottom:18px">Our Thirteen Properties</h2>
      <div style="gap:14px" data-stagger="0.04" class="g-2">${directory}
      </div>
    </div>
  </div>

  <!-- ================= MAP ================= -->
  <div class="hero-tile" style="height:300px">
    ${slot(setting(s, 'contact_map_image', '/images/contact-map.webp'), 'Speke Group location', 'width:100%;height:100%')}
    <div style="position:absolute;left:var(--gut);top:28px;background:rgba(92,23,40,.93);color:#f2e2c8;padding:18px 22px;border-radius:10px;max-width:300px;pointer-events:none">
      <div class="col-title" style="color:#d4af6a">Head Office</div>
      <div style="font-size:13.5px;line-height:1.85">${address}</div>
    </div>
  </div>

  ${footer(s, hotels, resorts, apartments)}
`;

  return <Html html={html} />;
}
