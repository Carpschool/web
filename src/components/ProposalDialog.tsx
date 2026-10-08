'use client';
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import MapView from './MapView';
import PlaceSearch from './PlaceSearch';
export default function ProposalDialog({ open, initial, onClose, onSend, title }: { open: boolean; initial: { pos: [number, number]; time: string } | null; title: string; onClose: () => void; onSend: (pos: [number, number], time: string) => Promise<void> }) {
  const full = useMediaQuery('(max-width:600px)');
  const [pos, setPos] = useState<[number, number] | null>(null); const [time, setTime] = useState('07:45'); const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setPos(initial?.pos ?? null); setTime(initial?.time ?? '07:45'); setBusy(false); } }, [open, initial]);
  return (<Dialog open={open} onClose={() => !busy && onClose()} fullScreen={full} fullWidth maxWidth="sm" aria-labelledby="prop-title">
    <DialogTitle id="prop-title" sx={{ fontFamily: 'var(--font-display)', fontWeight: 750 }}>{title}</DialogTitle>
    <DialogContent><Stack gap={1.5} sx={{ pt: 1 }}>
      <PlaceSearch label="Search a pickup spot" bias={pos ?? undefined} onSelect={p => setPos([p.lat, p.lng])} />
      <MapView center={pos ?? [49.26, -123.2]} zoom={16} markers={pos ? [{ pos, color: '#F2A900', label: 'Pickup' }] : []} onPick={(a, b) => setPos([a, b])} height={full ? 320 : 280} label="Tap to set pickup point" />
      <Typography variant="body2" color="text.secondary">Tap the map to move the pickup pin.</Typography>
      <TextField type="time" label="Pickup time" value={time} onChange={e => setTime(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
    </Stack></DialogContent>
    <DialogActions sx={{ p: 2 }}><Button onClick={onClose} disabled={busy}>Cancel</Button>
      <Button variant="contained" disabled={!pos || !time || busy} onClick={async () => { setBusy(true); try { await onSend(pos!, time); } finally { setBusy(false); } }}>{busy ? 'Sending…' : 'Send proposal'}</Button></DialogActions>
  </Dialog>);
}
