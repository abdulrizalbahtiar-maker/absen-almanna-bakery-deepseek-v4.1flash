"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ikonKantor = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#d97706;border:3px solid #fff;box-shadow:0 0 0 2px #d97706"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const ikonUser = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function PenangkapKlik({ onKlik }: { onKlik: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onKlik(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function IkutiPusat({ lat, lng }: { lat: number; lng: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export interface OfficeMapProps {
  kantorLat: number;
  kantorLng: number;
  radiusMeter: number;
  userLat?: number;
  userLng?: number;
  mode: "tampil" | "picker";
  onPilih?: (lat: number, lng: number) => void;
}

export default function OfficeMap({
  kantorLat,
  kantorLng,
  radiusMeter,
  userLat,
  userLng,
  mode,
  onPilih,
}: OfficeMapProps) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-2xl border border-border sm:h-80">
      <MapContainer
        center={[kantorLat, kantorLng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[kantorLat, kantorLng]}
          radius={radiusMeter}
          pathOptions={{ color: "#d97706", fillColor: "#d97706", fillOpacity: 0.12 }}
        />
        <Marker position={[kantorLat, kantorLng]} icon={ikonKantor} />
        {mode === "tampil" && userLat != null && userLng != null && (
          <Marker position={[userLat, userLng]} icon={ikonUser} />
        )}
        {mode === "picker" && onPilih && <PenangkapKlik onKlik={onPilih} />}
        {mode === "picker" && <IkutiPusat lat={kantorLat} lng={kantorLng} />}
      </MapContainer>
    </div>
  );
}
