import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet's default marker icons don't resolve correctly under Vite's
// bundling — this explicit fix is the standard workaround.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CLASSIFICATION_COLOR = {
  under_served: "#2e7d32",
  moderately_competitive: "#f9a825",
  highly_saturated: "#c62828",
};

export default function CompetitorMap({ points = [], classification }) {
  if (!points.length) {
    return (
      <p className="competitor-map__empty">
        No exact competitor locations available yet for this area — classification is based on
        estimated density only.
      </p>
    );
  }

  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  const color = CLASSIFICATION_COLOR[classification] || "#555";

  return (
    <div className="competitor-map" style={{ borderColor: color }}>
      <MapContainer center={[avgLat, avgLng]} zoom={13} style={{ height: "260px", width: "100%", borderRadius: "10px" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={`${p.name}-${p.lat}-${p.lng}`} position={[p.lat, p.lng]}>
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.category}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
