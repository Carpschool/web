'use client';
import Map, { Marker, Popup, Source, Layer, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';

// Next's bundler can't resolve MapLibre's module worker; serve a copy from /public (see "prebuild").
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapProps } from './MapView';
// Self-hosted OpenMapTiles vector tiles (tileserver-gl), proxied by this app at /tiles.
const STYLE = '/tiles/styles/positron/style.json';
type LngLat = [number, number];
const ll = (p: [number, number]): LngLat => [p[1], p[0]];
/** Geodesic-ish circle polygon (64 steps) for a radius in metres. */
function circle([lat, lng]: [number, number], r: number) {
  const pts: LngLat[] = []; const dLat = r / 111320, dLng = r / (111320 * Math.cos(lat * Math.PI / 180));
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * 2 * Math.PI; pts.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]); }
  return pts;
}
export default function MapInner(p: MapProps) {
  const ref = useRef<MapRef>(null); const [open, setOpen] = useState<number | null>(null); const [ready, setReady] = useState(false);
  const line = useMemo(() => p.line && p.line.length > 1 ? { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: p.line.map(ll) } } : null, [JSON.stringify(p.line)]); // eslint-disable-line
  const circles = useMemo(() => ({ type: 'FeatureCollection' as const, features: (p.circles || []).map(c => ({ type: 'Feature' as const, properties: { color: c.color || '#F2A900' }, geometry: { type: 'Polygon' as const, coordinates: [circle(c.pos, c.radius)] } })) }), [JSON.stringify(p.circles)]); // eslint-disable-line
  useEffect(() => {
    const m = ref.current; if (!m || !ready) return;
    const pts = [...(p.line || []), ...(p.markers || []).map(x => x.pos)];
    if (p.fit && pts.length > 1) { const lats = pts.map(x => x[0]), lngs = pts.map(x => x[1]); m.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 28, duration: 0, maxZoom: 16 }); }
    else m.jumpTo({ center: ll(p.center), ...(p.zoom ? { zoom: p.zoom } : {}) });
  }, [ready, JSON.stringify(p.center), p.fit, (p.line || []).length, (p.markers || []).length]); // eslint-disable-line
  return (
    <div role="region" aria-label={p.label || 'Map'} style={{ height: p.height ?? 280, borderRadius: 18, overflow: 'hidden' }}>
      <Map ref={ref} mapStyle={STYLE} initialViewState={{ longitude: p.center[1], latitude: p.center[0], zoom: p.zoom ?? 14 }} cooperativeGestures attributionControl={{ compact: true }}
        onLoad={() => setReady(true)} onClick={e => p.onPick?.(e.lngLat.lat, e.lngLat.lng)} style={{ width: '100%', height: '100%' }}>
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="circles" type="geojson" data={circles}>
          <Layer id="circle-fill" type="fill" paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.18 }} />
          <Layer id="circle-line" type="line" paint={{ 'line-color': ['get', 'color'], 'line-width': 2 }} />
        </Source>
        {line && <Source id="route" type="geojson" data={line}>
          <Layer id="route-casing" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#FFFCF6', 'line-width': 9, 'line-opacity': 0.9 }} />
          <Layer id="route-line" type="line" layout={{ 'line-cap': 'round', 'line-join': 'round' }} paint={{ 'line-color': '#13203B', 'line-width': 5 }} />
        </Source>}
        {p.markers?.map((m, i) => <Marker key={m.key ?? i} longitude={m.pos[1]} latitude={m.pos[0]} onClick={e => { e.originalEvent.stopPropagation(); m.onClick?.(); if (m.label) setOpen(i); }}>
          <div className="pin-dot" title={m.label} style={{ background: m.color || '#13203B', cursor: m.onClick || m.label ? 'pointer' : undefined }} /></Marker>)}
        {open != null && p.markers?.[open]?.label && <Popup longitude={p.markers[open].pos[1]} latitude={p.markers[open].pos[0]} offset={12} closeButton={false} onClose={() => setOpen(null)}>{p.markers[open].label}</Popup>}
      </Map>
    </div>
  );
}
