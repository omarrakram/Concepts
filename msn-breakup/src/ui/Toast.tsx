import { TASKBAR_H, VH, VW } from '../constants';
import { HIM, SONG } from '../story/cast';
import type { ToastState } from '../story/state';
import { UI } from '../fonts';
import { HisDP } from './desktop';
import { Butterfly, MusicNote } from './icons';

export const TOAST = { w: 188, h: 116 };

/**
 * The little bottom-right notification. It slides up out of the taskbar,
 * waits, and slides back down: the Messenger 7.5 toast.
 */
export function Toast({ toast, stack = 0 }: { toast: ToastState; stack?: number }) {
  const IN = 0.3, OUT = 0.35;
  const u = toast.age < IN ? toast.age / IN : toast.age > toast.life - OUT ? (toast.life - toast.age) / OUT : 1;
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
  const top = VH - TASKBAR_H - 4 - TOAST.h * ease - stack * (TOAST.h + 6);
  return (
    // drawn under the taskbar, so it really rises out of it
    <div style={{ position: 'absolute', left: VW - TOAST.w - 4, top, width: TOAST.w, height: TOAST.h }}>
      <div
        style={{
          width: TOAST.w,
          height: TOAST.h,
          boxSizing: 'border-box',
          border: '1px solid #5776b7',
          borderRadius: 4,
          background: 'linear-gradient(180deg,#f3f7ff 0%,#dbe6f8 70%,#cfdcf4 100%)',
          boxShadow: '1px 2px 5px rgba(0,0,0,.35), inset 0 0 0 1px #fff',
          fontFamily: UI,
          fontSize: 11,
          position: 'relative',
        }}
      >
        <div style={{ height: 20, display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px', borderBottom: '1px solid #b6c8ea', background: 'linear-gradient(180deg,#e9f0fd,#c8d8f4)' }}>
          <Butterfly size={13} />
          <span style={{ flex: 1, color: '#22325a' }}>MSN Messenger</span>
          <svg width="9" height="9" viewBox="0 0 9 9">
            <path d="M1 1l7 7M8 1L1 8" stroke="#4b5c82" strokeWidth="1.4" />
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '9px 8px 0 9px' }}>
          <div style={{ flex: 'none', border: '1px solid #8aa4d6', borderRadius: 3, padding: 1, background: '#fff', height: 'fit-content', lineHeight: 0 }}>
            <HisDP size={40} />
          </div>
          <div style={{ color: '#1a1a1a', lineHeight: '14px' }}>
            {toast.kind === 'signin' ? (
              <>
                <b>{HIM.name}</b> has just signed in.
              </>
            ) : (
              <>
                <b>{HIM.name}</b> is listening to
                <div style={{ marginTop: 2, display: 'flex', gap: 3 }}>
                  <MusicNote size={12} style={{ flex: 'none', marginTop: 1 }} />
                  <span>
                    “{SONG.title}” by {SONG.artist}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ position: 'absolute', right: 8, bottom: 6, color: '#1b3f9a', textDecoration: 'underline' }}>Options</div>
      </div>
    </div>
  );
}
