'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import DirectionsWalk from '@mui/icons-material/DirectionsWalk';
import MapView from '@/components/MapView';
import Ticket from '@/components/Ticket';
import Confirm from '@/components/Confirm';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Drive, Match } from '@/lib/types';
import { dirLabel, errText, schedule, shortId } from '@/lib/format';
export default function DrivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { api } = useSchool(); const router = useRouter(); const toast = useToast();
  const d = useApi<Drive>('/drives/' + id); const m = useApi<Match[]>('/drives/' + id + '/matches', { refetchInterval: 30000 });
  const [busy, setBusy] = useState<string | null>(null); const [cancel, setCancel] = useState(false);
  async function reach(requestId: string) { setBusy(requestId); try { const n = await api('/drives/' + id + '/negotiations', { body: { requestId } }); router.push('/chats/' + n._id); } catch (e) { toast(errText(e), 'error'); setBusy(null); } }
  if (d.isLoading) return <Loading rows={3} />;
  if (d.error || !d.data) return <ErrorState error={d.error ?? 'Drive not found'} retry={d.refetch} />;
  const drive = d.data; const line = drive.route?.coordinates.map(([a, b]) => [b, a] as [number, number]) ?? [];
  const pickups = drive.passengers.filter(p => p.status !== 'left').map(p => ({ pos: [p.pickup.coordinates[1], p.pickup.coordinates[0]] as [number, number], color: '#F2A900', label: 'Pickup ' + p.time }));
  return (<>
    <PageHead kicker={schedule(drive) + ' · ' + drive.startTime + '–' + drive.endTime} title={dirLabel(drive.direction)} sub={`${drive.availableSeats} of ${drive.seats} seats open`} action={drive.status === 'active' ? <Button color="error" onClick={() => setCancel(true)}>Cancel drive</Button> : <Chip label={drive.status} />} />
    {line.length > 1 && <Card sx={{ mb: 3, overflow: 'hidden' }} className="rise"><MapView center={line[0]} line={line} fit height={300} markers={[{ pos: line[0], color: '#2F7A57', label: 'Start' }, ...pickups, { pos: line[line.length - 1], color: '#C4462B', label: 'End' }]} label="Corridor map" /></Card>}
    <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>Riders along your route</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sorted by how close they are to your route. Everyone here is within their own walking distance.</Typography>
    {m.isLoading ? <Loading rows={2} h={76} /> : m.error ? <ErrorState error={m.error} retry={m.refetch} /> : !m.data?.length ?
      <Empty icon={<PersonSearchOutlined />} title={drive.availableSeats < 1 ? 'Your car is full' : 'No riders yet'} body={drive.availableSeats < 1 ? 'All seats are taken for this drive.' : 'We check again every 30 seconds. Riders who post later will show up here.'} /> :
      <Stack gap={1.5}>{m.data.map(x => (
        <Ticket key={x.requestId}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.main', fontWeight: 700 }}>{shortId(x.rider).slice(0, 2)}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700}>Rider · {shortId(x.rider)}</Typography>
              <Typography variant="body2" color="text.secondary"><DirectionsWalk sx={{ fontSize: 15, verticalAlign: -2 }} /> {x.distanceMeters} m from route · {x.startTime}–{x.endTime}</Typography>
            </Box>
            <Button variant="contained" size="small" disabled={!!busy} onClick={() => reach(x.requestId)}>{busy === x.requestId ? 'Opening…' : 'Reach out'}</Button>
          </Stack>
        </Ticket>))}</Stack>}
    <Confirm open={cancel} title="Cancel this drive?" body="Any riders who haven't boarded will be notified and their requests reopened." confirmText="Cancel drive" danger onClose={() => setCancel(false)}
      onConfirm={async () => { try { await api('/drives/' + id, { method: 'DELETE' }); toast('Drive cancelled'); router.push('/home'); } catch (e) { toast(errText(e), 'error'); } setCancel(false); }} />
  </>);
}
