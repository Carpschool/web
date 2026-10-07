'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import type { MapProps } from './MapView';
const icon = (color = '#13203B') => L.divIcon({ className: '', html: `<div class="pin-dot" style="background:${color}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
function Picker({ onPick }: { onPick?: MapProps['onPick'] }) { useMapEvents({ click: e => onPick?.(e.latlng.lat, e.latlng.lng) }); return null; }
function Fit({ p }: { p: MapProps }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [...(p.line || []), ...(p.markers || []).map(m => m.pos)];
    if (p.fit && pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [28, 28] }); else map.setView(p.center, p.zoom ?? map.getZoom());
  }, [JSON.stringify(p.center), p.fit, (p.line || []).length, (p.markers || []).length]); // eslint-disable-line
  return null;
}
export default function MapInner(p: MapProps) {
  return (
    <div role="region" aria-label={p.label || 'Map'} style={{ height: p.height ?? 280 }}>
      <MapContainer center={p.center} zoom={p.zoom ?? 14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} attributionControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
        {p.line && p.line.length > 1 && <><Polyline positions={p.line} pathOptions={{ color: '#FFFCF6', weight: 9, opacity: 0.9 }} /><Polyline positions={p.line} pathOptions={{ color: '#13203B', weight: 5 }} /></>}
        {p.circles?.map((c, i) => <Circle key={i} center={c.pos} radius={c.radius} pathOptions={{ color: c.color || '#F2A900', fillOpacity: 0.18, weight: 2 }} />)}
        {p.markers?.map((m, i) => <Marker key={m.key ?? i} position={m.pos} icon={icon(m.color)} eventHandlers={m.onClick ? { click: m.onClick } : undefined}>{m.label && <Tooltip direction="top" offset={[0, -8]}>{m.label}</Tooltip>}</Marker>)}
        <Picker onPick={p.onPick} /><Fit p={p} />
      </MapContainer>
    </div>
  );
}
