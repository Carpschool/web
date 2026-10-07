'use client';
import Link from 'next/link';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import ChevronRight from '@mui/icons-material/ChevronRight';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import ChatOutlined from '@mui/icons-material/ChatOutlined';
import Ticket from '@/components/Ticket';
import Confirm from '@/components/Confirm';
import { Empty, ErrorState, Loading } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Commute, Drive, Home } from '@/lib/types';
import { dirLabel, errText, runsToday, schedule, shortId } from '@/lib/format';
import { mono } from '@/theme';
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <Box component="section" sx={{ mb: 4 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}><Typography variant="h6" component="h2">{title}</Typography>{action}</Stack>{children}</Box>;
}
function Stub({ top, big }: { top: string; big: string }) { return <><Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>{top}</Typography><Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 20 }}>{big}</Typography></>; }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
export default function Dashboard() {
  const { me, school, api } = useSchool(); const toast = useToast(); const driver = me?.role === 'driver';
  const homes = useApi<Home[]>('/homes');
  const reqs = useApi<Commute[]>(driver ? null : '/requests');
  const drives = useApi<Drive[]>(driver ? '/drives' : null);
  const offers = useApi<{ negotiationId: string; driveId: string; requestId: string }[]>(driver ? null : '/matches', { refetchInterval: 20000 });
  const pools = useApi<Drive[]>('/carpools', { refetchInterval: 30000 });
  const [cancel, setCancel] = useState<Commute | null>(null);
  const homeName = (id: string) => homes.data?.find(h => h._id === id)?.label ?? 'Home';
  const today = (pools.data || []).filter(p => p.status === 'active' && runsToday(p) && p.passengers.some(x => x.status === 'locked' || x.status === 'boarded'));
  const list = driver ? drives : reqs;
  const active = (list.data || []).filter((x: Commute) => x.status === 'active' || x.status === 'locked');
  return (<>
    <Box className="rise" sx={{ mb: 4 }}>
      <Typography variant="overline" color="text.secondary">{school?.name}</Typography>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '2.2rem', sm: '2.8rem' } }}>{greeting()}, {me?.name?.split(' ')[0]}.</Typography>
    </Box>
    {homes.data && homes.data.length === 0 && <Box sx={{ mb: 4 }}><Empty icon={<Add />} title="Add a home to get started" body="Pickups are matched to where you live." action={<Button component={Link} href="/homes" variant="contained">Add home</Button>} /></Box>}
    <Section title="Today">
      {pools.isLoading ? <Loading rows={1} /> : pools.error ? <ErrorState error={pools.error} retry={pools.refetch} /> : today.length === 0 ?
        <Typography color="text.secondary" sx={{ py: 2 }}>No carpools today.</Typography> :
        <Stack gap={1.5}>{today.map(p => { const mine = driver ? p.passengers.filter(x => x.status !== 'left') : p.passengers; const first = [...mine].sort((a, b) => a.time.localeCompare(b.time))[0]; return (
          <Link key={p._id} href={'/rides/' + p._id} style={{ color: 'inherit', textDecoration: 'none' }}>
            <Ticket accent="#2F7A57" stub={<Stub top="PICKUP" big={first?.time ?? p.startTime} />}>
              <Typography fontWeight={700}>{dirLabel(p.direction)}</Typography>
              <Typography variant="body2" color="text.secondary">{driver ? `${mine.length} rider${mine.length === 1 ? '' : 's'} · tap for pickup order` : 'Tap to show your boarding PIN'}</Typography>
            </Ticket></Link>); })}</Stack>}
    </Section>
    {!driver && (offers.data?.length ?? 0) > 0 && <Section title="Drivers reaching out">
      <Stack gap={1.5}>{offers.data!.map(o => (<Link key={o.negotiationId} href={'/chats/' + o.negotiationId} style={{ color: 'inherit', textDecoration: 'none' }}>
        <Ticket accent="#F2A900"><Stack direction="row" alignItems="center" gap={2}><ChatOutlined color="action" /><Box sx={{ flex: 1 }}><Typography fontWeight={700}>A driver wants to pick you up</Typography><Typography variant="body2" color="text.secondary">Open the chat to agree on a pickup</Typography></Box><ChevronRight /></Stack></Ticket></Link>))}</Stack>
    </Section>}
    <Section title={driver ? 'Your drives' : 'Your requests'} action={<Button component={Link} href={driver ? '/drives/new' : '/requests/new'} variant="contained" startIcon={<Add />}>{driver ? 'Post drive' : 'Request'}</Button>}>
      {list.isLoading ? <Loading rows={2} /> : list.error ? <ErrorState error={list.error} retry={list.refetch} /> : active.length === 0 ?
        <Empty icon={driver ? <DirectionsCarOutlined /> : <HourglassEmpty />} title={driver ? 'No drives posted' : 'No ride requests'} body={driver ? 'Post your usual commute and we will show riders along the way.' : 'Tell drivers when you need to get to school or home.'} /> :
        <Stack gap={1.5}>{active.map((x: any) => driver ? (
          <Link key={x._id} href={'/drives/' + x._id} style={{ color: 'inherit', textDecoration: 'none' }}>
            <Ticket stub={<Stub top="SEATS" big={`${x.availableSeats}/${x.seats}`} />}>
              <Typography fontWeight={700}>{dirLabel(x.direction)} · {homeName(x.homeId)}</Typography>
              <Typography variant="body2" color="text.secondary">{schedule(x)} · {x.startTime}–{x.endTime}</Typography>
              <Chip size="small" sx={{ mt: 1 }} label="Find riders" color="secondary" />
            </Ticket></Link>) : (
          <Ticket key={x._id} accent={x.status === 'locked' ? '#2F7A57' : '#F2A900'} stub={<Stub top={x.direction === 'to-school' ? 'ARRIVE' : 'LEAVE'} big={x.startTime} />}>
            <Stack direction="row" alignItems="flex-start"><Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700}>{dirLabel(x.direction)} · {homeName(x.homeId)}</Typography>
              <Typography variant="body2" color="text.secondary">{schedule(x)} · {x.startTime}–{x.endTime}</Typography>
              <Chip size="small" sx={{ mt: 1 }} label={x.status === 'locked' ? 'Carpool locked' : 'Waiting for drivers'} color={x.status === 'locked' ? 'success' : 'default'} variant={x.status === 'locked' ? 'filled' : 'outlined'} />
            </Box>{x.status === 'active' && <IconButton aria-label="Cancel request" size="small" onClick={() => setCancel(x)}><Close /></IconButton>}</Stack>
          </Ticket>))}</Stack>}
    </Section>
    <Confirm open={!!cancel} title="Cancel this request?" body="Drivers will no longer see it." confirmText="Cancel request" danger onClose={() => setCancel(null)}
      onConfirm={async () => { try { await api('/requests/' + cancel!._id, { method: 'DELETE' }); toast('Request cancelled'); reqs.refetch(); } catch (e) { toast(errText(e), 'error'); } setCancel(null); }} />
  </>);
}
