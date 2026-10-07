'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import MailOutline from '@mui/icons-material/MailOutline';
import Onboard from '@/components/Onboard';
import { Loading } from '@/components/States';
import { useSchool } from '@/lib/school';
import { errText } from '@/lib/format';
import { mono } from '@/theme';
export default function Verify() {
  const { school, schools, me, meState, meError, api, refreshMe } = useSchool(); const router = useRouter();
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [cool, setCool] = useState(0);
  useEffect(() => { if (schools && !school) router.replace('/school'); }, [schools, school, router]);
  useEffect(() => { if (me?.verified) router.replace(me.role ? '/home' : '/role'); }, [me, router]);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(c => c - 1), 1000); return () => clearTimeout(t); }, [cool]);
  const domains = school?.domains || [];
  const okDomain = domains.some(d => email.toLowerCase().trim().endsWith('@' + d));
  async function send() { setBusy(true); setErr(''); try { await api('/edu/send', { body: { email: email.trim().toLowerCase() } }); setSent(true); setCool(60); } catch (e) { setErr(errText(e)); } finally { setBusy(false); } }
  async function verify() { setBusy(true); setErr(''); try { await api('/edu/verify', { body: { code } }); const m = await refreshMe(); router.replace(m?.role ? '/home' : '/role'); } catch (e) { setErr(errText(e)); setBusy(false); } }
  if (!school || meState === 'loading' || meState === 'idle') return <Onboard step={1} title="Verify you're a student"><Loading rows={2} h={56} /></Onboard>;
  return (
    <Onboard step={1} title="Verify you're a student" sub={`We'll email a 6 digit code to your ${school.name} address. Required for everyone.`}>
      {meState === 'error' && <Alert severity="error" sx={{ mb: 2 }}>{meError}</Alert>}
      {!sent ? (
        <Stack component="form" gap={2} onSubmit={e => { e.preventDefault(); if (okDomain) send(); }}>
          <TextField label="School email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={'you@' + (domains[0] || 'school.edu')}
            error={!!email && email.includes('@') && !okDomain} helperText={email.includes('@') && !okDomain ? 'Use an address ending in @' + domains.join(' or @') : 'Must end in @' + domains.join(' or @')}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><MailOutline /></InputAdornment> } }} />
          {err && <Alert severity="error">{err}</Alert>}
          <Button type="submit" size="large" variant="contained" disabled={!okDomain || busy}>{busy ? 'Sending…' : 'Send code'}</Button>
        </Stack>
      ) : (
        <Stack component="form" gap={2} onSubmit={e => { e.preventDefault(); if (code.length === 6) verify(); }}>
          <Typography>Code sent to <b>{email}</b>. It expires in 10 minutes.</Typography>
          <TextField label="6 digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus
            slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', style: { fontFamily: mono, fontSize: 28, letterSpacing: '0.5em', textAlign: 'center' } } }} />
          {err && <Alert severity="error">{err}</Alert>}
          <Button type="submit" size="large" variant="contained" disabled={code.length !== 6 || busy}>{busy ? 'Checking…' : 'Verify'}</Button>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {cool > 0 ? `Resend in ${cool}s` : <Link component="button" type="button" onClick={send}>Resend code</Link>} · <Link component="button" type="button" onClick={() => { setSent(false); setCode(''); setErr(''); }}>Change email</Link>
          </Typography>
        </Stack>
      )}
    </Onboard>
  );
}
