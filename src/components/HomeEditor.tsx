'use client';
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import MapView from './MapView';
import PlaceSearch from './PlaceSearch';
import type { Home } from '@/lib/types';
import { useSchool } from '@/lib/school';
import { errText } from '@/lib/format';
export default function HomeEditor({ open, home, onClose, onSaved }: { open: boolean; home: Home | null; onClose: () => void; onSaved: () => void }) {
  const { api, meta } = useSchool(); const full = useMediaQuery('(max-width:600px)');
  const campus: [number, number] = meta ? [meta.campus.coordinates[1], meta.campus.coordinates[0]] : [49.26, -123.25];
  const [label, setLabel] = useState(''); const [pos, setPos] = useState<[number, number] | null>(null); const [r, setR] = useState(80); const [addr, setAddr] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (!open) return; setErr(''); setBusy(false); setLabel(home?.label ?? 'Home'); setPos(home ? [home.location.coordinates[1], home.location.coordinates[0]] : null); setR(home?.walkingRadius ?? 80); setAddr(''); }, [open, home]);
  async function save() {
    if (!pos) return; setBusy(true); setErr('');
    const body = { label: label.trim() || 'Home', location: { type: 'Point', coordinates: [+pos[1].toFixed(6), +pos[0].toFixed(6)] }, walkingRadius: r };
    try { await api(home ? '/homes/' + home._id : '/homes', { method: home ? 'PUT' : 'POST', body }); onSaved(); } catch (e) { setErr(errText(e)); setBusy(false); }
  }
  return (
    <Dialog open={open} onClose={() => !busy && onClose()} fullScreen={full} fullWidth maxWidth="sm" aria-labelledby="home-title">
      <DialogTitle id="home-title" sx={{ fontFamily: 'var(--font-display)', fontWeight: 750 }}>{home ? 'Edit home' : 'Add a home'}</DialogTitle>
      <DialogContent>
        <Stack gap={1.5} sx={{ pt: 1 }}>
          <TextField label="Name" value={label} onChange={e => setLabel(e.target.value.slice(0, 40))} placeholder="Home, Dad's place…" />
          <PlaceSearch bias={campus} onSelect={p => { setPos([p.lat, p.lng]); setAddr(p.address); }} />
          <MapView center={pos ?? campus} zoom={pos ? 16 : 12} markers={pos ? [{ pos, label: addr || 'Pickup point' }] : []} circles={pos ? [{ pos, radius: r }] : []} onPick={(lat, lng) => setPos([lat, lng])} height={full ? 300 : 280} label="Tap to place your home pin" />
          <Typography variant="body2" color="text.secondary">{pos ? 'Tap the map to fine-tune the pin.' : 'Search above or tap the map to drop a pin.'}</Typography>
          <Typography fontWeight={650} sx={{ mt: 1 }} id="radius-label">How far will you walk to a pickup? <b>{r} m</b></Typography>
          <Slider aria-labelledby="radius-label" value={r} min={10} max={200} step={10} onChange={(_, v) => setR(v as number)} marks={[{ value: 10, label: '10 m' }, { value: 200, label: '200 m' }]} color="secondary" sx={{ mx: 1, width: 'auto' }} />
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={!pos || busy}>{busy ? 'Saving…' : 'Save home'}</Button></DialogActions>
    </Dialog>
  );
}
