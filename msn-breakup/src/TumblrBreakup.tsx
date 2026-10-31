import { useAudioData, type MediaUtilsAudioData } from '@remotion/media-utils';
import { Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BARS, songMeter } from './meter';
import { songAnalysisFile, songFile } from './music';
import { Screen } from './Scene';
import { clickCues, Cues, typingCues } from './sound';
import { sfx } from './Reel';
import { HER, HIM } from './story/cast';
import { PLAYER, playerAt } from './story/player';
import { stateAt } from './story/state';
import { CAROUSEL_VIEW, REEL } from './story/stories';
import { IE_WIN, TEASER_POST, TUMBLR, TUMBLR_CURSOR, TUMBLR_SONG, TUMBLR_TEXT, tumblrAt } from './story/tumblr';
import { IEWindow } from './ui/Browser';
import { ContactList } from './ui/ContactList';
import { Conversation } from './ui/Conversation';
import { DesktopIcons, Taskbar, Wallpaper } from './ui/desktop';
import { Pointer } from './ui/icons';
import { MediaPlayer } from './ui/MediaPlayer';
import { TumblrBlog, TumblrDashboard, TumblrPostForm } from './ui/Tumblr';

/** The conversation exactly as the film leaves it: every line, the three nudges, "Last message received…". */
export const FILM_END = stateAt(REEL, REEL.duration);

const CUES = [
  ...clickCues(TUMBLR_CURSOR),
  ...(TUMBLR.title ? typingCues(TUMBLR.title, 'title', false) : []),
  ...TUMBLR.body.flatMap((b, i) => typingCues(b, `body${i}`, false)),
  // the Enters between her lines (the second one makes the blank line), as loud as an Enter in the film
  ...TUMBLR.enters.map((at, i) => ({ at: at - 0.03, src: sfx('key1'), volume: 0.42, key: `body${i}-enter` })),
];

export interface TumblrProps {
  view?: { w: number; h: number };
  /** the song, carrying on from slide 2; false = the clean export (the bars still follow it) */
  song?: boolean;
  /** clicks and keys; false leaves only the song (QA: it must carry on from where slide 2 stops) */
  uiSounds?: boolean;
  songVolume?: number;
}

/**
 * Carousel slide 3 (4:5), the last, picking up where slide 2 ends: Windows Media Player open on
 * Now Playing, the song still playing. She opens Internet Explorer over it, writes and publishes
 * her Tumblr post, and it ends on that post, the song still going.
 */
export function TumblrBreakup(props: TumblrProps) {
  const analysis = songAnalysisFile();
  return analysis ? <WithAnalysis src={staticFile(analysis)} {...props} /> : <Tumblr {...props} audioData={null} />;
}

function WithAnalysis({ src, ...props }: TumblrProps & { src: string }) {
  const audioData = useAudioData(src, { sampleRate: 22050 });
  return <Tumblr {...props} audioData={audioData} />;
}

function Tumblr({ view = CAROUSEL_VIEW, song = true, uiSounds = true, songVolume = 0.8, audioData }: TumblrProps & { audioData: MediaUtilsAudioData | null }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const s = tumblrAt(t, view);
  // the player as slide 2 leaves it, still playing: its clock and its bars run on (the bars are
  // only worked out while they can be seen: the browser covers them once it is up)
  const wmp = playerAt(PLAYER.duration + t, view);
  const meter = t < TUMBLR.shown + 0.1 ? songMeter(audioData, fps, TUMBLR_SONG.from + frame) : { bars: new Array<number>(BARS).fill(0), peaks: new Array<number>(BARS).fill(0) };
  const tasks = [
    { label: `${HER.name} - MSN Messenger` },
    { label: `${HIM.name} - Conversation` },
    { label: 'Windows Media Player', active: !s.ieShown, icon: 'player' as const },
    ...(s.ieShown ? [{ label: `${s.pageTitle}${TUMBLR_TEXT.windowSuffix}`, active: true, icon: 'internet' as const }] : []),
  ];
  const file = songFile();
  const fadeIn = Math.round(TUMBLR_SONG.fadeIn * fps);
  const fadeOut = Math.round(TUMBLR_SONG.fadeOut * fps);
  return (
    <>
      <Screen camera={s.camera} view={view} frameSeed={frame}>
        <Wallpaper />
        <DesktopIcons />
        <ContactList inactive />
        <Conversation s={{ ...FILM_END, caretOn: false }} inactive />
        <MediaPlayer view={wmp.view} selected={wmp.selected} rowHover={wmp.rowHover} playing={wmp.playing} elapsed={wmp.elapsed} playHover={wmp.playHover} playPressed={wmp.playPressed} tabHover={wmp.tabHover} bars={meter.bars} peaks={meter.peaks} />
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
      {uiSounds && <Cues cues={CUES} />}
      {song && file && (
        <Audio
          src={staticFile(file)}
          name="SONG, carrying on from slide 2 (supplied file)"
          trimBefore={TUMBLR_SONG.from}
          // the file frame slide 2 would play next; in over 0.1 s, out over the last second
          volume={(f) => songVolume * interpolate(f, [0, fadeIn], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * interpolate(f, [durationInFrames - fadeOut, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
        />
      )}
    </>
  );
}
