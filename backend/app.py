from pathlib import Path
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "objects.json"

with DATA_PATH.open("r", encoding="utf-8") as f:
    CATALOG = json.load(f)

app = FastAPI(title="Astroverse API", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:80",
        "http://127.0.0.1:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "objects": len(CATALOG), "views": ["solar", "local", "galaxy"]}

@app.get("/api/objects")
def objects(q: str | None = None, kind: str | None = None):
    items = CATALOG
    if q:
        ql = q.lower()
        blob = f"{x.get('name','')} {x.get('latin','')} {x.get('description','')} {x.get('constellation','')} {' '.join(x.get('facts') or [])}"
        items = [x for x in items if ql in blob.lower()]
    if kind:
        items = [x for x in items if x["kind"] == kind]
    return items

@app.get("/api/objects/{object_id}")
def object_by_id(object_id: str):
    for obj in CATALOG:
        if obj["id"] == object_id:
            return obj
    raise HTTPException(status_code=404, detail="Object not found")

@app.get("/api/views")
def views():
    return {
        "solar": {"title": "Солнечная система", "scale": "AU"},
        "local": {"title": "Окрестности Солнца", "scale": "light-years"},
        "galaxy": {"title": "Млечный Путь", "scale": "thousands-of-light-years"},
    }
