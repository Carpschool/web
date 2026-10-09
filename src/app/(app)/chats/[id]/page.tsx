'use client';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import Send from '@mui/icons-material/Send';
import AddLocationAlt from '@mui/icons-material/AddLocationAlt';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CheckCircle from '@mui/icons-material/CheckCircle';
import MapView from '@/components/MapView';
import ProposalDialog from '@/components/ProposalDialog';
import SafetyMenu from '@/components/SafetyMenu';
import { ErrorState, Loading } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Drive, Home, Message, Negotiation, Proposal } from '@/lib/types';
import { errText, shortId } from '@/lib/format';
import { mono } from '@/theme';
type Item = { kind: 'm'; at: string; m: Message } | { kind: 'p'; at: string; p: Proposal };
export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { me, school, token, api } = useSchool(); const toast = useToast(); const router = useRouter();
  const n = useApi<Negotiation>('/negotiations/' + id);
  const msgsQ = useApi<Message[]>('/negotiations/' + id + '/messages'); const propsQ = useApi<Proposal[]>('/negotiations/' + id + '/proposals');
  const homes = useApi<Home[]>(me?.role === 'rider' ? '/homes' : null); const drive = useApi<Drive>(me?.role === 'driver' && n.data ? '/drives/' + n.data.driveId : null);
  const [msgs, setMsgs] = useState<Message[]>([]); const [props, setProps] = useState<Proposal[]>([]); const [text, setText] = useState(''); const [live, setLive] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [dlg, setDlg] = useState<{ title: string; initial: { pos: [number, number]; time: string } | null } | null>(null); const [pin, setPin] = useState<string | null>(null); const [locked, setLocked] = useState<string | null>(null);
  const tokenRef = useRef(token); tokenRef.current = token; const sock = useRef<Socket | null>(null); const pending = useRef<((e: Error) => void) | null>(null); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (msgsQ.data) setMsgs(msgsQ.data); }, [msgsQ.data]);
  useEffect(() => { if (propsQ.data) setProps(propsQ.data); }, [propsQ.data]);
  const baseUrl = school?.baseUrl; const ready = !!me?.sub;
  const dbg = (k: string, v?: unknown) => { if (typeof window !== 'undefined') { const w = window as any; (w.__chatDiag ||= []).push({ t: Date.now() % 1e6, k, v }); } };
  dbg('render', { ready, baseUrl: !!baseUrl, meState: typeof me, hasSub: !!me?.sub });
  useEffect(() => {
    if (!baseUrl || !ready) return; let s: Socket | null = null; let dead = false; setLive('connecting'); dbg('effect-start');
    (async () => {
      try {
        s = io(baseUrl, { auth: cb => { dbg('auth-fn'); let done = false; const fin = (a: { token?: string }) => { dbg('auth-cb', { hasToken: !!a.token }); if (!done && !dead) { done = true; cb(a); } }; const to = setTimeout(() => fin({}), 15000); Promise.resolve().then(() => tokenRef.current()).then(t => { dbg('token-ok'); fin({ token: t }); }, (e) => { dbg('token-err', e?.message); fin({}); }).finally(() => clearTimeout(to)); }, transports: ['websocket', 'polling'] }); sock.current = s; dbg('io-created', { autoConnect: (s.io as any)._autoConnect ?? null, readyState: s.io._readyState, path: s.io.opts.path, transports: s.io.opts.transports });
        s.io.on('open', () => dbg('mgr-open', { transport: s!.io.engine?.transport?.name })); s.io.on('error', (e: Error) => dbg('mgr-error', e?.message)); s.io.on('reconnect_attempt', () => dbg('mgr-reconnect-attempt')); s.io.engine?.on('error', (e: any) => dbg('engine-error', e?.message || String(e))); dbg('engine-present', !!s.io.engine);
        s.on('connect', () => dbg('connect')); s.on('connect', () => s!.emit('negotiation:join', { negotiationId: id }, (a: any) => !dead && setLive(a?.ok === false ? 'offline' : 'live')));
        s.on('disconnect', () => !dead && setLive('offline'));
        s.on('connect_error', (e: Error) => { dbg('connect_error', e?.message); if (!dead) setLive('offline'); });
        s.on('exception', (e: any) => { const err = new Error(typeof e?.message === 'string' ? e.message : 'Request rejected'); if (pending.current) { pending.current(err); pending.current = null; } else toast(err.message, 'error'); });
        s.on('message:new', (m: Message) => setMsgs(x => x.some(y => y._id === m._id) ? x : [...x, m]));
        s.on('proposal:new', (p: Proposal) => setProps(x => x.some(y => y._id === p._id) ? x : [p, ...x]));
        s.on('carpool:locked', (e: { driveId: string }) => { setLocked(e.driveId); n.refetch(); propsQ.refetch(); });
      } catch { setLive('offline'); }
    })();
    return () => { dbg('effect-cleanup'); dead = true; s?.disconnect(); if (sock.current === s) sock.current = null; };
  }, [baseUrl, ready, id]); // eslint-disable-line
  const emit = (ev: string, data: any) => new Promise<any>((res, rej) => {
    if (!sock.current?.connected) return rej(new Error('Not connected. Trying again shortly.'));
    pending.current = (e) => rej(e);
    sock.current.timeout(10000).emit(ev, { negotiationId: id, ...data }, (err: any, a: any) => { pending.current = null; if (err) rej(new Error('Timed out')); else if (a?.ok === false || a?.error) rej(new Error(a.error?.message || a.error || a.message || 'Failed')); else res(a?.data ?? a); });
  });
  const items = useMemo<Item[]>(() => [...msgs.map(m => ({ kind: 'm' as const, at: m.createdAt, m })), ...props.map(p => ({ kind: 'p' as const, at: p.createdAt, p }))].sort((a, b) => a.at.localeCompare(b.at)), [msgs, props]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [items.length]);
  async function send() { const t = text.trim(); if (!t) return; setText(''); try { const m = await emit('message:send', { text: t }); if (m?._id) setMsgs(x => x.some(y => y._id === m._id) ? x : [...x, m]); } catch (e) { setText(t); toast(errText(e), 'error'); } }
  async function propose(pos: [number, number], time: string) { try { const p = await emit('proposal:send', { pickup: { type: 'Point', coordinates: [+pos[1].toFixed(6), +pos[0].toFixed(6)] }, time }); if (p?._id) setProps(x => x.some(y => y._id === p._id) ? x : [p, ...x]); setDlg(null); } catch (e) { toast(errText(e), 'error'); } }
  async function accept(p: Proposal) { try { const r = await emit('proposal:accept', { proposalId: p._id }); setLocked(r.driveId); if (r.pin) setPin(r.pin); else toast('Seat locked. Your rider is confirmed.'); n.refetch(); propsQ.refetch(); } catch (e) { toast(errText(e), 'error'); } }
  if (n.isLoading) return <Loading rows={4} h={60} />;
  if (n.error || !n.data) return <ErrorState error={n.error ?? 'Chat not found'} retry={n.refetch} />;
  const neg = n.data; const driver = me?.role === 'driver'; const other = driver ? neg.rider : neg.driver; const who = (driver ? 'Rider ' : 'Driver ') + shortId(other); const open = neg.status === 'open';
  const defaultPos = (): [number, number] | null => { const h = homes.data?.[0]?.location.coordinates; if (h) return [h[1], h[0]]; const r = drive.data?.route?.coordinates?.[0]; return r ? [r[1], r[0]] : null; };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100dvh - 64px - 64px - 24px)', md: 'calc(100dvh - 72px)' } }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <IconButton component={Link} href="/chats" aria-label="Back to chats"><ArrowBack /></IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="h6" component="h1" noWrap>{who}</Typography>
          <Typography variant="caption" color={live === 'live' ? 'success.main' : 'text.secondary'} aria-live="polite">{live === 'live' ? '● Live' : live === 'connecting' ? 'Connecting…' : 'Offline, reconnecting'}</Typography></Box>
        {neg.status === 'locked' && <Chip label="Carpool locked" color="success" size="small" icon={<CheckCircle />} />}{neg.status === 'cancelled' && <Chip label="Cancelled" size="small" variant="outlined" />}
        <SafetyMenu subject={other} who={who} onBlocked={() => router.push('/chats')} />
      </Stack>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }} role="log" aria-label="Conversation">
        {msgsQ.isLoading ? <Loading rows={3} h={44} /> : items.length === 0 && <Alert severity="info" icon={<AddLocationAlt />}>Say hi, then send a pickup proposal with a spot on the map and a time.</Alert>}
        {items.map(it => {
          if (it.kind === 'm') { const mine = it.m.author === me?.sub; return (
            <Box key={it.m._id} className="rise" sx={{ flexShrink: 0, alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', bgcolor: mine ? 'primary.main' : 'background.paper', color: mine ? '#F5F0E6' : 'text.primary', border: mine ? 0 : '1px solid', borderColor: 'divider', px: 1.75, py: 1, borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', wordBreak: 'break-word' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{it.m.text}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.55 }}>{new Date(it.m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Typography>
            </Box>); }
          const p = it.p; const mine = p.author === me?.sub; const pos: [number, number] = [p.pickup.coordinates[1], p.pickup.coordinates[0]];
          return (
            <Box key={p._id} className="rise" sx={{ flexShrink: 0, alignSelf: mine ? 'flex-end' : 'flex-start', width: { xs: '88%', sm: 360 }, borderRadius: '20px', overflow: 'hidden', border: '2px solid', borderColor: p.status === 'accepted' ? 'success.main' : 'secondary.main', bgcolor: 'background.paper' }}>
              <MapView center={pos} zoom={16} height={130} markers={[{ pos, color: '#F2A900' }]} label="Proposed pickup" />
              <Stack direction="row" alignItems="center" sx={{ p: 1.5, gap: 1.5 }}>
                <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono, letterSpacing: '.1em' }}>{mine ? 'YOUR PROPOSAL' : 'PROPOSAL'}</Typography>
                  <Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 22 }}>{p.time}</Typography></Box>
                {p.status === 'accepted' ? <Chip color="success" label="Accepted" size="small" /> : p.status !== 'pending' ? <Chip label={p.status === 'superseded' ? 'Replaced' : p.status === 'cancelled' ? 'Cancelled' : p.status} size="small" variant="outlined" /> : mine ? <Chip label="Waiting" size="small" variant="outlined" /> : open && (
                  <Stack direction="row" gap={1}><Button size="small" onClick={() => setDlg({ title: 'Counter proposal', initial: { pos, time: p.time } })}>Counter</Button><Button size="small" variant="contained" color="success" onClick={() => accept(p)}>Accept</Button></Stack>)}
              </Stack>
            </Box>);
        })}
        {locked && neg.status === 'locked' && <Alert severity="success" action={<Button color="inherit" component={Link} href={'/rides/' + locked}>View ride</Button>}>Carpool locked.</Alert>}
        <div ref={end} />
      </Box>
      {open ? (
        <Stack component="form" direction="row" gap={1} alignItems="flex-end" sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }} onSubmit={e => { e.preventDefault(); send(); }}>
          <Tooltip title="Propose pickup"><IconButton aria-label="Propose pickup spot and time" onClick={() => setDlg({ title: 'Propose a pickup', initial: (() => { const d = defaultPos(); return d ? { pos: d, time: '07:45' } : null; })() })} sx={{ bgcolor: 'secondary.main', color: 'primary.main', '&:hover': { bgcolor: 'secondary.dark' } }}><AddLocationAlt /></IconButton></Tooltip>
          <TextField size="small" placeholder="Message" value={text} onChange={e => setText(e.target.value.slice(0, 2000))} multiline maxRows={4} slotProps={{ htmlInput: { 'aria-label': 'Message' } }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <IconButton type="submit" aria-label="Send" disabled={!text.trim()} color="primary"><Send /></IconButton>
        </Stack>) : neg.status === 'cancelled' ? <Alert severity="warning" sx={{ mt: 1 }}>This carpool was cancelled. The rider's request is open again.</Alert>
        : <Alert severity="success" sx={{ mt: 1 }} action={<Button color="inherit" component={Link} href={'/rides/' + neg.driveId}>Open ride</Button>}>This carpool is locked.</Alert>}
      <ProposalDialog open={!!dlg} title={dlg?.title ?? ''} initial={dlg?.initial ?? null} onClose={() => setDlg(null)} onSend={propose} />
      <Dialog open={!!pin} onClose={() => setPin(null)} aria-labelledby="pin-title">
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography id="pin-title" variant="h5">You're in. Here's your boarding PIN.</Typography>
          <Typography sx={{ fontFamily: mono, fontWeight: 800, fontSize: 56, letterSpacing: '.25em', my: 2, color: 'primary.main' }}>{pin}</Typography>
          <Typography color="text.secondary">Show it to your driver at pickup. You can get a new one from the ride page any time.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button variant="contained" fullWidth onClick={() => { setPin(null); if (locked) router.push('/rides/' + locked); }}>Got it</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
