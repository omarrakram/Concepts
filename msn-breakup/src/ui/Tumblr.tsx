import type { CSSProperties, ReactNode } from 'react';
import { BLACK, HIS_FONT, SERIF, UI } from '../fonts';
import { BLOG, BLOG_COLORS, DASH, FORM, FRAME, pill, TUMBLR_TEXT } from '../story/tumblr';
import { HerDP } from './desktop';

/**
 * Tumblr in 2007, drawn in code (no Tumblr artwork: the wordmark is set in a
 * plain bold face, without the logo's flower, and every icon is an original
 * drawing). The dashboard frame and the "Add a new..." buttons follow the
 * archived April 2007 dashboard; the form follows the archived forms of the
 * time; her blog is the archived default theme of August 2007 in her pink.
 * What is archived and what is reconstructed: docs/sources.md.
 */
const T = TUMBLR_TEXT;
const SANS = HIS_FONT; // the pages ask for Lucida Grande / Helvetica: on her XP machine, Arial
const LINK = '#7aaee8';
const TAB = '#639cd6';

const caret = (h: number) => <span style={{ display: 'inline-block', width: 1, height: h, background: '#000', verticalAlign: '-3px', marginLeft: 1 }} />;
const field: CSSProperties = {
  position: 'absolute',
  boxSizing: 'border-box',
  border: '1px solid #a7a7a7',
  background: '#fff',
  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,.1)',
  overflow: 'hidden',
};
const grayPill = (pressed = false): CSSProperties => ({
  boxSizing: 'border-box',
  border: '1px solid #8d8d8d',
  borderRadius: 999,
  background: pressed ? 'linear-gradient(180deg,#c9c9c9,#e4e4e4)' : 'linear-gradient(180deg,#fdfdfd 0%,#ececec 55%,#d3d3d3 100%)',
  boxShadow: pressed ? 'inset 0 1px 2px rgba(0,0,0,.3)' : '0 1px 0 rgba(255,255,255,.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: SANS,
  color: '#222',
});

/** The dashboard frame: the dark page, the wordmark, her links, the tabs and the white panel. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#13181e 0px,#212731 90px,#30394b 100%)' }}>
      <div style={{ position: 'absolute', left: 16, top: 9, fontFamily: SANS, fontWeight: 700, fontSize: 31, letterSpacing: -1, color: '#f4f4f4' }}>{T.wordmark}</div>
      <div style={{ position: 'absolute', right: 12, top: 9, textAlign: 'right', fontFamily: SANS, fontSize: 10.5, lineHeight: '14px', color: LINK }}>
        {T.links.map((l) => (
          <div key={l}>
            <span style={{ textDecoration: 'underline' }}>{l}</span> «
          </div>
        ))}
      </div>
      {T.tabs.map((name, i) => (
        <div
          key={name}
          style={{
            position: 'absolute',
            left: FRAME.tabs.x[i],
            top: FRAME.tabs.y,
            width: FRAME.tabs.w[i],
            height: FRAME.tabs.h + (i === 0 ? 1 : 0),
            borderRadius: '2px 2px 0 0',
            background: i === 0 ? '#fff' : TAB,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 11,
            color: i === 0 ? '#4b8bd1' : '#fff',
          }}
        >
          {name}
        </div>
      ))}
      <div style={{ position: 'absolute', left: FRAME.panel.x, top: FRAME.panel.y, width: FRAME.panel.w, height: FRAME.panel.h, background: '#fff' }}>{children}</div>
    </div>
  );
}

/** Her dashboard: "Add a new..." and the six post types; on the side, her picture and name. */
export function TumblrDashboard({ textPressed }: { textPressed: boolean }) {
  const p = FRAME.panel;
  return (
    <Frame>
      <div style={{ position: 'absolute', left: DASH.addNew.x - p.x, top: DASH.addNew.y - p.y, fontFamily: SERIF, fontSize: 15, color: '#555' }}>{T.addNew}</div>
      {T.postTypes.map((name, i) => {
        const r = pill(i);
        const pressed = i === 0 && textPressed;
        return (
          <div key={name} style={{ ...grayPill(pressed), position: 'absolute', left: r.x - p.x, top: r.y - p.y, width: r.w, height: r.h, justifyContent: 'flex-start', paddingLeft: 3, gap: 2, border: '1px solid #c4c4c4', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
            <PostType kind={i} />
            {name}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 10, right: 10, top: DASH.pills.y + DASH.pills.h + 12 - p.y, height: 1, background: '#e2e2e2' }} />
      {/* the side column: her picture (her Messenger picture) and her name */}
      <div style={{ position: 'absolute', left: DASH.side.x - p.x, top: DASH.side.y - p.y, width: DASH.side.w, height: 44, background: '#ececec', borderRadius: 3 }}>
        <div style={{ position: 'absolute', left: 6, top: 6, width: 32, height: 32, boxSizing: 'border-box', border: '1px solid #bbb', background: '#fff', padding: 1 }}>
          <HerDP size={28} />
        </div>
        <div style={{ position: 'absolute', left: 43, top: 9, fontFamily: SANS, fontWeight: 700, fontSize: 9.5, color: '#2d63a6', whiteSpace: 'nowrap' }}>{T.sideName}</div>
        <div style={{ position: 'absolute', left: 43, top: 23, fontFamily: SANS, fontSize: 8.5, color: '#5b8bc4', textDecoration: 'underline', whiteSpace: 'nowrap' }}>{T.sidePhoto}</div>
      </div>
    </Frame>
  );
}

const label: CSSProperties = { position: 'absolute', left: FORM.title.x - FRAME.panel.x, fontFamily: SANS, fontWeight: 700, fontSize: 12.5, color: '#333' };

/** The text-post form (reconstructed from the archived forms of 2007: see docs/sources.md). */
export function TumblrPostForm({ title, body, focus, caretOn, createPressed }: { title: string; body: string[]; focus: 'title' | 'body' | null; caretOn: boolean; createPressed: boolean }) {
  const p = FRAME.panel;
  const at = (r: { x: number; y: number; w: number; h: number }) => ({ left: r.x - p.x, top: r.y - p.y, width: r.w, height: r.h });
  return (
    <Frame>
      <div style={{ position: 'absolute', left: FORM.heading.x - p.x, top: FORM.heading.y - p.y, fontFamily: SERIF, fontSize: 21, color: '#555' }}>{T.formHeading}</div>
      <div style={{ ...label, top: FORM.titleLabel - p.y }}>
        {T.titleLabel} <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 10, color: '#999' }}>{T.optional}</span>
      </div>
      <div style={{ ...field, ...at(FORM.title), borderColor: focus === 'title' ? '#7b9cc4' : '#a7a7a7' }}>
        <div style={{ padding: '0 6px', lineHeight: `${FORM.title.h - 2}px`, fontFamily: SANS, fontSize: 14, color: '#222', whiteSpace: 'nowrap' }}>
          {title}
          {focus === 'title' && caretOn && caret(16)}
        </div>
      </div>
      <div style={{ ...label, top: FORM.bodyLabel - p.y }}>{T.bodyLabel}</div>
      <div style={{ position: 'absolute', left: FORM.body.x - p.x, top: FORM.formatting - p.y, display: 'flex', gap: 4 }}>
        {T.formatting.map((f) => (
          <div key={f} style={{ ...grayPill(), height: 16, padding: '0 7px', fontSize: 9.5 }}>
            {f}
          </div>
        ))}
      </div>
      <div style={{ ...field, ...at(FORM.body), borderColor: focus === 'body' ? '#7b9cc4' : '#a7a7a7' }}>
        <div style={{ padding: '4px 6px', fontFamily: SANS, fontSize: 12.5, lineHeight: '18px', color: '#222' }}>
          {(body.length ? body : ['']).map((line, i, all) => (
            <div key={i} style={{ height: 18, whiteSpace: 'nowrap' }}>
              {line}
              {focus === 'body' && caretOn && i === all.length - 1 && caret(14)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...grayPill(createPressed), position: 'absolute', ...at(FORM.create), fontSize: 11 }}>{T.create}</div>
      <div style={{ position: 'absolute', left: FORM.create.x + FORM.create.w + 10 - p.x, top: FORM.create.y + 4 - p.y, fontFamily: SANS, fontSize: 11, color: '#1d4fbf', textDecoration: 'underline' }}>{T.cancel}</div>
    </Frame>
  );
}

/** Her posts' titles: the theme's bold face, in her pink. */
const postTitle: CSSProperties = { fontFamily: SANS, fontWeight: 700, fontSize: 18, letterSpacing: -1, color: BLOG_COLORS.postTitle };

/**
 * The ending, once her post has registered: the line on its own, in her post
 * title's type and pink on her blog's white, centred on (x, y) of the screen.
 */
export function TumblrStayTuned({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: BLOG_COLORS.background }}>
      <div style={{ ...postTitle, position: 'absolute', left: x - 200, width: 400, top: y - 11, lineHeight: '22px', textAlign: 'center', whiteSpace: 'nowrap' }}>{text}</div>
    </div>
  );
}

/** Her blog: the default theme of 2007 (title, rule, RSS, the day block, the post), in her colours. */
export function TumblrBlog({ title, body }: { title: string; body: string[] }) {
  const C = BLOG_COLORS;
  const B = BLOG;
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.background, overflow: 'hidden' }}>
      {/* the Tumblr control, top right, for the blog's signed-in owner */}
      <div style={{ position: 'absolute', right: 0, top: 0, height: 19, padding: '0 7px 0 5px', borderRadius: '0 0 0 4px', background: 'linear-gradient(180deg,#4a4a4a,#262626)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: SANS, fontWeight: 700, fontSize: 9.5, color: '#f2f2f2' }}>
        <House />
        {T.control}
      </div>
      <div style={{ position: 'absolute', left: B.title.x, width: B.title.w, top: B.title.top, height: B.title.rule - B.title.top, borderBottom: '1px solid #ccc' }}>
        <div style={{ textAlign: 'center', fontFamily: BLACK, fontSize: 40, letterSpacing: -2, lineHeight: `${B.title.line}px`, color: C.title }}>{T.blogTitle}</div>
        <Rss />
      </div>
      <div style={{ position: 'absolute', left: B.post.x, top: B.post.y, width: B.post.w }}>
        {/* the day block, to the left of the post: the weekday, and the date on one line in the block
            (a little tighter than the theme's month-and-day block, so it keeps its place in the narrow window) */}
        <div style={{ position: 'absolute', right: B.post.w + 18, top: 0, display: 'flex', alignItems: 'flex-start', gap: 7, whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: SANS, fontSize: 30, letterSpacing: -2, lineHeight: '31px', color: C.date, textTransform: 'uppercase' }}>{T.day}</div>
          <div style={{ height: 30, padding: '0 3px', display: 'flex', alignItems: 'center', background: C.dateBlock, color: C.dateBlockText, fontFamily: UI, fontWeight: 700, fontSize: 12, lineHeight: '12px' }}>{T.postDate}</div>
        </div>
        {title && <div style={{ ...postTitle, margin: '0 0 5px' }}>{title}</div>}
        {body.length > 0 && (
          <div style={{ fontFamily: SANS, fontSize: 12, lineHeight: '17px', color: C.text }}>
            {body.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 80, textAlign: 'center', marginLeft: -(B.post.x - B.title.x), width: B.title.w, fontFamily: SANS, fontSize: 12, color: '#444' }}>{T.footer}</div>
      </div>
    </div>
  );
}

/** The theme's RSS badge (an original drawing of a small blue tag), bottom right of the title. */
function Rss() {
  return (
    <div style={{ position: 'absolute', right: 0, bottom: 10, width: BLOG.rss.w, height: BLOG.rss.h, borderRadius: 2, background: 'linear-gradient(180deg,#7d99ee,#5f83e7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: 0.3, color: '#fff' }}>
      {T.rss}
    </div>
  );
}

function House() {
  return (
    <svg width="11" height="10" viewBox="0 0 11 10" style={{ display: 'block' }}>
      <path d="M5.5 0.6 10.5 5H9v4.4H6.6V6.6H4.4v2.8H2V5H0.5z" fill="#5aa0f0" stroke="#d9ecff" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  );
}

/** The six post types' pictures: Text, Photo, Quote, Link, Chat, Video (original drawings, not Tumblr's). */
function PostType({ kind }: { kind: number }) {
  const shapes: ReactNode[] = [
    <g key="t">
      <path d="M5 2.5h10.5l3.5 3.5v15.5H5z" fill="#fbfbfb" stroke="#9a9a9a" strokeWidth="1" />
      {[8.5, 11.5, 14.5, 17.5].map((y) => (
        <rect key={y} x="7.5" y={y} width={y === 17.5 ? 6 : 9} height="1.3" fill="#a9a9a9" />
      ))}
    </g>,
    <g key="p">
      <rect x="2.5" y="5" width="19" height="15" rx="1" fill="#fff" stroke="#9a9a9a" />
      <rect x="4.5" y="7" width="15" height="11" fill="#9fd0f2" />
      <path d="M4.5 18l5-5.5 3.5 3.5 2.5-2 4 4z" fill="#58a845" />
    </g>,
    <g key="q" fill="#3e6ea8">
      <path d="M4 18v-5.5C4 9 6 6.6 9.6 6l.6 1.6C8.2 8.3 7.4 9.6 7.4 11.3H10V18z" />
      <path d="M13 18v-5.5c0-3.5 2-5.9 5.6-6.5l.6 1.6c-2 .7-2.8 2-2.8 3.7H19V18z" />
    </g>,
    <g key="l">
      <circle cx="12" cy="12" r="8.5" fill="#8dbbe8" stroke="#4f7fb8" />
      <path d="M3.8 12h16.4M12 3.5c-3 2.5-3 14.5 0 17M12 3.5c3 2.5 3 14.5 0 17" fill="none" stroke="#fff" strokeWidth="1" />
    </g>,
    <g key="c">
      <path d="M3 4.5h13a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3.5v-3.5H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" fill="#4f7fb8" />
      <path d="M19 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-3.5-3H12a2 2 0 0 1-1.6-.8" fill="#9ac0e6" />
    </g>,
    <g key="v">
      <rect x="4" y="2.5" width="16" height="19" rx="1" fill="#5d5d5d" />
      {[4.5, 8.5, 12.5, 16.5].map((y) => (
        <g key={y}>
          <rect x="5.2" y={y} width="1.8" height="2" fill="#e6e6e6" />
          <rect x="17" y={y} width="1.8" height="2" fill="#e6e6e6" />
        </g>
      ))}
      <rect x="8.2" y="4.5" width="7.6" height="15" fill="#a7a7a7" />
    </g>,
  ];
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block', flex: 'none' }}>
      {shapes[kind]}
    </svg>
  );
}
