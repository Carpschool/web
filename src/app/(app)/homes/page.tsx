'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Add from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import HouseOutlined from '@mui/icons-material/HouseOutlined';
import MapView from '@/components/MapView';
import HomeEditor from '@/components/HomeEditor';
import Confirm from '@/components/Confirm';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Home } from '@/lib/types';
import { errText } from '@/lib/format';
function Homes() {
  const q = useApi<Home[]>('/homes'); const { api, meta, me } = useSchool(); const toast = useToast(); const router = useRouter(); const onboarding = useSearchParams().get('onboarding');
  const [edit, setEdit] = useState<Home | null>(null); const [open, setOpen] = useState(false); const [del, setDel] = useState<Home | null>(null);
  const max = meta?.limits.homes ?? 3; const homes = q.data || [];
  return (<>
    <PageHead kicker={onboarding ? 'Last step' : 'Places'} title="Your homes" sub={`Where pickups and drop-offs happen. Save up to ${max}.`} action={homes.length > 0 && homes.length < max ? <Button variant="contained" startIcon={<Add />} onClick={() => { setEdit(null); setOpen(true); }}>Add</Button> : undefined} />
    {onboarding && homes.length > 0 && <Alert severity="success" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => router.push('/home')}>Done</Button>}>You're all set. Add another home or start {me?.role === 'driver' ? 'posting drives' : 'requesting rides'}.</Alert>}
    {q.isLoading ? <Loading rows={2} h={200} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : homes.length === 0 ?
      <Empty icon={<HouseOutlined />} title="Add your first home" body="Drop a pin and choose how far you're happy to walk. Only people you carpool with see the exact pickup spot." action={<Button variant="contained" size="large" startIcon={<Add />} onClick={() => { setEdit(null); setOpen(true); }}>Add home</Button>} /> :
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {homes.map(h => { const pos: [number, number] = [h.location.coordinates[1], h.location.coordinates[0]]; return (
          <Card key={h._id} className="rise">
            <MapView center={pos} zoom={15} height={150} markers={[{ pos }]} circles={[{ pos, radius: h.walkingRadius }]} label={h.label + ' map'} />
            <Stack direction="row" alignItems="center" sx={{ p: 2 }}>
              <Box sx={{ flex: 1 }}><Typography fontWeight={700}>{h.label}</Typography><Typography variant="body2" color="text.secondary">Walks up to {h.walkingRadius} m</Typography></Box>
              <IconButton aria-label={'Edit ' + h.label} onClick={() => { setEdit(h); setOpen(true); }}><EditOutlined /></IconButton>
              <IconButton aria-label={'Delete ' + h.label} onClick={() => setDel(h)}><DeleteOutline /></IconButton>
            </Stack>
          </Card>); })}
      </Box>}
    {homes.length >= max && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>You've saved the maximum of {max} homes.</Typography>}
    <HomeEditor open={open} home={edit} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); q.refetch(); toast(edit ? 'Home updated' : 'Home saved'); }} />
    <Confirm open={!!del} title={'Delete ' + (del?.label ?? '') + '?'} body="Active requests or drives from this home may stop matching." confirmText="Delete" danger onClose={() => setDel(null)}
      onConfirm={async () => { try { await api('/homes/' + del!._id, { method: 'DELETE' }); toast('Home deleted'); q.refetch(); } catch (e) { toast(errText(e), 'error'); } setDel(null); }} />
  </>);
}
export default function Page() { return <Suspense><Homes /></Suspense>; }
