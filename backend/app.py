from pathlib import Path
import json
import re
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "objects.json"

with DATA_PATH.open("r", encoding="utf-8") as f:
    CATALOG = json.load(f)

app = FastAPI(title="Astroverse API", version="0.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Коды тел в базе NASA JPL Horizons (199 = Меркурий, 299 = Венера ... 999 = Плутон)
JPL_COMMANDS = {
    "mercury": "199",
    "venus": "299",
    "earth": "399",
    "mars": "499",
    "jupiter": "599",
    "saturn": "699",
    "uranus": "799",
    "neptune": "899",
    "pluto": "999",
}

EPHEMERIS_CACHE = {
    "timestamp": None,
    "data": {}
}

def fetch_jpl_vector(cmd: str):
    """Запрашивает у NASA JPL вектор (X, Y, Z) в а.е. относительно центра Солнца (@10)"""
    base_url = "https://ssd-api.jpl.nasa.gov/horizons.api"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    params = {
        "format": "json",
        "COMMAND": f"'{cmd}'",
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": "'@10'",  # Солнце-центрическая система
        "START_TIME": f"'{now_str}'",
        "STOP_TIME": f"'{now_str} 00:01'",
        "STEP_SIZE": "'1d'",
        "CSV_FORMAT": "YES"
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Astroverse/1.0'})

    with urllib.request.urlopen(req, timeout=10) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        text = res.get("result", "")
        # Извлекаем X, Y, Z между маркерами $$SOE и $$EOE
        match = re.search(r"\$\$SOE.*?\n(.*?),.*?\n\$\$EOE", text, re.DOTALL)
        if match:
            line = match.group(1).split(",")
            if len(line) >= 5:
                # line[2]=X, line[3]=Y, line[4]=Z (в астрономических единицах)
                return {
                    "x": float(line[2].strip()),
                    "y": float(line[4].strip()),  # В Three.js вертикальная ось — Y (в JPL это Z)
                    "z": float(line[3].strip()),
                }
    return None

@app.get("/api/health")
def health():
    return {"status": "ok", "objects": len(CATALOG)}

@app.get("/api/objects")
def objects(q: str | None = None, kind: str | None = None):
    items = CATALOG
    if q:
        ql = q.lower()
        items = [x for x in items if ql in f"{x.get('name','')} {x.get('latin','')} {x.get('description','')}".lower()]
    if kind:
        items = [x for x in items if x["kind"] == kind]
    return items

@app.get("/api/live-ephemeris")
def live_ephemeris():
    """Возвращает реальные текущие координаты планет в пространстве напрямую из NASA"""
    now = datetime.now(timezone.utc)

    # Кэшируем на 1 час, чтобы не перегружать NASA и приложение летало
    if EPHEMERIS_CACHE["timestamp"] and (now - EPHEMERIS_CACHE["timestamp"]).total_seconds() < 3600:
        return {"timestamp": EPHEMERIS_CACHE["timestamp"].isoformat(), "positions": EPHEMERIS_CACHE["data"], "source": "NASA JPL Horizons (cached)"}

    positions = {}
    for planet_id, cmd in JPL_COMMANDS.items():
        try:
            vec = fetch_jpl_vector(cmd)
            if vec:
                positions[planet_id] = vec
        except Exception as e:
            print(f"JPL Horizons Error for {planet_id}: {e}")

    if positions:
        EPHEMERIS_CACHE["timestamp"] = now
        EPHEMERIS_CACHE["data"] = positions

    return {
        "timestamp": now.isoformat(),
        "positions": EPHEMERIS_CACHE["data"],
        "source": "NASA JPL Horizons Live Ephemeris"
    }
