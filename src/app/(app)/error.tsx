'use client';
import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// Catches render errors inside the app shell instead of Next's blank "client-side exception" page.
// One automatic retry covers first-load races (data arriving mid-render); a second failure shows a real message.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tried = useRef(false);
  useEffect(() => {
    console.error('[carpschool] page crashed', error);
    const k = 'carpschool.autoretry'; const last = Number(sessionStorage.getItem(k) || 0);
    if (!tried.current && Date.now() - last > 15_000) { tried.current = true; sessionStorage.setItem(k, String(Date.now())); reset(); }
  }, [error, reset]);
  return (<Box role="alert" sx={{ py: 10, textAlign: 'center' }}>
    <Typography variant="h5" component="h1" sx={{ mb: 1 }}>Something went wrong loading this page</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>It usually clears up on a retry.</Typography>
    <Button variant="contained" onClick={() => reset()}>Try again</Button>{' '}
    <Button onClick={() => location.reload()}>Reload</Button>
  </Box>);
}
