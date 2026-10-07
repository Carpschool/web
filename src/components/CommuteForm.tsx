'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import School from '@mui/icons-material/School';
import House from '@mui/icons-material/House';
import { DAYS, todayISO } from '@/lib/format';
import type { Home } from '@/lib/types';
export type CommuteValue = { homeId: string; direction: 'to-school' | 'home'; dates: string[]; days: number[]; startTime: string; endTime: string };
/** draftKey: persist the form in localStorage so a refresh keeps it; call clearDraft() after posting. */
export function useCommute(homes: Home[] | undefined, draftKey?: string) {
  const [v, setV] = useState<CommuteValue>({ homeId: '', direction: 'to-school', dates: [], days: [1, 2, 3, 4, 5], startTime: '07:30', endTime: '08:15' });
  const [mode, setMode] = useState<'weekly' | 'once'>('weekly'); const [date, setDate] = useState(todayISO());
  const [loaded, setLoaded] = useState(!draftKey);
  useEffect(() => { if (!draftKey) return; try { const d = JSON.parse(localStorage.getItem(draftKey) || 'null'); if (d?.v) { setV(d.v); setMode(d.mode === 'once' ? 'once' : 'weekly'); if (typeof d.date === 'string' && d.date >= todayISO()) setDate(d.date); } } catch {} setLoaded(true); }, [draftKey]);
  useEffect(() => { if (draftKey && loaded) localStorage.setItem(draftKey, JSON.stringify({ v, mode, date })); }, [draftKey, loaded, v, mode, date]);
  useEffect(() => { if (homes && (!v.homeId || !homes.some(h => h._id === v.homeId)) && homes.length) setV(x => ({ ...x, homeId: homes[0]._id })); }, [homes, loaded]); // eslint-disable-line
  const clearDraft = () => { if (draftKey) localStorage.removeItem(draftKey); };
  const value: CommuteValue = { ...v, days: mode === 'weekly' ? v.days : [], dates: mode === 'once' ? [date] : [] };
  const pastDate = mode === 'once' && (!date || date < todayISO());
  const badTime = !(v.startTime < v.endTime);
  const valid = !!v.homeId && (mode === 'once' ? !pastDate : v.days.length > 0) && !badTime;
  return { v, setV, mode, setMode, date, setDate, value, valid, pastDate, badTime, clearDraft };
}
export default function CommuteForm({ c, homes, timeLabel }: { c: ReturnType<typeof useCommute>; homes: Home[]; timeLabel?: string }) {
  const { v, setV, mode, setMode, date, setDate, pastDate, badTime } = c;
  if (!homes.length) return <Alert severity="info" action={<Button component={Link} href="/homes" color="inherit">Add home</Button>}>Add a home first so we know where you start.</Alert>;
  const lbl = timeLabel ?? (v.direction === 'to-school' ? 'Arrive at school between' : 'Leave school between');
  return (
    <Stack gap={2.5}>
      <Stack gap={1}><Typography variant="overline" color="text.secondary" component="label" id="dir">Direction</Typography>
        <ToggleButtonGroup exclusive fullWidth value={v.direction} onChange={(_, d) => d && setV(x => ({ ...x, direction: d, ...(d === 'home' ? { startTime: '15:00', endTime: '15:45' } : { startTime: '07:30', endTime: '08:15' }) }))} aria-labelledby="dir">
          <ToggleButton value="to-school"><School sx={{ mr: 1 }} fontSize="small" />To school</ToggleButton><ToggleButton value="home"><House sx={{ mr: 1 }} fontSize="small" />Home</ToggleButton>
        </ToggleButtonGroup></Stack>
      <TextField select label={v.direction === 'to-school' ? 'Leaving from' : 'Going to'} value={v.homeId} onChange={e => setV(x => ({ ...x, homeId: e.target.value }))}>
        {homes.map(h => <MenuItem key={h._id} value={h._id}>{h.label}</MenuItem>)}
      </TextField>
      <Stack gap={1}><Typography variant="overline" color="text.secondary" id="when">When</Typography>
        <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, m) => m && setMode(m)} aria-labelledby="when"><ToggleButton value="weekly" sx={{ px: 2 }}>Every week</ToggleButton><ToggleButton value="once" sx={{ px: 2 }}>One day</ToggleButton></ToggleButtonGroup>
        {mode === 'weekly' ? (
          <ToggleButtonGroup value={v.days} onChange={(_, d) => setV(x => ({ ...x, days: d }))} aria-label="Weekdays" sx={{ flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButton-root': { border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', flex: '1 0 40px', ml: '0 !important' } }}>
            {DAYS.map((d, i) => <ToggleButton key={d} value={i} aria-label={d}>{d.slice(0, 2)}</ToggleButton>)}
          </ToggleButtonGroup>
        ) : <TextField type="date" label="Date" value={date} onChange={e => setDate(e.target.value)} error={pastDate} helperText={pastDate ? 'Pick today or a later date.' : ' '} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayISO() } }} />}
      </Stack>
      <Stack gap={1}><Typography variant="overline" color="text.secondary">{lbl}</Typography>
        <Stack direction="row" gap={1.5} alignItems="center">
          <TextField type="time" label="From" value={v.startTime} onChange={e => setV(x => ({ ...x, startTime: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          <Typography color="text.secondary">to</Typography>
          <TextField type="time" label="Until" value={v.endTime} onChange={e => setV(x => ({ ...x, endTime: e.target.value }))} error={badTime} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
        {badTime && <Typography variant="body2" color="error">End time must be after start time.</Typography>}
      </Stack>
    </Stack>
  );
}
