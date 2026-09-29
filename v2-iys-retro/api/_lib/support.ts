/**
 * IYS MAIL → real support email (server-side only).
 *
 * Pure validation + message building + a request handler that takes its
 * environment and mail sender as arguments, so it can be unit-tested without
 * network or secrets. The Vercel function in ../support-email.ts wires it to
 * process.env and the Resend REST API.
 *
 * Never logs customer data. Never returns provider errors to the client.
 */

export const SUPPORT_TOPICS = ['Order question', 'Delivery', 'Product question', 'Payment', 'Store question', 'Other'] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export const DEFAULT_SUPPORT_TO = 'orders@inyourshoe.com';

export const LIMITS = {
  body: 16_000,
  email: 254,
  name: 80,
  order: 40,
  subject: 120,
  message: 4000,
} as const;

const FIELDS = ['email', 'name', 'order', 'topic', 'subject', 'message', 'website'] as const;

export interface SupportRequest {
  email: string;
  name: string;
  order: string;
  topic: SupportTopic;
  subject: string;
  message: string;
}

export type ValidationResult = { ok: true; value: SupportRequest } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
/** Single-line fields: collapse any line breaks / control chars. */
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
/** Multi-line message: keep newlines, drop other control chars. */
const multiLine = (s: string) => s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();

export const isValidEmail = (s: string) => s.length <= LIMITS.email && EMAIL_RE.test(s);

export function validateSupport(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Malformed request.' };
  const o = input as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!(FIELDS as readonly string[]).includes(k)) return { ok: false, error: 'Unexpected field.' };
  for (const k of FIELDS) if (o[k] !== undefined && typeof o[k] !== 'string') return { ok: false, error: 'Malformed request.' };
  // Honeypot: real people never see or fill this field.
  if (typeof o.website === 'string' && o.website.trim() !== '') return { ok: false, error: 'Rejected.' };

  const email = oneLine((o.email as string) ?? '').toLowerCase();
  const name = oneLine((o.name as string) ?? '');
  const order = oneLine((o.order as string) ?? '');
  const topic = oneLine((o.topic as string) ?? '');
  const subject = oneLine((o.subject as string) ?? '');
  const message = multiLine((o.message as string) ?? '');

  if (!isValidEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!name || name.length > LIMITS.name) return { ok: false, error: `Please enter your name (max ${LIMITS.name} characters).` };
  if (order.length > LIMITS.order || (order && !/^[A-Za-z0-9#\- ]+$/.test(order))) return { ok: false, error: 'Order number can only use letters, numbers, # and -.' };
  if (!(SUPPORT_TOPICS as readonly string[]).includes(topic)) return { ok: false, error: 'Please choose a topic.' };
  if (!subject || subject.length > LIMITS.subject) return { ok: false, error: `Please add a subject (max ${LIMITS.subject} characters).` };
  if (message.length < 2 || message.length > LIMITS.message) return { ok: false, error: `Please write a message (max ${LIMITS.message} characters).` };
  return { ok: true, value: { email, name, order, topic: topic as SupportTopic, subject, message } };
}

export interface OutgoingMail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export function buildSupportMail(v: SupportRequest, env: { from: string; to: string }, now: Date): OutgoingMail {
  return {
    from: env.from,
    to: env.to,
    replyTo: v.email,
    subject: `[IYS Support] ${v.subject}`,
    text: [
      'New support message from IYS Retro V2',
      '',
      `Name:\n${v.name}`,
      '',
      `Customer Email:\n${v.email}`,
      '',
      `Order Number:\n${v.order || '—'}`,
      '',
      `Topic:\n${v.topic}`,
      '',
      `Message:\n${v.message}`,
      '',
      `Submitted:\n${now.toISOString()}`,
      '',
      'Source:\nIYS MAIL — IYS Retro V2',
    ].join('\n'),
  };
}

export interface SupportEnv {
  RESEND_API_KEY?: string;
  SUPPORT_FROM_EMAIL?: string;
  SUPPORT_TO_EMAIL?: string;
}
export type Sender = (mail: OutgoingMail, apiKey: string) => Promise<boolean>;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

/** Origin must match the host the request was sent to (same-origin form only). */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleSupport(req: Request, env: SupportEnv, send: Sender, now = new Date()): Promise<Response> {
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), { status: 405, headers: { Allow: 'POST', 'Content-Type': 'application/json' } });
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, error: 'Unsupported content type.' });
  if (!sameOrigin(req)) return json(403, { ok: false, error: 'Forbidden.' });

  const raw = await req.text();
  if (raw.length > LIMITS.body) return json(413, { ok: false, error: 'Message too large.' });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'Malformed request.' });
  }
  const v = validateSupport(parsed);
  if (!v.ok) return json(400, { ok: false, error: v.error });

  const from = env.SUPPORT_FROM_EMAIL?.trim();
  const key = env.RESEND_API_KEY?.trim();
  const to = env.SUPPORT_TO_EMAIL?.trim() || DEFAULT_SUPPORT_TO;
  if (!from || !key) return json(503, { ok: false, error: 'IYS MAIL is not connected yet. Please email orders@inyourshoe.com directly.' });

  let sent = false;
  try {
    sent = await send(buildSupportMail(v.value, { from, to }, now), key);
  } catch {
    sent = false;
  }
  if (!sent) return json(502, { ok: false, error: 'Mail server did not accept the message. Please try again.' });
  return json(200, { ok: true });
}

/** Resend REST API (https://resend.com/docs/api-reference/emails/send-email). */
export const resendSender: Sender = async (mail, apiKey) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: mail.from, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text }),
  });
  return res.ok;
};
