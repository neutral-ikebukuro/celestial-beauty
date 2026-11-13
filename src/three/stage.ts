// 天体盤(アストロラーベ)の WebGL 舞台。必要になった時だけ動的に読み込まれる。
import * as THREE from 'three';
import { SIGNS } from '../data/zodiac';
import type { Sky } from '../lib/sky';
import type { Aspect } from '../data/readings';

export type Mode = 'select' | 'reading' | 'result';
export interface StageOptions {
  tier: 'high' | 'low';
  reducedMotion: boolean;
  onSelect: (sign: number) => void;
}

const ROSE = new THREE.Color('#E24B91');
const LILAC = new THREE.Color('#CCB4E5');
const PLAT = new THREE.Color('#ECE8F1');
const INK = new THREE.Color('#170D19');

const ORBIT: Record<string, number> = { moon: 0.62, mercury: 0.88, venus: 1.12, sun: 1.38, mars: 1.62, jupiter: 1.84, saturn: 2.04 };
const BAND_IN = 2.26;
const BAND_OUT = 2.98;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOut = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const rad = THREE.MathUtils.degToRad;

interface Tween { from: number; to: number; dur: number; t0: number; delay: number; ease: (t: number) => number; set: (v: number) => void; done?: () => void }

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  private clock = new THREE.Clock();
  private tweens: Tween[] = [];
  private raf = 0;
  private running = true;
  private lastFrame = 0;
  private opts: StageOptions;
  private w = 1;
  private h = 1;

  // 物
  private bg!: THREE.Mesh;
  private bgMat!: THREE.ShaderMaterial;
  private stars!: THREE.Points;
  private starMat!: THREE.ShaderMaterial;
  private rig = new THREE.Group(); // 位置・大きさ(レイアウト)
  private tilt = new THREE.Group(); // 傾き
  private dial = new THREE.Group(); // 黄道の回転
  private glassMat!: THREE.MeshPhysicalMaterial;
  private bandMat!: THREE.MeshStandardMaterial;
  private highlight!: THREE.Mesh;
  private highlightMat!: THREE.MeshBasicMaterial;
  private planets: { key: string; mesh: THREE.Mesh; glow: THREE.Sprite; r: number; angle: number; target: number }[] = [];
  private aspectLines: { line: THREE.Line; mat: THREE.LineBasicMaterial; key: string }[] = [];
  private constel = new THREE.Group();
  private constelPts?: THREE.Points;
  private constelMat?: THREE.ShaderMaterial;
  private constelLines?: THREE.LineSegments;
  private constelLineMat?: THREE.LineBasicMaterial;
  private dishLights: THREE.PointLight[] = [];
  private keyLight!: THREE.DirectionalLight;

  // 状態
  private dialAngle = 0;
  private sign = -1;
  private mode: Mode = 'select';
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private dragging = false;
  private dragStartX = 0;
  private dragStartAngle = 0;
  private dragMoved = false;
  private layout = { x: 0, y: 0, s: 1, camZ: 12, dim: 0 };
  private assemble = 0;
  private dive = 0;

  constructor(private canvas: HTMLCanvasElement, opts: StageOptions) {
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: opts.tier === 'high', alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(INK, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.camera.position.set(0, 0, 12);
    this.scene.add(this.camera);
    this.buildEnvironment();
    this.buildBackground();
    this.buildStars();
    this.buildAstrolabe();
    this.scene.add(this.rig);
    this.rig.add(this.tilt);
    this.tilt.add(this.dial);
    this.tilt.rotation.x = -0.92;
    this.rig.add(this.constel);
    this.bindInput();
    this.resize();
    document.addEventListener('visibilitychange', this.onVisibility);
    // 起動: 環が組み上がる
    if (opts.reducedMotion) this.assemble = 1;
    else this.tween(0, 1, 1.25, (v) => (this.assemble = v), 0.05, easeOut);
    this.loop();
  }

  // ---------- 構築 ----------
  private buildEnvironment() {
    // 外部の HDR を使わず、光の板だけで映り込みをつくる
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color('#0b060c');
    const panel = (color: THREE.Color, intensity: number, w: number, h: number, pos: [number, number, number], rot: [number, number, number]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.rotation.set(...rot);
      env.add(m);
    };
    panel(ROSE, 3.2, 6, 14, [-9, 4, 2], [0, Math.PI / 2, 0]);
    panel(LILAC, 2.2, 5, 12, [9, -3, 1], [0, -Math.PI / 2, 0]);
    panel(PLAT, 4.0, 18, 0.8, [0, 9, -2], [Math.PI / 2, 0, 0]);
    panel(PLAT, 1.6, 0.6, 10, [3, 0, 9], [0, Math.PI, 0]);
    panel(ROSE, 1.2, 10, 3, [0, -9, 4], [-Math.PI / 2, 0, 0]);
    this.scene.environment = pmrem.fromScene(env, 0.04).texture;
    pmrem.dispose();

    this.keyLight = new THREE.DirectionalLight(PLAT, 1.6);
    this.keyLight.position.set(-3, 5, 6);
    this.scene.add(this.keyLight);
    const rose = new THREE.PointLight(ROSE, 18, 14, 2);
    rose.position.set(-3.5, 2.5, 2.5);
    this.scene.add(rose);
    for (let i = 0; i < 2; i++) {
      const l = new THREE.PointLight(PLAT, 0, 10, 2);
      l.position.set(i ? 2.6 : -1.8, i ? -1.2 : 1.6, 2.2);
      this.scene.add(l);
      this.dishLights.push(l);
    }
  }

  private buildBackground() {
    this.bgMat = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uInk: { value: INK.clone() },
        uRose: { value: new THREE.Color('#4a1330') },
        uLilac: { value: new THREE.Color('#231732') },
        uGlow: { value: new THREE.Vector2(0.22, 0.78) },
        uAspect: { value: 1 },
        uTime: { value: 0 },
        uDim: { value: 0 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }',
      fragmentShader: `
        varying vec2 vUv; uniform vec3 uInk; uniform vec3 uRose; uniform vec3 uLilac; uniform vec2 uGlow; uniform float uAspect; uniform float uTime; uniform float uDim;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){
          vec2 p = vUv; vec2 q = vec2((p.x - uGlow.x) * uAspect, p.y - uGlow.y);
          float g = exp(-dot(q,q) * 5.5);
          vec2 q2 = vec2((p.x - 0.86) * uAspect, p.y - 0.12);
          float l = exp(-dot(q2,q2) * 5.0);
          vec3 col = uInk * 0.9 + uRose * g * 0.42 + uLilac * l * 0.3;
          float v = smoothstep(1.25, 0.25, length((p - 0.5) * vec2(uAspect, 1.0)));
          col *= mix(0.45, 1.0, v);
          col *= 1.0 - uDim * 0.45;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
          gl_FragColor.rgb += (hash(p * 800.0 + uTime) - 0.5) * 0.018; // 粒子感は表示色の上で
        }`,
    });
    this.bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat);
    this.bg.frustumCulled = false;
    this.bg.renderOrder = -10;
    this.scene.add(this.bg);
  }

  private buildStars() {
    const n = this.opts.tier === 'high' ? 2600 : 1200;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const tw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const z = -8 - Math.pow(Math.random(), 0.7) * 60;
      const spread = (-z + 12) * 0.55;
      pos[i * 3] = (Math.random() - 0.5) * spread * 2.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 2.2;
      pos[i * 3 + 2] = z;
      const r = Math.random();
      size[i] = r > 0.985 ? 3.2 : r > 0.9 ? 1.9 : 1.0 + Math.random() * 0.5;
      tw[i] = Math.random() > 0.9 ? Math.random() * 6.28 : -1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aTw', new THREE.BufferAttribute(tw, 1));
    this.starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uAlpha: { value: 1 } },
      vertexShader: `attribute float aSize; attribute float aTw; uniform float uTime; uniform float uPx; varying float vA; varying float vS;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
          float tw = aTw < 0.0 ? 1.0 : 0.75 + 0.25 * sin(uTime * 0.9 + aTw);
          gl_PointSize = aSize * uPx * (34.0 / -mv.z) * 1.6; vA = tw * clamp(30.0 / -mv.z, 0.25, 1.0); vS = aSize; }`,
      fragmentShader: `varying float vA; varying float vS; uniform float uAlpha;
        void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c);
          float core = smoothstep(0.5, 0.0, d); core = pow(core, 2.2);
          float cross = vS > 3.0 ? (smoothstep(0.05,0.0,abs(c.x)) + smoothstep(0.05,0.0,abs(c.y))) * smoothstep(0.5,0.0,d) * 0.35 : 0.0;
          vec3 col = mix(vec3(0.93,0.91,0.95), vec3(0.85,0.75,0.92), step(2.0, vS) * 0.4);
          gl_FragColor = vec4(col, (core + cross) * vA * uAlpha); }`,
    });
    this.stars = new THREE.Points(g, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }

  private makeBandTexture(): THREE.CanvasTexture {
    const S = this.opts.tier === 'high' ? 2048 : 1024;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d')!;
    const c = S / 2;
    const k = c / BAND_OUT; // 世界座標 → 画素
    const polar = (r: number, a: number) => [c + r * k * Math.cos(a), c - r * k * Math.sin(a)] as const;
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(236,232,241,0.9)';
    ctx.lineCap = 'round';
    // 目盛り
    for (let d = 0; d < 360; d++) {
      const a = rad(d);
      const long = d % 30 === 0 ? 0.2 : d % 5 === 0 ? 0.075 : 0.035;
      ctx.lineWidth = d % 30 === 0 ? S / 900 : S / 2400;
      const [x1, y1] = polar(BAND_OUT - 0.04, a);
      const [x2, y2] = polar(BAND_OUT - 0.04 - long, a);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      if (d % 30 === 0) {
        const [x3, y3] = polar(BAND_IN + 0.02, a);
        const [x4, y4] = polar(BAND_IN + 0.18, a);
        ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x4, y4); ctx.stroke();
      }
    }
    // 罫
    ctx.lineWidth = S / 1600;
    [BAND_OUT - 0.04, BAND_OUT - 0.25, BAND_IN + 0.03].forEach((r) => { ctx.beginPath(); ctx.arc(c, c, r * k, 0, Math.PI * 2); ctx.stroke(); });
    // 星座名(弧に沿って)
    const fontPx = Math.round(S * 0.026);
    ctx.fillStyle = 'rgba(236,232,241,0.95)';
    ctx.font = `300 ${fontPx}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rText = (BAND_IN + BAND_OUT - 0.25) / 2 + 0.02;
    SIGNS.forEach((s) => {
      const label = s.en.toUpperCase().split('').join(' ');
      const mid = rad(s.id * 30 + 15);
      const chars = [...label];
      const widths = chars.map((ch) => ctx.measureText(ch).width * 1.18);
      const total = widths.reduce((a, b) => a + b, 0);
      let ang = mid + total / 2 / (rText * k);
      chars.forEach((ch, i) => {
        const wa = widths[i] / (rText * k);
        const a = ang - wa / 2;
        const [x, y] = polar(rText, a);
        ctx.save(); ctx.translate(x, y); ctx.rotate(-a + Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore();
        ang -= wa;
      });
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  private glowTexture(): THREE.Texture {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const ctx = cv.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  private buildAstrolabe() {
    const metal = new THREE.MeshPhysicalMaterial({ color: PLAT, metalness: 1, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.25 });
    const metalDim = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#c9c2d3'), metalness: 1, roughness: 0.32, envMapIntensity: 1.0 });
    const ring = (r: number, tube: number, mat: THREE.Material, seg = 256) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 24, seg), mat);
      this.dial.add(m);
      return m;
    };
    ring(BAND_OUT + 0.05, 0.05, metal);
    ring(BAND_OUT + 0.17, 0.012, metalDim);
    ring(BAND_IN - 0.02, 0.028, metal);

    // 黄道帯(暗いエナメルに刻印)
    const tex = this.makeBandTexture();
    this.bandMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2a1630'), metalness: 0.75, roughness: 0.38, emissive: PLAT, emissiveMap: tex, emissiveIntensity: 0.9, transparent: true, opacity: 0.94, side: THREE.DoubleSide, envMapIntensity: 0.8 });
    const band = new THREE.Mesh(new THREE.RingGeometry(BAND_IN, BAND_OUT, 256, 1), this.bandMat);
    this.fixRingUV(band.geometry as THREE.RingGeometry);
    this.dial.add(band);

    // 選択中の星座の区画
    this.highlightMat = new THREE.MeshBasicMaterial({ color: ROSE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.highlight = new THREE.Mesh(new THREE.RingGeometry(BAND_IN + 0.02, BAND_OUT - 0.04, 48, 1, 0, rad(30)), this.highlightMat);
    this.highlight.position.z = 0.004;
    this.dial.add(this.highlight);

    // ガラス盤
    const high = this.opts.tier === 'high';
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f2e6f4'), metalness: 0, roughness: 0.08,
      transmission: high ? 1 : 0, transparent: !high, opacity: high ? 1 : 0.22,
      thickness: 0.5, ior: 1.46, iridescence: 0.35, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 520],
      clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new THREE.Color('#e9a9cc'), attenuationDistance: 2.4, envMapIntensity: 0.55,
      specularIntensity: 0.5,
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(BAND_IN - 0.04, BAND_IN - 0.04, 0.09, 128, 1), this.glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.z = -0.06;
    this.dial.add(glass);

    // 軌道
    const orbitMat = new THREE.MeshBasicMaterial({ color: LILAC, transparent: true, opacity: 0.28, depthWrite: false });
    Object.values(ORBIT).forEach((r) => ring(r, 0.0045, orbitMat, 192));

    // 中心(地球=観測者)
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture(), color: PLAT, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, opacity: 0.9 }));
    core.renderOrder = 6;
    core.scale.setScalar(0.42);
    core.position.z = 0.05;
    this.dial.add(core);
    const coreDot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), new THREE.MeshBasicMaterial({ color: PLAT, transparent: true }));
    coreDot.position.z = 0.051;
    this.dial.add(coreDot);

    // 天体
    const glowTex = this.glowTexture();
    const colorOf: Record<string, THREE.Color> = { sun: PLAT, moon: LILAC, venus: ROSE, mercury: PLAT, mars: new THREE.Color('#f07aa8'), jupiter: PLAT, saturn: LILAC };
    const sizeOf: Record<string, number> = { sun: 0.13, moon: 0.1, mercury: 0.055, venus: 0.085, mars: 0.07, jupiter: 0.1, saturn: 0.09 };
    Object.entries(ORBIT).forEach(([key, r], i) => {
      const col = colorOf[key];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(sizeOf[key], 32, 16),
        new THREE.MeshPhysicalMaterial({ color: col, metalness: key === 'sun' ? 1 : 0.3, roughness: 0.15, clearcoat: 1, emissive: col, emissiveIntensity: key === 'sun' ? 0.65 : 0.25, transparent: true }),
      );
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, opacity: 0.85 }));
      glow.renderOrder = 6;
      glow.scale.setScalar(sizeOf[key] * (key === 'sun' ? 9 : 6));
      const holder = new THREE.Group();
      holder.add(mesh); holder.add(glow);
      this.dial.add(holder);
      const a0 = rad(i * 51);
      this.planets.push({ key, mesh, glow, r, angle: a0, target: a0 });
      (mesh as any).holder = holder;

      const lm = new THREE.LineBasicMaterial({ color: ROSE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(lg, lm);
      line.frustumCulled = false;
      this.dial.add(line);
      this.aspectLines.push({ line, mat: lm, key });
    });
  }

  /** RingGeometry の UV を中心基準の平面 UV に直す(テクスチャの刻印位置を正確に) */
  private fixRingUV(g: THREE.RingGeometry) {
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / BAND_OUT / 2 + 0.5, pos.getY(i) / BAND_OUT / 2 + 0.5);
    uv.needsUpdate = true;
  }

  private buildConstellation(sign: number) {
    if (this.constelPts) { this.constel.remove(this.constelPts); this.constelPts.geometry.dispose(); }
    if (this.constelLines) { this.constel.remove(this.constelLines); this.constelLines.geometry.dispose(); }
    const s = SIGNS[sign];
    const per = 26;
    const n = s.stars.length * per;
    const start = new Float32Array(n * 3);
    const target = new Float32Array(n * 3);
    const info = new Float32Array(n * 3); // 遅れ, 主星か, 明るさ
    s.stars.forEach(([x, y, b], si) => {
      for (let j = 0; j < per; j++) {
        const i = si * per + j;
        const a = Math.random() * Math.PI * 2;
        const r = 2.5 + Math.random() * 4.5;
        start[i * 3] = Math.cos(a) * r; start[i * 3 + 1] = Math.sin(a) * r * 0.8; start[i * 3 + 2] = (Math.random() - 0.5) * 4;
        const jit = j === 0 ? 0 : 0.05 + Math.random() * 0.12;
        const ja = Math.random() * Math.PI * 2;
        target[i * 3] = x + Math.cos(ja) * jit; target[i * 3 + 1] = y + Math.sin(ja) * jit; target[i * 3 + 2] = 0;
        info[i * 3] = Math.random() * 0.35; info[i * 3 + 1] = j === 0 ? 1 : 0; info[i * 3 + 2] = b;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(target, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 3));
    if (!this.constelMat) {
      this.constelMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        uniforms: { uP: { value: 0 }, uPx: { value: 1 }, uAlpha: { value: 1 }, uRose: { value: ROSE }, uPlat: { value: PLAT } },
        vertexShader: `attribute vec3 aStart; attribute vec3 aInfo; uniform float uP; uniform float uPx; varying float vA; varying float vMain; varying float vB;
          void main(){ float t = clamp((uP - aInfo.x) / 0.65, 0.0, 1.0); t = 1.0 - pow(1.0 - t, 3.0);
            vec3 p = mix(aStart, position, t);
            vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
            float settle = smoothstep(0.75, 1.0, uP);
            vMain = aInfo.y; vB = aInfo.z;
            float sz = mix(2.2, aInfo.y > 0.5 ? 9.0 + aInfo.z * 10.0 : 1.4, settle);
            gl_PointSize = sz * uPx * (12.0 / -mv.z);
            vA = aInfo.y > 0.5 ? 1.0 : mix(0.9, 0.18, settle); }`,
        fragmentShader: `varying float vA; varying float vMain; varying float vB; uniform float uAlpha; uniform vec3 uRose; uniform vec3 uPlat;
          void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = pow(smoothstep(0.5, 0.0, d), 2.0);
            float spike = vMain > 0.5 ? (smoothstep(0.04,0.0,abs(c.x)) + smoothstep(0.04,0.0,abs(c.y))) * smoothstep(0.5,0.1,d) * 0.5 * vB : 0.0;
            vec3 col = mix(uRose, uPlat, vMain > 0.5 ? 0.75 : 0.25);
            gl_FragColor = vec4(col, (a + spike) * vA * uAlpha); }`,
      });
      this.constelLineMat = new THREE.LineBasicMaterial({ color: PLAT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
    }
    this.constelPts = new THREE.Points(g, this.constelMat);
    this.constelPts.frustumCulled = false;
    this.constelPts.renderOrder = 5;
    const lp: number[] = [];
    s.lines.forEach(([a, b]) => { lp.push(s.stars[a][0], s.stars[a][1], 0, s.stars[b][0], s.stars[b][1], 0); });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    this.constelLines = new THREE.LineSegments(lg, this.constelLineMat);
    this.constelLines.renderOrder = 4;
    this.constel.add(this.constelLines);
    this.constel.add(this.constelPts);
  }

  // ---------- 入力 ----------
  private bindInput() {
    const el = this.canvas;
    el.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    window.addEventListener('resize', this.resize);
  }

  private onDown = (e: PointerEvent) => {
    if (this.mode !== 'select') return;
    this.dragging = true;
    this.dragMoved = false;
    this.dragStartX = e.clientX;
    this.dragStartAngle = this.dialAngle;
    this.tweens = this.tweens.filter((t) => (t as any).tag !== 'dial');
  };

  private onMove = (e: PointerEvent) => {
    this.pointer.set((e.clientX / this.w) * 2 - 1, -(e.clientY / this.h) * 2 + 1);
    if (!this.dragging) return;
    const dx = e.clientX - this.dragStartX;
    if (Math.abs(dx) > 6) this.dragMoved = true;
    if (this.dragMoved) this.dialAngle = this.dragStartAngle + (dx / Math.min(this.w, 520)) * 2.4;
  };

  private onUp = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.dragMoved) {
      // 真上に一番近い星座へ吸着
      const topLon = Math.PI / 2 - this.dialAngle;
      const deg = ((THREE.MathUtils.radToDeg(topLon) % 360) + 360) % 360;
      const sign = Math.floor(deg / 30) % 12;
      this.opts.onSelect(sign);
    } else {
      const s = this.hitSign(e.clientX, e.clientY);
      if (s >= 0) this.opts.onSelect(s);
    }
  };

  private hitSign(x: number, y: number): number {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((x / this.w) * 2 - 1, -(y / this.h) * 2 + 1), this.camera);
    this.dial.updateWorldMatrix(true, false);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(this.dial.matrixWorld);
    const origin = new THREE.Vector3().setFromMatrixPosition(this.dial.matrixWorld);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(plane, hit)) return -1;
    const local = this.dial.worldToLocal(hit.clone());
    const r = Math.hypot(local.x, local.y);
    if (r < BAND_IN - 0.2 || r > BAND_OUT + 0.3) return -1;
    const deg = ((THREE.MathUtils.radToDeg(Math.atan2(local.y, local.x)) % 360) + 360) % 360;
    return Math.floor(deg / 30) % 12;
  }

  // ---------- 公開API ----------
  selectSign(sign: number) {
    const first = this.sign < 0;
    this.sign = sign;
    this.buildConstellation(sign);
    const target = Math.PI / 2 - rad(sign * 30 + 15);
    let delta = target - this.dialAngle;
    delta = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    const rm = this.opts.reducedMotion;
    const tw = this.tween(this.dialAngle, this.dialAngle + delta, rm ? 0.01 : 0.9, (v) => (this.dialAngle = v), 0, easeInOut);
    (tw as any).tag = 'dial';
    this.highlight.rotation.z = rad(sign * 30);
    this.tween(first ? 0 : 0.2, 0.55, rm ? 0.01 : 0.6, (v) => (this.highlightMat.opacity = v * 0.5), 0.25);
    if (this.constelMat && this.constelLineMat) {
      this.constelMat.uniforms.uP.value = 0;
      this.constelLineMat.opacity = 0;
      this.tween(0, 1, rm ? 0.01 : 1.0, (v) => (this.constelMat!.uniforms.uP.value = v), 0.05, (t) => t);
      this.tween(0, 0.42, rm ? 0.01 : 0.5, (v) => (this.constelLineMat!.opacity = v), rm ? 0 : 0.75);
    }
  }

  /** 今日の実際の天体位置に、演出なしで置く */
  setSky(sky: Sky) {
    this.planets.forEach((p) => {
      const b = sky.bodies.find((x) => x.key === p.key);
      if (b) p.angle = p.target = rad(b.lon);
    });
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.applyLayout(true);
  }

  /** 鑑定の演出。終わったら onDone。skip() で即座に終わらせられる */
  playReading(sky: Sky, aspects: { key: string; aspect: Aspect }[], colors: string[], onDone: () => void) {
    this.mode = 'reading';
    const rm = this.opts.reducedMotion;
    const signAngle = rad(this.sign * 30 + 15);
    const dur = rm ? 0.01 : 1;
    // 天体はいったん あなたの星座 に集まってから、実際の黄経へ
    this.planets.forEach((p, i) => {
      const b = sky.bodies.find((x) => x.key === p.key)!;
      let target = rad(b.lon);
      while (target - signAngle > Math.PI) target -= Math.PI * 2;
      while (target - signAngle < -Math.PI) target += Math.PI * 2;
      p.target = target;
      this.tween(p.angle, signAngle, 0.35 * dur, (v) => (p.angle = v), 0, easeInOut);
      this.tween(signAngle, target, 1.15 * dur, (v) => (p.angle = v), (0.35 + i * 0.06) * dur, easeInOut);
    });
    // 角度の線
    aspects.forEach((a, i) => {
      const al = this.aspectLines.find((l) => l.key === a.key);
      if (!al) return;
      const good = a.aspect === 'conj' || a.aspect === 'trine' || a.aspect === 'sext';
      const show = a.aspect !== 'quiet';
      al.mat.color.copy(good ? ROSE : LILAC);
      this.tween(0, show ? (good ? 0.9 : 0.5) : 0, 0.45 * dur, (v) => (al.mat.opacity = v), (1.25 + i * 0.05) * dur);
    });
    if (this.constelMat) this.tween(1, 0.25, 0.5 * dur, (v) => (this.constelMat!.uniforms.uAlpha.value = v), 0);
    // 料理の色の光へ
    this.setDishColors(colors, 1.7 * dur, 0.8 * dur);
    this.applyLayout(true, 'reading');
    this.tween(this.dive, 1, 1.1 * dur, (v) => (this.dive = v), 0, easeInOut);
    const end = this.tween(0, 1, 0.01, () => {}, rm ? 0.05 : 2.5);
    end.done = () => { this.mode = 'result'; this.finishReading(); onDone(); };
  }

  skip() {
    // すべての演出を最終値に
    const ts = this.tweens; this.tweens = [];
    ts.sort((a, b) => a.t0 + a.delay - (b.t0 + b.delay)).forEach((t) => { t.set(t.to); t.done?.(); });
  }

  private finishReading() {
    this.tween(this.dive, 0, 0.9, (v) => (this.dive = v), 0, easeOut);
    this.applyLayout(true, 'result');
  }

  setDishColors(colors: string[], delay = 0, dur = 0.8) {
    const c0 = new THREE.Color(colors[0] || '#E24B91');
    const c1 = new THREE.Color(colors[1] || colors[0] || '#CCB4E5');
    const glassFrom = this.glassMat.attenuationColor.clone();
    const glassTo = c0.clone().lerp(PLAT, 0.35);
    const bgFrom = (this.bgMat.uniforms.uRose.value as THREE.Color).clone();
    const bgTo = c0.clone().lerp(new THREE.Color('#5a1638'), 0.55).multiplyScalar(0.85);
    const lFrom = this.dishLights.map((l) => l.color.clone());
    this.tween(0, 1, dur, (v) => {
      this.glassMat.attenuationColor.copy(glassFrom).lerp(glassTo, v);
      (this.bgMat.uniforms.uRose.value as THREE.Color).copy(bgFrom).lerp(bgTo, v);
      this.dishLights[0].color.copy(lFrom[0]).lerp(c0, v);
      this.dishLights[1].color.copy(lFrom[1]).lerp(c1, v);
      this.dishLights.forEach((l) => (l.intensity = 14 * v));
    }, delay, easeInOut);
  }

  resetForSelect() {
    this.mode = 'select';
    this.aspectLines.forEach((l) => this.tween(l.mat.opacity, 0, 0.4, (v) => (l.mat.opacity = v)));
    if (this.constelMat) this.tween(this.constelMat.uniforms.uAlpha.value, 1, 0.5, (v) => (this.constelMat!.uniforms.uAlpha.value = v));
    const bgFrom = (this.bgMat.uniforms.uRose.value as THREE.Color).clone();
    const glassFrom = this.glassMat.attenuationColor.clone();
    this.tween(0, 1, 0.6, (v) => {
      (this.bgMat.uniforms.uRose.value as THREE.Color).copy(bgFrom).lerp(new THREE.Color('#5a1638'), v);
      this.glassMat.attenuationColor.copy(glassFrom).lerp(new THREE.Color('#e9a9cc'), v);
      this.dishLights.forEach((l) => (l.intensity *= 1 - v));
    });
    this.applyLayout(true, 'select');
  }

  // ---------- レイアウト ----------
  private applyLayout(animate: boolean, mode: Mode = this.mode) {
    const aspect = this.w / this.h;
    const visH = 2 * 12 * Math.tan(rad(this.camera.fov / 2));
    const visW = visH * aspect;
    const wide = aspect > 1.05;
    let x = 0, y = 0, s = 1, dim = 0;
    if (wide) {
      s = Math.min(visH * 0.92 / 6.3, visW * 0.5 / 6.3) ;
      x = mode === 'select' ? -visW * 0.18 : -visW * 0.2;
      y = 0.1;
      if (mode === 'result') { s *= 0.9; dim = 0.35; }
    } else {
      const tablet = aspect > 0.62;
      s = (visW * (tablet ? 0.92 : 1.12)) / 6.3;
      y = tablet ? visH * 0.04 : visH * 0.12;
      if (mode === 'reading') { y = visH * 0.1; s = (visW * (tablet ? 0.86 : 0.98)) / 6.3; }
      if (mode === 'result') { s = (visW * (tablet ? 1.0 : 1.25)) / 6.3; y = visH * (tablet ? 0.22 : 0.27); dim = 0.45; }
    }
    const target = { x, y, s, dim };
    if (!animate || this.opts.reducedMotion) { Object.assign(this.layout, target); return; }
    const from = { ...this.layout };
    this.tween(0, 1, 1.1, (v) => {
      this.layout.x = from.x + (target.x - from.x) * v;
      this.layout.y = from.y + (target.y - from.y) * v;
      this.layout.s = from.s + (target.s - from.s) * v;
      this.layout.dim = from.dim + (target.dim - from.dim) * v;
    }, 0, easeInOut);
  }

  private resize = () => {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.tier === 'high' ? 2 : 1.25);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.bgMat.uniforms.uAspect.value = this.w / this.h;
    this.starMat.uniforms.uPx.value = dpr;
    if (this.constelMat) this.constelMat.uniforms.uPx.value = dpr;
    this.applyLayout(false);
  };

  private onVisibility = () => {
    this.running = !document.hidden;
    if (this.running) { this.clock.getDelta(); this.loop(); }
  };

  setVisible(v: boolean) {
    this.running = v && !document.hidden;
    if (this.running) this.loop();
  }

  // ---------- 時間 ----------
  private tween(from: number, to: number, dur: number, set: (v: number) => void, delay = 0, ease = easeOut): Tween {
    const t: Tween = { from, to, dur: Math.max(dur, 0.001), t0: this.clock.elapsedTime, delay, ease, set };
    this.tweens.push(t);
    if (!this.raf) this.loop();
    return t;
  }

  private loop = () => {
    if (!this.running) { this.raf = 0; return; }
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const busy = this.tweens.length > 0 || this.dragging;
    // 何も動いていない時は 30fps に落として GPU を休ませる
    if (!busy && now - this.lastFrame < 32) return;
    this.lastFrame = now;
    this.clock.getDelta();
    const time = this.clock.elapsedTime;

    const list = this.tweens;
    this.tweens = [];
    const next: Tween[] = [];
    for (const t of list) {
      if (time - t.t0 < t.delay) { next.push(t); continue; }
      const p = clamp01((time - t.t0 - t.delay) / t.dur);
      t.set(t.from + (t.to - t.from) * t.ease(p));
      if (p >= 1) t.done?.(); else next.push(t);
    }
    this.tweens = next.concat(this.tweens); // done() の中で追加されたものも残す
    this.render(time);
  };

  private render(time: number) {
    const rm = this.opts.reducedMotion;
    this.pointerSmooth.lerp(this.pointer, rm ? 0 : 0.05);
    const L = this.layout;
    const a = this.assemble;

    this.rig.position.set(L.x, L.y, 0);
    this.rig.scale.setScalar(L.s * (0.86 + 0.14 * a));
    this.tilt.rotation.x = -0.92 + (1 - a) * 0.6 + this.pointerSmooth.y * 0.05 + this.dive * 0.66;
    this.tilt.rotation.y = this.pointerSmooth.x * 0.08;
    this.dial.rotation.z = this.dialAngle + (1 - a) * 0.9;
    this.bandMat.opacity = 0.94 * a;
    this.bandMat.emissiveIntensity = 0.85 * a;

    // 天体の位置
    this.planets.forEach((p) => {
      const holder = (p.mesh as any).holder as THREE.Group;
      holder.position.set(Math.cos(p.angle) * p.r, Math.sin(p.angle) * p.r, 0.06);
      const al = this.aspectLines.find((l) => l.key === p.key)!;
      const pos = al.line.geometry.attributes.position as THREE.BufferAttribute;
      const sa = rad(this.sign * 30 + 15);
      pos.setXYZ(0, Math.cos(sa) * (BAND_IN + 0.08), Math.sin(sa) * (BAND_IN + 0.08), 0.05);
      pos.setXYZ(1, holder.position.x, holder.position.y, 0.06);
      pos.needsUpdate = true;
    });

    // 星座は盤の上に、カメラに正対して浮かぶ
    this.constel.position.set(0, 0.35, 1.2);
    this.constel.scale.setScalar(1.25);
    this.constel.rotation.set(this.pointerSmooth.y * -0.06, this.pointerSmooth.x * 0.1, 0);

    // カメラ(視差・ダイブ)
    this.camera.position.set(this.pointerSmooth.x * 0.25, this.pointerSmooth.y * 0.2, 12 - this.dive * 0.8);
    this.camera.lookAt(L.x * 0.15, L.y * 0.3, 0);

    this.stars.rotation.z = rm ? 0 : time * 0.004;
    this.starMat.uniforms.uTime.value = rm ? 0 : time;
    this.bgMat.uniforms.uTime.value = rm ? 0 : Math.floor(time * 24) * 0.37;
    this.bgMat.uniforms.uDim.value = L.dim;
    this.starMat.uniforms.uAlpha.value = 1 - L.dim * 0.35;
    this.renderer.render(this.scene, this.camera);
  }

  /** 静止画の書き出し(共有画像用) */
  snapshot(): HTMLCanvasElement {
    this.render(this.clock.elapsedTime);
    return this.canvas;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.running = false;
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.renderer.dispose();
  }
}

export function detectTier(): 'high' | 'low' | 'none' {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'none';
    const mem = (navigator as any).deviceMemory as number | undefined;
    const cores = navigator.hardwareConcurrency || 4;
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if ((mem && mem <= 2) || cores <= 2 || max < 4096) return 'low';
    return 'high';
  } catch {
    return 'none';
  }
}
