import type { CSSProperties, ReactNode } from 'react';
import { HIS_FONT, SERIF, UI } from '../fonts';
import { FORM, PAGE, TUMBLR_TEXT } from '../story/tumblr';

/**
 * Tumblr in 2007, as a simple, plausible period design (not a reproduction:
 * no Tumblr artwork is used, the wordmark is set in a plain bold face): the
 * slate-blue "new text post" page with its post-type row, Title and Post
 * fields and the "Create post" button, then her blog in a plain serif theme.
 */
const SLATE = '#2c4762';

const caret = (h: number) => <span style={{ display: 'inline-block', width: 1, height: h, background: '#000', verticalAlign: '-3px', marginLeft: 1 }} />;
const field: CSSProperties = {
  position: 'absolute',
  boxSizing: 'border-box',
  border: '1px solid #a5acb5',
  borderRadius: 3,
  background: '#fff',
  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,.12)',
  overflow: 'hidden',
};
const label: CSSProperties = { position: 'absolute', left: FORM.title.x, fontFamily: HIS_FONT, fontWeight: 700, fontSize: 12, color: '#3b3b3b' };

export function TumblrPostForm({ title, body, focus, caretOn, createPressed }: { title: string; body: string[]; focus: 'title' | 'body' | null; caretOn: boolean; createPressed: boolean }) {
  const T = TUMBLR_TEXT;
  return (
    <div style={{ position: 'absolute', inset: 0, background: SLATE }}>
      {/* header */}
      <div style={{ position: 'absolute', left: 18, top: 7, fontFamily: HIS_FONT, fontWeight: 700, fontSize: 30, letterSpacing: -1.2, color: '#fff' }}>{T.wordmark}</div>
      <div style={{ position: 'absolute', right: 16, top: 20, display: 'flex', gap: 14, fontFamily: UI, fontSize: 11, color: '#b9c6d6' }}>
        {T.nav.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      {/* the form */}
      <div style={{ position: 'absolute', left: FORM.panel.x, top: FORM.panel.y, width: FORM.panel.w, height: FORM.panel.h, borderRadius: 10, background: '#fff' }} />
      <div style={{ position: 'absolute', left: FORM.panel.x + 16, top: FORM.panel.y + 9, display: 'flex' }}>
        {T.postTypes.map((p, i) => (
          <div key={p} style={{ width: 62, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <PostType kind={i} on={i === 0} />
            <span style={{ fontFamily: HIS_FONT, fontSize: 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? SLATE : '#9aa4ae' }}>{p}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: FORM.panel.x + 14, width: FORM.panel.w - 28, top: FORM.panel.y + 58, height: 1, background: '#e1e5ea' }} />
      <div style={{ ...label, top: FORM.titleLabel }}>{T.titleLabel}</div>
      <div style={{ ...field, left: FORM.title.x, top: FORM.title.y, width: FORM.title.w, height: FORM.title.h, borderColor: focus === 'title' ? '#6d8db3' : '#a5acb5' }}>
        <div style={{ padding: '0 7px', lineHeight: `${FORM.title.h - 2}px`, fontFamily: HIS_FONT, fontSize: 15, color: '#222', whiteSpace: 'nowrap' }}>
          {title}
          {focus === 'title' && caretOn && caret(17)}
        </div>
      </div>
      <div style={{ ...label, top: FORM.bodyLabel }}>{T.bodyLabel}</div>
      <div style={{ ...field, left: FORM.body.x, top: FORM.body.y, width: FORM.body.w, height: FORM.body.h, borderColor: focus === 'body' ? '#6d8db3' : '#a5acb5' }}>
        <div style={{ padding: '5px 7px', fontFamily: HIS_FONT, fontSize: 13, lineHeight: '19px', color: '#222' }}>
          {(body.length ? body : ['']).map((line, i, all) => (
            <div key={i} style={{ height: 19, whiteSpace: 'nowrap' }}>
              {line}
              {focus === 'body' && caretOn && i === all.length - 1 && caret(15)}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: FORM.create.x,
          top: FORM.create.y,
          width: FORM.create.w,
          height: FORM.create.h,
          boxSizing: 'border-box',
          borderRadius: 6,
          border: '1px solid #3c5a7d',
          background: createPressed ? 'linear-gradient(180deg,#46668b,#5b7da4)' : 'linear-gradient(180deg,#7d9cc0,#557aa3 55%,#4a6d94)',
          boxShadow: createPressed ? 'inset 1px 2px 3px rgba(0,0,0,.35)' : 'inset 0 1px 0 rgba(255,255,255,.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: HIS_FONT,
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
          textShadow: '0 -1px 0 rgba(0,0,0,.25)',
        }}
      >
        {T.create}
      </div>
    </div>
  );
}

/** Her blog, with the post she just made on top. */
export function TumblrBlog({ title, body }: { title: string; body: string[] }) {
  const T = TUMBLR_TEXT;
  const rule = <div style={{ height: 0, borderTop: '1px dotted #e3a9c8' }} />;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fdeef6' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 20, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: '#e0108a' }}>{T.blogTitle}</div>
      <div style={{ position: 'absolute', left: 40, width: PAGE.w - 80, top: 76 }}>
        {rule}
        <div style={{ marginTop: 16, fontFamily: SERIF, fontStyle: 'italic', fontSize: 11.5, color: '#b07a98' }}>{T.date}</div>
        <div style={{ marginTop: 6, fontFamily: SERIF, fontWeight: 700, fontSize: 18, lineHeight: '24px', color: '#2d2d2d' }}>{title}</div>
        <div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 14, lineHeight: '21px', color: '#3d3d3d' }}>
          {body.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>{rule}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 10.5, color: '#c29ab0' }}>{T.footer}</div>
    </div>
  );
}

/** The six post-type buttons' pictures: Text, Photo, Quote, Link, Chat, Video (original drawings). */
function PostType({ kind, on }: { kind: number; on: boolean }) {
  const c = on ? SLATE : '#b6c0cb';
  const shapes: ReactNode[] = [
    <text key="t" x="12" y="17" textAnchor="middle" fontFamily={SERIF} fontWeight="700" fontSize="15" fill={c}>
      Aa
    </text>,
    <g key="p">
      <rect x="3" y="7" width="18" height="12" rx="2" fill={c} />
      <rect x="8" y="4.5" width="6" height="3.5" rx="1" fill={c} />
      <circle cx="12" cy="13" r="3.6" fill="#fff" />
      <circle cx="12" cy="13" r="2" fill={c} />
    </g>,
    <text key="q" x="12" y="22" textAnchor="middle" fontFamily={SERIF} fontWeight="700" fontSize="26" fill={c}>
      “
    </text>,
    <g key="l" fill="none" stroke={c} strokeWidth="2.4">
      <rect x="2.5" y="9" width="10" height="6" rx="3" transform="rotate(-30 7.5 12)" />
      <rect x="11.5" y="9" width="10" height="6" rx="3" transform="rotate(-30 16.5 12)" />
    </g>,
    <g key="c" fill={c}>
      <path d="M3 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-3.5 3v-3H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M17 9h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v2.5L17 17h-4a2 2 0 0 1-1.8-1.2" opacity=".75" />
    </g>,
    <g key="v">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" fill={c} />
      {[4.5, 9, 13.5, 18].map((x) => (
        <rect key={x} x={x - 0.9} y="6.6" width="1.8" height="1.6" fill="#fff" />
      ))}
      {[4.5, 9, 13.5, 18].map((x) => (
        <rect key={`b${x}`} x={x - 0.9} y="15.8" width="1.8" height="1.6" fill="#fff" />
      ))}
      <path d="M10 9.4l4.6 2.6-4.6 2.6z" fill="#fff" />
    </g>,
  ];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: 'block' }}>
      {shapes[kind]}
    </svg>
  );
}
