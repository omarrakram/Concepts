import { HER } from '../story/cast';
import { UI } from '../fonts';
import { HerDP } from './desktop';
import { Glyph, MsnMark } from './icons';
import { MenuBar, XPButton, XPWindow } from './xp';

/** The MSN Messenger 7.5 sign-in window, her details remembered. */
export function SignIn({ x, y, signingIn = 0 }: { x: number; y: number; signingIn?: number }) {
  const field = (w: number, children: React.ReactNode) => (
    <div style={{ width: w, height: 20, boxSizing: 'border-box', border: '1px solid #7f9db9', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 4px', fontFamily: UI, fontSize: 11 }}>{children}</div>
  );
  const box = (on: boolean, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: UI, fontSize: 11, height: 18 }}>
      <div style={{ width: 13, height: 13, boxSizing: 'border-box', border: '1px solid #1c5180', background: 'linear-gradient(135deg,#dcdcd7,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {on && (
          <svg width="9" height="9" viewBox="0 0 9 9">
            <path d="M1 4.5l2.4 2.4L8 1.6" fill="none" stroke="#21a121" strokeWidth="1.8" />
          </svg>
        )}
      </div>
      {label}
    </div>
  );
  return (
    <XPWindow title="MSN Messenger" style={{ left: x, top: y, width: 300, height: 520 }} bodyStyle={{ background: '#fff' }}>
      <MenuBar items={['File', 'Contacts', 'Actions', 'Tools', 'Help']} />
      <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px', background: 'linear-gradient(180deg,#f5f9ff,#dfe9fa)', borderBottom: '1px solid #b8c9e8' }}>
        <MsnMark size={13} />
        <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: '#1d3f8a' }}>Messenger</span>
      </div>
      <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg,#fff 0%,#f3f7fd 100%)' }}>
        <svg width="294" height="440" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
          <circle cx="200" cy="340" r="26" fill="#9bb5e3" />
          <path d="M150 440c2-40 22-62 50-62s48 22 50 62z" fill="#9bb5e3" />
          <circle cx="250" cy="360" r="20" fill="#c2d3f0" />
        </svg>
        <div style={{ position: 'absolute', left: 97, top: 18, width: 100, height: 100, borderRadius: 7, border: '1px solid #8aa4d6', background: 'linear-gradient(180deg,#fbfdff,#dce7f8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ border: '1px solid #9db3dc', borderRadius: 3, overflow: 'hidden', lineHeight: 0 }}>
            <HerDP size={88} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 62, top: 134, fontFamily: UI, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span>E-mail address:</span>
          <div style={{ display: 'flex' }}>
            {field(152, HER.email)}
            <div style={{ width: 16, height: 20, boxSizing: 'border-box', border: '1px solid #7f9db9', borderLeft: 'none', background: 'linear-gradient(180deg,#e1ebfd,#bcd1f8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Glyph kind="down" size={11} />
            </div>
          </div>
          <span style={{ marginTop: 6 }}>Password:</span>
          {field(168, <span style={{ letterSpacing: 2 }}>●●●●●●●●●</span>)}
          <span style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            Status: <span style={{ color: '#1b3f9a' }}>Online</span> <Glyph kind="down" size={10} />
          </span>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {box(true, 'Remember Me')}
            {box(true, 'Remember my Password')}
            {box(false, 'Sign me in automatically')}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 109, top: 350 }}>
          <XPButton width={76} height={24} pressed={signingIn > 0}>
            <span>
              <span style={{ textDecoration: 'underline' }}>S</span>ign In
            </span>
          </XPButton>
        </div>
        <div style={{ position: 'absolute', left: 14, bottom: 46, fontFamily: UI, fontSize: 11, color: '#1b3f9a', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ textDecoration: 'underline' }}>Forgot your password?</span>
          <span style={{ textDecoration: 'underline' }}>Service Status</span>
        </div>
        <div style={{ position: 'absolute', right: 14, bottom: 46, fontFamily: UI, fontSize: 11, color: '#1b3f9a', textDecoration: 'underline' }}>Get a new account</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, borderTop: '1px solid #d5dfef', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', fontFamily: UI, fontSize: 11, color: '#333' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="5.5" cy="8" r="3.6" fill="none" stroke="#4a6fb5" strokeWidth="1.8" />
            <path d="M9 8h6M13 8v3M15 8v2" stroke="#4a6fb5" strokeWidth="1.8" />
          </svg>
          Passport Network
        </div>
      </div>
    </XPWindow>
  );
}
