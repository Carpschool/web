'use client';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
export default function Confirm({ open, title, body, confirmText = 'Confirm', danger, onClose, onConfirm, children }: { open: boolean; title: string; body?: string; confirmText?: string; danger?: boolean; onClose: () => void; onConfirm: () => Promise<void> | void; children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (<Dialog open={open} onClose={() => !busy && onClose()} fullWidth maxWidth="xs" aria-labelledby="confirm-title">
    <DialogTitle id="confirm-title" sx={{ fontFamily: 'var(--font-display)', fontWeight: 750 }}>{title}</DialogTitle>
    <DialogContent>{body && <Typography color="text.secondary">{body}</Typography>}{children}</DialogContent>
    <DialogActions sx={{ p: 2 }}><Button onClick={onClose} disabled={busy}>Cancel</Button>
      <Button variant="contained" color={danger ? 'error' : 'primary'} disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>{busy ? 'Working…' : confirmText}</Button></DialogActions>
  </Dialog>);
}
