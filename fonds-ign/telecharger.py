"""Télécharge des fonds WMS IGN (Géoplateforme) listés dans un JSON : [{"fichier", "layer", "bbox_l93", "w", "h"}]."""
import json, sys, time, urllib.parse, urllib.request
from pathlib import Path

req, out = json.loads(Path(sys.argv[1]).read_text()), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
for v in req["vues"]:
    q = {"SERVICE": "WMS", "VERSION": "1.3.0", "REQUEST": "GetMap", "LAYERS": v["layer"], "STYLES": "", "CRS": "EPSG:2154",
         "BBOX": ",".join(f"{c:.2f}" for c in v["bbox_l93"]), "WIDTH": v["w"], "HEIGHT": v["h"], "FORMAT": "image/png"}
    for base in ("https://data.geopf.fr/wms-r/wms", "https://data.geopf.fr/wms-v/ows"):
        for essai in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(base + "?" + urllib.parse.urlencode(q),
                                            headers={"User-Agent": "IDMaitrise-PCMI1/1.0"}), timeout=60) as r:
                    data, ct = r.read(), r.headers.get("Content-Type", "")
                if ct.startswith("image"):
                    (out / v["fichier"]).write_bytes(data); print("OK", v["fichier"], len(data)); break
                print("pas une image", base, data[:200])
            except Exception as e:
                print("erreur", base, e); time.sleep(3)
        else:
            continue
        break
