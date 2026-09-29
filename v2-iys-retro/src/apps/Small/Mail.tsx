import { useId, useRef, useState } from 'react';
import { Icon } from '../../components/os/Icon';
import { Window } from '../../components/os/Window';
import { SUPPORT_EMAIL_ENDPOINT, SUPPORT_EMAIL_TO } from '../../config/integrations';
import { concept } from '../../data/copy';
import type { Win } from '../../state/os';

const TOPICS = ['Order question', 'Delivery', 'Product question', 'Payment', 'Store question', 'Other'] as const;
type Phase = 'idle' | 'sending' | 'sent' | 'error';

/**
 * IYS MAIL — the retro support mail client. Sends a REAL email to
 * orders@inyourshoe.com through /api/support-email (server-side provider).
 * Success is shown only after the server confirms it.
 */
export default function Mail({ win }: { win: Win }) {
  const id = useId();
  const [f, setF] = useState({ email: '', name: '', order: '', topic: '', subject: '', message: '', website: '' });
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const busy = useRef(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPhase('sending');
    setError('');
    try {
      const res = await fetch(SUPPORT_EMAIL_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && body?.ok === true) setPhase('sent');
      else {
        setError(body?.error ?? concept.mail.failed);
        setPhase('error');
      }
    } catch {
      setError(concept.mail.failed);
      setPhase('error');
    } finally {
      busy.current = false;
    }
  };

  const status = phase === 'sending' ? concept.mail.sending : phase === 'sent' ? concept.mail.done : phase === 'error' ? `${concept.mail.errorTitle} ${error}` : 'Ready.';

  return (
    <Window
      win={win}
      icon="mail"
      menubar={['File', 'Edit', 'View', 'Message', 'Help']}
      statusbar={
        <div className="statusbar">
          <span className="grow" role="status" aria-live="polite">
            {status}
          </span>
        </div>
      }
    >
      {phase === 'sent' ? (
        <div className="mail mail--sent">
          <div className="mail__body">
            <p>
              <Icon name="mail" size={32} /> <b>{concept.mail.done}</b>
            </p>
            <p>{concept.mail.doneSub}</p>
          </div>
          <div className="cp-actions">
            <button
              type="button"
              className="btn"
              data-autofocus
              onClick={() => {
                setF((s) => ({ ...s, subject: '', message: '', order: '' }));
                setPhase('idle');
              }}
            >
              {concept.mail.another}
            </button>
          </div>
        </div>
      ) : (
        <form className="mail" onSubmit={send} aria-busy={phase === 'sending'}>
          <div className="mail__row">
            <span>To:</span>
            <input className="input mail__to" value={SUPPORT_EMAIL_TO} readOnly aria-label="To" tabIndex={-1} />
          </div>
          <div className="mail__row">
            <label htmlFor={`${id}-from`}>From:</label>
            <input id={`${id}-from`} className="input" type="email" required maxLength={254} value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" data-autofocus />
          </div>
          <div className="mail__row">
            <label htmlFor={`${id}-name`}>Name:</label>
            <input id={`${id}-name`} className="input" required maxLength={80} value={f.name} onChange={set('name')} autoComplete="name" />
          </div>
          <div className="mail__row mail__row--pair">
            <label htmlFor={`${id}-order`}>Order #:</label>
            <input id={`${id}-order`} className="input" maxLength={40} value={f.order} onChange={set('order')} placeholder="optional" />
            <label htmlFor={`${id}-topic`}>Topic:</label>
            <select id={`${id}-topic`} className="select" required value={f.topic} onChange={set('topic')}>
              <option value="" disabled>
                Choose...
              </option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="mail__row">
            <label htmlFor={`${id}-subject`}>Subject:</label>
            <input id={`${id}-subject`} className="input" required maxLength={120} value={f.subject} onChange={set('subject')} />
          </div>
          <label htmlFor={`${id}-message`} className="sr-only">
            Message
          </label>
          <textarea id={`${id}-message`} className="input mail__message" required minLength={2} maxLength={4000} value={f.message} onChange={set('message')} placeholder={concept.mail.placeholder} />
          <div className="mail__hp" aria-hidden="true">
            <label htmlFor={`${id}-website`}>Website</label>
            <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
          </div>
          {phase === 'error' && (
            <p className="mail__error" role="alert">
              <Icon name="error" size={16} /> {concept.mail.errorTitle} {error}
            </p>
          )}
          <div className="mail__foot">
            <small className="muted">{concept.mail.note}</small>
            <button type="submit" className="btn btn--go" disabled={phase === 'sending'}>
              {phase === 'sending' ? concept.mail.sending : phase === 'error' ? concept.mail.retry : concept.mail.send}
            </button>
          </div>
        </form>
      )}
    </Window>
  );
}
