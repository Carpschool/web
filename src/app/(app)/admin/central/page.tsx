'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Search from '@mui/icons-material/Search';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useSchool, ApiError } from '@/lib/school';
import { useToast } from '@/components/Toast';
import { errText, timeAgo } from '@/lib/format';
type S = { _id: string; schoolCode: string; name: string; domains: string[]; baseUrl: string; trusted: boolean; lastHeartbeat?: string };
type U = { id: string; name: string | null; email: string | null; imageUrl: string | null; admin: boolean; school: Record<string, { admin: boolean }> };
const DOMAIN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const alive = (h?: string) => !!h && Date.now() - new Date(h).getTime() < 15 * 60_000;
export default function CentralAdmin() {
  const { centralApi, central, flags, reloadSchools } = useSchool(); const toast = useToast();
  const q = useQuery<S[]>({ queryKey: ['central-admin', central], queryFn: () => centralApi('/admin/schools'), enabled: !!central });
  const [url, setUrl] = useState(''); const [busy, setBusy] = useState(false); const [edit, setEdit] = useState<S | null>(null);
  if (flags && !flags.admin) return <><PageHead title="Network admin" /><Alert severity="warning">This page is for Carpschool network admins.</Alert></>;
  if (q.error instanceof ApiError && q.error.status === 403) return <><PageHead title="Network admin" /><Alert severity="warning">Network admin required.</Alert></>;
  const changed = () => { q.refetch(); reloadSchools?.(); };
  async function onboard() { setBusy(true); try { await centralApi('/admin/schools', { body: { baseUrl: url.trim() } }); toast('School onboarded'); setUrl(''); changed(); } catch (e) { toast(errText(e), 'error'); } setBusy(false); }
  async function trust(s: S, trusted: boolean) { try { await centralApi('/admin/schools/' + s.schoolCode + '/trust', { method: 'PATCH', body: { trusted } }); toast(trusted ? s.name + ' trusted' : s.name + ' untrusted'); changed(); } catch (e) { toast(errText(e), 'error'); } }
  return (<>
    <PageHead kicker="Carpschool network" title="Network admin" />
    <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}><Typography variant="h6" component="h2">Onboard a school</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>We fetch its metadata over HTTPS and verify it signs a challenge.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}><TextField label="School server URL" placeholder="https://school.example.edu" value={url} onChange={e => setUrl(e.target.value)} /><Button variant="contained" disabled={!/^https:\/\//.test(url) || busy} onClick={onboard} sx={{ flexShrink: 0 }}>{busy ? 'Checking…' : 'Onboard'}</Button></Stack></Card>
    <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Schools</Typography>
    {q.isLoading ? <Loading rows={2} h={80} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : !q.data?.length ? <Empty icon={<span>🏫</span>} title="No schools yet" body="Onboard a school server above." /> :
      <Stack gap={1.5} sx={{ mb: 4 }}>{q.data.map(s => <Card key={s._id} sx={{ p: 2, opacity: s.trusted ? 1 : 0.8 }}><Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Typography fontWeight={700}>{s.name}</Typography><Typography component="span" color="text.secondary" sx={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.schoolCode}</Typography>
            <Chip size="small" variant="outlined" label={alive(s.lastHeartbeat) ? 'Online' : 'Offline'} color={alive(s.lastHeartbeat) ? 'success' : 'default'} />{!s.trusted && <Chip size="small" color="warning" label="Untrusted" />}</Stack>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{s.baseUrl}</Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>{s.domains.map(d => <Chip key={d} size="small" label={'@' + d} />)}</Stack>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>ID {s._id} · heartbeat {s.lastHeartbeat ? timeAgo(s.lastHeartbeat) : 'never'}</Typography></Box>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <FormControlLabel control={<Switch checked={!!s.trusted} onChange={e => trust(s, e.target.checked)} />} label="Trusted" />
          <Tooltip title="Edit school"><IconButton aria-label={'Edit ' + s.name} onClick={() => setEdit(s)}><EditOutlined /></IconButton></Tooltip></Stack>
      </Stack></Card>)}</Stack>}
    <Admins schools={q.data || []} />
    {edit && <EditSchool s={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); changed(); }} />}
  </>);
}
function EditSchool({ s, onClose, onSaved }: { s: S; onClose: () => void; onSaved: () => void }) {
  const { centralApi } = useSchool(); const toast = useToast();
  const [f, setF] = useState({ name: s.name, domains: s.domains, baseUrl: s.baseUrl }); const [busy, setBusy] = useState(false);
  const errs = { name: f.name.trim().length < 2, domains: !f.domains.length || f.domains.some(d => !DOMAIN.test(d)), baseUrl: !/^https:\/\/[^/\s]+\/?$/.test(f.baseUrl.trim()) };
  async function save() {
    const b: any = {}; if (f.name.trim() !== s.name) b.name = f.name.trim(); if (JSON.stringify(f.domains) !== JSON.stringify(s.domains)) b.domains = f.domains; if (f.baseUrl.trim().replace(/\/$/, '') !== s.baseUrl) b.baseUrl = f.baseUrl.trim().replace(/\/$/, '');
    if (!Object.keys(b).length) return onClose();
    setBusy(true); try { await centralApi('/admin/schools/' + s.schoolCode, { method: 'PATCH', body: b }); toast('School updated'); onSaved(); } catch (e) { toast(errText(e), 'error'); setBusy(false); }
  }
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Edit {s.name}</DialogTitle>
    <DialogContent><Stack gap={2} sx={{ pt: 1 }}>
      <TextField label="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={errs.name} helperText={errs.name ? 'At least 2 characters' : ' '} />
      <Autocomplete multiple freeSolo options={[] as string[]} value={f.domains} onChange={(_, v) => setF({ ...f, domains: [...new Set((v as string[]).map(d => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean))] })}
        renderValue={(v, gp) => v.map((d, i) => { const { key, ...p } = gp({ index: i }); return <Chip key={key} {...p} size="small" label={'@' + d} color={DOMAIN.test(d) ? 'default' : 'error'} />; })}
        renderInput={p => <TextField {...p} label="Email domains" placeholder="school.edu" error={errs.domains} helperText={errs.domains ? 'At least one valid domain' : 'Press Enter after each'} />} />
      <TextField label="Server URL" value={f.baseUrl} onChange={e => setF({ ...f, baseUrl: e.target.value })} error={errs.baseUrl} helperText={errs.baseUrl ? 'HTTPS origin, no path' : 'Must serve the same school code and signing key; we re-verify it.'} />
    </Stack></DialogContent>
    <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" disabled={busy || Object.values(errs).some(Boolean)} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button></DialogActions></Dialog>;
}
function Admins({ schools }: { schools: S[] }) {
  const { centralApi } = useSchool(); const toast = useToast(); const { user } = useUser();
  const [term, setTerm] = useState(''); const [query, setQuery] = useState('');
  useEffect(() => { const t = setTimeout(() => setQuery(term.trim()), 350); return () => clearTimeout(t); }, [term]);
  const u = useQuery<U[]>({ queryKey: ['central-users', query], queryFn: () => centralApi('/admin/users' + (query ? '?q=' + encodeURIComponent(query) : '')) });
  const [pending, setPending] = useState<string | null>(null);
  async function put(key: string, path: string, admin: boolean, ok: string) { setPending(key); try { await centralApi(path, { method: 'PUT', body: { admin } }); toast(ok); await u.refetch(); } catch (e) { toast(errText(e), 'error'); } setPending(null); }
  return (<>
    <Typography variant="h6" component="h2">Admins</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>Network admins manage every school. School admins manage one school. Changes apply on the user's next session.</Typography>
    <TextField placeholder="Search by name or email" value={term} onChange={e => setTerm(e.target.value)} sx={{ mb: 1.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }, htmlInput: { 'aria-label': 'Search users' } }} />
    {u.isLoading ? <Loading rows={3} h={72} /> : u.error ? <ErrorState error={u.error} retry={u.refetch} /> : !u.data?.length ? <Empty icon={<span>🔎</span>} title="No users found" /> :
      <Stack gap={1}>{u.data.map(x => { const self = x.id === user?.id; return <Card key={x.id} sx={{ p: 1.75 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}>
          <Stack direction="row" gap={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar src={x.imageUrl || undefined} alt="" sx={{ width: 40, height: 40 }}>{(x.name || x.email || '?')[0]}</Avatar>
            <Box sx={{ minWidth: 0 }}><Typography fontWeight={700} noWrap>{x.name || 'Unnamed'}{self && <Typography component="span" color="text.secondary" fontWeight={400}> (you)</Typography>}</Typography><Typography variant="body2" color="text.secondary" noWrap>{x.email || x.id}</Typography></Box>
          </Stack>
          <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
            {schools.map(s => { const on = x.school?.[s._id]?.admin === true; const k = x.id + s._id; return <Chip key={s._id} size="small" disabled={pending === k} clickable color={on ? 'secondary' : 'default'} variant={on ? 'filled' : 'outlined'}
              label={(on ? '✓ ' : '+ ') + s.name + ' admin'} aria-pressed={on} onClick={() => put(k, '/admin/users/' + x.id + '/schools/' + s._id + '/admin', !on, on ? 'Removed ' + s.name + ' admin' : 'Made ' + s.name + ' admin')} />; })}
            <Tooltip title={self ? "You can't remove your own network admin" : ''}><span><FormControlLabel sx={{ ml: 0.5, mr: 0 }} control={<Switch size="small" checked={x.admin} disabled={(self && x.admin) || pending === x.id} onChange={e => put(x.id, '/admin/users/' + x.id + '/admin', e.target.checked, e.target.checked ? 'Network admin granted' : 'Network admin removed')} />} label="Network admin" /></span></Tooltip>
          </Stack>
        </Stack></Card>; })}</Stack>}
  </>);
}
