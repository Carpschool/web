'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Search from '@mui/icons-material/Search';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Onboard from '@/components/Onboard';
import Ticket from '@/components/Ticket';
import { Empty, ErrorState, Loading } from '@/components/States';
import { useSchool } from '@/lib/school';
const online = (h?: string) => !!h && Date.now() - new Date(h).getTime() < 15 * 60_000;
export default function PickSchool() {
  const { schools, schoolsError, chooseSchool, reloadSchools, school } = useSchool(); const router = useRouter(); const [q, setQ] = useState('');
  const list = useMemo(() => (schools || []).filter(s => (s.name + ' ' + s.schoolCode + ' ' + s.domains.join(' ')).toLowerCase().includes(q.toLowerCase())), [schools, q]);
  return (
    <Onboard step={0} title="Which school do you go to?" sub="Only schools trusted by the Carpschool network are listed.">
      <TextField autoFocus placeholder="Search schools" value={q} onChange={e => setQ(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} inputProps={{ 'aria-label': 'Search schools' }} />
      <Stack gap={1.5} sx={{ mt: 2.5 }}>
        {schoolsError ? <ErrorState error={schoolsError} retry={reloadSchools} /> : !schools ? <Loading rows={2} h={76} /> : list.length === 0 ? <Empty icon={<SchoolOutlined />} title="No matching schools" body="Your school might not be on Carpschool yet." /> :
          list.map(s => (
            <Ticket key={s._id} onClick={() => { chooseSchool(s); router.push('/verify'); }} accent={school?._id === s._id ? '#2F7A57' : '#F2A900'}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} fontSize={17}>{s.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>@{s.domains.join(', @')}</Typography>
                </Box>
                <Chip size="small" label={online(s.lastHeartbeat) ? 'Online' : 'Offline'} color={online(s.lastHeartbeat) ? 'success' : 'default'} variant="outlined" />
                <ChevronRight color="action" />
              </Stack>
            </Ticket>))}
      </Stack>
    </Onboard>
  );
}
