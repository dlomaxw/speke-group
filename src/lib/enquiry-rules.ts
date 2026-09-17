/**
 * Enquiry validation shared by the API and the dashboard. No server-only
 * imports, so the rules can be unit-checked from a script.
 */

export const ENQUIRY_TYPES = [
  { value: 'stay', label: 'A stay or accommodation' },
  { value: 'event', label: 'An event, meeting or wedding' },
  { value: 'dining', label: 'Dining' },
  { value: 'general', label: 'Something else' },
  { value: 'careers', label: 'Careers' },
  { value: 'press', label: 'Press and media' },
] as const;

export const CONTACT_METHODS = ['email', 'phone', 'whatsapp'] as const;

export type EnquiryInput = {
  propertyId: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  contactMethod: (typeof CONTACT_METHODS)[number];
  kind: (typeof ENQUIRY_TYPES)[number]['value'];
  arrivalDate: string | null;
  departureDate: string | null;
  guests: number | null;
  subject: string | null;
  message: string;
  marketingOptIn: boolean;
};

export type FieldErrors = Partial<Record<keyof EnquiryInput | 'idempotencyKey', string>>;

export const enquiryReference = (id: number) => `SG-${String(id).padStart(6, '0')}`;

/** Today's date in Kampala as YYYY-MM-DD, which is what stay dates are compared against. */
export function kampalaToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validateEnquiry(raw: Record<string, unknown>, validPropertyIds: Set<number>, now = new Date()):
  { ok: true; data: EnquiryInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const name = str(raw.name, 160);
  if (!name) errors.name = 'Please tell us your name.';

  const method = str(raw.contactMethod, 20) || 'email';
  const contactMethod = (CONTACT_METHODS as readonly string[]).includes(method)
    ? (method as EnquiryInput['contactMethod']) : null;
  if (!contactMethod) errors.contactMethod = 'Choose how you would like us to reply.';

  const email = str(raw.email, 255).toLowerCase() || null;
  const phone = str(raw.phone, 60) || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = 'That email address does not look right.';
  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone)) errors.phone = 'That phone number does not look right.';
  if (contactMethod === 'email' && !email) errors.email = 'Add an email address so we can reply.';
  if ((contactMethod === 'phone' || contactMethod === 'whatsapp') && !phone) {
    errors.phone = 'Add a phone number so we can reply.';
  }

  const kindRaw = str(raw.kind ?? raw.enquiryType, 20) || 'general';
  const kind = ENQUIRY_TYPES.some((t) => t.value === kindRaw) ? (kindRaw as EnquiryInput['kind']) : null;
  if (!kind) errors.kind = 'Choose what the enquiry is about.';

  let propertyId: number | null = null;
  const propRaw = raw.propertyId;
  if (propRaw !== undefined && propRaw !== null && propRaw !== '') {
    const n = Number(propRaw);
    if (!Number.isInteger(n) || !validPropertyIds.has(n)) errors.propertyId = 'Choose a property from the list.';
    else propertyId = n;
  }

  const today = kampalaToday(now);
  const arrivalDate = str(raw.arrivalDate, 10) || null;
  const departureDate = str(raw.departureDate, 10) || null;
  if (arrivalDate && !isRealDate(arrivalDate)) errors.arrivalDate = 'Enter a valid arrival date.';
  else if (arrivalDate && arrivalDate < today) errors.arrivalDate = 'Arrival cannot be in the past.';
  if (departureDate && !isRealDate(departureDate)) errors.departureDate = 'Enter a valid departure date.';
  else if (departureDate && !arrivalDate) errors.arrivalDate = 'Add an arrival date as well.';
  else if (departureDate && arrivalDate && departureDate <= arrivalDate) {
    errors.departureDate = 'Departure must be after arrival.';
  }

  let guests: number | null = null;
  const guestsRaw = raw.guests;
  if (guestsRaw !== undefined && guestsRaw !== null && guestsRaw !== '') {
    const n = Number(guestsRaw);
    if (!Number.isInteger(n) || n < 1 || n > 2000) errors.guests = 'Guests must be a whole number from 1 to 2000.';
    else guests = n;
  }

  const message = str(raw.message, 5000);
  if (message.length < 10) errors.message = 'Please write a little more so we can help.';

  const subject = str(raw.subject, 250) || null;
  const marketingOptIn = raw.marketingOptIn === true || raw.marketingOptIn === 'on' || raw.marketingOptIn === 'true';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      propertyId, name, email, phone, contactMethod: contactMethod!, kind: kind!,
      arrivalDate, departureDate, guests, subject, message, marketingOptIn,
    },
  };
}
