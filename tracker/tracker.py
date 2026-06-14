"""
BusNow — Tracker Desktop
Interface web local com mapa interativo. Clique no mapa para mover o ônibus.
A posição é enviada automaticamente para o backend a cada vez que você clica.

Requisitos: pip install flask requests folium
"""

import threading
import webbrowser
import time
import requests
from flask import Flask, render_template_string, request, jsonify

# ── Configuração ──────────────────────────────────────────────────────────────
BACKEND_URL = "http://localhost:8080"
BUS_ID      = "bus-001"
# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)

state = {
    "lat": -21.3700,
    "lng": -46.5250,
    "current_stop": "",
    "last_sent": None,
    "error": None,
}

HTML = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BusNow Tracker</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; }
    header { padding: 12px 16px; background: #1e40af; color: white; }
    header h1 { font-size: 18px; }
    header p  { font-size: 12px; opacity: .8; margin-top: 2px; }
    #controls { display: flex; gap: 8px; align-items: center; padding: 10px 16px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
    #controls label { font-size: 13px; color: #555; }
    #stop-input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; width: 200px; }
    #status { font-size: 12px; color: #555; margin-left: auto; }
    #status.ok  { color: #16a34a; }
    #status.err { color: #dc2626; }
    #map { flex: 1; }
    #log { height: 110px; overflow-y: auto; background: #0f172a; color: #94a3b8; font-family: monospace; font-size: 11px; padding: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>BusNow — Tracker Desktop</h1>
    <p>Clique no mapa para mover o ônibus. Bus ID: <strong>{{ bus_id }}</strong></p>
  </header>

  <div id="controls">
    <label>Parada atual:</label>
    <input id="stop-input" type="text" placeholder="ex: Terminal Central" />
    <span id="status">Aguardando clique no mapa...</span>
  </div>

  <div id="map"></div>
  <div id="log"></div>

  <script>
    const map = L.map('map').setView([{{ lat }}, {{ lng }}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const busIcon = L.divIcon({
      html: '<div style="background:#1e40af;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,.3)">🚌</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: ''
    });

    let marker = L.marker([{{ lat }}, {{ lng }}], {icon: busIcon}).addTo(map);
    const logEl = document.getElementById('log');
    const statusEl = document.getElementById('status');

    function addLog(msg) {
      const t = new Date().toLocaleTimeString('pt-BR');
      logEl.innerHTML = `[${t}] ${msg}\n` + logEl.innerHTML;
    }

    map.on('click', async function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const stop = document.getElementById('stop-input').value;

      marker.setLatLng([lat, lng]);

      try {
        const res = await fetch('/send', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({lat, lng, current_stop: stop})
        });
        const data = await res.json();
        if (data.ok) {
          statusEl.textContent = `Enviado — lat: ${lat.toFixed(4)} lng: ${lng.toFixed(4)}`;
          statusEl.className = 'ok';
          addLog(`OK — lat: ${lat.toFixed(5)} lng: ${lng.toFixed(5)} parada: "${stop}"`);
        } else {
          statusEl.textContent = 'Erro: ' + data.error;
          statusEl.className = 'err';
          addLog(`ERRO — ${data.error}`);
        }
      } catch(err) {
        statusEl.textContent = 'Erro de conexão com o tracker';
        statusEl.className = 'err';
        addLog(`ERRO — ${err.message}`);
      }
    });

    addLog('Tracker iniciado. Clique no mapa para mover o ônibus.');
  </script>
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(HTML, lat=state["lat"], lng=state["lng"], bus_id=BUS_ID)


@app.route("/send", methods=["POST"])
def send():
    body = request.get_json()
    lat  = body["lat"]
    lng  = body["lng"]
    stop = body.get("current_stop", "")

    try:
        res = requests.post(
            f"{BACKEND_URL}/buses/{BUS_ID}/location",
            json={"lat": lat, "lng": lng, "speed_kmh": 0, "current_stop": stop},
            timeout=5,
        )
        res.raise_for_status()
        state.update({"lat": lat, "lng": lng, "current_stop": stop, "error": None})
        return jsonify({"ok": True})
    except Exception as e:
        state["error"] = str(e)
        return jsonify({"ok": False, "error": str(e)})


def open_browser():
    time.sleep(1)
    webbrowser.open("http://localhost:5050")


if __name__ == "__main__":
    threading.Thread(target=open_browser, daemon=True).start()
    print(f"[BusNow Tracker] Abrindo em http://localhost:5050")
    print(f"[BusNow Tracker] Backend: {BACKEND_URL}")
    print(f"[BusNow Tracker] Bus ID:  {BUS_ID}")
    app.run(port=5050, debug=False)
