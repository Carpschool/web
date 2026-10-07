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
    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }} indicatorColor="secondary"><Tab label="Users" /><Tab label="Reports" /><Tab label="School settings" /><Tab label="Mailer" /></Tabs>
    {tab === 0 && (users.isLoading ? <Loading rows={3} h={48} /> : users.error ? <ErrorState error={users.error} retry={users.refetch} /> : !users.data?.length ? <Empty icon={<span>👥</span>} title="No users yet" /> :
      <Card><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell align="right">Banned</TableCell></TableRow></TableHead>
        <TableBody>{users.data.map(u => <TableRow key={u._id} hover><TableCell><Button size="small" sx={{ p: 0, minWidth: 0, textAlign: 'left', fontWeight: 700 }} onClick={() => setOpen(u._id)}>{u.name || shortId(u.sub)}</Button></TableCell><TableCell>{u.eduEmail || (u.verified ? '' : 'unverified')}</TableCell><TableCell>{u.role || '—'}</TableCell>
          <TableCell align="right"><Switch checked={!!u.banned} color="error" inputProps={{ 'aria-label': 'Ban ' + (u.name || u.sub) }} onChange={e => act(() => api('/admin/users/' + u._id + '/ban', { method: 'PUT', body: { banned: e.target.checked } }), e.target.checked ? 'User banned' : 'User unbanned', users.refetch)} /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Card>)}
    {tab === 1 && (reports.isLoading ? <Loading rows={2} /> : reports.error ? <ErrorState error={reports.error} retry={reports.refetch} /> : !reports.data?.length ? <Empty icon={<span>🛡️</span>} title="No reports" body="Nothing to review." /> :
      <Stack gap={1.5}>{reports.data.map(r => <Card key={r._id} sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
        <div><Typography fontWeight={700}>About {shortId(r.subject)} · by {shortId(r.reporter)}</Typography><Typography variant="body2" color="text.secondary">{timeAgo(r.createdAt)}</Typography><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{r.reason}</Typography></div>
        <TextField select size="small" value={r.status} sx={{ width: 140, flexShrink: 0 }} label="Status" onChange={e => act(() => api('/admin/reports/' + r._id, { method: 'PUT', body: { status: e.target.value } }), 'Report updated', reports.refetch)}>
          {['open', 'resolved', 'dismissed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Stack></Card>)}</Stack>)}
    {tab >= 2 && (settings.isLoading ? <Loading rows={3} h={56} /> : settings.error ? <ErrorState error={settings.error} retry={settings.refetch} /> : settings.data &&
      (tab === 2 ? <SettingsForm key={school.schoolCode} s={settings.data} save={b => api('/admin/settings', { method: 'PUT', body: b })} testRules={b => api('/admin/email-rules/test', { method: 'POST', body: b })} done={settings.refetch} /> : <MailerForm key={school.schoolCode} s={settings.data} save={b => api('/admin/settings', { method: 'PUT', body: b })} done={settings.refetch} />))}
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
type Settings = { officialName: string; campus: { name: string; address: string; latitude: number; longitude: number }; emailRules: Rule[]; limits: { maxCarpoolStudents: number; maxHomesPerUser: number; maxUsersPerEduEmail: number }; mailer: { provider: string; gmailUser?: string; fromName: string; clientId?: string; clientSecretSet: boolean; refreshTokenSet: boolean; configured: boolean } };
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
  const errs = { officialName: f.officialName.trim().length < 2, campusName: !f.campusName.trim(), lat: !num(f.lat, -90, 90), lng: !num(f.lng, -180, 180), rules: !f.rules.length || f.rules.some(r => !r.value.trim() || (r.type === 'domain' && !DOMAIN.test(r.value))), seats: !int(f.seats, 1, 12), homes: !int(f.homes, 1, 50), perEmail: !int(f.perEmail, 1, 20) };
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
  return <TextField label={label} type="password" autoComplete="new-password" value={value} onChange={e => { onChange(e.target.value); onClear(false); }}
    placeholder={isSet && !clear ? '•••••••• saved' : ''} helperText={clear ? 'Will be removed on save' : isSet ? 'Leave blank to keep the saved value' : 'Not set'}
    slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: isSet ? <InputAdornment position="end"><Button size="small" color={clear ? 'inherit' : 'error'} onClick={() => { onChange(''); onClear(!clear); }}>{clear ? 'Undo' : 'Remove'}</Button></InputAdornment> : undefined } }} />;
}
function MailerForm({ s, save, done }: { s: Settings; save: (b: any) => Promise<any>; done: () => any }) {
  const m = s.mailer; const init = () => ({ gmailUser: m.gmailUser || '', fromName: m.fromName || '', clientId: m.clientId || '', clientSecret: '', refreshToken: '', clearSecret: false, clearToken: false });
  const [f, setF] = useState(init); useEffect(() => setF(init()), [s]); // eslint-disable-line
  const { busy, run } = useSaver(save, done);
  const emailBad = !!f.gmailUser && !/^\S+@\S+\.\S+$/.test(f.gmailUser);
  const dirty = JSON.stringify(f) !== JSON.stringify(init());
  function submit() {
    const b: any = { fromName: f.fromName.trim() };
    if (f.gmailUser.trim()) b.gmailUser = f.gmailUser.trim(); if (f.clientId.trim()) b.clientId = f.clientId.trim();
    if (f.clientSecret) b.clientSecret = f.clientSecret; else if (f.clearSecret) b.clientSecret = null;
    if (f.refreshToken) b.refreshToken = f.refreshToken; else if (f.clearToken) b.refreshToken = null;
    run({ mailer: b }, 'Mailer saved');
  }
  return (<Card component="form" sx={{ p: { xs: 2, sm: 3 } }} onSubmit={e => { e.preventDefault(); if (!emailBad && dirty) submit(); }}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={{ mb: 2.5 }} flexWrap="wrap">
      <Box sx={{ flex: 1, minWidth: 220 }}><Typography variant="subtitle1" fontWeight={700} component="h2">Verification email sender</Typography><Typography variant="body2" color="text.secondary">Gmail OAuth used to send student codes. Secrets are never shown again after saving.</Typography></Box>
      <Chip color={m.configured ? 'success' : 'warning'} label={m.provider === 'test' ? 'Test mode' : m.configured ? 'Configured' : 'Not configured'} />
    </Stack>
    <Stack gap={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField label="Gmail address" type="email" value={f.gmailUser} onChange={e => setF({ ...f, gmailUser: e.target.value })} error={emailBad} helperText={emailBad ? 'Enter a valid email' : ' '} />
        <TextField label="From name" value={f.fromName} onChange={e => setF({ ...f, fromName: e.target.value })} helperText="e.g. KJT Rides" />
      </Stack>
      <TextField label="OAuth client ID" value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })} />
      <SecretField label="OAuth client secret" isSet={m.clientSecretSet} value={f.clientSecret} onChange={v => setF(x => ({ ...x, clientSecret: v }))} clear={f.clearSecret} onClear={v => setF(x => ({ ...x, clearSecret: v }))} />
      <SecretField label="OAuth refresh token" isSet={m.refreshTokenSet} value={f.refreshToken} onChange={v => setF(x => ({ ...x, refreshToken: v }))} clear={f.clearToken} onClear={v => setF(x => ({ ...x, clearToken: v }))} />
    </Stack>
    <Stack direction="row" gap={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
      <Button disabled={!dirty || busy} onClick={() => setF(init())}>Reset</Button>
      <Button type="submit" variant="contained" disabled={!dirty || emailBad || busy}>{busy ? 'Saving…' : 'Save mailer'}</Button>
    </Stack>
  </Card>);
}

type Rule = { type: 'domain' | 'regex'; value: string };
/** Ordered list of domain/regex rules plus a live tester that runs the exact server matcher (RE2, anchored). */
function EmailRules({ rules, onChange, api }: { rules: Rule[]; onChange: (r: Rule[]) => void; api: (b: any) => Promise<any> }) {
  const set = (i: number, r: Partial<Rule>) => onChange(rules.map((x, j) => j === i ? { ...x, ...r } : x));
  const [email, setEmail] = useState('');
  const [res, setRes] = useState<{ ok?: boolean; matched?: Rule | null; error?: string } | null>(null);
  const valid = rules.length > 0 && rules.every(r => r.value.trim());
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
        error={!!r.value && r.type === 'domain' && !DOMAIN.test(r.value)}
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
          : !valid ? <Typography variant="body2" color="text.secondary">Fill in every rule first.</Typography>
          : res?.error ? <Alert severity="error" sx={{ py: 0 }}>{res.error}</Alert>
          : res == null ? <Typography variant="body2" color="text.secondary">Checking…</Typography>
          : res.ok ? <Alert severity="success" sx={{ py: 0 }}>Allowed by {res.matched!.type} rule <code>{res.matched!.value}</code></Alert>
          : <Alert severity="warning" sx={{ py: 0 }}>Not allowed. No rule matches.</Alert>}
      </Box>
    </Box>
  </Stack>;
}
