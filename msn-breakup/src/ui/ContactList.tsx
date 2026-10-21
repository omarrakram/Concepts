import { CONTACTS, HER, HIM, SONG } from '../story/cast';
import { UI } from '../fonts';
import { HerDP } from './desktop';
import { Buddy, Glyph, MsnMark, MusicNote, type Presence } from './icons';
import { rich } from './Conversation';
import { MenuBar, Scrollbar, XPWindow } from './xp';

/** The MSN Messenger 7.5 main window: her own header, then her contacts. */
export const LIST = { x: 96, y: 16, w: 290, h: 520 };

function Row({ status, name, psm, listening }: { status: Presence; name: string; psm?: string; listening?: boolean }) {
  const label = status === 'online' ? '' : ` (${status === 'away' ? 'Away' : status === 'busy' ? 'Busy' : status === 'blocked' ? 'Blocked' : 'Offline'})`;
  return (
    <div style={{ height: 19, display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 18, whiteSpace: 'nowrap', overflow: 'hidden', fontFamily: UI, fontSize: 11 }}>
      <Buddy status={status} size={16} style={{ flex: 'none' }} />
      <span style={{ color: status === 'offline' ? '#555' : '#000' }}>{name}</span>
      <span style={{ color: '#8a8a8a' }}>{label}</span>
      {listening ? (
        <span style={{ color: '#555', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          - <MusicNote size={11} /> {SONG.artist} - {SONG.title}
        </span>
      ) : (
        psm && <span style={{ color: '#555', fontStyle: 'italic' }}> - {psm}</span>
      )}
    </div>
  );
}

export function ContactList({ inactive, listening }: { inactive?: boolean; listening?: boolean }) {
  const online = CONTACTS.filter((c) => c.status !== 'offline');
  const offline = CONTACTS.filter((c) => c.status === 'offline');
  return (
    <XPWindow title="MSN Messenger" icon={<Buddy size={15} />} inactive={inactive} style={{ left: LIST.x, top: LIST.y, width: LIST.w, height: LIST.h }} bodyStyle={{ background: '#fff' }}>
      <MenuBar items={['File', 'Contacts', 'Actions', 'Tools', 'Help']} />
      {/* her header */}
      <div style={{ height: 96, background: 'linear-gradient(180deg,#f5f9ff 0%,#dfe9fa 100%)', borderBottom: '1px solid #b8c9e8', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 8, top: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="13" height="13" viewBox="0 0 13 13">
            <circle cx="6.5" cy="6.5" r="5.6" fill="#fff" stroke="#5a77b5" />
            <path d="M4 7.6l2.5-2.4L9 7.6" fill="none" stroke="#3a5596" strokeWidth="1.3" />
          </svg>
          <MsnMark size={13} />
          <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: '#1d3f8a' }}>Messenger</span>
        </div>
        <div style={{ position: 'absolute', left: 8, top: 24, width: 64, height: 64, borderRadius: 6, border: '1px solid #8aa4d6', background: '#fff', padding: 2, boxSizing: 'border-box' }}>
          <div style={{ borderRadius: 3, overflow: 'hidden', lineHeight: 0 }}>
            <HerDP size={58} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 80, top: 28, right: 6, fontFamily: UI }}>
          <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {HER.name} <span style={{ fontWeight: 400, color: '#7b7b7b' }}>(Online)</span> <Glyph kind="down" size={10} />
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, whiteSpace: 'nowrap' }}>
            {rich(HER.psm, 14)} <Glyph kind="down" size={10} />
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#1b3f9a' }}>
            <Glyph kind="mail" size={15} />
            (3)
          </div>
        </div>
      </div>
      {/* contact area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', background: '#fff' }}>
        <div style={{ width: 26, background: 'linear-gradient(90deg,#c9d9f6,#e4ecfa)', borderRight: '1px solid #b6c8ea', display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
          <Buddy size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ margin: '5px 5px 3px', padding: '4px 6px', background: '#ffffe1', border: '1px solid #e2d98a', display: 'flex', gap: 5, fontFamily: UI, fontSize: 11, color: '#1b3f9a', lineHeight: '13px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ flex: 'none' }}>
              <circle cx="7" cy="7" r="6.2" fill="#2f63d6" />
              <path d="M7 6v4.4M7 3.4v1" stroke="#fff" strokeWidth="1.8" />
            </svg>
            <span style={{ textDecoration: 'underline' }}>Click here to learn about the Customer Experience Improvement Program.</span>
          </div>
          <div style={{ height: 20, display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 6, fontFamily: UI, fontSize: 11 }}>
            <Buddy size={15} />
            <span style={{ marginLeft: -6, marginTop: 6, fontWeight: 700, color: '#2c8f2c', fontSize: 12 }}>+</span>
            Add a Contact
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', borderTop: '1px solid #e1e8f5' }}>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>
              <Group label={`Online (${online.length + 1})`} />
              <Row status="online" name={HIM.name} psm={HIM.psm} listening={listening} />
              {online.map((c) => (
                <Row key={c.name} status={c.status} name={c.name} psm={c.psm} />
              ))}
              <Group label={`Offline (${offline.length})`} />
              {offline.map((c) => (
                <Row key={c.name} status={c.status} name={c.name} psm={c.psm} />
              ))}
            </div>
            <Scrollbar height={262} pos={0} size={0.7} />
          </div>
        </div>
      </div>
      {/* the bottom banner (a plain, original messenger banner) */}
      <div style={{ height: 52, borderTop: '1px solid #b8c9e8', background: 'linear-gradient(180deg,#fff,#eef3fb)', position: 'relative', overflow: 'hidden' }}>
        <svg width="110" height="52" viewBox="0 0 110 52" style={{ position: 'absolute', left: 6, top: 0, opacity: 0.35 }}>
          <circle cx="30" cy="16" r="9" fill="#9bb5e3" />
          <path d="M14 52c1-14 8-22 16-22s15 8 16 22z" fill="#9bb5e3" />
          <circle cx="56" cy="20" r="8" fill="#c2d3f0" />
          <path d="M42 52c1-12 7-19 14-19s13 7 14 19z" fill="#c2d3f0" />
        </svg>
        <div style={{ position: 'absolute', left: 92, top: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <MsnMark size={20} />
          <span style={{ fontFamily: UI, fontSize: 14, color: '#1a1a1a' }}>Messenger</span>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 3, background: 'linear-gradient(90deg,#f47b20,#ffb900 30%,#7fba00 60%,#00a4ef)' }} />
      </div>
    </XPWindow>
  );
}

function Group({ label }: { label: string }) {
  return (
    <div style={{ height: 18, display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4, fontFamily: UI, fontSize: 11, fontWeight: 700, color: '#2b3d63' }}>
      <svg width="9" height="9" viewBox="0 0 9 9">
        <rect x=".5" y=".5" width="8" height="8" fill="#fff" stroke="#8f9fbd" />
        <path d="M2 4.5h5" stroke="#2b3d63" />
      </svg>
      {label}
    </div>
  );
}
