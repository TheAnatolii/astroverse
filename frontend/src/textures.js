import * as THREE from 'three';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';
const THREE_BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/';
const MOONS_CDN = 'https://cdn.jsdelivr.net/npm/artastra@1.0.8/textures/';

const CDN_MAP = {
  sun: CDN_BASE + 'sunmap.jpg',
  mercury: CDN_BASE + 'mercurymap.jpg',
  venus: CDN_BASE + 'venusmap.jpg',
  earth: THREE_BASE + 'earth_atmos_2048.jpg',
  moon: THREE_BASE + 'moon_1024.jpg',
  mars: CDN_BASE + 'marsmap1k.jpg',
  jupiter: CDN_BASE + 'jupitermap.jpg',
  saturn: CDN_BASE + 'saturnmap.jpg',
  uranus: CDN_BASE + 'uranusmap.jpg',
  neptune: CDN_BASE + 'neptunemap.jpg',
  pluto: CDN_BASE + 'plutomap1k.jpg',
  io: MOONS_CDN + 'io.jpg',
  europa: MOONS_CDN + 'europa.jpg',
  ganymede: MOONS_CDN + 'ganymede.jpg',
  callisto: MOONS_CDN + 'callisto.jpg',
  titan: CDN_BASE + 'venusmap.jpg',
};

const loader = new THREE.TextureLoader();
loader.setCrossOrigin('anonymous');
const cache = new Map();

function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Генераторы плазмы звёзд и рельефа
const painters = {
  // Голубые гиганты (Ригель, Сириус)
  star_blue: (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#cbe3ff');
    g.addColorStop(1, '#66aaff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  // Жёлтые звёзды (Солнце, Альфа Центавра)
  star_yellow: (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#ffe494');
    g.addColorStop(1, '#ff9922');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  },
  // Оранжевые гиганты (Арктур, Альдебаран)
  star_orange: (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#ffe8aa');
    g.addColorStop(0.4, '#ff9020');
    g.addColorStop(1, '#b83800');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#ff7010';
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, Math.random() * 24, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  // Красные сверхгиганты (Бетельгейзе, Антарес)
  star_red: (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#ff9565');
    g.addColorStop(0.5, '#c92c00');
    g.addColorStop(1, '#520b00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  },
  // Кратерированный астероидный рельеф
  rocky: (ctx, s) => {
    ctx.fillStyle = '#6e6963';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 55; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 3 + Math.random() * 12;
      ctx.fillStyle = '#3d3a36';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#948e86';
      ctx.beginPath();
      ctx.arc(x - 1.5, y - 1.5, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  exoplanet_habitable: (ctx, s) => {
    ctx.fillStyle = '#14467d';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#397843';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 15 + Math.random() * 50, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  exoplanet_lava: (ctx, s) => {
    ctx.fillStyle = '#1a0903';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#ff4d00';
    ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, Math.random() * s);
      ctx.lineTo(Math.random() * s, Math.random() * s);
      ctx.stroke();
    }
  }
};

export function getTexture(name) {
  if (cache.has(name)) return cache.get(name);

  const url = CDN_MAP[name];
  if (url) {
    const tex = loader.load(
      url,
      (t) => { t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; },
      undefined,
      () => {}
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    cache.set(name, tex);
    return tex;
  }

  const painter = painters[name] || painters.rocky;
  const fallback = canvasTexture(256, painter);
  cache.set(name, fallback);
  return fallback;
}

export function makeRingTexture() {
  if (cache.has('saturn_ring')) return cache.get('saturn_ring');
  const tex = loader.load(CDN_BASE + 'saturnringcolor.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('saturn_ring', tex);
  return tex;
}
