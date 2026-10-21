import type { CSSProperties, ReactNode } from 'react';
import { CLOCK, DATE, HER, HIM, SONG, TIP } from '../story/cast';
import type { StoryState } from '../story/state';
import { HER_FONT, HIS_FONT, UI } from '../fonts';
import { HerDP, HisDP } from './desktop';
import { Buddy, Emoticon, FontA, Glyph, MsnMark, MusicNote, ToolIcon } from './icons';
import { MenuBar, Scrollbar, XPButton, XPWindow } from './xp';

/**
 * The MSN Messenger 7.5 conversation window (2006), at native 96-dpi pixel
 * sizes. Layout (body coordinates, below the menu bar and the toolbar):
 * the history box on the left (To: line + messages), the two display
 * pictures on the right, the input box with its formatting toolbar and the
 * Send / Search buttons, then the status line and the sponsored tip.
 */
export const CONVO = { x: 22, y: 288, w: 500, h: 612 };
const BODY_W = CONVO.w - 6;
const LEFT = { x: 8, w: 362 };
const HIST = { top: 6, toH: 22, h: 294 };
const PANE_H = HIST.h - HIST.toH;
const INPUT = { top: 308, tools: 26, text: 86 };
const LINE = { head: 15, his: 21, hers: 22, gap: 3, nudge: 19 };

/** Messenger turned emoticon codes into pictures: ":(" → a sad face, "(L)" → a heart. */
export function rich(text: string, size = 17): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(:\(|\(L\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<Emoticon key={m.index} kind={m[0] === ':(' ? 'sad' : 'heart'} size={size} style={{ verticalAlign: '-4px', margin: '0 1px' }} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const blockH = (e: StoryState['entries'][number]) => (e.kind === 'nudge' ? LINE.nudge + LINE.gap : LINE.head + (e.who === 'him' ? LINE.his : LINE.hers) + LINE.gap);
/** A new block slides in over 4 frames (Messenger jumped; this is that jump, softened by a hair). */
const grow = (age: number) => Math.min(1, Math.max(0, age / 0.13));

function History({ s }: { s: StoryState }) {
  const heights = s.entries.map((e) => blockH(e) * grow(s.t - e.at));
  const total = heights.reduce((a, b) => a + b, 0) + 6;
  const scroll = Math.max(0, total - PANE_H);
  const say = (who: 'him' | 'her') => `${who === 'him' ? HIM.name : HER.name} says:`;
  return (
    <div style={{ position: 'relative', height: PANE_H, display: 'flex', background: '#fff' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 6, right: 4, top: 4 - scroll }}>
          {s.entries.map((e, i) => (
            <div key={e.key} style={{ height: heights[i], overflow: 'hidden' }}>
              {e.kind === 'nudge' ? (
                <div style={{ height: LINE.nudge, display: 'flex', alignItems: 'center', gap: 4, fontFamily: UI, fontSize: 11, color: '#6d6d6d' }}>
                  <Emoticon kind="nudge" size={15} />
                  {e.text}
                </div>
              ) : (
                <>
                  <div style={{ height: LINE.head, fontFamily: UI, fontSize: 11, color: '#6d6d6d', lineHeight: `${LINE.head}px`, whiteSpace: 'nowrap' }}>{say(e.who)}</div>
                  <div
                    style={{
                      height: e.who === 'him' ? LINE.his : LINE.hers,
                      lineHeight: `${e.who === 'him' ? LINE.his : LINE.hers}px`,
                      paddingLeft: 11,
                      whiteSpace: 'nowrap',
                      fontFamily: e.who === 'him' ? HIS_FONT : HER_FONT,
                      fontSize: e.who === 'him' ? 15 : 16,
                      fontWeight: e.who === 'him' ? 400 : 700,
                      color: e.who === 'him' ? '#000' : '#e0108a',
                    }}
                  >
                    {rich(e.text, 19)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <Scrollbar height={PANE_H} pos={scroll > 0 ? 1 : 0} size={total > PANE_H ? PANE_H / total : 1} />
    </div>
  );
}

const panel: CSSProperties = { position: 'absolute', background: '#fff', border: '1px solid #7f9db9', borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 0 #fff' };

function DPFrame({ children, top }: { children: ReactNode; top: number }) {
  return (
    <div style={{ position: 'absolute', left: 378, top, width: 108, height: 116 }}>
      <div style={{ width: 108, height: 108, borderRadius: 7, border: '1px solid #8aa4d6', background: 'linear-gradient(180deg,#fbfdff,#dce7f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 2px #fff' }}>
        <div style={{ border: '1px solid #9db3dc', borderRadius: 3, overflow: 'hidden', lineHeight: 0 }}>{children}</div>
      </div>
      <div style={{ position: 'absolute', right: 2, bottom: 0, transform: 'scale(.8)' }}>
        <Glyph kind="down" size={12} />
      </div>
    </div>
  );
}

const TOOLS: [Parameters<typeof ToolIcon>[0]['kind'], string][] = [
  ['invite', 'Invite'],
  ['files', 'Send Files'],
  ['video', 'Video'],
  ['voice', 'Voice'],
  ['activities', 'Activities'],
  ['games', 'Games'],
];

export function Conversation({ s, nudgePressed }: { s: StoryState; nudgePressed?: boolean }) {
  const status = s.himTyping ? `${HIM.name} is typing a message.` : s.received ? `Last message received at ${CLOCK} on ${DATE}.` : '';
  const psm = s.listening ? (
    <span style={{ color: '#6d6d6d', fontStyle: 'italic' }}>
      <MusicNote size={11} style={{ verticalAlign: '-1px', marginRight: 3 }} />
      {SONG.artist} - {SONG.title}
    </span>
  ) : (
    <span style={{ color: '#6d6d6d' }}>{HIM.psm}</span>
  );
  return (
    <XPWindow
      title={`${HIM.name} - Conversation`}
      icon={<Buddy size={15} />}
      style={{ left: CONVO.x + s.shake.x, top: CONVO.y + s.shake.y, width: CONVO.w, height: CONVO.h }}
      bodyStyle={{ background: '#fff' }}
    >
      <MenuBar items={['File', 'Edit', 'Actions', 'Tools', 'Help']} />
      {/* toolbar */}
      <div style={{ height: 62, position: 'relative', background: 'linear-gradient(180deg,#f7faff 0%,#e4edfb 60%,#d3e1f7 100%)', borderBottom: '1px solid #b8c9e8', display: 'flex', alignItems: 'flex-end', paddingLeft: 6, gap: 2 }}>
        {TOOLS.map(([k, label]) => (
          <div key={k} style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 4 }}>
            <ToolIcon kind={k} size={30} />
            <div style={{ fontFamily: UI, fontSize: 11, color: '#1d2b48', marginTop: 2, whiteSpace: 'nowrap' }}>
              <span style={{ textDecoration: 'underline' }}>{label[0]}</span>
              {label.slice(1)}
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', right: 12, top: 8 }}>
          <MsnMark size={17} />
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 6, display: 'flex', gap: 5 }}>
          <Glyph kind="block" size={18} />
          <Glyph kind="brush" size={18} />
        </div>
      </div>
      {/* body */}
      <div style={{ position: 'relative', flex: 1, background: 'linear-gradient(180deg,#e9f0fb 0%,#dfe8f8 45%,#e9f0fb 100%)', overflow: 'hidden' }}>
        <svg width={BODY_W} height="500" style={{ position: 'absolute', inset: 0 }}>
          <path d={`M0 380 C 160 300, 320 440, ${BODY_W} 330 V 500 H 0 Z`} fill="#fff" opacity=".35" />
        </svg>
        {/* history box */}
        <div style={{ ...panel, left: LEFT.x, top: HIST.top, width: LEFT.w, height: HIST.h }}>
          <div style={{ height: HIST.toH, display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px', borderBottom: '1px solid #c9d6ee', background: 'linear-gradient(180deg,#fdfeff,#eef3fc)', fontFamily: UI, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ color: '#444' }}>To:</span>
            <span style={{ fontWeight: 700 }}>{HIM.name}</span>
            <span style={{ color: '#444' }}>&lt;{HIM.email}&gt;</span>
            {psm}
          </div>
          <History s={s} />
        </div>
        {/* input box */}
        <div style={{ ...panel, left: LEFT.x, top: INPUT.top, width: LEFT.w, height: INPUT.tools + INPUT.text, background: '#fff' }}>
          <div style={{ height: INPUT.tools, display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg,#fdfeff,#e6eefb)', borderBottom: '1px solid #c9d6ee', paddingLeft: 0 }}>
            <Tool x={0} w={26}>
              <FontA size={18} />
            </Tool>
            <Tool x={30} w={34}>
              <Emoticon kind="smile" size={17} />
              <Glyph kind="down" size={10} />
            </Tool>
            <Tool x={68} w={70}>
              <Glyph kind="speaker" size={15} />
              <span style={{ fontFamily: UI, fontSize: 11, marginLeft: 3 }}>Voice Clip</span>
            </Tool>
            <Tool x={142} w={34}>
              <Emoticon kind="wink" size={17} />
              <Glyph kind="down" size={10} />
            </Tool>
            <Tool x={180} w={34}>
              <Glyph kind="picture" size={16} />
              <Glyph kind="down" size={10} />
            </Tool>
            <Tool x={218} w={34}>
              <Emoticon kind="gift" size={17} />
              <Glyph kind="down" size={10} />
            </Tool>
            <Tool x={256} w={26} pressed={nudgePressed}>
              <Emoticon kind="nudge" size={19} />
            </Tool>
          </div>
          <div style={{ position: 'relative', height: INPUT.text }}>
            <div style={{ position: 'absolute', left: 6, top: 6, width: 272, fontFamily: HER_FONT, fontWeight: 700, fontSize: 16, color: '#e0108a', whiteSpace: 'normal', overflowWrap: 'break-word', lineHeight: '21px' }}>
              {s.input}
              {s.caretOn && <span style={{ display: 'inline-block', width: 1, height: 18, background: '#000', verticalAlign: '-3px', marginLeft: 1 }} />}
            </div>
            <XPButton width={62} height={27} disabled={!s.input} style={{ position: 'absolute', left: 292, top: 6 }}>
              <span>
                <span style={{ textDecoration: 'underline' }}>S</span>end
              </span>
            </XPButton>
            <XPButton width={62} height={27} style={{ position: 'absolute', left: 292, top: 39 }}>
              <span>
                Se<span style={{ textDecoration: 'underline' }}>a</span>rch
              </span>
            </XPButton>
          </div>
        </div>
        <div style={{ position: 'absolute', left: LEFT.x + 270, top: INPUT.top + INPUT.tools + INPUT.text - 1, display: 'flex' }}>
          {(['pen', 'A'] as const).map((k, i) => (
            <div key={k} style={{ width: 28, height: 19, border: '1px solid #7f9db9', borderTop: 'none', borderRadius: '0 0 4px 4px', background: i === 1 ? '#fff' : '#e7eefb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i ? 2 : 0 }}>
              {k === 'pen' ? <Glyph kind="pen" size={13} /> : <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 13, color: '#1a2f6e' }}>A</span>}
            </div>
          ))}
        </div>
        <DPFrame top={6}>
          <HisDP size={96} />
        </DPFrame>
        <DPFrame top={INPUT.top}>
          <HerDP size={96} />
        </DPFrame>
        {/* status line + tip */}
        <div style={{ position: 'absolute', left: LEFT.x + 2, top: 446, fontFamily: UI, fontSize: 11, color: '#444', whiteSpace: 'nowrap' }}>{status}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, borderTop: '1px solid #c3d2ee', background: 'linear-gradient(180deg,#f4f8ff,#dfe8f8)', display: 'flex', alignItems: 'center', padding: '0 10px', fontFamily: UI, fontSize: 11, color: '#1b3f9a', whiteSpace: 'nowrap' }}>
          <span style={{ textDecoration: 'underline' }}>{TIP}</span>
        </div>
      </div>
    </XPWindow>
  );
}

function Tool({ x, w, children, pressed }: { x: number; w: number; children: ReactNode; pressed?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x + 4,
        top: 3,
        width: w,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        border: pressed ? '1px solid #6d8ac6' : '1px solid transparent',
        background: pressed ? 'linear-gradient(180deg,#d2e0fa,#e8effc)' : 'transparent',
      }}
    >
      {children}
    </div>
  );
}
