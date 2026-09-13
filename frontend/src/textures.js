import * as THREE from 'three';

// Высоконадежные 2K карты планет и спутников
const CDN_MAP = {
  sun: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/sunmap.jpg',
  mercury: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/mercurymap.jpg',
  venus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/venusmap.jpg',
  earth: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg',
  moon: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg',
  mars: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg',
  jupiter: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/jupitermap.jpg',
  saturn: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnmap.jpg',
  uranus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/uranusmap.jpg',
  neptune: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/neptunemap.jpg',
  pluto: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/plutomap1k.jpg',
  io: 'https://cdn.jsdelivr.net/npm/artastra@1.0.8/textures/io.jpg',
  europa: 'https://cdn.jsdelivr.net/npm/artastra@1.0.8/textures/europa.jpg',
  ganymede: 'https://cdn.jsdelivr.net/npm/artastra@1.0.8/textures/ganymede.jpg',
  callisto: 'https://cdn.jsdelivr.net/npm/artastra@1.0.8/textures/callisto.jpg',
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

// Запасные текстуры с мягким градиентом шума
const fallbackPainters = {
  star_plasma: (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#ffcc44');
    g.addColorStop(1, '#ff6600');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  },
  exoplanet_habitable: (ctx, s) => {
    ctx.fillStyle = '#10396b';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#2d6a3e';
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 10 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  exoplanet_lava: (ctx, s) => {
    ctx.fillStyle = '#1c0c06';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, Math.random() * s);
      ctx.lineTo(Math.random() * s, Math.random() * s);
      ctx.stroke();
    }
  },
  // Реалистичный шум для скалистых лун вместо кружочков
  rocky: (ctx, s) => {
    const img = ctx.createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = 95 + Math.floor(Math.random() * 55);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v + 4;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
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
      () => console.warn(`Fallback для ${name}`)
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    cache.set(name, tex);
    return tex;
  }

  const painter = fallbackPainters[name] || fallbackPainters.rocky;
  const fallback = canvasTexture(256, painter);
  cache.set(name, fallback);
  return fallback;
}

export function makeRingTexture() {
  if (cache.has('saturn_ring')) return cache.get('saturn_ring');
  const tex = loader.load('https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnringcolor.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('saturn_ring', tex);
  return tex;
}
