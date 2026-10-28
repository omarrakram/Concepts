import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Screen } from './Scene';
import { clickCues, Cues, typingCues } from './sound';
import { HER, HIM } from './story/cast';
import { stateAt } from './story/state';
import { CAROUSEL_VIEW, REEL } from './story/stories';
import { IE_WIN, TUMBLR, TUMBLR_CURSOR, TUMBLR_TEXT, tumblrAt } from './story/tumblr';
import { IEWindow } from './ui/Browser';
import { ContactList } from './ui/ContactList';
import { Conversation } from './ui/Conversation';
import { DesktopIcons, Taskbar, Wallpaper } from './ui/desktop';
import { Pointer } from './ui/icons';
import { TumblrBlog, TumblrPostForm } from './ui/Tumblr';

/** The conversation exactly as the film leaves it: every line, the three nudges, "Last message received…". */
export const FILM_END = stateAt(REEL, REEL.duration);

const CUES = [
  ...clickCues(TUMBLR_CURSOR),
  ...typingCues(TUMBLR.title, 'title', false),
  ...TUMBLR.body.flatMap((b, i) => typingCues(b, `body${i}`, i < TUMBLR.body.length - 1)),
];

/** Carousel slide 2 (4:5): her Tumblr post, a minute after the film. No music. */
export function TumblrBreakup({ view = CAROUSEL_VIEW }: { view?: { w: number; h: number } }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = tumblrAt(t, view);
  const msnActive = !s.ieShown;
  const msn = { ...FILM_END, caretOn: msnActive && Math.floor(t / 0.53) % 2 === 0 };
  const tasks = [
    { label: `${HER.name} - MSN Messenger` },
    { label: `${HIM.name} - Conversation`, active: msnActive },
    ...(s.ieShown ? [{ label: `${s.pageTitle}${TUMBLR_TEXT.windowSuffix}`, active: true, icon: 'internet' as const }] : []),
  ];
  const post = { title: TUMBLR.title.text, body: TUMBLR.body.map((b) => b.text) };
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
              {s.page === 'form' && <TumblrPostForm title={s.title} body={s.body} focus={s.focus} caretOn={s.caretOn} createPressed={s.createPressed} />}
              {s.page === 'blog' && <TumblrBlog title={post.title} body={post.body} />}
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
