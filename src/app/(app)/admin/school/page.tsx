'use client';
import { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import { ApiError } from '@/lib/school';
import { errText, shortId, timeAgo } from '@/lib/format';
export default function SchoolAdmin() {
  const { api, school } = useSchool(); const toast = useToast(); const [tab, setTab] = useState(0);
  const users = useApi<any[]>('/admin/users'); const reports = useApi<any[]>(tab === 1 ? '/admin/reports' : null); const domains = useApi<string[] | { domains: string[] }>(tab === 2 ? '/admin/domains' : null); const mailer = useApi<any>(tab === 3 ? '/admin/mailer' : null);
  const [dom, setDom] = useState(''); useEffect(() => { const d: any = domains.data; if (d) setDom((Array.isArray(d) ? d : d.domains || []).join(', ')); }, [domains.data]);
  if (users.error instanceof ApiError && users.error.status === 403) return <><PageHead title="School admin" /><Alert severity="warning">You're not an admin for {school?.name}.</Alert></>;
  const act = async (fn: () => Promise<any>, ok: string, refetch: () => any) => { try { await fn(); toast(ok); refetch(); } catch (e) { toast(errText(e), 'error'); } };
  return (<>
    <PageHead kicker={school?.name} title="School admin" />
    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }} indicatorColor="secondary"><Tab label="Users" /><Tab label="Reports" /><Tab label="Email domains" /><Tab label="Mailer" /></Tabs>
    {tab === 0 && (users.isLoading ? <Loading rows={3} h={48} /> : users.error ? <ErrorState error={users.error} retry={users.refetch} /> : !users.data?.length ? <Empty icon={<span>👥</span>} title="No users yet" /> :
      <Card><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell align="right">Banned</TableCell></TableRow></TableHead>
        <TableBody>{users.data.map(u => <TableRow key={u._id}><TableCell>{u.name || shortId(u.sub)}</TableCell><TableCell>{u.eduEmail || (u.verified ? '' : 'unverified')}</TableCell><TableCell>{u.role || '—'}</TableCell>
          <TableCell align="right"><Switch checked={!!u.banned} color="error" inputProps={{ 'aria-label': 'Ban ' + (u.name || u.sub) }} onChange={e => act(() => api('/admin/users/' + u._id + '/ban', { method: 'PUT', body: { banned: e.target.checked } }), e.target.checked ? 'User banned' : 'User unbanned', users.refetch)} /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Card>)}
    {tab === 1 && (reports.isLoading ? <Loading rows={2} /> : reports.error ? <ErrorState error={reports.error} retry={reports.refetch} /> : !reports.data?.length ? <Empty icon={<span>🛡️</span>} title="No reports" body="Nothing to review." /> :
      <Stack gap={1.5}>{reports.data.map(r => <Card key={r._id} sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
        <div><Typography fontWeight={700}>About {shortId(r.subject)} · by {shortId(r.reporter)}</Typography><Typography variant="body2" color="text.secondary">{timeAgo(r.createdAt)}</Typography><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{r.reason}</Typography></div>
        <TextField select size="small" value={r.status} sx={{ width: 140, flexShrink: 0 }} label="Status" onChange={e => act(() => api('/admin/reports/' + r._id, { method: 'PUT', body: { status: e.target.value } }), 'Report updated', reports.refetch)}>
          {['open', 'resolved', 'dismissed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Stack></Card>)}</Stack>)}
    {tab === 2 && (domains.isLoading ? <Loading rows={1} h={56} /> : domains.error ? <ErrorState error={domains.error} retry={domains.refetch} /> :
      <Card sx={{ p: 2.5 }}><Typography sx={{ mb: 2 }} color="text.secondary">Students must verify an email at one of these domains.</Typography>
        <TextField label="Domains (comma separated)" value={dom} onChange={e => setDom(e.target.value)} />
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => act(() => api('/admin/domains', { method: 'PUT', body: { domains: dom.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } }), 'Domains saved', domains.refetch)}>Save domains</Button></Card>)}
    {tab === 3 && (mailer.isLoading ? <Loading rows={1} h={56} /> : mailer.error ? <ErrorState error={mailer.error} retry={mailer.refetch} /> :
      <Card sx={{ p: 2.5 }}><Stack gap={1}><Typography>Provider: <b>{mailer.data?.provider}</b></Typography><Typography>Sender: <b>{mailer.data?.user || '—'}</b></Typography>
        <Chip sx={{ alignSelf: 'flex-start' }} color={mailer.data?.configured ? 'success' : 'warning'} label={mailer.data?.configured ? 'Configured' : 'Not configured'} />
        <Typography variant="body2" color="text.secondary">Mail credentials are set in the school server environment.</Typography></Stack></Card>)}
  </>);
}
