'use client';
import Link from 'next/link';
import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Ticket from '@/components/Ticket';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import type { Drive } from '@/lib/types';
import { dirLabel, schedule } from '@/lib/format';
import { mono } from '@/theme';
export default function Rides() {
  const { me } = useSchool(); const q = useApi<Drive[]>('/carpools'); const [tab, setTab] = useState(0); const driver = me?.role === 'driver';
  const pools = (q.data || []).filter(d => d.passengers.length > 0);
  const isUpcoming = (d: Drive) => d.status === 'active' && d.passengers.some(p => p.status === 'locked' || p.status === 'boarded');
  const list = pools.filter(d => tab === 0 ? isUpcoming(d) : !isUpcoming(d));
  const status = (d: Drive) => { const ps = d.passengers; if (d.status === 'cancelled') return ['Cancelled', 'default']; if (ps.every(p => p.status === 'completed' || p.status === 'dropped')) return ['Completed', 'success']; if (ps.every(p => p.status === 'left')) return [driver ? 'Riders left' : 'Left', 'default']; if (ps.some(p => p.status === 'boarded')) return ['On board', 'secondary']; return ['Locked', 'success']; };
  return (<>
    <PageHead kicker="Carpools" title="Rides" />
    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5 }} textColor="primary" indicatorColor="secondary"><Tab label="Upcoming" /><Tab label="History" /></Tabs>
    {q.isLoading ? <Loading rows={2} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : !list.length ?
      (tab === 0 ? <Empty icon={<ConfirmationNumberOutlined />} title="No carpools locked yet" body={driver ? 'Accept a rider proposal in chat to lock a seat.' : 'Once you accept a pickup in chat, your boarding pass lives here.'} /> : <Empty icon={<HistoryOutlined />} title="No past rides" />) :
      <Stack gap={1.5}>{list.map(d => { const [s, c] = status(d); const t = [...d.passengers].sort((a, b) => a.time.localeCompare(b.time))[0]?.time; return (
        <Link key={d._id} href={'/rides/' + d._id} style={{ color: 'inherit', textDecoration: 'none' }}>
          <Ticket onClick={() => {}} accent={c === 'success' ? '#2F7A57' : c === 'secondary' ? '#F2A900' : '#9aa0aa'} stub={<><Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>PICKUP</Typography><Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 20 }}>{t}</Typography></>}>
            <Typography fontWeight={700}>{dirLabel(d.direction)}</Typography>
            <Typography variant="body2" color="text.secondary">{schedule(d)}{driver ? ` · ${d.passengers.filter(p => p.status !== 'left').length} rider(s)` : ''}</Typography>
            <Chip size="small" sx={{ mt: 1 }} label={s} color={c as any} />
          </Ticket></Link>); })}</Stack>}
  </>);
}
