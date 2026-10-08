'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';
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
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import PlaceSearch from '@/components/PlaceSearch';
import { Empty, ErrorState, Loading, PageHead } from '@/components/States';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import { ApiError } from '@/lib/school';
import { errText, shortId, timeAgo } from '@/lib/format';
const PICK = 'carpschool.adminSchool';
export default function SchoolAdmin() {
  const { apiFor, school: active, schools, flags } = useSchool(); const toast = useToast(); const [tab, setTab] = useState(0);
  const mine = useMemo(() => (schools || []).filter(s => flags?.schoolAdminOf.includes(s._id)), [schools, flags]);
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => { setPick(localStorage.getItem(PICK)); }, []);
  const school = mine.find(s => s.schoolCode === pick) ?? mine.find(s => s.schoolCode === active?.schoolCode) ?? mine[0] ?? null;
  const choose = (code: string) => { localStorage.setItem(PICK, code); setPick(code); setTab(t => t); };
  const api = (path: string, o?: any) => apiFor(school!, path, o);
  const q = <T,>(path: string | null) => useQuery<T>({ queryKey: ['admin', school?.schoolCode, path], queryFn: () => apiFor<T>(school!, path!), enabled: !!school && !!path }); // eslint-disable-line react-hooks/rules-of-hooks
  useEffect(() => { const u = new URL(window.location.href); const r = u.searchParams.get('mailer'); if (u.searchParams.get('tab') === 'mailer' || r) setTab(3); if (r) { toast(r === 'connected' ? 'Gmail connected' : 'Gmail connection failed', r === 'connected' ? undefined : 'error'); u.searchParams.delete('mailer'); window.history.replaceState(null, '', u.pathname + u.search); } }, []); // eslint-disable-line
  const users = q<any[]>('/admin/users'); const reports = q<any[]>(tab === 1 ? '/admin/reports' : null); const settings = q<Settings>(tab >= 2 ? '/admin/settings' : null);
  const [open, setOpen] = useState<string | null>(null);
  if (flags && !mine.length) return <><PageHead title="School admin" /><Alert severity="warning">You're not a school admin.</Alert></>;
  if (!school) return <><PageHead title="School admin" /><Loading rows={3} h={48} /></>;
  if (users.error instanceof ApiError && users.error.status === 403) return <><PageHead title="School admin" /><Alert severity="warning">You're not an admin for {school.name}. If this just changed, sign out and back in.</Alert></>;
  const act = async (fn: () => Promise<any>, ok: string, refetch: () => any) => { try { await fn(); toast(ok); refetch(); } catch (e) { toast(errText(e), 'error'); } };
  return (<>
    {mine.length > 1 && <TextField select size="small" label="School" value={school.schoolCode} onChange={e => choose(e.target.value)} sx={{ mb: 1.5, minWidth: 220, maxWidth: '100%' }}>
      {mine.map(s => <MenuItem key={s._id} value={s.schoolCode}>{s.name}</MenuItem>)}</TextField>}
    <PageHead kicker={mine.length > 1 ? undefined : school.name} title="School admin" />
    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 2, mx: { xs: -1, sm: 0 } }} indicatorColor="secondary"><Tab label="Users" /><Tab label="Reports" /><Tab label="School settings" /><Tab label="Mailer" /></Tabs>
    {tab === 0 && (users.isLoading ? <Loading rows={3} h={48} /> : users.error ? <ErrorState error={users.error} retry={users.refetch} /> : !users.data?.length ? <Empty icon={<span>👥</span>} title="No users yet" /> :
      <Card><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell><TableCell>Role</TableCell><TableCell align="right">Banned</TableCell></TableRow></TableHead>
        <TableBody>{users.data.map(u => <TableRow key={u._id} hover><TableCell><Button size="small" sx={{ p: 0, minWidth: 0, textAlign: 'left', fontWeight: 700 }} onClick={() => setOpen(u._id)}>{u.name || shortId(u.sub)}</Button></TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{u.eduEmail || (u.verified ? '' : 'unverified')}</TableCell><TableCell>{u.role || '—'}</TableCell>
          <TableCell align="right"><Switch checked={!!u.banned} color="error" inputProps={{ 'aria-label': 'Ban ' + (u.name || u.sub) }} onChange={e => act(() => api('/admin/users/' + u._id + '/ban', { method: 'PUT', body: { banned: e.target.checked } }), e.target.checked ? 'User banned' : 'User unbanned', users.refetch)} /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Card>)}
    {tab === 1 && (reports.isLoading ? <Loading rows={2} /> : reports.error ? <ErrorState error={reports.error} retry={reports.refetch} /> : !reports.data?.length ? <Empty icon={<span>🛡️</span>} title="No reports" body="Nothing to review." /> :
      <Stack gap={1.5}>{reports.data.map(r => <Card key={r._id} sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
        <div><Typography fontWeight={700}>About {shortId(r.subject)} · by {shortId(r.reporter)}</Typography><Typography variant="body2" color="text.secondary">{timeAgo(r.createdAt)}</Typography><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{r.reason}</Typography></div>
        <TextField select size="small" value={r.status} sx={{ width: 140, flexShrink: 0 }} label="Status" onChange={e => act(() => api('/admin/reports/' + r._id, { method: 'PUT', body: { status: e.target.value } }), 'Report updated', reports.refetch)}>
          {['open', 'resolved', 'dismissed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Stack></Card>)}</Stack>)}
    {tab >= 2 && (settings.isLoading ? <Loading rows={3} h={56} /> : settings.error ? <ErrorState error={settings.error} retry={settings.refetch} /> : settings.data &&
      (tab === 2 ? <SettingsForm key={school.schoolCode} s={settings.data} save={b => api('/admin/settings', { method: 'PUT', body: b })} testRules={b => api('/admin/email-rules/test', { method: 'POST', body: b })} done={settings.refetch} /> : <MailerForm key={school.schoolCode} s={settings.data} save={b => api('/admin/settings', { method: 'PUT', body: b })} done={settings.refetch} api={api} />))}
    {open && <StudentDialog id={open} load={id => api('/admin/users/' + id)} onClose={() => setOpen(null)} />}
  </>);
}
function Row({ k, v }: { k: string; v: React.ReactNode }) { return <Stack direction="row" gap={2} sx={{ py: 0.5 }}><Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>{k}</Typography><Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-word' }}>{v ?? '—'}</Typography></Stack>; }
function StudentDialog({ id, load, onClose }: { id: string; load: (id: string) => Promise<any>; onClose: () => void }) {
  const d = useQuery<any>({ queryKey: ['admin-student', id], queryFn: () => load(id) });
  const u = d.data?.user;
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" scroll="paper"><DialogTitle>{u?.name || 'Student'}</DialogTitle>
    <DialogContent dividers>{d.isLoading ? <Loading rows={3} h={40} /> : d.error ? <ErrorState error={d.error} retry={d.refetch} /> : u && <Stack gap={2}>
      <Stack direction="row" gap={1.5} alignItems="center"><Avatar src={u.avatar || undefined} alt="" sx={{ width: 48, height: 48 }}>{(u.name || '?')[0]}</Avatar>
        <Stack direction="row" gap={0.75} flexWrap="wrap">{u.role && <Chip size="small" label={u.role} />}<Chip size="small" variant="outlined" color={u.verified ? 'success' : 'default'} label={u.verified ? 'Verified' : 'Unverified'} />{u.banned && <Chip size="small" color="error" label="Banned" />}</Stack></Stack>
      <Box><Row k="School email" v={u.eduEmail} /><Row k="Personal email" v={u.personalEmail} /><Row k="Phone" v={u.phone} />{u.car && <Row k="Car" v={[u.car.make, u.car.model, u.car.color, u.car.plate].filter(Boolean).join(' · ')} />}<Row k="Joined" v={timeAgo(u.createdAt)} /><Row k="User ID" v={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.sub}</span>} /></Box>
      <Divider />
      <Box><Typography fontWeight={700} component="h3">Homes ({d.data.homes.length})</Typography>{d.data.homes.map((h: any) => <Typography key={h._id} variant="body2">{h.label} · {h.walkingRadius} m walk</Typography>)}</Box>
      <Box><Typography fontWeight={700} component="h3">Ride requests ({d.data.requests.length})</Typography>{d.data.requests.slice(0, 10).map((r: any) => <Typography key={r._id} variant="body2">{r.direction} {r.startTime}–{r.endTime} · {r.status}</Typography>)}</Box>
      <Box><Typography fontWeight={700} component="h3">Drives ({d.data.drives.length})</Typography>{d.data.drives.slice(0, 10).map((r: any) => <Typography key={r._id} variant="body2">{r.owner === u.sub ? 'Driving' : 'Riding'} · {r.direction} {r.startTime} · {r.status}</Typography>)}</Box>
      <Box><Typography fontWeight={700} component="h3">Reports</Typography><Typography variant="body2">{d.data.reportsAbout.length} about them · {d.data.reportsBy.length} filed · {d.data.blocks} blocked</Typography></Box>
    </Stack>}</DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button></DialogActions></Dialog>;
}
type Settings = { officialName: string; campus: { name: string; address: string; latitude: number; longitude: number }; emailRules: Rule[]; limits: { maxCarpoolStudents: number; maxHomesPerUser: number; maxUsersPerEduEmail: number }; mailer: { provider: string; url?: string; secretSet?: boolean; smtpHost?: string; smtpPort?: number; smtpSecurity?: string; smtpUser?: string; smtpFrom?: string; smtpPasswordSet?: boolean; gmailUser?: string; fromName: string; configured: boolean } };
const DOMAIN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <Box><Typography variant="subtitle1" fontWeight={700} component="h2">{title}</Typography>{sub && <Typography variant="body2" color="text.secondary">{sub}</Typography>}<Stack gap={2} sx={{ mt: 1.5 }}>{children}</Stack></Box>;
}
function useSaver(save: (b: any) => Promise<any>, done: () => any) {
  const toast = useToast(); const [busy, setBusy] = useState(false);
  return { busy, run: async (b: any, ok: string) => { setBusy(true); try { await save(b); toast(ok); await done(); } catch (e) { toast(errText(e), 'error'); } finally { setBusy(false); } } };
}
function SettingsForm({ s, save, done, testRules }: { s: Settings; save: (b: any) => Promise<any>; done: () => any; testRules: (b: any) => Promise<any> }) {
  const init = () => ({ officialName: s.officialName, campusName: s.campus.name, address: s.campus.address, lat: String(s.campus.latitude), lng: String(s.campus.longitude), rules: s.emailRules, seats: String(s.limits.maxCarpoolStudents), homes: String(s.limits.maxHomesPerUser), perEmail: String(s.limits.maxUsersPerEduEmail) });
  const [f, setF] = useState(init); useEffect(() => setF(init()), [s]); // eslint-disable-line
  const { busy, run } = useSaver(save, done);
  const set = (k: keyof ReturnType<typeof init>) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }));
  const num = (v: string, lo: number, hi: number) => /^-?\d+(\.\d+)?$/.test(v.trim()) && +v >= lo && +v <= hi;
  const int = (v: string, lo: number, hi: number) => /^\d+$/.test(v.trim()) && +v >= lo && +v <= hi;
  const errs = { officialName: f.officialName.trim().length < 2, campusName: !f.campusName.trim(), lat: !num(f.lat, -90, 90), lng: !num(f.lng, -180, 180), rules: !f.rules.length || f.rules.some(r => !r.value.trim() || !!ruleError(r)), seats: !int(f.seats, 1, 12), homes: !int(f.homes, 1, 50), perEmail: !int(f.perEmail, 1, 20) };
  const bad = Object.values(errs).some(Boolean);
  const dirty = JSON.stringify(f) !== JSON.stringify(init());
  const submit = () => run({ officialName: f.officialName.trim(), campus: { name: f.campusName.trim(), address: f.address.trim(), latitude: +f.lat, longitude: +f.lng }, emailRules: f.rules.map(r => ({ type: r.type, value: r.value.trim() })), limits: { maxCarpoolStudents: +f.seats, maxHomesPerUser: +f.homes, maxUsersPerEduEmail: +f.perEmail } }, 'School settings saved');
  return (<Card component="form" sx={{ p: { xs: 2, sm: 3 } }} onSubmit={e => { e.preventDefault(); if (!bad && dirty) submit(); }}>
    <Stack gap={3} divider={<Divider flexItem />}>
      <Section title="School"><TextField label="Official name" value={f.officialName} onChange={set('officialName')} error={errs.officialName} helperText={errs.officialName ? 'At least 2 characters' : 'Shown to students when they pick a school'} required /></Section>
      <Section title="Campus" sub="Where drives to school end and drives home start.">
        <TextField label="Campus name" value={f.campusName} onChange={set('campusName')} error={errs.campusName} required />
        <PlaceSearch label="Find campus address" onSelect={p => setF(x => ({ ...x, address: p.address, lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) }))} />
        <TextField label="Address" value={f.address} onChange={set('address')} />
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField label="Latitude" inputMode="decimal" value={f.lat} onChange={set('lat')} error={errs.lat} helperText={errs.lat ? '-90 to 90' : ' '} />
          <TextField label="Longitude" inputMode="decimal" value={f.lng} onChange={set('lng')} error={errs.lng} helperText={errs.lng ? '-180 to 180' : ' '} />
        </Stack>
      </Section>
      <Section title="Who can sign up" sub="A school email must match at least one rule. Domain rules are also shown publicly to help students pick their school; regex rules are private.">
        <EmailRules rules={f.rules} onChange={rules => setF(x => ({ ...x, rules }))} api={testRules} />
      </Section>
      <Section title="Limits">
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField label="Students per carpool" value={f.seats} onChange={set('seats')} inputMode="numeric" error={errs.seats} helperText={errs.seats ? '1 to 12' : 'Max seats a driver can offer'} />
          <TextField label="Homes per user" value={f.homes} onChange={set('homes')} inputMode="numeric" error={errs.homes} helperText={errs.homes ? '1 to 50' : ' '} />
          <TextField label="Accounts per school email" value={f.perEmail} onChange={set('perEmail')} inputMode="numeric" error={errs.perEmail} helperText={errs.perEmail ? '1 to 20' : ' '} />
        </Stack>
      </Section>
    </Stack>
    <Stack direction="row" gap={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
      <Button disabled={!dirty || busy} onClick={() => setF(init())}>Reset</Button>
      <Button type="submit" variant="contained" disabled={!dirty || bad || busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
    </Stack>
  </Card>);
}
function SecretField({ label, isSet, value, onChange, clear, onClear }: { label: string; isSet: boolean; value: string; onChange: (v: string) => void; clear: boolean; onClear: (v: boolean) => void }) {
  return <Stack direction="row" gap={1} alignItems="flex-start">
    <TextField label={label} type="password" autoComplete="new-password" value={value} onChange={e => { onChange(e.target.value); onClear(false); }}
      placeholder={isSet && !clear ? '•••••••• saved' : ''} helperText={clear ? 'Will be removed on save' : isSet ? 'Leave blank to keep the saved value' : 'Not set'}
      slotProps={{ inputLabel: { shrink: true } }} />
    {isSet && <Button variant="outlined" color={clear ? 'inherit' : 'error'} sx={{ mt: 0.75, flexShrink: 0 }} onClick={() => { onChange(''); onClear(!clear); }}>{clear ? 'Undo' : 'Remove'}</Button>}
  </Stack>;
}
function fmtWhen(v?: string | null) { return v ? new Date(v).toLocaleString() : 'Never'; }
function CopyBlock({ label, value }: { label: string; value: string }) {
  const toast = useToast();
  return <Box>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}><Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Button size="small" onClick={() => navigator.clipboard.writeText(value).then(() => toast(label + ' copied'), () => toast('Copy failed', 'error'))}>Copy</Button></Stack>
    <TextField value={value} fullWidth multiline minRows={2} maxRows={4} slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }, htmlInput: { spellCheck: false, autoComplete: 'off' } }} />
  </Box>;
}
type Generated = { codeGs: string; appsscriptJson: string; keyId: string };
type PushStatus = { generated: boolean; keyId: string | null; tokenSet: boolean; tokenValid: boolean; expiresAt: string | null; lastPushAt: string | null };
function PushPanel({ api, scope }: { api: (p: string, o?: any) => Promise<any>; scope: string }) {
  const toast = useToast();
  const status = useQuery<PushStatus>({ queryKey: ['mailer-push-status', scope], queryFn: () => api('/admin/mailer/appsscript/status'), refetchInterval: 10000, gcTime: 0 });
  const st = status.data;
  const [gen, setGen] = useState<Generated | null>(null); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  async function generate(regenerate: boolean) {
    setBusy(true); setConfirm(false);
    try { const r = await api('/admin/mailer/appsscript/generate', { method: 'POST', body: { regenerate } }); setGen({ codeGs: r.codeGs, appsscriptJson: r.appsscriptJson, keyId: r.keyId }); await status.refetch(); }
    catch (e: any) { if (e?.status === 409) setConfirm(true); else toast(errText(e), 'error'); }
    finally { setBusy(false); }
  }
  const label = !st ? 'Loading' : !st.generated ? 'No script yet' : !st.tokenSet ? 'Waiting for first token' : st.tokenValid ? 'Receiving tokens' : 'Token expired';
  const tone = st?.tokenValid ? 'success' : st?.tokenSet ? 'error' : 'default';
  return <Stack gap={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }}>
      <Box sx={{ flex: 1 }}><Typography variant="body2" color="text.secondary">Last token received</Typography><Typography variant="body1">{fmtWhen(st?.lastPushAt)}</Typography>
        {st?.expiresAt && <Typography variant="caption" color="text.secondary">Expires {fmtWhen(st.expiresAt)}</Typography>}</Box>
      <Chip color={tone as any} label={label} />
    </Stack>
    {status.isError && <Alert severity="warning">Couldn't load script status.</Alert>}
    <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
      <Button variant="outlined" disabled={busy || !st} onClick={() => st?.generated ? setConfirm(true) : generate(false)}>{busy ? 'Generating…' : st?.generated ? 'Regenerate script' : 'Generate script'}</Button>
      {st?.keyId && <Typography variant="caption" color="text.secondary">Key {st.keyId}</Typography>}
    </Stack>
    {gen && <Card variant="outlined" sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>This script contains secrets and is shown only once. Copy it now; leaving this page hides it.</Alert>
      <Typography variant="body2" component="ol" sx={{ pl: 2.5, mt: 0, mb: 2, '& li': { mb: 0.5 } }}>
        <li>Open script.google.com while signed in as the sending account and create a new project.</li>
        <li>Project Settings: tick "Show appsscript.json manifest file in editor".</li>
        <li>Replace Code.gs and appsscript.json with the two blocks below and save.</li>
        <li>Select the <b>setup</b> function, click Run once and authorize. The status above turns green when the first token arrives.</li>
      </Typography>
      <Stack gap={2}><CopyBlock label="Code.gs" value={gen.codeGs} /><CopyBlock label="appsscript.json" value={gen.appsscriptJson} />
        <Button sx={{ alignSelf: 'flex-end' }} onClick={() => setGen(null)}>Hide</Button></Stack>
    </Card>}
    <Dialog open={confirm} onClose={() => setConfirm(false)}>
      <DialogTitle>Regenerate the script key?</DialogTitle>
      <DialogContent><Typography variant="body2">The current Apps Script stops working immediately. Email codes won't send until you paste the new script and run setup again.</Typography></DialogContent>
      <DialogActions><Button onClick={() => setConfirm(false)}>Cancel</Button><Button color="error" variant="contained" onClick={() => generate(true)}>Regenerate</Button></DialogActions>
    </Dialog>
  </Stack>;
}
type GoogleStatus = { connected: boolean; email: string | null; expiresAt: string | null };
function GooglePanel({ api, scope, done }: { api: (p: string, o?: any) => Promise<any>; scope: string; done: () => any }) {
  const toast = useToast(); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  const status = useQuery<GoogleStatus>({ queryKey: ['mailer-google-status', scope], queryFn: () => api('/admin/mailer/google/status'), retry: false });
  const gl = status.data;
  async function connect() {
    setBusy(true);
    try { const r = await api('/admin/mailer/google/connect', { method: 'POST' }); if (typeof r?.url !== 'string' || !/^https:\/\//.test(r.url)) throw new Error('Bad connect URL'); window.location.assign(r.url); }
    catch (e) { toast(errText(e), 'error'); setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setConfirm(false);
    try { await api('/admin/mailer/google/disconnect', { method: 'POST', body: {} }); toast('Gmail disconnected'); await status.refetch(); await done(); } catch (e) { toast(errText(e), 'error'); } finally { setBusy(false); }
  }
  const st: 'connected' | 'disconnected' | 'unknown' = status.isError ? 'unknown' : !gl ? 'unknown' : !gl.connected ? 'disconnected' : 'connected';
  return <Stack gap={2}>
    <Typography variant="body2" color="text.secondary">Sign in with the sending Google account. CarpSchool's central server holds the Google credentials and hands this school short-lived send access.</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }}>
      <Box sx={{ flex: 1 }}><Typography variant="body2" color="text.secondary">Connected account</Typography><Typography variant="body1">{status.isLoading ? 'Checking…' : gl?.connected && gl.email || 'None'}</Typography>
        {gl?.connected && gl.expiresAt && <Typography variant="caption" color="text.secondary">Current access token expires {fmtWhen(gl.expiresAt)}; renewed automatically</Typography>}</Box>
      <Chip color={st === 'connected' ? 'success' : 'default'} label={({ connected: 'Connected', disconnected: 'Not connected', unknown: status.isLoading ? 'Checking' : 'Unavailable' } as const)[st]} />
    </Stack>
    {status.isError && <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => status.refetch()}>Retry</Button>}>Couldn't load Gmail connection status.</Alert>}
    <Stack direction="row" gap={1.5} flexWrap="wrap">
      <Button variant="outlined" disabled={busy || status.isLoading} onClick={connect}>{busy ? 'Opening Google…' : gl?.connected ? 'Reconnect' : 'Connect Gmail'}</Button>
      {gl?.connected && <Button color="error" disabled={busy} onClick={() => setConfirm(true)}>Disconnect</Button>}
    </Stack>
    <Dialog open={confirm} onClose={() => setConfirm(false)}>

      <DialogTitle>Disconnect Gmail?</DialogTitle>
      <DialogContent><Typography variant="body2">Verification codes stop sending until another method is set up or Gmail is reconnected.</Typography></DialogContent>
      <DialogActions><Button onClick={() => setConfirm(false)}>Cancel</Button><Button color="error" variant="contained" onClick={disconnect}>Disconnect</Button></DialogActions>
    </Dialog>
  </Stack>;
}

const APPS_SCRIPT_URL = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const PROVIDERS = [['smtp', 'SMTP'], ['google', 'Google (Gmail)'], ['appsscript_push', 'Google Apps Script']] as const;
function MailerForm({ s, save, done, api }: { s: Settings; save: (b: any) => Promise<any>; done: () => any; api: (p: string, o?: any) => Promise<any> }) {
  const m = s.mailer;
  const init = () => ({ provider: m.provider, fromName: m.fromName || '',
    smtpHost: m.smtpHost || '', smtpPort: m.smtpPort ? String(m.smtpPort) : '587', smtpSecurity: m.smtpSecurity || 'starttls', smtpUser: m.smtpUser || '', smtpFrom: m.smtpFrom || '', smtpPassword: '', clearSmtp: false,
    url: m.url || '', secret: '', clearRelaySecret: false, gmailUser: m.gmailUser || '' });
  const [f, setF] = useState(init); useEffect(() => setF(init()), [s]); // eslint-disable-line
  const { busy, run } = useSaver(save, done);
  const set = (k: keyof ReturnType<typeof init>) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }));
  const email = (v: string) => !v || /^\S+@\S+\.\S+$/.test(v);
  const pv = f.provider;
  const errs = { smtpFrom: pv === 'smtp' && !email(f.smtpFrom), smtpPort: pv === 'smtp' && !(/^\d+$/.test(f.smtpPort) && +f.smtpPort >= 1 && +f.smtpPort <= 65535), gmailUser: pv === 'appsscript_push' && !(f.gmailUser.trim() && email(f.gmailUser.trim())), url: pv === 'appsscript' && !!f.url.trim() && !APPS_SCRIPT_URL.test(f.url.trim()) };
  const invalid = Object.values(errs).some(Boolean);
  const dirty = JSON.stringify(f) !== JSON.stringify(init());
  const w = (b: any, k: string, v: string, clear: boolean) => { if (v) b[k] = v; else if (clear) b[k] = null; };
  function submit() {
    const b: any = { provider: pv, fromName: f.fromName.trim() };
    if (pv === 'appsscript_push') b.gmailUser = f.gmailUser.trim();
    if (pv === 'smtp') { Object.assign(b, { smtpHost: f.smtpHost.trim(), smtpPort: +f.smtpPort, smtpSecurity: f.smtpSecurity, smtpUser: f.smtpUser.trim(), smtpFrom: f.smtpFrom.trim() }); w(b, 'smtpPassword', f.smtpPassword, f.clearSmtp); }
    if (pv === 'appsscript') { if (f.url.trim()) b.url = f.url.trim(); w(b, 'secret', f.secret, f.clearRelaySecret); }
    run({ mailer: b }, 'Mailer saved');
  }
  const chip = pv !== m.provider ? { color: 'default' as const, label: 'Unsaved provider' } : m.provider === 'test' ? { color: 'warning' as const, label: 'Test mode' } : m.configured ? { color: 'success' as const, label: 'Configured' } : { color: 'warning' as const, label: 'Not configured' };
  return (<Card component="form" sx={{ p: { xs: 2, sm: 3 } }} onSubmit={e => { e.preventDefault(); if (!invalid && dirty) submit(); }}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={{ mb: 2.5 }} flexWrap="wrap">
      <Box sx={{ flex: 1, minWidth: 220 }}><Typography variant="subtitle1" fontWeight={700} component="h2">Verification email sender</Typography><Typography variant="body2" color="text.secondary">How student verification codes are sent. Secrets are never shown again after saving.</Typography></Box>
      <Chip color={chip.color} label={chip.label} />
    </Stack>
    <Stack gap={2}>
      <TextField select label="Method" value={pv} onChange={set('provider')}>
        {PROVIDERS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        {m.provider === 'gmail' && <MenuItem value="gmail">Gmail OAuth (legacy)</MenuItem>}
        {m.provider === 'appsscript' && <MenuItem value="appsscript">Apps Script relay (interim)</MenuItem>}
        {m.provider === 'test' && <MenuItem value="test">Test mode</MenuItem>}
        </TextField>
      <TextField label="From name" value={f.fromName} onChange={set('fromName')} helperText="Shown as the sender, e.g. KJT Rides" />
      {pv === 'smtp' && <>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField label="Host" value={f.smtpHost} onChange={set('smtpHost')} sx={{ flex: 2 }} placeholder="smtp.example.com" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Port" value={f.smtpPort} onChange={set('smtpPort')} error={errs.smtpPort} sx={{ flex: 1 }} slotProps={{ htmlInput: { inputMode: 'numeric' } }} />
          <TextField select label="Security" value={f.smtpSecurity} onChange={set('smtpSecurity')} sx={{ flex: 1, minWidth: 140 }}>
            <MenuItem value="starttls">STARTTLS</MenuItem><MenuItem value="tls">TLS</MenuItem><MenuItem value="none">None</MenuItem></TextField>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField label="Username" value={f.smtpUser} onChange={set('smtpUser')} autoComplete="off" sx={{ flex: 1 }} />
          <TextField label="From address" type="email" value={f.smtpFrom} onChange={set('smtpFrom')} error={errs.smtpFrom} helperText={errs.smtpFrom ? 'Enter a valid email' : ' '} sx={{ flex: 1 }} />
        </Stack>
        <SecretField label="Password" isSet={!!m.smtpPasswordSet} value={f.smtpPassword} onChange={v => setF(x => ({ ...x, smtpPassword: v }))} clear={f.clearSmtp} onClear={v => setF(x => ({ ...x, clearSmtp: v }))} />
      </>}
      {pv === 'google' && <GooglePanel api={api} scope={s.officialName} done={done} />}
      {pv === 'gmail' && <Alert severity="info">Legacy Gmail setup{m.gmailUser ? ' (' + m.gmailUser + ')' : ''} is still active. Its credentials can't be edited here; switch to Google (Gmail) and connect to replace it.</Alert>}
      {pv === 'appsscript' && <>
        <Alert severity="info">Interim relay. Switch to Google Apps Script once its token is arriving.</Alert>
        <TextField label="Deployment URL" type="url" multiline maxRows={3} value={f.url} onChange={set('url')} error={errs.url} slotProps={{ htmlInput: { spellCheck: false, style: { wordBreak: 'break-all' } } }} helperText={errs.url ? 'Must be https://script.google.com/macros/s/<deployment>/exec' : ' '} />
        <SecretField label="Shared secret" isSet={!!m.secretSet} value={f.secret} onChange={v => setF(x => ({ ...x, secret: v }))} clear={f.clearRelaySecret} onClear={v => setF(x => ({ ...x, clearRelaySecret: v }))} />
      </>}
      {pv === 'appsscript_push' && <>
        <Typography variant="body2" color="text.secondary">A script in the sending Google account pushes short-lived encrypted send tokens to this server. No Google passwords or OAuth secrets are stored here.</Typography>
        <TextField label="Sending account" type="email" value={f.gmailUser} onChange={set('gmailUser')} error={errs.gmailUser} placeholder="name@school.ca" slotProps={{ inputLabel: { shrink: true }, htmlInput: { spellCheck: false, autoComplete: 'off' } }} required helperText={errs.gmailUser ? 'Enter the sending account email' : 'The Google account the script runs as; codes are sent from this address'} />
        <PushPanel api={api} scope={s.officialName} />
      </>}
    </Stack>
    <Stack direction="row" gap={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
      <Button disabled={!dirty || busy} onClick={() => setF(init())}>Reset</Button>
      <Button type="submit" variant="contained" disabled={!dirty || invalid || busy}>{busy ? 'Saving…' : 'Save mailer'}</Button>
    </Stack>
  </Card>);
}

type Rule = { type: 'domain' | 'regex'; value: string };
/** Ordered list of domain/regex rules plus a live tester that runs the exact server matcher (RE2, anchored). */
/** Client-side mirror of the server's RE2 check: JS syntax + RE2's missing features. Server stays authoritative. */
function regexError(p: string): string | null {
  if (!p.trim()) return null;
  if (/\(\?<?[=!]/.test(p)) return 'Lookarounds like (?= aren\u2019t supported (RE2)';
  if (/\\[1-9]|\\k</.test(p)) return 'Backreferences aren\u2019t supported (RE2)';
  try { new RegExp('^(?:' + p + ')$', 'i'); return null; } catch (e) { return 'Invalid regex: ' + String((e as Error).message).replace(/^Invalid regular expression: \/.*\/i?: /, ''); }
}
function ruleError(r: Rule): string | null {
  if (!r.value) return null;
  if (r.type === 'domain') return DOMAIN.test(r.value) ? null : 'Enter just the domain, like school.edu (no http://, no @, no double dots)';
  return regexError(r.value);
}
function EmailRules({ rules, onChange, api }: { rules: Rule[]; onChange: (r: Rule[]) => void; api: (b: any) => Promise<any> }) {
  const set = (i: number, r: Partial<Rule>) => onChange(rules.map((x, j) => j === i ? { ...x, ...r } : x));
  const [email, setEmail] = useState('');
  const [res, setRes] = useState<{ ok?: boolean; matched?: Rule | null; error?: string } | null>(null);
  const valid = rules.length > 0 && rules.every(r => r.value.trim() && !ruleError(r));
  useEffect(() => {
    if (!email.includes('@') || !valid) { setRes(null); return; }
    let live = true;
    const t = setTimeout(() => api({ email, rules: rules.map(r => ({ type: r.type, value: r.value.trim() })) })
      .then(x => live && setRes({ ok: x.allowed, matched: x.matched }))
      .catch(e => live && setRes({ error: errText(e) })), 350);
    return () => { live = false; clearTimeout(t); };
  }, [email, JSON.stringify(rules)]);
  const hit = (r: Rule) => !!res?.matched && res.matched.type === r.type && res.matched.value === r.value.trim();
  return <Stack spacing={1.5}>
    {rules.map((r, i) => <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
      <TextField select size="small" label="Type" value={r.type} sx={{ width: 112, flexShrink: 0 }} onChange={e => set(i, { type: e.target.value as Rule['type'] })}>
        <MenuItem value="domain">Domain</MenuItem><MenuItem value="regex">Regex</MenuItem>
      </TextField>
      <TextField size="small" fullWidth label={r.type === 'domain' ? 'Domain' : 'Pattern (matches the whole email)'} value={r.value}
        placeholder={r.type === 'domain' ? 'school.edu' : '[a-z]+\\.[0-9]{2}@students\\.school\\.edu'}
        inputProps={{ maxLength: r.type === 'regex' ? 200 : 253, spellCheck: false, style: r.type === 'regex' ? { fontFamily: 'var(--font-mono), monospace' } : undefined }}
        onChange={e => set(i, { value: r.type === 'domain' ? e.target.value.trim().toLowerCase().replace(/^@/, '') : e.target.value })}
        error={!!ruleError(r)} helperText={ruleError(r) || undefined}
        color={hit(r) ? 'success' : undefined} focused={hit(r) || undefined}
        InputProps={r.type === 'domain' ? { startAdornment: <InputAdornment position="start">@</InputAdornment> } : undefined} />
      <Button color="error" size="small" sx={{ mt: 0.5, minWidth: 0, flexShrink: 0 }} disabled={rules.length === 1} onClick={() => onChange(rules.filter((_, j) => j !== i))} aria-label={'Remove rule ' + (i + 1)}>Remove</Button>
    </Stack>)}
    <Stack direction="row" spacing={1}>
      <Button size="small" variant="outlined" onClick={() => onChange([...rules, { type: 'domain', value: '' }])}>Add domain</Button>
      <Button size="small" variant="outlined" onClick={() => onChange([...rules, { type: 'regex', value: '' }])}>Add regex</Button>
    </Stack>
    <Typography variant="caption" color="text.secondary">Regex uses RE2 syntax and is case-insensitive and anchored automatically, so it has to match the whole address. No lookarounds or backreferences. 200 characters max.</Typography>
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
      <TextField size="small" fullWidth label="Test an email" placeholder="student@school.edu" value={email} onChange={e => setEmail(e.target.value)} inputProps={{ spellCheck: false, autoCapitalize: 'none' }} />
      <Box sx={{ mt: 1, minHeight: 24 }} aria-live="polite">
        {!email.includes('@') ? <Typography variant="body2" color="text.secondary">Type an address to check it against the rules above (unsaved changes included).</Typography>
          : !valid ? <Typography variant="body2" color="text.secondary">{rules.some(r => ruleError(r)) ? 'Fix the highlighted rule first.' : 'Fill in every rule first.'}</Typography>
          : res?.error ? <Alert severity="error" sx={{ py: 0 }}>{res.error}</Alert>
          : res == null ? <Typography variant="body2" color="text.secondary">Checking…</Typography>
          : res.ok ? <Alert severity="success" sx={{ py: 0 }}>Allowed by {res.matched!.type} rule <code>{res.matched!.value}</code></Alert>
          : <Alert severity="warning" sx={{ py: 0 }}>Not allowed. No rule matches.</Alert>}
      </Box>
    </Box>
  </Stack>;
}
