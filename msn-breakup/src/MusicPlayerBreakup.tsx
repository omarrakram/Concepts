import { useAudioData, visualizeAudio, type MediaUtilsAudioData } from '@remotion/media-utils';
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { songAnalysisFile, songFile } from './music';
import { sfx } from './Reel';
import { Screen } from './Scene';
import { clickCues, Cues } from './sound';
import { HER, HIM } from './story/cast';
import { PLAY_FRAME, PLAYER, PLAYER_CURSOR, playerAt, SONG_SOURCE } from './story/player';
import { CAROUSEL_VIEW } from './story/stories';
import { IE_WIN, TEASER_POST, TUMBLR_TEXT } from './story/tumblr';
import { FILM_END } from './TumblrBreakup';
import { IEWindow } from './ui/Browser';
import { ContactList } from './ui/ContactList';
import { Conversation } from './ui/Conversation';
import { DesktopIcons, Taskbar, Wallpaper } from './ui/desktop';
import { Hourglass, Pointer } from './ui/icons';
import { MediaPlayer } from './ui/MediaPlayer';
import { StartMenu } from './ui/StartMenu';
import { TumblrBlog } from './ui/Tumblr';

export interface MusicPlayerProps {
  /** the song (from public/music); false = the clean export for adding the licensed track in an app */
  song?: boolean;
  /** clicks; false leaves only the song (QA: its onset must land on PLAY_FRAME) */
  uiSounds?: boolean;
  /** QA: a sharp marker tone exactly on PLAY_FRAME */
  cueTone?: boolean;
  songVolume?: number;
}

const BARS = 28;
const PEAK_FALL = 0.025; // per frame
const PEAK_HOLD = 40; // frames looked back (a full fall)
const FFT = 512; // bins: 21.5 Hz each at 22.05 kHz
const LO_HZ = 110;
const HI_HZ = 8000;
/**
 * A fixed display EQ (dB) across the bars, measured on the song's first
 * bars: it flattens the average spectrum (a quiet low end, a loud piano
 * middle) so every bar moves around the same height.
 */
const EQ: [number, number][] = [
  [0, -48],
  [6, -35],
  [12, -18],
  [20, -22],
  [27, -29],
];
const eqAt = (i: number) => interpolate(i, EQ.map((e) => e[0]), EQ.map((e) => e[1]));

/** The spectrum at one frame of the song's own timeline, as 28 log-spaced bars (0..1). */
function spectrumBars(audioData: MediaUtilsAudioData, fps: number, songFrame: number): number[] {
  // the analysis window (2 × FFT samples) starts on the frame instead of being centred on it,
  // so the Play frame never reads the swell before the playback point
  const mags = visualizeAudio({ audioData, fps, frame: songFrame, numberOfSamples: FFT, smoothing: false, optimizeFor: 'speed', dataOffsetInSeconds: -FFT / audioData.sampleRate });
  const hz = audioData.sampleRate / 2 / FFT;
  const b0 = LO_HZ / hz;
  const b1 = HI_HZ / hz;
  return Array.from({ length: BARS }, (_, i) => {
    const lo = Math.round(b0 * Math.pow(b1 / b0, i / BARS));
    const hi = Math.max(lo + 1, Math.round(b0 * Math.pow(b1 / b0, (i + 1) / BARS)));
    let e = 0;
    for (let k = lo; k < hi; k++) e += (mags[k] ?? 0) ** 2;
    // energy in the band, +5 dB / octave (music falls off towards the highs), then ±13 dB around the EQ
    const db = 10 * Math.log10(e + 1e-12) + 5 * Math.log2((lo + hi) / 2 / b0);
    return Math.max(0, Math.min(1, (db - eqAt(i) + 13) / 26));
  });
}

/**
 * Carousel slide 3 (4:5): Start → Windows Media Player → "When You’re Gone"
 * → Play. The song is a <Sequence> that starts on PLAY_FRAME, trimmed to
 * the first note; nothing of it plays before.
 */
export function MusicPlayerBreakup(props: MusicPlayerProps) {
  const analysis = songAnalysisFile();
  return analysis ? <WithAnalysis src={staticFile(analysis)} {...props} /> : <Player {...props} audioData={null} />;
}

function WithAnalysis({ src, ...props }: MusicPlayerProps & { src: string }) {
  const audioData = useAudioData(src, { sampleRate: 22050 });
  return <Player {...props} audioData={audioData} />;
}

function Player({ song = true, uiSounds = true, cueTone = false, songVolume = 0.8, audioData }: MusicPlayerProps & { audioData: MediaUtilsAudioData | null }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const s = playerAt(t, CAROUSEL_VIEW);
  // bars: only from PLAY_FRAME on, and only from audio at or after the playback point
  const barsFor = (f: number) => (audioData && f >= PLAY_FRAME ? spectrumBars(audioData, fps, f - PLAY_FRAME + SONG_SOURCE.inFrames) : new Array<number>(BARS).fill(0));
  const now = barsFor(frame);
  const prev = frame - 1 >= PLAY_FRAME ? barsFor(frame - 1) : now;
  const bars = now.map((v, i) => (v + prev[i]!) / 2);
  const peaks = bars.map((v, i) => {
    let p = v;
    for (let k = 1; k <= PEAK_HOLD && frame - k >= PLAY_FRAME; k++) p = Math.max(p, barsFor(frame - k)[i]! - PEAK_FALL * k);
    return p;
  });
  const file = songFile();
  const songFrames = durationInFrames - PLAY_FRAME;
  const fade = Math.round(PLAYER.fadeOut * fps);
  const tasks = [
    { label: `${HER.name} - MSN Messenger` },
    { label: `${HIM.name} - Conversation` },
    { label: `${TUMBLR_TEXT.blogTitle}${TUMBLR_TEXT.windowSuffix}`, active: !s.wmpShown, icon: 'internet' as const },
    ...(s.wmpShown ? [{ label: 'Windows Media Player', active: true, icon: 'player' as const }] : []),
  ];
  return (
    <>
      <Screen camera={s.camera} view={CAROUSEL_VIEW} frameSeed={frame}>
        <Wallpaper />
        <DesktopIcons />
        <ContactList inactive />
        <Conversation s={{ ...FILM_END, caretOn: false }} inactive />
        {/* her blog, as the Tumblr video left it */}
        <IEWindow win={IE_WIN} title={TUMBLR_TEXT.blogTitle} url={TUMBLR_TEXT.blogUrl} loading={false} progress={0} status={TUMBLR_TEXT.done} canGoBack frame={frame} inactive={s.wmpShown || s.menuOpen}>
          <TumblrBlog title={TEASER_POST.title} body={TEASER_POST.body} />
        </IEWindow>
        {s.wmpShown && (
          <div style={{ opacity: Math.min(1, s.wmpAge / 0.08) }}>
            <MediaPlayer view={s.view} selected={s.selected} rowHover={s.rowHover} playing={s.playing} elapsed={s.elapsed} playHover={s.playHover} playPressed={s.playPressed} tabHover={s.tabHover} bars={bars} peaks={peaks} />
          </div>
        )}
        {s.menuOpen && <StartMenu hover={s.menuHover} />}
        <Taskbar tasks={tasks} clock={PLAYER.clock} startPressed={s.menuOpen} />
        <div style={{ position: 'absolute', left: s.cursor.x - 1, top: s.cursor.y - 1, transform: s.cursor.pressed ? 'scale(.94)' : undefined, transformOrigin: '0 0' }}>
          <Pointer size={15} />
          {s.busy && (
            <div style={{ position: 'absolute', left: 11, top: 14 }}>
              <Hourglass size={9} />
            </div>
          )}
        </div>
      </Screen>
      {uiSounds && <Cues cues={clickCues(PLAYER_CURSOR)} />}
      {song && file && (
        <Sequence from={PLAY_FRAME} layout="none" name="SONG (supplied file)">
          <Audio
            src={staticFile(file)}
            trimBefore={SONG_SOURCE.inFrames}
            // full level from the Play frame itself; out over the last 0.3 s, into the bar line
            volume={(f) => songVolume * interpolate(f, [songFrames - fade, songFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          />
        </Sequence>
      )}
      {cueTone && (
        <Sequence from={PLAY_FRAME} layout="none" name="QA cue tone">
          <Audio src={sfx('cue-tone')} volume={0.8} />
        </Sequence>
      )}
    </>
  );
}
