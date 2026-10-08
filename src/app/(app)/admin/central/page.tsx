'use client';
import { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
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
import InputAdornment from '@mui/material/InputAdornment';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Search from '@mui/icons-material/Search';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useSchool, ApiError } from '@/lib/school';
import { useToast } from '@/components/Toast';
import { errText, timeAgo } from '@/lib/format';
type S = { _id: string; schoolCode: string; name: string; domains: string[]; baseUrl: string; trusted: boolean; enabled?: boolean; lastHeartbeat?: string };
type U = { id: string; name: string | null; email: string | null; imageUrl: string | null; admin: boolean; school: Record<string, { admin: boolean }> };
const alive = (h?: string) => !!h && Date.now() - new Date(h).getTime() < 15 * 60_000;
const CODE = /^[0-9a-f]{7}$/i, SCODE = /^[a-z0-9_-]{2,64}$/, ORIGIN = /^https:\/\/[^/\s]+\/?$/;
export default function CentralAdmin() {
  const { centralApi, central, flags, reloadSchools } = useSchool(); const toast = useToast();
  const q = useQuery<S[]>({ queryKey: ['central-admin', central], queryFn: () => centralApi('/admin/schools'), enabled: !!central });
  const [tab, setTab] = useState(0); const [edit, setEdit] = useState<S | null>(null); const [who, setWho] = useState<string | null>(null);
  if (flags && !flags.admin) return <><PageHead title="Network admin" /><Alert severity="warning">This page is for Carpschool network admins.</Alert></>;
  if (q.error instanceof ApiError && q.error.status === 403) return <><PageHead title="Network admin" /><Alert severity="warning">Network admin required.</Alert></>;
  const changed = () => { q.refetch(); reloadSchools?.(); };
  async function enable(s: S, enabled: boolean) { try { await centralApi('/admin/schools/' + s.schoolCode + '/enabled', { method: 'PATCH', body: { enabled } }); toast(s.name + (enabled ? ' enabled' : ' disabled')); changed(); } catch (e) { toast(errText(e), 'error'); } }
  return (<>
    <PageHead kicker="Carpschool network" title="Network admin" />
    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 2, mx: { xs: -1, sm: 0 } }} indicatorColor="secondary"><Tab label="Schools" /><Tab label="Users" /><Tab label="Add school" /><Tab label="Settings" /></Tabs>
    {tab === 0 && (q.isLoading ? <Loading rows={2} h={80} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : !q.data?.length ? <Empty icon={<span>🏫</span>} title="No schools yet" body="Add a school server from the Add school tab." /> :
      <Stack gap={1.5}>{q.data.map(s => { const on = s.enabled !== false; return <Card key={s._id} sx={{ p: 2, opacity: on ? 1 : 0.75 }}><Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Typography fontWeight={700}>{s.name}</Typography><Typography component="span" color="text.secondary" sx={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.schoolCode}</Typography>
            <Chip size="small" variant="outlined" label={alive(s.lastHeartbeat) ? 'Online' : 'Offline'} color={alive(s.lastHeartbeat) ? 'success' : 'default'} />{!on && <Chip size="small" color="warning" label="Disabled" />}</Stack>
          <Typography variant="body2" color="text.secondary" noWrap title={s.baseUrl} sx={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.baseUrl.replace(/^https:\/\//, '')}</Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>{s.domains.map(d => <Chip key={d} size="small" label={'@' + d} />)}</Stack>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>ID {s._id} · heartbeat {s.lastHeartbeat ? timeAgo(s.lastHeartbeat) : 'never'}</Typography></Box>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <FormControlLabel control={<Switch checked={on} onChange={e => enable(s, e.target.checked)} />} label="Enabled" />
          <Tooltip title="School admins"><IconButton aria-label={'Manage admins of ' + s.name} onClick={() => setEdit(s)}><EditOutlined /></IconButton></Tooltip></Stack>
      </Stack></Card>; })}</Stack>)}
    {tab === 1 && <Users onOpen={setWho} />}
    {tab === 2 && <AddSchool onDone={() => { changed(); setTab(0); }} />}
    {tab === 3 && <><CentralSettings />{LEGAL.map(l => <LegalEditor key={l.doc} {...l} />)}</>}
    {edit && <SchoolAdmins s={edit} onClose={() => setEdit(null)} onOpen={setWho} />}
    {who && <UserDialog id={who} onClose={() => setWho(null)} />}
  </>);
}
function SchoolAdmins({ s, onClose, onOpen }: { s: S; onClose: () => void; onOpen: (id: string) => void }) {
  const { centralApi } = useSchool(); const toast = useToast();
  const u = useQuery<(U & { schoolAdmin: boolean })[]>({ queryKey: ['school-users', s.schoolCode], queryFn: () => centralApi('/admin/schools/' + s.schoolCode + '/users') });
  const [pending, setPending] = useState<string | null>(null);
  async function set(x: U, admin: boolean) { setPending(x.id); try { await centralApi('/admin/users/' + x.id + '/schools/' + s._id + '/admin', { method: 'PUT', body: { admin } }); toast((x.name || 'User') + (admin ? ' is now a school admin' : ' is no longer a school admin')); await u.refetch(); } catch (e) { toast(errText(e), 'error'); } setPending(null); }
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" scroll="paper"><DialogTitle>{s.name}<Typography variant="body2" color="text.secondary">School settings are managed by its school admins. Choose who they are; it applies on their next session.</Typography></DialogTitle>
    <DialogContent dividers sx={{ p: 0 }}>{u.isLoading ? <Box sx={{ p: 2 }}><Loading rows={3} h={48} /></Box> : u.error ? <Box sx={{ p: 2 }}><ErrorState error={u.error} retry={u.refetch} /></Box> : !u.data?.length ? <Box sx={{ p: 2 }}><Empty icon={<span>👥</span>} title="No users yet" body="People show up here after they open this school in Carpschool." /></Box> :
      <List dense>{u.data.map(x => <Stack key={x.id} direction="row" alignItems="center" sx={{ pr: 2 }}>
        <ListItemButton onClick={() => onOpen(x.id)} sx={{ flex: 1, minWidth: 0 }}><ListItemAvatar><Avatar src={x.imageUrl || undefined} alt="">{(x.name || x.email || '?')[0]}</Avatar></ListItemAvatar><ListItemText primary={x.name || 'Unnamed'} secondary={x.email || x.id} slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }} /></ListItemButton>
        <FormControlLabel labelPlacement="start" control={<Switch checked={x.schoolAdmin} disabled={pending === x.id} onChange={e => set(x, e.target.checked)} />} label="Admin" /></Stack>)}</List>}</DialogContent>
    <DialogActions><Button onClick={onClose}>Done</Button></DialogActions></Dialog>;
}
function Users({ onOpen }: { onOpen: (id: string) => void }) {
  const { centralApi } = useSchool(); const { user } = useUser();
  const [term, setTerm] = useState(''); const [query, setQuery] = useState('');
  useEffect(() => { const t = setTimeout(() => setQuery(term.trim()), 350); return () => clearTimeout(t); }, [term]);
  const u = useQuery<U[]>({ queryKey: ['central-users', query], queryFn: () => centralApi('/admin/users' + (query ? '?q=' + encodeURIComponent(query) : '')) });
  return (<>
    <TextField placeholder="Search by name or email" value={term} onChange={e => setTerm(e.target.value)} sx={{ mb: 1.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }, htmlInput: { 'aria-label': 'Search users' } }} />
    {u.isLoading ? <Loading rows={3} h={64} /> : u.error ? <ErrorState error={u.error} retry={u.refetch} /> : !u.data?.length ? <Empty icon={<span>🔎</span>} title="No users found" /> :
      <Card><List disablePadding>{u.data.map((x, i) => <Box key={x.id}>{i > 0 && <Divider component="div" />}<ListItemButton onClick={() => onOpen(x.id)}>
        <ListItemAvatar><Avatar src={x.imageUrl || undefined} alt="">{(x.name || x.email || '?')[0]}</Avatar></ListItemAvatar>
        <ListItemText primary={<>{x.name || 'Unnamed'}{x.id === user?.id && <Typography component="span" color="text.secondary"> (you)</Typography>}</>} secondary={x.email || x.id} slotProps={{ secondary: { noWrap: true } }} sx={{ minWidth: 0 }} />
        {x.admin && <Tooltip title="Managed in the Clerk dashboard"><Chip size="small" color="primary" label="Network admin" sx={{ ml: 1 }} /></Tooltip>}
      </ListItemButton></Box>)}</List></Card>}
  </>);
}
type Detail = U & { firstSeen: string | null; lastSeen: string | null; schools: { _id: string; schoolCode: string; name: string; enabled?: boolean; used: boolean; schoolAdmin: boolean }[] };
function UserDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { centralApi } = useSchool();
  const d = useQuery<Detail>({ queryKey: ['central-user', id], queryFn: () => centralApi('/admin/users/' + id) });
  const x = d.data;
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" scroll="paper"><DialogTitle>{x?.name || 'User'}</DialogTitle>
    <DialogContent dividers>{d.isLoading ? <Loading rows={3} h={40} /> : d.error ? <ErrorState error={d.error} retry={d.refetch} /> : x && <Stack gap={2}>
      <Stack direction="row" gap={1.5} alignItems="center"><Avatar src={x.imageUrl || undefined} alt="" sx={{ width: 48, height: 48 }}>{(x.name || '?')[0]}</Avatar>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ wordBreak: 'break-all' }}>{x.email || '—'}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'var(--font-mono)' }}>{x.id}</Typography></Box></Stack>
      <Stack direction="row" gap={0.75} flexWrap="wrap">{x.admin && <Chip size="small" color="primary" label="Network admin" />}<Chip size="small" variant="outlined" label={'First seen ' + (x.firstSeen ? timeAgo(x.firstSeen) : 'never')} /><Chip size="small" variant="outlined" label={'Last active ' + (x.lastSeen ? timeAgo(x.lastSeen) : 'never')} /></Stack>
      <Divider />
      <Typography fontWeight={700} component="h3">Schools</Typography>
      {!x.schools.length ? <Typography variant="body2" color="text.secondary">Hasn't opened a school yet.</Typography> : x.schools.map(s => <Stack key={s._id} direction="row" gap={1} alignItems="center" flexWrap="wrap">
        <Typography>{s.name}</Typography><Typography color="text.secondary" sx={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.schoolCode}</Typography>
        {s.used && <Chip size="small" label="Member" />}{s.schoolAdmin && <Chip size="small" color="secondary" label="School admin" />}{s.enabled === false && <Chip size="small" color="warning" label="Disabled" />}</Stack>)}
      <Typography variant="caption" color="text.secondary">Ride data, homes and reports live on each school's server; its school admins can see them.</Typography>
    </Stack>}</DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button></DialogActions></Dialog>;
}
function AddSchool({ onDone }: { onDone: () => void }) {
  const { centralApi } = useSchool(); const toast = useToast();
  const [f, setF] = useState({ baseUrl: '', code: '', schoolCode: '', name: '' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setErr(''); setF({ ...f, [k]: k === 'schoolCode' ? e.target.value.toLowerCase() : e.target.value }); };
  const bad = { baseUrl: !!f.baseUrl && !ORIGIN.test(f.baseUrl.trim()), code: !!f.code && !CODE.test(f.code.trim()), schoolCode: !!f.schoolCode && !SCODE.test(f.schoolCode), name: !!f.name && f.name.trim().length < 2 };
  const ready = ORIGIN.test(f.baseUrl.trim()) && CODE.test(f.code.trim()) && SCODE.test(f.schoolCode) && f.name.trim().length >= 2;
  async function claim() {
    setBusy(true); setErr('');
    try { await centralApi('/admin/schools/claim', { body: { baseUrl: f.baseUrl.trim().replace(/\/$/, ''), code: f.code.trim(), schoolCode: f.schoolCode, name: f.name.trim() } }); toast(f.name.trim() + ' added and trusted'); setF({ baseUrl: '', code: '', schoolCode: '', name: '' }); onDone(); }
    catch (e) { setErr(errText(e)); }
    setBusy(false);
  }
  return <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
    <Typography variant="h6" component="h2">Add school</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Start a fresh school server and copy the 7-character setup code from its log. The code works once; five wrong tries lock it and print a new one.</Typography>
    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      <TextField label="School server URL" placeholder="https://school.example.edu" value={f.baseUrl} onChange={set('baseUrl')} error={bad.baseUrl} helperText={bad.baseUrl ? 'HTTPS origin, no path' : ' '} sx={{ gridColumn: { sm: '1 / -1' } }} />
      <TextField label="Setup code" placeholder="a1b2c3d" value={f.code} onChange={set('code')} error={bad.code} helperText={bad.code ? '7 hex characters' : ' '} slotProps={{ htmlInput: { maxLength: 7, autoComplete: 'off', spellCheck: false, style: { fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.12em' } } }} />
      <TextField label="School code" placeholder="sentinel" value={f.schoolCode} onChange={set('schoolCode')} error={bad.schoolCode} helperText={bad.schoolCode ? 'a-z, 0-9, - or _' : 'Permanent short id'} />
      <TextField label="Display name" placeholder="Sentinel Secondary" value={f.name} onChange={set('name')} error={bad.name} helperText={bad.name ? 'At least 2 characters' : 'The school admin can rename it later'} sx={{ gridColumn: { sm: '1 / -1' } }} />
    </Box>
    {err && <Alert severity="error" sx={{ mt: 1 }}>{err}</Alert>}
    <Button variant="contained" disabled={!ready || busy} onClick={claim} sx={{ mt: 1.5 }}>{busy ? 'Claiming…' : 'Claim school'}</Button>
  </Card>;
}

type CSet = { publicUrl: string; corsOrigins: string[]; webhookSecretSet: boolean };
function CentralSettings() {
  const { centralApi } = useSchool(); const toast = useToast();
  const q = useQuery<CSet>({ queryKey: ['central-settings'], queryFn: () => centralApi('/admin/settings') });
  const [f, setF] = useState({ publicUrl: '', origins: '', secret: '' }); const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) setF({ publicUrl: q.data.publicUrl, origins: q.data.corsOrigins.join('\n'), secret: '' }); }, [q.data]);
  if (!q.data) return null;
  const origins = f.origins.split(/[\s,]+/).filter(Boolean);
  const bad = { publicUrl: !ORIGIN.test(f.publicUrl.trim()), origins: !origins.length || origins.some(o => !/^https?:\/\/[^/\s]+\/?$/.test(o)), secret: !!f.secret && !/^whsec_[A-Za-z0-9+/=]{16,}$/.test(f.secret.trim()) };
  async function save(body: any, ok: string) { setBusy(true); try { await centralApi('/admin/settings', { method: 'PUT', body }); toast(ok); setF(x => ({ ...x, secret: '' })); await q.refetch(); } catch (e) { toast(errText(e), 'error'); } setBusy(false); }
  return <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
    <Typography variant="h6" component="h2">Central settings</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Stored in the central database. Changing the public URL changes the token issuer that every school has pinned.</Typography>
    <Stack gap={1.5}>
      <TextField label="Central public URL" value={f.publicUrl} onChange={e => setF({ ...f, publicUrl: e.target.value })} error={bad.publicUrl} helperText={bad.publicUrl ? 'HTTPS origin, no path' : ' '} />
      <TextField label="Web app origins" multiline minRows={2} value={f.origins} onChange={e => setF({ ...f, origins: e.target.value })} error={bad.origins} helperText={bad.origins ? 'One origin per line' : 'Allowed for CORS and Clerk sign-in'} />
      <TextField label="Clerk webhook secret" type="password" placeholder={q.data.webhookSecretSet ? '•••••••• saved' : 'whsec_…'} value={f.secret} onChange={e => setF({ ...f, secret: e.target.value })} error={bad.secret} helperText={bad.secret ? 'Should start with whsec_' : 'Write-only. Leave blank to keep the current one'} autoComplete="off" />
      <Stack direction="row" gap={1}>
        <Button variant="contained" disabled={busy || bad.publicUrl || bad.origins || bad.secret} onClick={() => save({ publicUrl: f.publicUrl.trim(), corsOrigins: origins.map(o => o.replace(/\/$/, '')), ...(f.secret ? { webhookSecret: f.secret.trim() } : {}) }, 'Central settings saved')}>{busy ? 'Saving…' : 'Save'}</Button>
        {q.data.webhookSecretSet && <Button color="error" disabled={busy} onClick={() => save({ webhookSecret: null }, 'Webhook secret removed')}>Remove secret</Button>}
      </Stack>
    </Stack>
  </Card>;
}

const LEGAL: { doc: 'tos' | 'privacy'; label: string }[] = [{ doc: 'tos', label: 'Terms of Service' }, { doc: 'privacy', label: 'Privacy Policy' }];
function LegalEditor({ doc, label }: { doc: 'tos' | 'privacy'; label: string }) {
  const { central, centralApi } = useSchool(); const toast = useToast();
  const q = useQuery<{ markdown: string; updatedAt: string | null }>({ queryKey: ['legal', doc], enabled: !!central, queryFn: async () => { const r = await fetch(central + '/legal/' + doc, { cache: 'no-store' }); if (!r.ok) throw new Error('Could not load'); return r.json(); } });
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) setText(q.data.markdown); }, [q.data]);
  if (!q.data) return null;
  const dirty = text !== q.data.markdown;
  async function save() { setBusy(true); try { await centralApi('/admin/legal/' + doc, { method: 'PUT', body: { markdown: text } }); toast(label + ' saved'); await q.refetch(); } catch (e) { toast(errText(e), 'error'); } setBusy(false); }
  return <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1} flexWrap="wrap"><Typography variant="h6" component="h2">{label}</Typography><Button size="small" href={'/' + doc} target="_blank" rel="noopener">View page</Button></Stack>
    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Markdown. Shown publicly at /{doc}; blank shows &ldquo;Coming soon&rdquo;. HTML is not rendered.{q.data.updatedAt ? ' Last saved ' + new Date(q.data.updatedAt).toLocaleString() + '.' : ''}</Typography>
    <TextField multiline minRows={8} maxRows={30} fullWidth value={text} onChange={e => setText(e.target.value)} inputProps={{ maxLength: 100000, style: { fontFamily: 'var(--font-mono)', fontSize: 13 } }} placeholder="Blank" />
    <Stack direction="row" gap={1} sx={{ mt: 1.5 }}><Button variant="contained" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>{dirty && <Button disabled={busy} onClick={() => setText(q.data!.markdown)}>Discard</Button>}</Stack>
  </Card>;
}

