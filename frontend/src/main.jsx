import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './styles.css';
import { makeMilkyWay, equatorialXYZ, galacticXYZ, SUN_GALACTIC } from './galaxy.js';
import {
  createBodyMesh, makeOrbit, makeAsteroidBelt, makeKuiperBelt, makeStarField,
  makeLabel, kindLabel, objectScale, getSolarDistance, getSolarSpeed, getMoonOrbitDistance,
} from './bodies.js';

const API = import.meta.env.VITE_API_URL || '/api';

const VIEWS = [
  { id: 'solar', label: 'Солнечная система', icon: '☼' },
  { id: 'local', label: 'Окрестности Солнца', icon: '✦' },
  { id: 'galaxy', label: 'Млечный Путь', icon: '◌' },
];

function App() {
  const mountRef = useRef(null);
  const appRef = useRef({});
  const [objects, setObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState('solar');
  const [follow, setFollow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [panelTab, setPanelTab] = useState('overview');
  const [nasaSyncTime, setNasaSyncTime] = useState(null);

  useEffect(() => {
    // 1. Загружаем каталог тел
    fetch(`${API}/objects`)
      .then((r) => r.json())
      .then((data) => {
        setObjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Fetch Error:", err);
        setErrorDetails("Ошибка API: " + err.message);
        setLoading(false);
      });

    // 2. Запрашиваем живые координаты NASA JPL Horizons
    fetch(`${API}/live-ephemeris`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.positions) {
          appRef.current.livePositions = res.positions;
          setNasaSyncTime(new Date(res.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));

          // Синхронизируем положение планет
          if (appRef.current.meshes) {
            applyNasaLiveCoordinates(res.positions);
          }
        }
      })
      .catch((e) => console.warn("Не удалось подтянуть живые координаты NASA:", e));
  }, []);

  function applyNasaLiveCoordinates(positions) {
    const s = appRef.current;
    if (!s.meshes) return;

    Object.entries(positions).forEach(([planetId, vec]) => {
      const mesh = s.meshes.get(planetId);
      if (mesh) {
        // Вычисляем реальный угол планеты на орбите прямо сейчас
        const realAngle = Math.atan2(vec.z, vec.x);
        mesh.userData.currentAngle = realAngle;
        const r = mesh.userData.calculatedDistance || 15;
        mesh.position.x = Math.cos(realAngle) * r;
        mesh.position.z = Math.sin(realAngle) * r;
      }
    });
  }

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !objects.length) return;

    let raf;
    let renderer;

    try {
      const width = el.clientWidth || window.innerWidth;
      const height = el.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x010206);

      const camera = new THREE.PerspectiveCamera(50, width / height, 0.05, 100000);
      camera.position.set(0, 65, 120);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      if (el.childNodes.length > 0) el.innerHTML = '';
      el.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 0.05;
      controls.maxDistance = 50000;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.7;
      controls.enablePan = true;
      controls.screenSpacePanning = true;

      const ambient = new THREE.AmbientLight(0x0e1322, 0.07);
      scene.add(ambient);

      const sunLight = new THREE.PointLight(0xffffff, 3.2, 0, 0);
      sunLight.position.set(0, 0, 0);
      scene.add(sunLight);

      scene.add(makeStarField(10000, 18000));
      const galaxy = makeMilkyWay();
      scene.add(galaxy.group);

      const system = new THREE.Group();
      scene.add(system);
      const nearby = new THREE.Group();
      scene.add(nearby);
      const galaxyMarkers = new THREE.Group();
      scene.add(galaxyMarkers);

      const belt = makeAsteroidBelt();
      const kuiper = makeKuiperBelt();
      system.add(belt, kuiper);

      const meshes = new Map();
      const orbitLines = [];
      const labels = [];
      const moons = [];
      const blackHolesList = [];

      const solar = objects.filter((o) => objectScale(o) === 'solar');
      const planets = {};

      // 1. Планеты
      solar.filter((o) => o.kind !== 'moon').forEach((obj) => {
        const mesh = createBodyMesh(obj);
        const dist = getSolarDistance(obj);
        mesh.userData.calculatedDistance = dist;
        mesh.userData.calculatedSpeed = getSolarSpeed(obj);
        mesh.userData.currentAngle = Math.random() * Math.PI * 2; // Начальный угол до ответа NASA

        if (dist > 0) {
          mesh.position.set(dist, 0, 0);
        }
        system.add(mesh);
        meshes.set(obj.id, mesh);
        planets[obj.id] = mesh;

        if (['planet', 'dwarf_planet', 'asteroid'].includes(obj.kind) && dist > 0) {
          const orbit = makeOrbit(dist);
          system.add(orbit);
          orbitLines.push(orbit);
        }

        if (obj.kind !== 'star') {
          const label = makeLabel(obj.name);
          label.visible = false;
          scene.add(label);
          labels.push({ label, mesh, type: obj.kind, id: obj.id });
        }
      });

      // Если NASA координаты уже пришли к моменту рендера
      if (appRef.current.livePositions) {
        Object.entries(appRef.current.livePositions).forEach(([planetId, vec]) => {
          const mesh = meshes.get(planetId);
          if (mesh) {
            const realAngle = Math.atan2(vec.z, vec.x);
            mesh.userData.currentAngle = realAngle;
            const r = mesh.userData.calculatedDistance || 15;
            mesh.position.x = Math.cos(realAngle) * r;
            mesh.position.z = Math.sin(realAngle) * r;
          }
        });
      }

      // 2. Спутники
      solar.filter((o) => o.kind === 'moon').forEach((obj, idx) => {
        const parent = planets[obj.parent];
        const mesh = createBodyMesh(obj);
        const parentR = parent?.userData?.radius || 1.0;
        const moonDist = getMoonOrbitDistance(obj, parentR);

        const pivot = new THREE.Group();
        pivot.position.copy(parent ? parent.position : new THREE.Vector3());
        pivot.rotation.y = (idx * 2.399) % (Math.PI * 2);

        mesh.position.set(moonDist, 0, 0);
        pivot.add(mesh);

        const moonOrbit = makeOrbit(moonDist, 0x334466, 0.25);
        pivot.add(moonOrbit);

        system.add(pivot);
        meshes.set(obj.id, mesh);
        moons.push({ pivot, mesh, obj, parentId: obj.parent });
      });

      // 3. Звёзды и экзопланеты
      objects.filter((o) => objectScale(o) === 'local').forEach((obj) => {
        const mesh = createBodyMesh(obj);
        mesh.position.copy(equatorialXYZ(obj));
        nearby.add(mesh);
        meshes.set(obj.id, mesh);
      });

      // 4. Глубокий космос
      objects.filter((o) => objectScale(o) === 'galaxy').forEach((obj) => {
        const mesh = createBodyMesh(obj);
        mesh.position.copy(galacticXYZ(obj));
        galaxyMarkers.add(mesh);
        meshes.set(obj.id, mesh);

        if (mesh.userData?.isBlackHole) {
          blackHolesList.push(mesh.userData);
        }
      });

      // Разделение Drag и Click
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points = { threshold: 1.2 };
      const pointer = new THREE.Vector2();

      let isDragging = false;
      let startX = 0;
      let startY = 0;

      const onPointerDown = (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
      };

      const onPointerMove = (e) => {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 5) {
          isDragging = true;
        }
      };

      const onPointerUp = (event) => {
        if (isDragging) return;

        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const candidates = Array.from(meshes.values()).filter((m) => {
          let vis = m.visible;
          let p = m.parent;
          while (p) { vis = vis && p.visible; p = p.parent; }
          return vis;
        });

        const hit = raycaster.intersectObjects(candidates, true)[0];
        if (hit) {
          let obj = hit.object;
          while (obj && !obj.userData?.id) obj = obj.parent;
          if (obj?.userData?.id) focus(obj.userData);
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      appRef.current = {
        scene, camera, renderer, controls, meshes, orbitLines, galaxy, nearby,
        system, galaxyMarkers, labels, moons, planets, view: 'solar', sunLight, ambient, belt, kuiper,
      };

      applyViewState('solar');

      const clock = new THREE.Clock();
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.1);
        const state = appRef.current;
        const currentSpeed = state.speed ?? 1;

        // Движение планет с текущей позиции NASA
        solar.forEach((obj) => {
          const mesh = meshes.get(obj.id);
          if (!mesh || obj.kind === 'moon') return;
          const dist = mesh.userData.calculatedDistance || obj.distance;
          const orbitSpd = mesh.userData.calculatedSpeed || obj.speed || 0.1;

          if (['planet', 'dwarf_planet', 'asteroid'].includes(obj.kind) && dist > 0) {
            mesh.userData.currentAngle += dt * 0.08 * orbitSpd * currentSpeed;
            mesh.position.x = Math.cos(mesh.userData.currentAngle) * dist;
            mesh.position.z = Math.sin(mesh.userData.currentAngle) * dist * 0.995;
          }
          mesh.rotation.y += dt * (obj.id === 'sun' ? 0.05 : 0.14);
        });

        // Спутники
        moons.forEach(({ pivot, mesh, obj, parentId }) => {
          const parent = meshes.get(parentId);
          if (parent) pivot.position.copy(parent.position);
          const period = obj.period_days || 27.3;
          const speedRatio = Math.max(0.2, Math.min(5.0, 27.3 / period));
          pivot.rotation.y += dt * speedRatio * 0.12 * currentSpeed;
          mesh.rotation.y += dt * 0.1;
        });

        // Чёрные дыры
        blackHolesList.forEach(({ disk, lensHalo, photonRing }) => {
          if (disk) disk.rotation.z += dt * 0.45 * currentSpeed;
          if (lensHalo) lensHalo.rotation.z -= dt * 0.25 * currentSpeed;
          if (photonRing) photonRing.quaternion.copy(camera.quaternion);
        });

        // Метки
        labels.forEach(({ label, mesh, type, id }) => {
          const world = new THREE.Vector3();
          mesh.getWorldPosition(world);
          label.position.copy(world).add(new THREE.Vector3(0, (mesh.userData.radius || 1) + 1.2, 0));
          label.quaternion.copy(camera.quaternion);
          const isCurrentSelected = state.followObject && state.followObject.id === id;
          label.visible = state.view === 'solar' && ['planet', 'dwarf_planet'].includes(type) && !isCurrentSelected;
        });

        galaxy.group.rotation.y += dt * 0.004 * currentSpeed;

        // Дельта-слежение
        if (state.followObject && meshes.has(state.followObject.id)) {
          const m = meshes.get(state.followObject.id);
          const currentPos = new THREE.Vector3();
          m.getWorldPosition(currentPos);

          if (state.followCamera) {
            if (!state.lastFollowPos) {
              state.lastFollowPos = currentPos.clone();
            }
            const delta = currentPos.clone().sub(state.lastFollowPos);
            camera.position.add(delta);
            controls.target.add(delta);
            state.lastFollowPos.copy(currentPos);
          } else {
            state.lastFollowPos = null;
          }
        } else {
          state.lastFollowPos = null;
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const resize = () => {
        const w = el.clientWidth || window.innerWidth;
        const h = el.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', resize);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        if (renderer?.domElement) {
          renderer.domElement.removeEventListener('pointerdown', onPointerDown);
          renderer.domElement.removeEventListener('pointermove', onPointerMove);
          renderer.domElement.removeEventListener('pointerup', onPointerUp);
          if (el.contains(renderer.domElement)) {
            el.removeChild(renderer.domElement);
          }
        }
        renderer?.dispose();
      };
    } catch (err) {
      console.error("Three.js Init Error:", err);
      setErrorDetails(err.name + ": " + err.message + "\n\nСтек:\n" + err.stack);
    }
  }, [objects.length]);

  function applyViewState(nextView) {
    appRef.current.view = nextView;
    const s = appRef.current;
    if (!s.scene) return;
    s.system.visible = nextView === 'solar';
    s.nearby.visible = nextView === 'local';
    s.galaxy.group.visible = nextView === 'galaxy';
    s.galaxyMarkers.visible = nextView === 'galaxy';
    if (s.sunLight) {
      s.sunLight.visible = nextView === 'solar';
      s.ambient.intensity = nextView === 'solar' ? 0.07 : nextView === 'local' ? 0.5 : 0.7;
    }
    goHome(nextView);
  }

  useEffect(() => {
    applyViewState(view);
  }, [view]);

  useEffect(() => {
    appRef.current.speed = speed;
    appRef.current.followCamera = follow;
  }, [speed, follow]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return objects.filter((o) => {
      if (!q) return true;
      const blob = [o.name, o.latin, o.description, o.constellation, o.spectral_type, ...(o.facts || [])].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [objects, query]);

  const focus = (obj) => {
    const next = objectScale(obj);
    if (next !== view) setView(next);
    setSelected(obj);
    setFollow(true);
    setPanelTab('overview');

    const s = appRef.current;
    const mesh = s.meshes?.get(obj.id);
    if (!mesh) return;
    s.followObject = obj;
    s.followCamera = true;

    const p = new THREE.Vector3();
    mesh.getWorldPosition(p);
    s.lastFollowPos = p.clone();

    const isBig = obj.kind === 'cluster' || obj.kind === 'nebula' || obj.kind === 'galaxy' || obj.kind === 'black_hole';
    const r = Math.max(mesh.userData.radius || 1, 0.1);
    const zoomDist = isBig ? (r * 4.2) : (r * 2.8);

    s.controls.target.copy(p);
    s.camera.position.copy(p.clone().add(new THREE.Vector3(zoomDist, zoomDist * 0.4, zoomDist * 1.15)));
    s.controls.update();
  };

  function goHome(nextView) {
    const s = appRef.current;
    if (!s.camera) return;
    s.followObject = null;
    s.followCamera = false;
    s.lastFollowPos = null;
    setFollow(false);

    if (nextView === 'solar') {
      s.camera.position.set(0, 65, 120);
      s.controls.target.set(0, 0, 15);
    } else if (nextView === 'local') {
      s.camera.position.set(12, 14, 28);
      s.controls.target.set(0, 0, 0);
    } else {
      s.camera.position.set(SUN_GALACTIC.x + 40, 95, SUN_GALACTIC.z + 160);
      s.controls.target.set(20, 0, 0);
    }
  }

  const displayObjects = filtered.filter((o) => objectScale(o) === view);

  return (
    <div className="app">
      {errorDetails && (
        <div style={{
          position: 'fixed', top: '90px', left: '340px', right: '20px', zIndex: 99999,
          background: 'rgba(180, 20, 20, 0.9)', border: '2px solid #ff6666', borderRadius: '12px',
          padding: '20px', color: '#fff', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>❌ Ошибка:</h3>
          {errorDetails}
        </div>
      )}

      <header className="topbar">
        <div className="brand"><div className="logo">✦</div><div><b>ASTROVERSE</b><small>LOCAL UNIVERSE EXPLORER</small></div></div>
        <div className="topmeta">
          <span className="liveDot" />
          {nasaSyncTime ? `NASA JPL: ${nasaSyncTime}` : `СИНХРОНИЗАЦИЯ С NASA...`}
          <span className="sep">/</span> {objects.length} ТЕЛ
        </div>
      </header>

      <aside className="sidebar glass">
        <div className="searchBox"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти звезду, планету, туманность…" /></div>
        <div className="viewTitle">РЕЖИМ ПОЛЁТА</div>
        <div className="viewButtons">
          {VIEWS.map((v) => (
            <button key={v.id} className={view === v.id ? 'viewBtn active' : 'viewBtn'} onClick={() => setView(v.id)}>
              <span>{v.icon}</span>{v.label}
            </button>
          ))}
        </div>
        <div className="listHeader">
          <span>{view === 'galaxy' ? 'ОБЪЕКТЫ ГАЛАКТИКИ' : view === 'local' ? 'ЗВЁЗДЫ И ЭКЗОПЛАНЕТЫ' : 'СОЛНЕЧНАЯ СИСТЕМА'}</span>
          <b>{displayObjects.length}</b>
        </div>
        <div className="list">
          {loading && <div className="muted">Загрузка каталога…</div>}
          {displayObjects.map((o) => (
            <button key={o.id} className={selected?.id === o.id ? 'objectRow on' : 'objectRow'} onClick={() => focus(o)}>
              <span className="dot" style={{ background: o.color || '#9fb4ff' }} />
              <span className="objectName">{o.name}</span>
              <em>{kindLabel(o.kind)}</em>
            </button>
          ))}
          {!loading && !displayObjects.length && <div className="muted">Ничего не найдено</div>}
        </div>
        <div className="controlBlock">
          <div className="controlLabel"><span>Скорость времени</span><b>{speed.toFixed(1)}×</b></div>
          <input type="range" min="0" max="8" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
          <label className="followToggle">
            <input
              type="checkbox"
              checked={follow}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setFollow(isChecked);
                appRef.current.followCamera = isChecked;
                if (!isChecked) {
                  appRef.current.followObject = null;
                  appRef.current.lastFollowPos = null;
                }
              }}
            />
            <span>Следить за объектом</span>
          </label>
        </div>
      </aside>

      <main ref={mountRef} className="viewport" />

      <div className="scaleBadge glass">
        <span className="scaleIcon">◎</span>
        <div>
          <small>ПОЛОЖЕНИЕ ПЛАНЕТ</small>
          <b>Живые эфемериды NASA JPL</b>
        </div>
      </div>

      {view === 'galaxy' && (
        <div className="galaxyLegend glass">
          <b>МЛЕЧНЫЙ ПУТЬ</b>
          <span>Перемычка и балдж</span>
          <span>4 рукава + Orion Spur</span>
          <span>Солнце: голубая точка</span>
        </div>
      )}

      {/* МНОГОУРОВНЕВАЯ ЭНЦИКЛОПЕДИЧЕСКАЯ ПАНЕЛЬ */}
      {selected && (
        <section className="infoPanel glass">
          <button className="close" onClick={() => {
            setSelected(null);
            setFollow(false);
            appRef.current.followObject = null;
            appRef.current.followCamera = false;
            appRef.current.lastFollowPos = null;
          }}>×</button>

          <div className="panelHeader">
            <div className="eyebrow">{kindLabel(selected.kind).toUpperCase()}</div>
            <h1>{selected.name}</h1>
            {selected.latin && selected.latin !== selected.name && <div className="latin">{selected.latin}</div>}
          </div>

          <div className="panelTabs">
            <button className={panelTab === 'overview' ? 'tabBtn on' : 'tabBtn'} onClick={() => setPanelTab('overview')}>Обзор</button>
            <button className={panelTab === 'telemetry' ? 'tabBtn on' : 'tabBtn'} onClick={() => setPanelTab('telemetry')}>Телеметрия</button>
            {selected.missions && <button className={panelTab === 'missions' ? 'tabBtn on' : 'tabBtn'} onClick={() => setPanelTab('missions')}>Миссии</button>}
            <button className={panelTab === 'facts' ? 'tabBtn on' : 'tabBtn'} onClick={() => setPanelTab('facts')}>Факты</button>
          </div>

          <div className="panelBody">
            {panelTab === 'overview' && (
              <div className="tabContent">
                <p className="mainDesc">{selected.description}</p>
                {selected.structure && (
                  <div className="subBlock">
                    <h4>Строение и физика</h4>
                    <p>{selected.structure}</p>
                  </div>
                )}
                {selected.composition && (
                  <div className="subBlock">
                    <h4>Химический состав</h4>
                    <p className="compTag">{selected.composition}</p>
                  </div>
                )}
              </div>
            )}

            {panelTab === 'telemetry' && (
              <div className="tabContent">
                <div className="stats">
                  {selected.gravity && <div><small>Гравитация</small><b>{selected.gravity}</b></div>}
                  {selected.escape_velocity && <div><small>2-я космическая</small><b>{selected.escape_velocity}</b></div>}
                  {selected.spectral_type && <div><small>Спектральный класс</small><b>{selected.spectral_type}</b></div>}
                  {selected.temperature_k != null && <div><small>Температура</small><b>{formatNum(selected.temperature_k)} K</b></div>}
                  {selected.au != null && <div><small>Большая полуось</small><b>{selected.au} а.е.</b></div>}
                  {selected.period_days != null && <div><small>Период обращения</small><b>{formatPeriod(selected.period_days)}</b></div>}
                  {selected.radius_km != null && <div><small>Радиус</small><b>{formatNum(selected.radius_km)} км</b></div>}
                  {selected.radius_earth != null && <div><small>Радиус</small><b>{selected.radius_earth} R⊕</b></div>}
                  {selected.mass_earth != null && <div><small>Масса</small><b>{selected.mass_earth} M⊕</b></div>}
                  {selected.mass_sun != null && <div><small>Масса</small><b>{formatNum(selected.mass_sun)} M☉</b></div>}
                  {selected.distance_ly != null && selected.distance_ly > 0 && <div><small>Расстояние от Солнца</small><b>{formatLy(selected.distance_ly)}</b></div>}
                  {selected.apparent_magnitude != null && <div><small>Видимый блеск</small><b>{selected.apparent_magnitude} m</b></div>}
                  {selected.schwarzschild_radius_km && <div><small>Радиус горизонта</small><b>{formatNum(selected.schwarzschild_radius_km)} км</b></div>}
                </div>
              </div>
            )}

            {panelTab === 'missions' && selected.missions && (
              <div className="tabContent">
                <div className="missionList">
                  {selected.missions.map((m, idx) => (
                    <div key={idx} className="missionCard">
                      <b>{m.name || m}</b>
                      {m.desc && <p>{m.desc}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {panelTab === 'facts' && (
              <div className="tabContent">
                <ul className="factsList">
                  {(selected.facts || []).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>

          {selected.source && <div className="source">База данных: {selected.source}</div>}
        </section>
      )}

      <div className="hint glass">ЛКМ — выбор · колесо — масштаб · перетаскивание — свободный осмотр</div>
    </div>
  );
}

function formatLy(ly) {
  if (ly >= 1e6) return `${(ly / 1e6).toFixed(2)} млн св. лет`;
  if (ly >= 1000) return `${(ly / 1000).toFixed(ly >= 10000 ? 0 : 1)} тыс. св. лет`;
  return `${ly} св. лет`;
}

function formatNum(n) {
  if (n >= 1e6) return n.toExponential(2);
  return new Intl.NumberFormat('ru-RU').format(n);
}

function formatPeriod(days) {
  if (days >= 365) return `${(days / 365.25).toFixed(1)} лет`;
  if (days >= 2) return `${days.toFixed(1)} сут`;
  return `${(days * 24).toFixed(1)} ч`;
}

createRoot(document.getElementById('root')).render(<App />);
