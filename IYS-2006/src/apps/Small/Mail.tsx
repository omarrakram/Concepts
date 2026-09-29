import { useState } from 'react';
import { Icon } from '../../components/os/Icon';
import { Window } from '../../components/os/Window';
import { concept, official, OFFICIAL_VERIFIED_ON } from '../../data/copy';
import type { Win } from '../../state/os';

/** IYS MAIL — portfolio-only newsletter form. Nothing is sent or stored. */
export default function Mail({ win }: { win: Win }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <Window
      win={win}
      icon="mail"
      menubar={['File', 'Edit', 'View', 'Message', 'Help']}
      statusbar={
        <div className="statusbar">
          <span className="grow" role="status">
            {sent ? concept.mail.done : 'Ready.'}
          </span>
        </div>
      }
    >
      <form
        className="mail"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <div className="mail__row">
          <span>From:</span>
          <b>IN YOUR SHOE &lt;cool list&gt;</b>
        </div>
        <div className="mail__row">
          <label htmlFor="mail-to">To:</label>
          <input id="mail-to" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="off" data-autofocus />
        </div>
        <div className="mail__row">
          <span>Subject:</span>
          <b>{concept.mail.subject}</b>
        </div>
        <div className="mail__body">
          <p>
            <Icon name="mail" size={24} /> <b>{official.coolList}</b>
          </p>
          <p className="muted small">Offer text verified on inyourshoe.com on {OFFICIAL_VERIFIED_ON}. No code is shown here — the real list sends it.</p>
          <p className="small">{concept.mail.note}</p>
          <p className="small">
            <a href="https://inyourshoe.com/" target="_blank" rel="noopener noreferrer">
              Join the real cool list on inyourshoe.com ↗
            </a>
          </p>
        </div>
        <div className="cp-actions">
          <button type="submit" className="btn btn--go">
            {concept.y2k.newsletterCta}
          </button>
        </div>
      </form>
    </Window>
  );
}
