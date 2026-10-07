'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { ErrorState, Loading, PageHead } from '@/components/States';
import { useSchool, ApiError } from '@/lib/school';
import { useToast } from '@/components/Toast';
import { errText, timeAgo } from '@/lib/format';
export default function CentralAdmin() {
  const { centralApi, central, flags } = useSchool(); const toast = useToast();
  const q = useQuery<any[]>({ queryKey: ['central-admin', central], queryFn: () => centralApi('/admin/schools'), enabled: !!central });
  const [url, setUrl] = useState(''); const [busy, setBusy] = useState(false);
  const [ad, setAd] = useState({ email: '', schoolId: '', admin: true });
  if (flags && !flags.admin) return <><PageHead title="Network admin" /><Alert severity="warning">This page is for Carpschool network admins.</Alert></>;
  if (q.error instanceof ApiError && q.error.status === 403) return <><PageHead title="Network admin" /><Alert severity="warning">Network admin required.</Alert></>;
  async function onboard() { setBusy(true); try { await centralApi('/admin/schools', { body: { baseUrl: url.trim() } }); toast('School onboarded'); setUrl(''); q.refetch(); } catch (e) { toast(errText(e), 'error'); } setBusy(false); }
  async function assign() { try { const r = await fetch('/api/admin/school-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ad) }); const j = await r.json(); if (!r.ok) throw new Error(j.message); toast(ad.admin ? 'School admin granted' : 'School admin removed'); } catch (e) { toast(errText(e), 'error'); } }
  const alive = (h?: string) => !!h && Date.now() - new Date(h).getTime() < 15 * 60_000;
  return (<>
    <PageHead kicker="Carpschool network" title="Network admin" />
    <Card sx={{ p: 2.5, mb: 3 }}><Typography variant="h6" component="h2">Onboard a school</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>We fetch its metadata over HTTPS and verify it signs a challenge.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}><TextField label="School server URL" placeholder="https://school.example.edu" value={url} onChange={e => setUrl(e.target.value)} /><Button variant="contained" disabled={!/^https:\/\//.test(url) || busy} onClick={onboard} sx={{ flexShrink: 0 }}>{busy ? 'Checking…' : 'Onboard'}</Button></Stack></Card>
    <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Schools</Typography>
    {q.isLoading ? <Loading rows={2} h={80} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> :
      <Stack gap={1.5} sx={{ mb: 3 }}>{(q.data || []).map(s => <Card key={s._id} sx={{ p: 2 }}><Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
        <Box sx={{ flex: 1, minWidth: 200 }}><Typography fontWeight={700}>{s.name} <Typography component="span" color="text.secondary" sx={{ fontFamily: 'var(--font-mono)' }}>· {s.schoolCode}</Typography></Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{s.baseUrl}</Typography>
          <Typography variant="caption" color="text.secondary">ID {s._id} · heartbeat {s.lastHeartbeat ? timeAgo(s.lastHeartbeat) : 'never'}</Typography></Box>
        <Chip size="small" label={alive(s.lastHeartbeat) ? 'Online' : 'Offline'} color={alive(s.lastHeartbeat) ? 'success' : 'default'} />
        <FormControlLabel control={<Switch checked={!!s.trusted} onChange={async e => { try { await centralApi('/admin/schools/' + s.schoolCode + '/trust', { method: 'PATCH', body: { trusted: e.target.checked } }); q.refetch(); toast('Updated'); } catch (er) { toast(errText(er), 'error'); } }} />} label="Trusted" />
      </Stack></Card>)}</Stack>}
    <Card sx={{ p: 2.5 }}><Typography variant="h6" component="h2">School admins</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Grant or remove admin for a school. Takes effect on their next session.</Typography>
      <Stack gap={1.5}><TextField label="User's email" value={ad.email} onChange={e => setAd({ ...ad, email: e.target.value })} />
        <TextField select label="School" value={ad.schoolId} onChange={e => setAd({ ...ad, schoolId: e.target.value })}>{(q.data || []).map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}</TextField>
        <FormControlLabel control={<Switch checked={ad.admin} onChange={e => setAd({ ...ad, admin: e.target.checked })} />} label={ad.admin ? 'Grant admin' : 'Remove admin'} />
        <Button variant="contained" disabled={!ad.email || !ad.schoolId} onClick={assign} sx={{ alignSelf: 'flex-start' }}>Save</Button></Stack></Card>
  </>);
}
