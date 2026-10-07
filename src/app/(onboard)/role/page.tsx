'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import DirectionsWalk from '@mui/icons-material/DirectionsWalk';
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Onboard from '@/components/Onboard';
import { Loading } from '@/components/States';
import { useSchool } from '@/lib/school';
import { errText } from '@/lib/format';
type Role = 'rider' | 'driver';
function RoleCard({ role, sel, onClick }: { role: Role; sel: boolean; onClick: () => void }) {
  const r = role === 'rider';
  return (<ButtonBase onClick={onClick} aria-pressed={sel} sx={{ flex: 1, textAlign: 'left', display: 'block', p: 2.5, borderRadius: '22px', border: '2px solid', borderColor: sel ? 'primary.main' : 'divider', bgcolor: sel ? 'primary.main' : 'background.paper', color: sel ? '#F5F0E6' : 'text.primary', transition: 'all .2s' }}>
    <Box sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: 'secondary.main', color: 'primary.main', mb: 2 }}>{r ? <DirectionsWalk /> : <DirectionsCar />}</Box>
    <Typography variant="h6">{r ? "I need rides" : "I drive"}</Typography>
    <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>{r ? 'Request pickups near home.' : 'Offer seats on your commute.'}</Typography>
  </ButtonBase>);
}
export default function RolePage() {
  const { me, meState, api, refreshMe } = useSchool(); const { user } = useUser(); const router = useRouter();
  const [role, setRole] = useState<Role | null>(null); const [f, setF] = useState({ name: '', phone: '', personalEmail: '', make: '', color: '', plate: '' }); const [lic, setLic] = useState(false);
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (meState === 'ready' && !me?.verified) router.replace('/verify'); else if (me?.role) router.replace('/home'); }, [me, meState, router]);
  useEffect(() => { if (user && !f.name) setF(x => ({ ...x, name: user.fullName || '', personalEmail: user.primaryEmailAddress?.emailAddress || '' })); }, [user]); // eslint-disable-line
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(x => ({ ...x, [k]: e.target.value }));
  const phoneOk = /^[+0-9 ()-]{7,20}$/.test(f.phone);
  const valid = role && f.name.trim().length > 1 && phoneOk && (role === 'rider' || (/^\S+@\S+\.\S+$/.test(f.personalEmail) && f.make && f.color && f.plate && lic));
  async function submit() {
    setBusy(true); setErr('');
    const body = role === 'rider' ? { role, name: f.name.trim(), phone: f.phone.trim() } : { role, name: f.name.trim(), phone: f.phone.trim(), personalEmail: f.personalEmail.trim(), car: { make: f.make.trim(), color: f.color.trim(), plate: f.plate.trim().toUpperCase() }, licenseConfirmed: true };
    try { await api('/profile', { body }); await refreshMe(); router.replace('/homes?onboarding=1'); } catch (e) { setErr(errText(e)); setConfirm(false); setBusy(false); }
  }
  if (!me) return <Onboard step={2} title="How will you use Carpschool?"><Loading rows={2} /></Onboard>;
  return (
    <Onboard step={2} title="How will you use Carpschool?" sub="Pick one. It's locked once you continue, so choose the one you'll actually do.">
      <Stack direction="row" gap={1.5}><RoleCard role="rider" sel={role === 'rider'} onClick={() => setRole('rider')} /><RoleCard role="driver" sel={role === 'driver'} onClick={() => setRole('driver')} /></Stack>
      {role && (<Stack component="form" gap={2} sx={{ mt: 3 }} className="rise" onSubmit={e => { e.preventDefault(); if (valid) setConfirm(true); }}>
        <Stack direction="row" gap={2} alignItems="center" sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(19,32,59,.04)' }}>
          <Avatar src={user?.imageUrl} alt="" /><Typography variant="body2" color="text.secondary">Your photo comes from your account. Change it in account settings.</Typography>
        </Stack>
        <TextField label="Full name" autoComplete="name" value={f.name} onChange={set('name')} required />
        <TextField label="Phone" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} required error={!!f.phone && !phoneOk} helperText={f.phone && !phoneOk ? 'Enter a valid phone number' : 'Shared only with people you carpool with'} />
        {role === 'driver' && (<>
          <TextField label="Personal email" type="email" value={f.personalEmail} onChange={set('personalEmail')} required helperText="For ride notifications outside school" />
          <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>Your car</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Make & model" value={f.make} onChange={set('make')} placeholder="Honda Civic" required />
            <TextField label="Color" value={f.color} onChange={set('color')} placeholder="Grey" required />
          </Stack>
          <TextField label="License plate" value={f.plate} onChange={set('plate')} required slotProps={{ htmlInput: { style: { textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '.1em' } } }} />
          <FormControlLabel control={<Checkbox checked={lic} onChange={e => setLic(e.target.checked)} />} label="I have a valid driver's license and insurance that covers passengers." />
        </>)}
        {err && <Alert severity="error">{err}</Alert>}
        <Button type="submit" size="large" variant="contained" disabled={!valid || busy} startIcon={<LockOutlined />}>Continue as {role}</Button>
      </Stack>)}
      <Dialog open={confirm} onClose={() => !busy && setConfirm(false)} aria-labelledby="lock-title">
        <DialogTitle id="lock-title">Lock in {role}?</DialogTitle>
        <DialogContent><Typography color="text.secondary">You won't be able to switch roles later on this account.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setConfirm(false)} disabled={busy}>Go back</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Lock it in'}</Button></DialogActions>
      </Dialog>
    </Onboard>
  );
}
