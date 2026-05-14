import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "@tanstack/react-router";

type Show = { id: string; title: string; venue: string; lat: number; lng: number; date_time: string; venue_type: string | null; is_secret: boolean };

const icon = (label: string) => L.divIcon({
  className: "noisemap-pin",
  html: `<div style="background:#ff1e1e;color:#000;font-family:JetBrains Mono,monospace;font-weight:800;font-size:11px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:1px solid #000;box-shadow:0 0 8px rgba(255,30,30,0.7);transform:rotate(-3deg)">${label}</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

const labelFor = (t: string | null) => ({ venue: "▲", house: "●", warehouse: "■", skatepark: "◆", diy: "✕" } as Record<string, string>)[t ?? "venue"] ?? "▲";

export default function SceneMap({ shows }: { shows: Show[] }) {
  const center: [number, number] = shows.length
    ? [shows.reduce((a, s) => a + s.lat, 0) / shows.length, shows.reduce((a, s) => a + s.lng, 0) / shows.length]
    : [40.7128, -74.0060];
  return (
    <MapContainer center={center} zoom={shows.length ? 5 : 3} style={{ height: "100%", width: "100%", background: "#0a0a0a" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {shows.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={icon(labelFor(s.venue_type))}>
          <Popup>
            <div style={{ fontFamily: "JetBrains Mono, monospace", color: "#fff", background: "#0a0a0a", padding: 8, minWidth: 180 }}>
              <div style={{ color: "#ff1e1e", fontSize: 10, textTransform: "uppercase", letterSpacing: 2 }}>{s.venue_type ?? "venue"}{s.is_secret ? " · secret" : ""}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{s.venue}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{new Date(s.date_time).toLocaleString()}</div>
              <Link to="/shows/$id" params={{ id: s.id }} style={{ color: "#ff1e1e", fontSize: 11, marginTop: 6, display: "inline-block" }}>[ open show ]</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
