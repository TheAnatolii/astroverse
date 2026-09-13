import * as THREE from 'three';
import { getTexture, makeRingTexture } from './textures.js';

export function kindLabel(kind) {
  return {
    star: 'звезда',
    planet: 'планета',
    dwarf_planet: 'карликовая планета',
    moon: 'спутник',
    exoplanet: 'экзопланета',
    nebula: 'туманность',
    cluster: 'звёздное скопление',
    black_hole: 'чёрная дыра',
    galaxy: 'галактика',
    asteroid: 'астероид',
    comet: 'комета',
  }[kind] || kind;
}

export function objectScale(obj) {
  if (obj.scale) return obj.scale;
  if (['planet', 'dwarf_planet', 'moon', 'asteroid', 'comet'].includes(obj.kind)) return 'solar';
  if (obj.kind === 'star' && obj.id === 'sun') return 'solar';
  if (['star', 'exoplanet'].includes(obj.kind)) return 'local';
  return 'galaxy';
}

export function getSolarDistance(obj) {
  if (obj.id === 'sun') return 0;
  if (obj.au != null) {
    return 14.0 * Math.pow(obj.au, 0.72);
  }
  return obj.distance || 12;
}

export function getSolarSpeed(obj) {
  if (obj.au != null) {
    return 1.0 / Math.sqrt(obj.au);
  }
  return obj.speed || 0.1;
}

export function getMoonOrbitDistance(obj, parentRadius = 1.0) {
  if (obj.id === 'moon') return parentRadius * 3.4;
  if (obj.id === 'phobos') return parentRadius * 1.5;
  if (obj.id === 'deimos') return parentRadius * 2.3;
  if (obj.moon_distance) return parentRadius * (1.6 + obj.moon_distance * 0.45);
  return parentRadius * 2.8;
}

const starPointTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.25, 'rgba(255, 240, 200, 0.8)');
  g.addColorStop(0.6, 'rgba(255, 200, 150, 0.2)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
})();

// Корона с оптическими дифракционными лучами (Diffraction Spikes)
export function makeStarCorona(colorHex, scale = 4.5) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const cx = 128;
  const cy = 128;

  // Дифракционные 4 луча
  const ray = ctx.createLinearGradient(0, cy, 256, cy);
  ray.addColorStop(0, 'rgba(255,255,255,0)');
  ray.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  ray.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = ray;
  ctx.fillRect(0, cy - 2, 256, 4);

  const rayV = ctx.createLinearGradient(cx, 0, cx, 256);
  rayV.addColorStop(0, 'rgba(255,255,255,0)');
  rayV.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  rayV.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rayV;
  ctx.fillRect(cx - 2, 0, 4, 256);

  // Мягкий ореол
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.2, colorHex);
  g.addColorStop(0.6, colorHex);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  return sprite;
}

function makeNebulaCloudSprite(colorHex, scale = 5.0) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const baseCol = new THREE.Color(colorHex);
  const r = Math.round(baseCol.r * 255);
  const g = Math.round(baseCol.g * 255);
  const b = Math.round(baseCol.b * 255);

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.35)`);
  grad.addColorStop(0.7, `rgba(${Math.round(r * 0.8)}, ${Math.round(g * 0.7)}, ${b}, 0.12)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  return sprite;
}

function makeSpiralGalaxyTexture(colorHex = '#99ccff') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const bulge = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.22);
  bulge.addColorStop(0, 'rgba(255, 250, 230, 1.0)');
  bulge.addColorStop(0.25, 'rgba(255, 220, 160, 0.75)');
  bulge.addColorStop(0.6, 'rgba(255, 180, 120, 0.25)');
  bulge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bulge;
  ctx.fillRect(0, 0, size, size);

  const baseCol = new THREE.Color(colorHex);
  const armCol = `${Math.round(baseCol.r * 255)}, ${Math.round(baseCol.g * 255)}, ${Math.round(baseCol.b * 255)}`;

  for (let arm = 0; arm < 2; arm++) {
    const offset = arm * Math.PI;
    for (let t = 0; t < 220; t++) {
      const theta = offset + (t / 220) * Math.PI * 2.7;
      const r = 20 + Math.pow(t / 220, 1.35) * (size * 0.42);
      const x = cx + Math.cos(theta) * r + (Math.random() - 0.5) * 14;
      const y = cy + Math.sin(theta) * r + (Math.random() - 0.5) * 14;
      const alpha = (1 - (t / 220) * 0.65) * 0.35;

      ctx.fillStyle = `rgba(${armCol}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 5 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() < 0.2) {
        ctx.fillStyle = `rgba(180, 220, 255, ${alpha * 1.6})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const halo = ctx.createRadialGradient(cx, cy, size * 0.15, cx, cy, size * 0.48);
  halo.addColorStop(0, `rgba(${armCol}, 0.18)`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Аккреционный диск с релятивистским смещением Доплера (Interstellar)
function makeAccretionDiskTexture(innerRatio = 0.32) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const rIn = cx * innerRatio;
  const rOut = cx * 0.98;

  const g = ctx.createRadialGradient(cx, cy, rIn * 0.85, cx, cy, rOut);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(innerRatio * 0.92, 'rgba(0,0,0,0)');
  g.addColorStop(innerRatio, 'rgba(255, 255, 255, 1)'); // Ослепительная граница ISCO
  g.addColorStop(innerRatio + 0.08, 'rgba(255, 240, 190, 0.95)');
  g.addColorStop(innerRatio + 0.22, 'rgba(255, 160, 45, 0.85)');
  g.addColorStop(innerRatio + 0.45, 'rgba(215, 65, 15, 0.55)');
  g.addColorStop(0.88, 'rgba(130, 20, 5, 0.2)');
  g.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Релятивистское усиление Доплера (левая сторона слепит яркостью, правая — в тени)
  const beam = ctx.createLinearGradient(0, cy, size, cy);
  beam.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
  beam.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
  beam.addColorStop(1.0, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = beam;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    for (let r = rIn; r < rOut; r += 4) {
      const theta = angle + Math.log(r / rIn) * 3.5;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      if (r === rIn) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255, ${150 + (i % 5) * 20}, 50, 0.12)`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePhotonRingTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const g = ctx.createRadialGradient(cx, cy, cx * 0.72, cx, cy, cx * 0.98);
  g.addColorStop(0, 'rgba(255, 255, 255, 0)');
  g.addColorStop(0.5, 'rgba(255, 250, 230, 0.95)');
  g.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBodyMesh(obj) {
  const radius = obj.id === 'phobos' ? 0.038 : obj.id === 'deimos' ? 0.026 : (obj.radius || 0.4);
  const isStar = obj.kind === 'star';
  const isBlackHole = obj.kind === 'black_hole';
  const isCluster = obj.kind === 'cluster';
  const isNebula = obj.kind === 'nebula';
  const isGalaxy = obj.kind === 'galaxy';

  // 1. ЧЁРНЫЕ ДЫРЫ С ПОЛЯРНЫМИ ДЖЕТАМИ И ЛИНЗОЙ
  if (isBlackHole) {
    const group = new THREE.Group();
    const horizon = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 36),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    group.add(horizon);

    const photonRing = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.01, radius * 1.15, 96),
      new THREE.MeshBasicMaterial({
        map: makePhotonRingTexture(),
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(photonRing);

    const disk = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.15, radius * 4.4, 96, 16),
      new THREE.MeshBasicMaterial({
        map: makeAccretionDiskTexture(0.32),
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    disk.rotation.x = Math.PI / 2.2;
    disk.rotation.y = 0.15;
    group.add(disk);

    const lensHalo = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.15, radius * 3.4, 96, 16),
      new THREE.MeshBasicMaterial({
        map: makeAccretionDiskTexture(0.42),
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    lensHalo.rotation.y = Math.PI / 2.3;
    group.add(lensHalo);

    // Полярные релятивистские джеты (для M87* и Лебедя X-1)
    if (obj.has_jet) {
      const jetGeo = new THREE.ConeGeometry(radius * 0.35, radius * 9.0, 32, 1, true);
      const jetMat = new THREE.MeshBasicMaterial({
        color: 0x55ccff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const jetNorth = new THREE.Mesh(jetGeo, jetMat);
      jetNorth.position.y = radius * 4.5;
      const jetSouth = new THREE.Mesh(jetGeo, jetMat);
      jetSouth.position.y = -radius * 4.5;
      jetSouth.rotation.z = Math.PI;
      group.add(jetNorth, jetSouth);
    }

    group.add(makeStarCorona(obj.color || '#ff8833', radius * 4.8));
    group.userData = { ...obj, isBlackHole: true, disk, lensHalo, photonRing };
    return group;
  }

  // 2. ТУМАННОСТИ
  if (isNebula) {
    const group = new THREE.Group();
    if (obj.id === 'm57') {
      const outer = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.7, radius * 1.6, 64),
        new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
      );
      const inner = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.08, radius * 0.85, 64),
        new THREE.MeshBasicMaterial({ color: 0x00e5a3, side: THREE.DoubleSide, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
      );
      const wd = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.04, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      group.add(outer, inner, wd);
      group.rotation.x = Math.PI / 2.8;
      group.userData = obj;
      return group;
    }

    if (obj.id === 'm42') {
      const trapGeo = new THREE.BufferGeometry();
      trapGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0, radius*0.08,radius*0.05,0, -radius*0.06,radius*0.09,0, radius*0.03,-radius*0.07,0]), 3));
      group.add(new THREE.Points(trapGeo, new THREE.PointsMaterial({ size: 1.8, color: 0xe0f0ff, map: starPointTexture, transparent: true, blending: THREE.AdditiveBlending })));

      const colors = ['#ff2b88', '#8a2be2', '#00bfff'];
      for (let i = 0; i < 4; i++) {
        const sprite = makeNebulaCloudSprite(colors[i % colors.length], radius * (2.8 + i * 0.8));
        sprite.position.set((i % 2 === 0 ? 1 : -1) * radius * 0.6, Math.sin(i) * radius * 0.4, 0);
        group.add(sprite);
      }
      group.userData = obj;
      return group;
    }

    if (obj.id === 'm1') {
      group.add(makeNebulaCloudSprite('#0088ff', radius * 2.2));
      group.add(makeNebulaCloudSprite('#ff4500', radius * 3.2));
      const pulsar = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      group.add(pulsar);
      group.userData = obj;
      return group;
    }

    for (let i = 0; i < 3; i++) {
      const sprite = makeNebulaCloudSprite(obj.color || '#ff8cb0', radius * (2.6 + i * 0.7));
      sprite.position.set((Math.random() - 0.5) * radius * 0.4, (Math.random() - 0.5) * radius * 0.3, 0);
      group.add(sprite);
    }
    group.userData = obj;
    return group;
  }

  // 3. ЗВЁЗДНЫЕ СКОПЛЕНИЯ
  if (isCluster) {
    const group = new THREE.Group();
    if (obj.id === 'm45' || obj.id === 'pleiades') {
      const stars = [[0.15,0.05,0], [-0.35,0.25,0.1], [-0.65,-0.2,-0.1], [-0.12,0.45,0], [-0.25,-0.42,0.1], [-0.52,0.32,-0.1], [0.35,0.12,0]];
      const starPos = new Float32Array(stars.length * 3);
      stars.forEach((s, idx) => {
        const x = s[0] * radius * 1.5; const y = s[1] * radius * 1.5; const z = s[2] * radius * 1.5;
        starPos[idx * 3] = x; starPos[idx * 3 + 1] = y; starPos[idx * 3 + 2] = z;
        const haze = makeNebulaCloudSprite('#3388ff', radius * 1.2);
        haze.position.set(x, y, z);
        group.add(haze);
      });
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.8, color: 0xeef8ff, map: starPointTexture, transparent: true, blending: THREE.AdditiveBlending })));
      group.userData = obj;
      return group;
    }

    const count = 280;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseCol = new THREE.Color(obj.color || '#ffe0a8');

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const r = radius * (Math.pow(u, 2.8) * 1.1 + 0.06);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);

      const isBlue = Math.random() < 0.08;
      const starCol = isBlue
        ? new THREE.Color('#99bbff')
        : baseCol.clone().offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.2);

      col[i * 3] = starCol.r;
      col[i * 3 + 1] = starCol.g;
      col[i * 3 + 2] = starCol.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.9,
      map: starPointTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })));

    group.add(makeNebulaCloudSprite(obj.color || '#ffe0a8', radius * 1.2));
    group.userData = obj;
    return group;
  }

  // 4. ГАЛАКТИКИ
  if (isGalaxy) {
    const group = new THREE.Group();
    if (obj.id === 'm104') {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.75, 32, 24),
        new THREE.MeshBasicMaterial({ color: 0xffeedd, transparent: true, opacity: 0.9 })
      );
      const ringTop = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.8, radius * 2.6, 64),
        new THREE.MeshBasicMaterial({ color: 0xeeddcc, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      const darkLane = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.82, radius * 1.05, 64),
        new THREE.MeshBasicMaterial({ color: 0x110e0a, side: THREE.DoubleSide })
      );
      ringTop.rotation.x = Math.PI / 2.05;
      darkLane.rotation.x = Math.PI / 2.05;
      group.add(core, ringTop, darkLane);
      group.userData = obj;
      return group;
    }

    const galaxyTex = makeSpiralGalaxyTexture(obj.color || '#99ccff');
    const disk = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 5.5, radius * 5.5),
      new THREE.MeshBasicMaterial({
        map: galaxyTex,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    disk.rotation.x = Math.PI / 2.6;
    group.add(disk);
    group.userData = obj;
    return group;
  }

  // 5. ЗВЁЗДЫ И ПЛАНЕТЫ
  let texName = obj.texture;
  if (isStar) {
    const t = obj.temperature_k || 5500;
    texName = t > 8500 ? 'star_blue' : t > 7000 ? 'star_white' : t > 5200 ? 'star_yellow' : t > 3700 ? 'star_orange' : 'star_red';
  } else if (!texName) {
    if (obj.kind === 'exoplanet') {
      const t = obj.temperature_k || 300;
      texName = t > 500 ? 'exoplanet_lava' : 'exoplanet_habitable';
    } else {
      texName = 'rocky';
    }
  }

  const map = getTexture(texName);

  const material = isStar
    ? new THREE.MeshBasicMaterial({ color: 0xffffff, map })
    : new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      roughness: ['jupiter', 'saturn', 'uranus', 'neptune'].includes(obj.texture) ? 0.5 : 0.8,
      metalness: 0.05,
    });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 28), material);
  mesh.userData = obj;
  if (obj.tilt) mesh.rotation.z = (obj.tilt * Math.PI) / 180;

  if (isStar) {
    mesh.add(makeStarCorona(obj.color || '#ffb74d', radius * 3.6));
  }

  if (obj.id === 'earth') {
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.015, 36, 24),
      new THREE.MeshStandardMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.2, roughness: 1.0 })
    );
    mesh.add(atm);
  }

  if (obj.rings) {
    const inner = radius * (obj.rings.inner || 1.35);
    const outer = radius * (obj.rings.outer || 2.35);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 96, 4),
      new THREE.MeshStandardMaterial({
        map: makeRingTexture(),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        roughness: 0.6,
      })
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  return mesh;
}

export function makeOrbit(r, color = 0x242d42, opacity = 0.4) {
  const curve = new THREE.EllipseCurve(0, 0, r, r * 0.995, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(256).map((p) => new THREE.Vector3(p.x, 0, p.y));
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

export function makeAsteroidBelt() {
  const group = new THREE.Group();
  const n = 1800;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 24.5 + Math.random() * 8.5;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  group.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x8b8174,
    size: 0.09,
    map: starPointTexture,
    transparent: true,
    sizeAttenuation: true
  })));
  return group;
}

export function makeKuiperBelt() {
  const group = new THREE.Group();
  const n = 2400;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 168 + Math.random() * 70;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  group.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x6a7a99,
    size: 0.08,
    map: starPointTexture,
    transparent: true,
    opacity: 0.6
  })));
  return group;
}

export function makeStarField(count, radius) {
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.35 + Math.random() * 0.65);
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * radius * 0.3;
    arr[i * 3] = Math.cos(a) * r;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = Math.sin(a) * r;
    const t = Math.random();
    if (t > 0.8) { col[i * 3] = 0.75; col[i * 3 + 1] = 0.88; col[i * 3 + 2] = 1; }
    else if (t < 0.15) { col[i * 3] = 1; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 0.6; }
    else { col[i * 3] = 0.95; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 1; }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.4,
    map: starPointTexture,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
  }));
}

export function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(6, 10, 22, 0.75)';
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(10, 16, 364, 64, 16);
  } else {
    ctx.rect(10, 16, 364, 64);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#eef3ff';
  ctx.font = '600 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(3.0, 0.75, 1);
  return sprite;
}
