'use client';
import Link from 'next/link';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import Ticket from '@/components/Ticket';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import type { Negotiation } from '@/lib/types';
import { shortId, timeAgo } from '@/lib/format';
export default function Chats() {
  const { me } = useSchool(); const q = useApi<Negotiation[]>('/negotiations', { refetchInterval: 20000 }); const driver = me?.role === 'driver';
  const list = [...(q.data || [])].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return (<>
    <PageHead kicker="Negotiate" title="Chats" sub="Agree on a pickup spot and time, then lock the seat." />
    {q.isLoading ? <Loading rows={3} h={72} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : !list.length ?
      <Empty icon={<ChatBubbleOutline />} title="No conversations yet" body={driver ? 'Open one of your drives and reach out to a rider.' : 'When a driver reaches out about your request, the chat shows up here.'} /> :
      <Stack gap={1.5}>{list.map(n => { const other = driver ? n.rider : n.driver; return (
        <Link key={n._id} href={'/chats/' + n._id} style={{ color: 'inherit', textDecoration: 'none' }}>
          <Ticket accent={n.status === 'open' ? '#F2A900' : '#2F7A57'} onClick={() => {}}>
            <Stack direction="row" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'secondary.main', fontWeight: 700 }}>{shortId(other).slice(0, 2)}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700}>{driver ? 'Rider' : 'Driver'} · {shortId(other)}</Typography><Typography variant="body2" color="text.secondary">{timeAgo(n.updatedAt || n.createdAt)}</Typography></Box>
              <Chip size="small" label={n.status === 'open' ? 'Negotiating' : n.status === 'locked' ? 'Locked' : n.status} color={n.status === 'open' ? 'secondary' : 'success'} />
            </Stack>
          </Ticket></Link>); })}</Stack>}
  </>);
}
