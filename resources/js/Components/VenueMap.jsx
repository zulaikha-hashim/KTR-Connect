import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const campusCenter = [1.5594, 103.6382];

const venueMarker = L.divIcon({
  className: '',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#b42318" style="filter:drop-shadow(0 1px 2px #fff)" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapClickHandler({ onPin }) {
  useMapEvents({
    click(event) {
      onPin(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 16));
  }, [map, position]);

  return null;
}

export default function VenueMap({ position, onPin }) {
  const center = position || campusCenter;

  return (
    <MapContainer
      center={center}
      className="h-72 w-full rounded-lg"
      scrollWheelZoom={false}
      zoom={position ? 16 : 15}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPin={onPin} />
      <RecenterMap position={position} />
      {position && <Marker icon={venueMarker} position={position} title="Pinned venue location" alt="Pinned venue location" />}
    </MapContainer>
  );
}
