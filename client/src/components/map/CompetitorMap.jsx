import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";


delete L.Icon.Default.prototype
  ._getIconUrl;


L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


export default function CompetitorMap({
  points = [],
  classification,
}) {
  /*
   * Phase 0 compatibility:
   *
   * No points does NOT mean zero competitors.
   */
  if (!points.length) {
    return (
      <div className="competitor-map__empty">
        <strong>
          No identifiable competitor locations are available.
        </strong>

        <br />

        Available data does not currently contain
        mappable businesses for this category.

        <br />

        This does <strong>not</strong> mean that no
        competitors exist. Informal, unregistered,
        or unlisted businesses may not be captured.
      </div>
    );
  }


  const validPoints =
    points.filter(
      (point) =>
        Number.isFinite(
          Number(point.lat)
        ) &&
        Number.isFinite(
          Number(point.lng)
        )
    );


  if (!validPoints.length) {
    return (
      <div className="competitor-map__empty">
        Competitors were identified, but their
        locations are not available for mapping.
      </div>
    );
  }


  const avgLat =
    validPoints.reduce(
      (sum, point) =>
        sum + Number(point.lat),
      0
    ) /
    validPoints.length;


  const avgLng =
    validPoints.reduce(
      (sum, point) =>
        sum + Number(point.lng),
      0
    ) /
    validPoints.length;


  return (
    <>
      <div
        className="competitor-map"
        aria-label="Competitor location map"
      >
        <MapContainer
          center={[
            avgLat,
            avgLng,
          ]}
          zoom={13}
          style={{
            height: "300px",
            width: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validPoints.map(
            (point) => (
              <Marker
                key={`${point.name}-${point.lat}-${point.lng}`}
                position={[
                  Number(point.lat),
                  Number(point.lng),
                ]}
              >
                <Popup>
                  <strong>
                    {point.name}
                  </strong>

                  <br />

                  {point.category}
                </Popup>
              </Marker>
            )
          )}
        </MapContainer>
      </div>


      <div className="competitor-map__legend">
        <span>
          {validPoints.length} identifiable location
          {validPoints.length === 1
            ? ""
            : "s"} mapped
        </span>

        <span>
          Classification:{" "}
          {classification?.replace(
            /_/g,
            " "
          )}
        </span>
      </div>
    </>
  );
}