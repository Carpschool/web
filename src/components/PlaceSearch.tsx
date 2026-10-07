'use client';
import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
type S = { id: string; main: string; secondary: string };
export default function PlaceSearch({ onSelect, bias, label = 'Search an address' }: { onSelect: (p: { lat: number; lng: number; address: string; name?: string }) => void; bias?: [number, number]; label?: string }) {
  const [input, setInput] = useState(''); const [opts, setOpts] = useState<S[]>([]); const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  useEffect(() => {
    if (input.trim().length < 3) { setOpts([]); return; }
    const ctl = new AbortController(); setLoading(true);
    const t = setTimeout(() => fetch(`/api/places?q=${encodeURIComponent(input)}${bias ? `&lat=${bias[0]}&lng=${bias[1]}` : ''}`, { signal: ctl.signal }).then(r => r.json()).then(j => { setErr(j.error || ''); setOpts(j.suggestions || []); }).catch(() => {}).finally(() => setLoading(false)), 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [input]); // eslint-disable-line
  return (
    <Autocomplete<S> options={opts} filterOptions={x => x} loading={loading} getOptionLabel={o => o.main} noOptionsText={input.length < 3 ? 'Type at least 3 letters' : 'No places found'}
      onInputChange={(_, v) => setInput(v)} isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={async (_, v) => { if (!v) return; const j = await fetch('/api/places?id=' + v.id).then(r => r.json()); if (j.lat) onSelect(j); else setErr('Could not find that place'); }}
      renderOption={({ key, ...props }, o) => (<Box component="li" key={key} {...props} sx={{ gap: 1.5 }}><PlaceOutlined color="action" /><Box><Typography fontWeight={600}>{o.main}</Typography><Typography variant="body2" color="text.secondary">{o.secondary}</Typography></Box></Box>)}
      renderInput={params => <TextField {...params} label={label} error={!!err} helperText={err || ' '} />} />
  );
}
