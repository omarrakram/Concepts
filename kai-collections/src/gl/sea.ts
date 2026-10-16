/**
 * The KAI seascape: one fragment shader for sky, sun, sea, sand and a wordmark
 * reflected in moving water. Everything is a pure function of its uniforms, so
 * the same frame can be rendered live on the site and seeked frame-by-frame in
 * the film. It depicts light and water only — never a place or a product.
 */

export type RGB = [number, number, number];
export interface Light {
  skyTop: RGB;
  skyHz: RGB;
  seaDeep: RGB;
  seaFar: RGB;
  sun: RGB;
  haze: RGB;
  sandA: RGB;
  sandB: RGB;
  /** sun position: x across the frame (0..1), y height above the horizon (frame heights) */
  sunX: number;
  sunY: number;
  letter: RGB;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export const LIGHTS = {
  morning: {
    skyTop: hex('#9DC2D3'),
    skyHz: hex('#F7E9D3'),
    seaDeep: hex('#1F5466'),
    seaFar: hex('#8FB7C2'),
    sun: hex('#FFF4DE'),
    haze: hex('#F2E6D6'),
    sandA: hex('#E9DCC5'),
    sandB: hex('#CDB998'),
    sunX: 0.24,
    sunY: 0.16,
    letter: hex('#FFFDF7'),
  },
  noon: {
    skyTop: hex('#5E9BBC'),
    skyHz: hex('#E5EFF0'),
    seaDeep: hex('#123F55'),
    seaFar: hex('#5B9AAE'),
    sun: hex('#FFFFFF'),
    haze: hex('#E4EEEF'),
    sandA: hex('#F1E6D2'),
    sandB: hex('#D6C3A2'),
    sunX: 0.62,
    sunY: 0.42,
    letter: hex('#FFFDF7'),
  },
  golden: {
    skyTop: hex('#7FA6B6'),
    skyHz: hex('#F4D3A3'),
    seaDeep: hex('#1B4757'),
    seaFar: hex('#B99D82'),
    sun: hex('#FFD79A'),
    haze: hex('#F3D7B0'),
    sandA: hex('#EBCFA5'),
    sandB: hex('#C59C6C'),
    sunX: 0.7,
    sunY: 0.1,
    letter: hex('#FFF6E6'),
  },
  dusk: {
    skyTop: hex('#2D4A63'),
    skyHz: hex('#E6987A'),
    seaDeep: hex('#10303D'),
    seaFar: hex('#8C6A66'),
    sun: hex('#FFB98A'),
    haze: hex('#D99A84'),
    sandA: hex('#C9A08A'),
    sandB: hex('#8E6A5E'),
    sunX: 0.42,
    sunY: 0.012,
    letter: hex('#FBE7DA'),
  },
  night: {
    skyTop: hex('#0B1A24'),
    skyHz: hex('#284555'),
    seaDeep: hex('#07141B'),
    seaFar: hex('#1B3746'),
    sun: hex('#DDE7EA'),
    haze: hex('#2A4655'),
    sandA: hex('#3A4A50'),
    sandB: hex('#22303A'),
    sunX: 0.78,
    sunY: 0.3,
    letter: hex('#E9EEEF'),
  },
} satisfies Record<string, Light>;
export type LightKey = keyof typeof LIGHTS;

const mix3 = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export function mixLight(a: Light, b: Light, t: number): Light {
  const out = {} as Light;
  for (const k of Object.keys(a) as (keyof Light)[]) {
    const va = a[k];
    const vb = b[k];
    (out as unknown as Record<string, unknown>)[k] = Array.isArray(va)
      ? mix3(va as RGB, vb as RGB, t)
      : (va as number) + ((vb as number) - (va as number)) * t;
  }
  return out;
}
/** Blend along an ordered list of lights with p in [0,1]. */
export function lightAlong(keys: LightKey[], p: number): Light {
  const x = Math.max(0, Math.min(1, p)) * (keys.length - 1);
  const i = Math.min(keys.length - 2, Math.floor(x));
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  return mixLight(LIGHTS[keys[i]], LIGHTS[keys[i + 1]], s);
}

export interface SeaParams {
  light: Light;
  time: number;
  /** horizon height measured from the bottom of the frame, 0..1 */
  horizon: number;
  /** 0 = sea, 1 = sand */
  sand?: number;
  calm?: number;
  pointer?: [number, number];
  grain?: number;
  /** extra sun offset (e.g. pointer-driven glint) */
  sunShift?: number;
  /** strength of the sun's halo (1 = default) */
  glow?: number;
  /** letters reflected in the water */
  textOn?: number;
  /** how far the letters sit below their final baseline (frame heights): 0 = standing on the horizon */
  textLift?: number;
}

const VERT = `attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime,uHorizon,uSand,uCalm,uGrain,uTextOn,uSunShift,uLift,uGlow;
uniform vec2 uSun,uPointer;
uniform vec3 uSkyTop,uSkyHz,uSeaDeep,uSeaFar,uSunCol,uHaze,uSandA,uSandB,uLetter;
uniform sampler2D uText;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float waves(vec2 p,float t){
  float h=sin(p.x*.55+t*.55+sin(p.y*.21)*1.6)*.55;
  h+=sin(p.x*-.38+p.y*.9+t*.8)*.38;
  h+=sin(p.x*1.4+p.y*.47-t*1.25)*.2;
  h+=(noise(p*vec2(1.1,2.2)+vec2(t*.21,-t*.34))-.5)*.7;
  h+=(noise(p*vec2(3.1,5.3)+vec2(-t*.45,t*.62))-.5)*.28;
  h+=(noise(p*vec2(7.,11.)+vec2(t*.9,t*.4))-.5)*.1;
  return h;
}
float ripple(vec2 p){
  float w=noise(p*.35)*5.;
  return .5+.5*sin(p.y*5.2+p.x*.6+w);
}
vec3 sky(float e,float x,vec2 sunP,float aspect){
  vec3 c=mix(uSkyHz,uSkyTop,pow(smoothstep(0.,.75,e),.75));
  vec2 d=vec2((x-sunP.x)*aspect,e-sunP.y);
  float r=length(d);
  c+=uSunCol*(exp(-r*5.5)*.32+exp(-r*22.)*.35)*uGlow;
  c=mix(c,uSunCol,smoothstep(.034,.027,r));
  c=mix(c,uHaze,exp(-e*24.)*.55);
  return c;
}
void main(){
  vec2 uv=vUv;
  float aspect=uRes.x/uRes.y;
  float t=uTime;
  float hz=uHorizon+(uv.x-.5)*uPointer.x*.012;
  vec2 sunP=vec2(uSun.x+uSunShift+uPointer.x*.03,uSun.y);
  float e=uv.y-hz;
  vec3 col;
  float letterA=0.;
  if(e>=0.){
    col=sky(e,uv.x,sunP,aspect);
    vec4 tx=texture2D(uText,vec2(uv.x,1.-(uv.y+uLift)));
    letterA=tx.a*uTextOn;
    /* plaster letters: relief from the alpha gradient, lit from the sun's side */
    vec2 px=vec2(4.)/uRes;
    vec2 tuv=vec2(uv.x,1.-(uv.y+uLift));
    float aL=texture2D(uText,tuv-vec2(px.x,0.)).a,aR=texture2D(uText,tuv+vec2(px.x,0.)).a;
    float aU=texture2D(uText,tuv-vec2(0.,px.y)).a,aD=texture2D(uText,tuv+vec2(0.,px.y)).a;
    vec2 grad=vec2(aR-aL,aD-aU);
    vec2 toSun=normalize(vec2((sunP.x-uv.x)*aspect,(hz+sunP.y)-uv.y)+1e-4);
    float relief=dot(grad,-toSun);
    float ao=mix(.72,1.,smoothstep(0.,.42,e));
    float side=.92+.08*clamp(toSun.x*(uv.x-sunP.x)*-4.,-1.,1.);
    vec3 warm=uLetter*vec3(.9,.85,.77);
    vec3 lc=mix(warm,uLetter,ao*side*1.08-.08);
    lc=mix(lc,uSkyHz*.78,.12*(1.-smoothstep(0.,.3,e)));
    lc+=uSunCol*clamp(relief,0.,1.)*.35;
    lc-=vec3(.16,.14,.12)*clamp(-relief,0.,1.);
    /* a soft, even halo of shade around the letters lifts them off bright haze */
    if(uTextOn>0.&&letterA<1.){
      float halo=0.;
      for(int i=0;i<8;i++){
        float a=float(i)*.7854+.39;
        vec2 o=vec2(cos(a),sin(a))/uRes;
        halo+=texture2D(uText,tuv+o*7.).a+texture2D(uText,tuv+o*16.).a*.7+texture2D(uText,tuv+o*28.).a*.4;
      }
      col*=1.-(halo/16.8)*uTextOn*.14*(1.-letterA);
    }
    col=mix(col,lc,letterA);
  }else{
    float d=-e;
    float z=.16/max(d,.0015);
    vec2 wp=vec2((uv.x-.5)*aspect*z*2.6,z);
    float amp=uCalm*(.9/(1.+z*.08));
    float k=.03;
    float h0=waves(wp,t);
    float hx=waves(wp+vec2(k,0.),t);
    float hz2=waves(wp+vec2(0.,k),t);
    vec3 n=normalize(vec3(-(hx-h0)/k*amp*.32,1.,-(hz2-h0)/k*amp*.32));
    vec3 rd=normalize(vec3((uv.x-.5)*aspect,e,1.));
    vec3 r=reflect(rd,n);
    float re=max(r.y,0.);
    vec3 refl=sky(re,uv.x+r.x*.1,sunP,aspect);
    float fres=.03+.97*pow(1.-max(dot(-rd,n),0.),5.);
    float depthMix=smoothstep(0.,.55,d);
    vec3 body=mix(uSeaFar,uSeaDeep,pow(depthMix,.6));
    vec3 c=mix(body,refl,clamp(fres*1.25,0.,1.));
    vec3 sd=normalize(vec3((sunP.x-.5)*aspect,max(sunP.y,.004),1.));
    float spec=pow(max(dot(r,sd),0.),520.)*5.;
    float sheen=pow(max(dot(r,sd),0.),36.)*.4;
    float twinkle=step(.83,noise(wp*vec2(9.,14.)+t*2.3));
    c+=uSunCol*(spec*(.4+twinkle*1.2)+sheen)*smoothstep(-.02,.12,sunP.y);
    /* wordmark reflection */
    vec2 ruv=vec2(uv.x+n.x*.045,hz+d*1.0+n.z*.03);
    vec4 tr=texture2D(uText,vec2(ruv.x,1.-(ruv.y+uLift)));
    /* the part of the letters still under water, refracted */
    vec4 ts=texture2D(uText,vec2(uv.x+n.x*.035,1.-(uv.y+uLift+n.z*.02)));
    float sA=ts.a*uTextOn*smoothstep(0.,.02,uLift)*(1.-smoothstep(0.,.3,d))*.5;
    float rA=tr.a*uTextOn*(1.-smoothstep(0.,.42,d))*.62;
    c=mix(c,mix(uLetter,body,.35),rA*(.55+.45*fres));
    c=mix(c,mix(body,uLetter,.42),sA);
    /* sand */
    if(uSand>0.){
      vec2 sp=vec2((uv.x-.5)*aspect*z*3.,z*1.4);
      float rp=ripple(sp*1.6);
      float ln=.5+.5*dot(normalize(vec3(rp-.5,1.,.2)),normalize(vec3(sd.x,.6,-.3)));
      vec3 sandC=mix(uSandB,uSandA,rp*.55+ln*.45);
      sandC=mix(sandC,uHaze,smoothstep(.2,0.,d)*.35);
      c=mix(c,sandC,uSand);
    }
    c=mix(c,uHaze,exp(-d*42.)*.6);
    col=c;
  }
  float g=hash(uv*uRes+fract(t*7.13)*91.)-.5;
  col+=g*uGrain;
  gl_FragColor=vec4(col,1.);
}`;

export interface SeaRenderer {
  canvas: HTMLCanvasElement;
  render(p: SeaParams): void;
  setText(c: HTMLCanvasElement | null): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

export function createSea(canvas: HTMLCanvasElement): SeaRenderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = {
    res: U('uRes'),
    time: U('uTime'),
    horizon: U('uHorizon'),
    sand: U('uSand'),
    calm: U('uCalm'),
    grain: U('uGrain'),
    textOn: U('uTextOn'),
    sunShift: U('uSunShift'),
    lift: U('uLift'),
    glow: U('uGlow'),
    sun: U('uSun'),
    pointer: U('uPointer'),
    skyTop: U('uSkyTop'),
    skyHz: U('uSkyHz'),
    seaDeep: U('uSeaDeep'),
    seaFar: U('uSeaFar'),
    sunCol: U('uSunCol'),
    haze: U('uHaze'),
    sandA: U('uSandA'),
    sandB: U('uSandB'),
    letter: U('uLetter'),
    text: U('uText'),
  };
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  gl.uniform1i(u.text, 0);

  return {
    canvas,
    setText(c) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (c) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    },
    resize(w, h) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    },
    render(p) {
      const L = p.light;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, p.time);
      gl.uniform1f(u.horizon, p.horizon);
      gl.uniform1f(u.sand, p.sand ?? 0);
      gl.uniform1f(u.calm, p.calm ?? 1);
      gl.uniform1f(u.grain, p.grain ?? 0.025);
      gl.uniform1f(u.textOn, p.textOn ?? 0);
      gl.uniform1f(u.sunShift, p.sunShift ?? 0);
      gl.uniform1f(u.lift, p.textLift ?? 0);
      gl.uniform1f(u.glow, p.glow ?? 1);
      gl.uniform2f(u.sun, L.sunX, L.sunY);
      gl.uniform2f(u.pointer, p.pointer?.[0] ?? 0, p.pointer?.[1] ?? 0);
      gl.uniform3fv(u.skyTop, L.skyTop);
      gl.uniform3fv(u.skyHz, L.skyHz);
      gl.uniform3fv(u.seaDeep, L.seaDeep);
      gl.uniform3fv(u.seaFar, L.seaFar);
      gl.uniform3fv(u.sunCol, L.sun);
      gl.uniform3fv(u.haze, L.haze);
      gl.uniform3fv(u.sandA, L.sandA);
      gl.uniform3fv(u.sandB, L.sandB);
      gl.uniform3fv(u.letter, L.letter);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

/** Wordmark texture: letters standing on the horizon line, baseline exactly at the waterline. */
/* ---------- KAI's logo as the horizon texture ---------- */
let logoPromise: Promise<HTMLImageElement | null> | null = null;
/** Loads KAI's logo once, CORS-clean (KAI's CDN sends Access-Control-Allow-Origin: *) so WebGL can sample it. */
export function loadLogo(src: string): Promise<HTMLImageElement | null> {
  if (!logoPromise)
    logoPromise = new Promise((res) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  return logoPromise;
}

export interface LogoArt {
  img: HTMLImageElement;
  /** fraction of the artwork height taken by the "KAI" letters */
  kai: number;
}

export function wordmarkCanvas(w: number, h: number, horizon: number, text: string, sizeFrac: number, tracking = 0.04, logo?: LogoArt | null) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const size = Math.round(Math.min(w * sizeFrac, h * 0.6));
  if (logo && text === 'KAI') {
    // KAI's own letterforms, standing on the horizon: same footprint as the typeset fallback
    const sw = logo.img.naturalWidth;
    const sh = logo.img.naturalHeight * logo.kai;
    const H = size * 0.74;
    const W = (H * sw) / sh;
    const base = h * (1 - horizon) + size * 0.006;
    ctx.drawImage(logo.img, 0, 0, sw, sh, (w - W) / 2, base - H, W, H);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    c.dataset.source = 'logo';
    return c;
  }
  ctx.font = `300 ${size}px "Fraunces Variable", "Fraunces", Georgia, serif`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  const letters = [...text];
  const track = size * tracking;
  const widths = letters.map((l) => ctx.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (letters.length - 1);
  let x = (w - total) / 2;
  const base = h * (1 - horizon) + size * 0.012;
  letters.forEach((l, i) => {
    ctx.fillText(l, x, base);
    x += widths[i] + track;
  });
  return c;
}

/* ---------- Shared still renderer: one context, many vignettes ---------- */
let shared: SeaRenderer | null | undefined;
const stills = new Map<string, string>();
export function seaStill(key: string, w: number, h: number, p: SeaParams): string | null {
  const hit = stills.get(key);
  if (hit) return hit;
  if (shared === undefined) {
    try {
      shared = createSea(document.createElement('canvas'));
    } catch {
      shared = null;
    }
  }
  if (!shared) return null;
  shared.resize(w, h);
  shared.setText(null);
  shared.render({ ...p, textOn: 0 });
  const url = shared.canvas.toDataURL('image/jpeg', 0.86);
  stills.set(key, url);
  return url;
}

export function cssFallback(L: Light, horizon: number) {
  const c = (v: RGB) => `rgb(${v.map((x) => Math.round(x * 255)).join(',')})`;
  const hz = (1 - horizon) * 100;
  return `linear-gradient(180deg, ${c(L.skyTop)} 0%, ${c(L.skyHz)} ${hz}%, ${c(L.seaFar)} ${hz}%, ${c(L.seaDeep)} 100%)`;
}
