'use client';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ChatOutlined from '@mui/icons-material/ChatOutlined';
import MapView from '@/components/MapView';
import Confirm from '@/components/Confirm';
import SafetyMenu from '@/components/SafetyMenu';
import { ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Drive, Passenger, Point } from '@/lib/types';
import { dirLabel, errText, runsToday, schedule, shortId } from '@/lib/format';
import { mono } from '@/theme';
function here(fallback: Point): Promise<{ loc: Point; approx: boolean }> {
  return new Promise(res => {
    if (!navigator.geolocation) return res({ loc: fallback, approx: true });
    navigator.geolocation.getCurrentPosition(p => res({ loc: { type: 'Point', coordinates: [+p.coords.longitude.toFixed(6), +p.coords.latitude.toFixed(6)] }, approx: false }), () => res({ loc: fallback, approx: true }), { timeout: 8000, maximumAge: 60000 });
  });
}
const label: Record<string, [string, any]> = { locked: ['Waiting at pickup', 'secondary'], boarded: ['On board', 'success'], completed: ['Dropped off', 'default'], dropped: ['Dropped off', 'default'], left: ['Left', 'default'] };
export default function Ride({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); const { me, api } = useSchool(); const toast = useToast(); const driver = me?.role === 'driver';
  const q = useApi<Drive>('/carpools/' + id, { refetchInterval: 20000 });
  const [pin, setPin] = useState<string | null>(null); const [pinBusy, setPinBusy] = useState(false);
  const [board, setBoard] = useState<Passenger | null>(null); const [code, setCode] = useState(''); const [bErr, setBErr] = useState(''); const [bBusy, setBBusy] = useState(false);
  const [leave, setLeave] = useState<Passenger | null>(null); const [drop, setDrop] = useState<Passenger | null>(null);
  if (q.isLoading) return <Loading rows={3} />;
  if (q.error || !q.data) return <ErrorState error={q.error ?? 'Ride not found'} retry={q.refetch} />;
  const d = q.data; const ps = [...d.passengers].sort((a, b) => a.time.localeCompare(b.time)); const today = runsToday(d);
  async function getPin() { setPinBusy(true); try { const r = await api('/carpools/' + id + '/pin', { method: 'POST' }); setPin(r.pin); } catch (e) { toast(errText(e), 'error'); } finally { setPinBusy(false); } }
  async function doBoard() {
    if (!board) return; setBBusy(true); setBErr('');
    try { const { loc, approx } = await here(board.pickup); const r = await api('/carpools/' + id + '/board', { body: { rider: board.rider, pin: code, location: loc } });
      if (r?.invalid) { setBErr('Wrong PIN. Ask the rider to check their pass.'); setBBusy(false); return; }
      toast(approx ? 'Boarded (location approximate)' : 'Boarded'); setBoard(null); q.refetch(); } catch (e) { setBErr(errText(e)); } setBBusy(false);
  }
  return (<>
    <PageHead kicker={schedule(d)} title={dirLabel(d.direction)} sub={driver ? `${ps.filter(p => p.status !== 'left').length} rider(s) · ${d.availableSeats} seat(s) open` : 'Your boarding pass'} action={d.status !== 'active' ? <Chip label={d.status} /> : today ? <Chip label="Today" color="secondary" /> : undefined} />
    {!driver ? ps.map(p => { const pos: [number, number] = [p.pickup.coordinates[1], p.pickup.coordinates[0]]; const [l, c] = label[p.status] ?? [p.status, 'default']; return (
      <Box key={p._id} className="rise">
        <Box sx={{ bgcolor: 'primary.main', color: '#F5F0E6', borderRadius: '26px', overflow: 'hidden' }}>
          <MapView center={pos} zoom={16} height={200} markers={[{ pos, color: '#F2A900', label: 'Pickup' }]} label="Pickup location" />
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box><Typography sx={{ fontFamily: mono, fontSize: 12, opacity: 0.6, letterSpacing: '.14em' }}>PICKUP</Typography><Typography sx={{ fontFamily: mono, fontWeight: 800, fontSize: 40 }}>{p.time}</Typography></Box>
              <Chip label={l} color={c} />
            </Stack>
            <Box sx={{ borderTop: '2px dashed rgba(245,240,230,.25)', mt: 2, pt: 2 }}>
              {p.status === 'locked' ? (pin ? <Box textAlign="center"><Typography sx={{ fontFamily: mono, fontSize: 12, opacity: 0.6, letterSpacing: '.14em' }}>BOARDING PIN</Typography><Typography sx={{ fontFamily: mono, fontWeight: 800, fontSize: 52, letterSpacing: '.3em', color: 'secondary.main' }} aria-live="polite">{pin}</Typography><Typography variant="body2" sx={{ opacity: 0.7 }}>Show this to your driver. Getting a new PIN replaces the old one.</Typography></Box>
                : <Button fullWidth size="large" variant="contained" color="secondary" onClick={getPin} disabled={pinBusy}>{pinBusy ? 'Getting PIN…' : 'Show boarding PIN'}</Button>)
                : <Typography sx={{ opacity: 0.8 }}>{p.status === 'boarded' ? "You're on board. Have a good ride." : 'This ride is finished.'}</Typography>}
            </Box>
          </Box>
        </Box>
        <Stack direction="row" gap={1} sx={{ mt: 2 }} alignItems="center">
          <Button component={Link} href={'/chats/' + p.negotiationId} startIcon={<ChatOutlined />}>Chat with driver</Button>
          <Box sx={{ flex: 1 }} />
          {p.status === 'locked' && <Button color="error" onClick={() => setLeave(p)}>Leave carpool</Button>}
          <SafetyMenu subject={d.owner} who={'driver ' + shortId(d.owner)} />
        </Stack>
      </Box>); }) : (<>
      {ps.length > 0 && <Card sx={{ mb: 3, overflow: 'hidden' }}><MapView center={[ps[0].pickup.coordinates[1], ps[0].pickup.coordinates[0]]} fit height={240} markers={ps.filter(p => p.status !== 'left').map((p, i) => ({ pos: [p.pickup.coordinates[1], p.pickup.coordinates[0]] as [number, number], color: p.status === 'locked' ? '#F2A900' : '#2F7A57', label: `${i + 1}. ${p.time}` }))} label="Pickups in order" /></Card>}
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Pickups in order</Typography>
      <Stack gap={1.5}>{ps.map((p, i) => { const [l, c] = label[p.status] ?? [p.status, 'default']; return (
        <Card key={p._id} sx={{ p: 2 }} className="rise"><Stack direction="row" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: p.status === 'locked' ? 'secondary.main' : 'success.main', color: 'primary.main', fontFamily: mono, fontWeight: 800 }}>{i + 1}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700}>Rider {shortId(p.rider)} · <span style={{ fontFamily: 'var(--font-mono)' }}>{p.time}</span></Typography><Chip size="small" label={l} color={c} sx={{ mt: 0.5 }} /></Box>
          <SafetyMenu subject={p.rider} who={'rider ' + shortId(p.rider)} />
        </Stack>
        {(p.status === 'locked' || p.status === 'boarded') && d.status === 'active' && <Stack direction="row" gap={1} sx={{ mt: 1.5 }} flexWrap="wrap">
          {p.status === 'locked' && <Button variant="contained" onClick={() => { setBoard(p); setCode(''); setBErr(''); }}>Enter PIN</Button>}
          {p.status === 'boarded' && <Button variant="contained" color="success" onClick={() => setDrop(p)}>Complete drop-off</Button>}
          <Button component={Link} href={'/chats/' + p.negotiationId} startIcon={<ChatOutlined />}>Chat</Button>
          {p.status === 'locked' && <Button color="error" onClick={() => setLeave(p)}>Remove</Button>}
        </Stack>}
        </Card>); })}</Stack>
    </>)}
    <Dialog open={!!board} onClose={() => !bBusy && setBoard(null)} fullWidth maxWidth="xs" aria-labelledby="board-title">
      <DialogTitle id="board-title" sx={{ fontFamily: 'var(--font-display)', fontWeight: 750 }}>Rider's boarding PIN</DialogTitle>
      <DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>Ask the rider to show their pass. We save one location snapshot when they board.</Typography>
        <TextField autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': '4 digit PIN', style: { fontFamily: mono, fontSize: 34, letterSpacing: '.5em', textAlign: 'center' } } }} onKeyDown={e => { if (e.key === 'Enter' && code.length === 4) doBoard(); }} />
        {bErr && <Alert severity="error" sx={{ mt: 2 }}>{bErr}</Alert>}</DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={() => setBoard(null)} disabled={bBusy}>Cancel</Button><Button variant="contained" disabled={code.length !== 4 || bBusy} onClick={doBoard}>{bBusy ? 'Checking…' : 'Board rider'}</Button></DialogActions>
    </Dialog>
    <Confirm open={!!drop} title="Complete drop-off?" body="We'll save one location snapshot and mark the ride done." confirmText="Complete" onClose={() => setDrop(null)}
      onConfirm={async () => { try { const { loc } = await here(drop!.pickup); await api('/carpools/' + id + '/dropoff', { body: { rider: drop!.rider, location: loc } }); toast('Drop-off complete'); q.refetch(); } catch (e) { toast(errText(e), 'error'); } setDrop(null); }} />
    <Confirm open={!!leave} title={driver ? 'Remove this rider?' : 'Leave this carpool?'} body={driver ? 'Their seat opens up and they get an email.' : 'Your seat is released and the driver gets an email. Your request goes back into the pool.'} confirmText={driver ? 'Remove' : 'Leave'} danger onClose={() => setLeave(null)}
      onConfirm={async () => { try { await api('/carpools/' + id + '/leave', { body: { rider: leave!.rider } }); toast(driver ? 'Rider removed' : 'You left the carpool'); if (driver) q.refetch(); else router.replace('/rides'); } catch (e) { toast(errText(e), 'error'); } setLeave(null); }} />
  </>);
}
