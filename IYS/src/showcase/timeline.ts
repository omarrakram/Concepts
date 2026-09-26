import { gsap } from '../lib/gsap';

/** Film length in seconds. Ends on a hard cut — no fade. */
export const DURATION = 17.2;

/**
 * The master timeline. Every value is authored (no randomness), every scene
 * shows/hides with `autoAlpha` sets, so seek(t) renders the same frame every
 * time — that is what `npm run record` relies on.
 */
export function buildTimeline(root: HTMLElement) {
  const q = gsap.utils.selector(root);
  const one = (s: string) => q(s)[0] as HTMLElement | undefined;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  // First "from" state of every element, applied at t=0 so nothing shows before its entrance.
  const firsts = new Map<Element, gsap.TweenVars>();
  const ft = (target: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars, at: number, init = true) => {
    if (!target || (Array.isArray(target) && !target.length)) return;
    const els = gsap.utils.toArray<Element>(target);
    if (init)
      els.forEach((el, i) => {
      if (firsts.has(el)) return;
      const v: gsap.TweenVars = {};
        for (const [k, val] of Object.entries(from)) v[k] = typeof val === 'function' ? val(i, el, els) : val;
        firsts.set(el, v);
      });
    tl.fromTo(target, { ...from }, { ...to, immediateRender: false }, at);
  };
  const show = (s: string, at: number) => tl.set(q(s), { autoAlpha: 1 }, at);
  const hide = (s: string, at: number) => tl.set(q(s), { autoAlpha: 0 }, at);

  // initial state (t = 0)
  tl.set(q('.scn'), { autoAlpha: 0 }, 0);
  show('.s0', 0);

  // ── 0.00 – 1.30  THE COOL DECISION ─────────────────────────────────
  tl.set(q('.s-taped, .s-sure, .fit__inner, .s-toggle'), { autoAlpha: 0 }, 0);
  ft(q('.s-taped--0'), { autoAlpha: 0, y: -160, rotate: -20 }, { autoAlpha: 1, y: 0, rotate: -7, duration: 0.32, ease: 'back.out(1.6)' }, 0.02);
  ft(q('.s-taped--1'), { autoAlpha: 0, y: -160, rotate: 20 }, { autoAlpha: 1, y: 0, rotate: 6, duration: 0.32, ease: 'back.out(1.6)' }, 0.1);
  ft(q('.s-sure'), { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.22, ease: 'power2.out' }, 0.08);
  const lands = [0.2, 0.38, 0.56, 0.78];
  ['.l1', '.l2', '.l3', '.l4'].forEach((l, i) => {
    const big = i === 2;
    const at = lands[i]!;
    ft(q(`${l} .fit__inner`), { autoAlpha: 0, yPercent: -80, scaleY: 1.4 }, { autoAlpha: 1, yPercent: 0, scaleY: 1, duration: big ? 0.15 : 0.12, ease: 'power4.in' }, at);
    ft(q(`${l} .fit__inner`), { scaleY: 0.82, scaleX: 1.04 }, { scaleY: 1, scaleX: 1, duration: 0.34, ease: 'elastic.out(1, 0.4)' }, at + (big ? 0.15 : 0.12));
    ft(q('.s-doors'), { y: big ? 16 : 7 }, { y: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' }, at + (big ? 0.15 : 0.12));
  });
  ft(q('.s-toggle'), { autoAlpha: 0, scale: 0.6, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.18, ease: 'back.out(2)' }, 0.8);
  // auto-press YES
  ft(q('.s-toggle__knob'), { left: 322, width: 56 }, { left: 8, width: 342, duration: 0.12, ease: 'back.out(1.6)' }, 0.92);
  ft(q('.s-toggle__yes'), { color: '#f5f0e6' }, { color: '#17140f', duration: 0.05 }, 0.96);
  ft(q('.s-toggle'), { scale: 1 }, { scale: 0.94, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.93);
  ft(q('.s-toggle'), { autoAlpha: 1 }, { autoAlpha: 0, y: 40, duration: 0.12, ease: 'power2.in' }, 1.04);
  // wardrobe doors open
  ft(q('.s-dp--l'), { rotateY: 0 }, { rotateY: -106, duration: 0.42, ease: 'power3.inOut' }, 1.0);
  ft(q('.s-dp--r'), { rotateY: 0 }, { rotateY: 106, duration: 0.42, ease: 'power3.inOut' }, 1.0);
  hide('.s-doors', 1.43);
  ft(q('.s-inside'), { scale: 0.9, filter: 'brightness(0.7)' }, { scale: 1, filter: 'brightness(1)', duration: 0.5 }, 1.02);
  ft(q('.s-inside__item'), { rotate: (i: number) => (i % 2 ? 10 : -12) }, { rotate: 0, duration: 1.2, ease: 'elastic.out(1.2, 0.2)', stagger: 0.03 }, 1.12);

  // ── 1.30 – 3.50  HOW ARE YOU FEELING? ──────────────────────────────
  show('.s1', 1.44);
  ft(q('.s-inside'), { y: 0 }, { y: -270, duration: 0.42, ease: 'power3.inOut' }, 1.44);
  ft(q('.s1-table'), { yPercent: 100 }, { yPercent: 0, duration: 0.4, ease: 'power3.out' }, 1.44);
  ft(q('.s1-title'), { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'back.out(1.4)' }, 1.56);
  ft(q('.s1-today'), { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' }, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.22 }, 1.76);
  const moods = ['.s-mood--sleepy', '.s-mood--out', '.s-mood--cairo', '.s-mood--chaos', '.s-mood--match'];
  const rots = [-6, 4, 3, 8, -4];
  moods.forEach((m, i) => {
    ft(q(m), { autoAlpha: 0, y: -260, scale: 1.25, rotate: rots[i]! * -3 }, { autoAlpha: 1, y: 0, scale: 1, rotate: rots[i]!, duration: 0.26, ease: 'back.out(1.5)' }, 1.72 + i * 0.13);
  });
  // tap on SLEEPY
  ft(q('.s-tap'), { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power2.out' }, 2.5);
  ft(q('.s-tap'), { autoAlpha: 1 }, { autoAlpha: 0, scale: 1.5, duration: 0.25 }, 2.68);
  ft(q('.s-mood--sleepy'), { scale: 1 }, { scale: 1.14, duration: 0.1, ease: 'power2.out' }, 2.52);
  ft(q('.s-mood--sleepy'), { scale: 1.14 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)' }, 2.62);
  ft(q('.s-check'), { autoAlpha: 0, scale: 1.6, rotate: -30 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.2, ease: 'back.out(2)' }, 2.62);
  ['.s-mood--out', '.s-mood--cairo', '.s-mood--chaos', '.s-mood--match'].forEach((m, i) => {
    ft(q(m), { y: 0 }, { y: 900, rotate: (i % 2 ? 1 : -1) * 30, duration: 0.42, ease: 'power3.in' }, 2.72 + i * 0.04);
  });

  // room changes — the sleepy wipe
  show('.s2', 2.96);
  ft(q('.s2'), { clipPath: 'circle(0px at 300px 1080px)' }, { clipPath: 'circle(2300px at 300px 1080px)', duration: 0.42, ease: 'power2.in' }, 2.96);
  hide('.s0', 3.4);
  hide('.s1', 3.4);

  // ── 3.50 – 6.00  THE PJOY ROOM ─────────────────────────────────────
  ft(q('.s2-title'), { autoAlpha: 0, y: -80 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }, 3.2);
  ft(q('.s2-kick'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 3.3);
  ft(q('.s2-rope'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, 3.3);
  const strip = one('.s2-strip');
  const n = q('.s2-item').length;
  const heroX = 300 - (n - 1) * 540; // last item lands centred (width 480, gap 60)
  ft(strip!, { x: 1120 }, { x: heroX, duration: 1.5, ease: 'power2.inOut' }, 3.4);
  // the sweep makes them swing: lean back while moving, swing through on the stop
  ft(q('.s2-item'), { rotate: 0 }, { rotate: 9, duration: 0.5, ease: 'power2.out', stagger: 0.04 }, 3.4);
  ft(q('.s2-item'), { rotate: 9 }, { rotate: -7, duration: 0.55, ease: 'power2.inOut', stagger: 0.04 }, 4.4);
  ft(q('.s2-item'), { rotate: -7 }, { rotate: 0, duration: 0.9, ease: 'elastic.out(1.1, 0.3)', stagger: 0.04 }, 4.95);
  ft(q('.s2-tag'), { rotate: 0 }, { rotate: -14, duration: 0.5, stagger: 0.04 }, 3.45);
  ft(q('.s2-tag'), { rotate: -14 }, { rotate: 0, duration: 1.1, ease: 'elastic.out(1, 0.25)', stagger: 0.04 }, 4.5);
  // pegs open, the pjoy drops, the pattern takes the screen
  ft(q('.s2-item--hero .peg__l'), { rotate: 0 }, { rotate: -18, svgOrigin: '14 30', duration: 0.12 }, 5.12);
  ft(q('.s2-item--hero .peg__r'), { rotate: 0 }, { rotate: 18, svgOrigin: '14 30', duration: 0.12 }, 5.12);
  ft(q('.s2-item--hero .s2-garment'), { y: 0, rotate: 0 }, { y: 70, rotate: 3, duration: 0.2, ease: 'power2.in' }, 5.2);
  show('.s2-hero', 5.32);
  ft(q('.s2-hero'), { clipPath: 'inset(760px 300px 520px 300px round 4px)' }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.42, ease: 'power3.inOut' }, 5.32);
  ft(q('.s2-hero img'), { scale: 1 }, { scale: 1.9, duration: 0.9, ease: 'power2.out' }, 5.32);
  ft(q('.s2-hero__cap'), { autoAlpha: 0, y: 60, rotate: -12 }, { autoAlpha: 1, y: 0, rotate: -4, duration: 0.3, ease: 'back.out(1.8)' }, 5.55);

  // ── 6.00 – 8.20  WARDROBE FLIP / LOOK 01 ───────────────────────────
  ft(q('.s2'), { rotateY: 0, transformOrigin: '0% 50%' }, { rotateY: -80, autoAlpha: 0, duration: 0.24, ease: 'power2.in' }, 5.96);
  show('.s3', 6.08);
  ft(q('.s3'), { rotateY: 80, transformOrigin: '100% 50%' }, { rotateY: 0, duration: 0.28, ease: 'power2.out' }, 6.08);
  hide('.s2', 6.3);
  ft(q('.s3-kick'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 6.2);
  ft(q('.s3-list'), { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)' }, 6.2);
  const cards = q('.s3-card');
  const cardRot = [-4, 3, -2, 4];
  cards.forEach((c, i) => {
    const at = 6.25 + i * 0.4;
    ft(c, { autoAlpha: 0, rotateY: -110, x: -120, rotate: cardRot[i]! * 3 }, { autoAlpha: 1, rotateY: 0, x: 0, rotate: cardRot[i]!, duration: 0.3, ease: 'back.out(1.2)' }, at);
    ft(q(`.s3-line--${i}`), { autoAlpha: 0.25, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.18 }, at + 0.14);
    ft(q(`.s3-line--${i} .s3-tick`), { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.25, ease: 'back.out(3)' }, at + 0.2);
  });
  tl.set(q('.s3-line'), { autoAlpha: 0.25 }, 6.2);
  tl.set(q('.s3-tick'), { scale: 0 }, 6.2);
  const lookAt = 6.25 + cards.length * 0.4 + 0.1;
  // the stack fans out into the look
  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    ft(c, { scale: 1, x: 0, y: 0 }, { scale: 0.49, x: col ? 180 : -180, y: row ? 222 : -222, rotate: cardRot[i]! * 0.6, duration: 0.38, ease: 'power3.inOut' }, lookAt);
  });
  ft(q('.s3-look'), { autoAlpha: 0, scale: 2.2, rotate: -30 }, { autoAlpha: 1, scale: 1, rotate: -9, duration: 0.18, ease: 'power4.in' }, lookAt + 0.3);
  ft(q('.s3'), { x: 0 }, { x: 10, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' }, lookAt + 0.48);

  // ── 8.20 – 10.20  CAIRO MODE ────────────────────────────────────────
  show('.s4', 8.16);
  ft(q('.s4'), { xPercent: 100 }, { xPercent: 0, duration: 0.34, ease: 'power3.out' }, 8.16);
  ft(q('.s3'), { xPercent: 0 }, { xPercent: -35, duration: 0.34, ease: 'power3.out' }, 8.16);
  hide('.s3', 8.52);
  ft(q('.s4-arch img'), { scale: 1.18 }, { scale: 1, duration: 2.1, ease: 'power1.out' }, 8.16);
  ft(q('.s4-kick'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 8.4);
  ft(q('.s4-rail'), { y: 220 }, { y: 0, duration: 0.4, ease: 'power3.out' }, 8.36);
  const signs = ['.s4-sign--1', '.s4-sign--2', '.s4-sign--3'];
  const signRot = [-2, 3, -1.5];
  signs.forEach((s, i) => {
    const at = 8.55 + i * 0.2;
    ft(q(s), { autoAlpha: 0, y: -220, rotate: signRot[i]! + (i % 2 ? -24 : 22) }, { autoAlpha: 1, y: 0, rotate: signRot[i]!, duration: 0.9, ease: 'elastic.out(1, 0.42)' }, at);
  });
  ft(q('.s4-prod'), { autoAlpha: 0, scale: 1.6, rotate: 30 }, { autoAlpha: 1, scale: 1, rotate: 7, duration: 0.24, ease: 'back.out(1.6)' }, 9.3);

  // ── 10.20 – 12.10  MATCH DAY ───────────────────────────────────────
  show('.s5', 10.14);
  ft(q('.s5'), { yPercent: -100 }, { yPercent: 0, duration: 0.3, ease: 'power4.out' }, 10.14);
  hide('.s4', 10.46);
  ft(q('.s5-title'), { autoAlpha: 0, scaleY: 1.6, transformOrigin: '0% 0%' }, { autoAlpha: 1, scaleY: 1, duration: 0.3, ease: 'back.out(1.6)' }, 10.3);
  ft(q('.s5-tape'), { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 50%' }, { autoAlpha: 1, scaleX: 1, duration: 0.2, ease: 'power2.out' }, 10.46);
  ft(q('.s5-locker'), { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'back.out(1.4)' }, 10.34);
  q('.s5-door').forEach((d, i) => {
    ft(d, { rotateY: 0 }, { rotateY: -114, duration: 0.34, ease: 'back.out(1.3)' }, 10.7 + i * 0.16);
  });
  ft(q('.s5-item'), { y: -30, rotate: -4 }, { y: 0, rotate: 0, duration: 0.8, stagger: 0.16, ease: 'elastic.out(1, 0.35)' }, 10.78);
  ft(q('.s5-photo'), { autoAlpha: 0, y: 200, rotate: 20 }, { autoAlpha: 1, y: 0, rotate: 5, duration: 0.3, ease: 'back.out(1.6)' }, 11.35);

  // ── 12.10 – 14.00  THE WALL ────────────────────────────────────────
  show('.s6', 12.04);
  ft(q('.s6'), { yPercent: 100 }, { yPercent: 0, duration: 0.3, ease: 'power3.out' }, 12.04);
  hide('.s5', 12.36);
  ft(q('.s6-title'), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' }, 12.2);
  const polRot = [-6, 5, 2, 4, -5];
  q('.s6-pol').forEach((p, i) => {
    ft(p, { autoAlpha: 0, y: -240, scale: 1.2, rotate: polRot[i]! * -4 }, { autoAlpha: 1, y: 0, scale: 1, rotate: polRot[i]!, duration: 0.3, ease: 'back.out(1.5)' }, 12.28 + i * 0.13);
  });
  ft(q('.s6-note'), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.24, stagger: 0.12, ease: 'back.out(2)' }, 12.95);
  q('.s6-tag').forEach((t, i) => {
    ft(t, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'back.out(2.4)' }, 13.05 + i * 0.1);
  });
  ft(q('.s6-sticker'), { autoAlpha: 0, scale: 2.6, rotate: -48 }, { autoAlpha: 1, scale: 1, rotate: -12, duration: 0.16, ease: 'power4.in' }, 13.45);
  ft(q('.s6'), { y: 0 }, { y: 12, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' }, 13.61);

  // ── 14.00 – 15.80  THE MIRROR + BAG DROP ───────────────────────────
  show('.s7', 13.96);
  ft(q('.s7'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.28, ease: 'power3.inOut' }, 13.96);
  hide('.s6', 14.26);
  ft(q('.s7-mirror'), { y: 80, rotate: -3 }, { y: 0, rotate: 0, duration: 0.5, ease: 'back.out(1.3)' }, 14.0);
  ft(q('.s7-kick, .s7-name, .s7-price'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.05 }, 14.12);
  ft(q('.s7-size'), { autoAlpha: 0, y: 40, rotate: -10 }, { autoAlpha: 1, y: 0, rotate: 0, duration: 0.24, stagger: 0.05, ease: 'back.out(2)' }, 14.24);
  ft(q('.s7-add, .s7-bag, .s7-count'), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.05 }, 14.34);
  // M gets pinned
  ft(q('.s7-size--m'), { backgroundColor: '#fffdf8', color: '#17140f', rotate: 0 }, { backgroundColor: '#17140f', color: '#f5f0e6', rotate: -4, duration: 0.12 }, 14.6);
  ft(q('.s7-pin'), { autoAlpha: 0, x: -70, y: -50, rotate: -30 }, { autoAlpha: 1, x: 0, y: 0, rotate: 8, duration: 0.22, ease: 'back.out(2)' }, 14.6);
  // press ADD TO BAG
  ft(q('.s7-add'), { scale: 1 }, { scale: 0.93, duration: 0.07, yoyo: true, repeat: 1 }, 14.86);
  // the tag flies into the bag
  tl.set(q('.s7-tag'), { autoAlpha: 0 }, 0);
  ft(q('.s7-tag'), { autoAlpha: 1, x: 0, y: 0, scale: 1, rotate: -6 }, { keyframes: [{ x: 120, y: 260, rotate: 8, scale: 0.8, duration: 0.14, ease: 'power1.out' }, { x: 330, y: 820, rotate: -4, scale: 0.42, duration: 0.24, ease: 'power2.in' }] }, 14.98, false);
  tl.set(q('.s7-tag'), { autoAlpha: 0 }, 15.36);
  ft(q('.s7-bag'), { scaleY: 1, scaleX: 1, transformOrigin: '50% 100%' }, { keyframes: [{ scaleY: 0.86, scaleX: 1.08, duration: 0.07 }, { scaleY: 1, scaleX: 1, duration: 0.4, ease: 'elastic.out(1, 0.35)' }] }, 15.36);
  ft(q('.s7-count b'), { scale: 1 }, { scale: 1.6, duration: 0.08, yoyo: true, repeat: 1 }, 15.38);
  ft(q('.s7-made'), { autoAlpha: 0, scale: 2.2, rotate: -30 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.16, ease: 'power4.in' }, 15.42);

  // ── 15.80 – 17.20  FINAL LOCKUP ────────────────────────────────────
  show('.s8', 15.8);
  ft(q('.s8'), { yPercent: 100 }, { yPercent: 0, duration: 0.2, ease: 'power4.out' }, 15.8);
  hide('.s7', 16.02);
  ft(q('.s8-logo'), { autoAlpha: 0, y: -60, scale: 1.1 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, 15.9);
  q('.s8-line span').forEach((s, i) => {
    ft(s, { autoAlpha: 0, yPercent: -80, scaleY: 1.4 }, { autoAlpha: 1, yPercent: 0, scaleY: 1, duration: 0.14, ease: 'power4.in' }, 16.08 + i * 0.13);
  });
  ft(q('.s8-credits'), { autoAlpha: 0, y: 20 }, { autoAlpha: 0.85, y: 0, duration: 0.2 }, 16.3);

  firsts.forEach((v, el) => tl.set(el, v, 0));
  // pad to the exact length; hard cut
  tl.set({}, {}, DURATION);
  return tl;
}
