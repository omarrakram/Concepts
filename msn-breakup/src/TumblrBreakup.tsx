import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Screen } from './Scene';
import { clickCues, Cues, typingCues } from './sound';
import { HER, HIM } from './story/cast';
import { stateAt } from './story/state';
import { CAROUSEL_VIEW, REEL } from './story/stories';
import { IE_WIN, STAY_TUNED, TEASER_POST, TUMBLR, TUMBLR_CURSOR, TUMBLR_TEXT, tumblrAt } from './story/tumblr';
import { IEWindow } from './ui/Browser';
import { ContactList } from './ui/ContactList';
import { Conversation } from './ui/Conversation';
import { DesktopIcons, Taskbar, Wallpaper } from './ui/desktop';
import { Pointer } from './ui/icons';
import { TumblrBlog, TumblrDashboard, TumblrPostForm, TumblrStayTuned } from './ui/Tumblr';

/** The conversation exactly as the film leaves it: every line, the three nudges, "Last message received…". */
export const FILM_END = stateAt(REEL, REEL.duration);

const CUES = [
  ...clickCues(TUMBLR_CURSOR),
  ...(TUMBLR.title ? typingCues(TUMBLR.title, 'title', false) : []),
  ...TUMBLR.body.flatMap((b, i) => typingCues(b, `body${i}`, i < TUMBLR.body.length - 1)),
];

/** STAY TUNED. at the scale her post had at the end of the camera's move (z 1.545), centred. */
const END_CAMERA = { x: 270, y: 480, z: 1.545 };

/** Carousel slide 3 (4:5), the last: her Tumblr post, then STAY TUNED. No music. */
export function TumblrBreakup({ view = CAROUSEL_VIEW }: { view?: { w: number; h: number } }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t >= TUMBLR.stayTuned) {
    return (
      <>
        <Screen camera={END_CAMERA} view={view} frameSeed={frame}>
          <TumblrStayTuned text={STAY_TUNED} x={END_CAMERA.x} y={END_CAMERA.y} />
        </Screen>
        <Cues cues={CUES} />
      </>
    );
  }
  const s = tumblrAt(t, view);
  const msnActive = !s.ieShown;
  const msn = { ...FILM_END, caretOn: msnActive && Math.floor(t / 0.53) % 2 === 0 };
  const tasks = [
    { label: `${HER.name} - MSN Messenger` },
    { label: `${HIM.name} - Conversation`, active: msnActive },
    ...(s.ieShown ? [{ label: `${s.pageTitle}${TUMBLR_TEXT.windowSuffix}`, active: true, icon: 'internet' as const }] : []),
  ];
  return (
    <>
      <Screen camera={s.camera} view={view} frameSeed={frame}>
        <Wallpaper />
        <DesktopIcons />
        <ContactList inactive />
        <Conversation s={msn} inactive={!msnActive} />
        {s.ieShown && (
          <div style={{ opacity: Math.min(1, s.ieAge / 0.08) }}>
            <IEWindow win={IE_WIN} title={s.pageTitle} url={s.url} loading={s.loading} progress={s.progress} status={s.status} canGoBack={s.page === 'blog'} frame={frame}>
              {s.page === 'dashboard' && <TumblrDashboard textPressed={s.textPressed} />}
              {s.page === 'form' && <TumblrPostForm title={s.title} body={s.body} focus={s.focus} caretOn={s.caretOn} createPressed={s.createPressed} />}
              {s.page === 'blog' && <TumblrBlog title={TEASER_POST.title} body={TEASER_POST.body} />}
            </IEWindow>
          </div>
        )}
        <Taskbar tasks={tasks} clock={TUMBLR.clock} />
        <div style={{ position: 'absolute', left: s.cursor.x - 1, top: s.cursor.y - 1, transform: s.cursor.pressed ? 'scale(.94)' : undefined, transformOrigin: '0 0' }}>
          <Pointer size={15} />
        </div>
      </Screen>
      <Cues cues={CUES} />
    </>
  );
}
