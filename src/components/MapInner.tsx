'use client';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import type { MapProps } from './MapView';
// Browser key: Maps JavaScript API only, restricted by HTTP referrer in Google Cloud.
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const ll = (p: [number, number]) => ({ lat: p[0], lng: p[1] });
function Shapes({ p }: { p: MapProps }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const g = google.maps; const objs: { setMap(m: null): void }[] = [];
    if (p.line && p.line.length > 1) { const path = p.line.map(ll);
      objs.push(new g.Polyline({ map, path, strokeColor: '#FFFCF6', strokeWeight: 9, strokeOpacity: 0.9, clickable: false }), new g.Polyline({ map, path, strokeColor: '#13203B', strokeWeight: 5, clickable: false })); }
    for (const c of p.circles || []) objs.push(new g.Circle({ map, center: ll(c.pos), radius: c.radius, strokeColor: c.color || '#F2A900', strokeWeight: 2, fillColor: c.color || '#F2A900', fillOpacity: 0.18, clickable: false }));
    return () => objs.forEach(o => o.setMap(null));
  }, [map, JSON.stringify(p.line), JSON.stringify(p.circles)]); // eslint-disable-line
  useEffect(() => {
    if (!map) return;
    const pts = [...(p.line || []), ...(p.markers || []).map(m => m.pos)];
    if (p.fit && pts.length > 1) { const b = new google.maps.LatLngBounds(); pts.forEach(x => b.extend(ll(x))); map.fitBounds(b, 28); }
    else { map.setCenter(ll(p.center)); if (p.zoom) map.setZoom(p.zoom); }
  }, [map, JSON.stringify(p.center), p.fit, (p.line || []).length, (p.markers || []).length]); // eslint-disable-line
  return null;
}
export default function MapInner(p: MapProps) {
  const [open, setOpen] = useState<number | null>(null);
  if (!KEY) return <div role="region" aria-label={p.label || 'Map'} style={{ height: p.height ?? 280, display: 'grid', placeItems: 'center', borderRadius: 18, background: '#e9e3d6' }}>Map unavailable</div>;
  return (
    <div role="region" aria-label={p.label || 'Map'} style={{ height: p.height ?? 280, borderRadius: 18, overflow: 'hidden' }}>
      <APIProvider apiKey={KEY}>
        <Map defaultCenter={ll(p.center)} defaultZoom={p.zoom ?? 14} mapId="DEMO_MAP_ID" gestureHandling="cooperative" disableDefaultUI zoomControl clickableIcons={false}
          onClick={e => { const l = e.detail.latLng; if (l) p.onPick?.(l.lat, l.lng); }} style={{ width: '100%', height: '100%' }}>
          {p.markers?.map((m, i) => <AdvancedMarker key={m.key ?? i} position={ll(m.pos)} title={m.label} onClick={() => { m.onClick?.(); if (m.label) setOpen(i); }}>
            <div className="pin-dot" style={{ background: m.color || '#13203B' }} /></AdvancedMarker>)}
          {open != null && p.markers?.[open]?.label && <InfoWindow position={ll(p.markers[open].pos)} pixelOffset={[0, -10]} headerDisabled onCloseClick={() => setOpen(null)}>{p.markers[open].label}</InfoWindow>}
          <Shapes p={p} />
        </Map>
      </APIProvider>
    </div>
  );
}
