'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import CommuteForm, { useCommute } from '@/components/CommuteForm';
import MapView from '@/components/MapView';
import { ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Home } from '@/lib/types';
import { errText } from '@/lib/format';
export default function NewDrive() {
  const homes = useApi<Home[]>('/homes'); const c = useCommute(homes.data, 'carpschool.draft.drive'); const { api, meta } = useSchool(); const router = useRouter(); const toast = useToast();
  const [seats, setSeats] = useState(3); const [route, setRoute] = useState<{ coordinates: [number, number][]; meters: number; seconds: number } | null>(null); const [rErr, setRErr] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const home = homes.data?.find(h => h._id === c.v.homeId); const maxSeats = Math.min(meta?.limits.seats ?? 4, 4);
  useEffect(() => {
    if (!home || !meta) return; setRoute(null); setRErr('');
    const h = home.location.coordinates.join(','), s = meta.campus.coordinates.join(',');
    const [from, to] = c.v.direction === 'to-school' ? [h, s] : [s, h];
    fetch(`/api/route?from=${from}&to=${to}`).then(r => r.json()).then(j => j.coordinates ? setRoute(j) : setRErr(j.error || 'Could not get a route')).catch(() => setRErr('Could not get a route'));
  }, [home?._id, c.v.direction, meta]); // eslint-disable-line
  async function submit() { setBusy(true); setErr(''); try { const d = await api('/drives', { body: { commute: c.value, route: route!.coordinates, seats } }); c.clearDraft(); toast('Drive posted'); router.push('/drives/' + d._id); } catch (e) { setErr(errText(e)); setBusy(false); } }
  const line = route?.coordinates.map(([a, b]) => [b, a] as [number, number]);
  return (<>
    <PageHead kicker="Driver" title="Post a drive" sub="We'll find riders who live a short walk from your route." />
    {homes.isLoading ? <Loading rows={3} h={64} /> : homes.error ? <ErrorState error={homes.error} retry={homes.refetch} /> : (
      <Card sx={{ p: { xs: 2, sm: 3 } }} className="rise">
        <CommuteForm c={c} homes={homes.data || []} timeLabel={c.v.direction === 'to-school' ? 'Arrive at school between' : 'Leave school between'} />
        {!!homes.data?.length && <>
          <Stack gap={1} sx={{ mt: 3 }}><Typography variant="overline" color="text.secondary" id="seats">Seats to offer · {seats}</Typography>
            <Slider aria-labelledby="seats" value={seats} min={1} max={maxSeats} step={1} marks onChange={(_, v) => setSeats(v as number)} color="secondary" sx={{ mx: 1, width: 'auto' }} /></Stack>
          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" color="text.secondary">Your route</Typography>
            {rErr ? <Alert severity="error">{rErr}</Alert> : !line ? <Loading rows={1} h={240} /> : <>
              <MapView center={line[0]} line={line} fit height={260} markers={[{ pos: line[0], color: '#2F7A57', label: 'Start' }, { pos: line[line.length - 1], color: '#C4462B', label: 'End' }]} label="Drive route" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{(route!.meters / 1000).toFixed(1)} km · about {Math.round(route!.seconds / 60)} min</Typography></>}
          </Box>
          {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
          <Button fullWidth size="large" variant="contained" sx={{ mt: 3 }} disabled={!c.valid || !route || busy} onClick={submit}>{busy ? 'Posting…' : 'Post drive & find riders'}</Button>
        </>}
      </Card>)}
  </>);
}
