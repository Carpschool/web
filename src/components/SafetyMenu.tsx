'use client';
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from '@mui/material/TextField';
import MoreVert from '@mui/icons-material/MoreVert';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import Confirm from './Confirm';
import { useSchool } from '@/lib/school';
import { useToast } from './Toast';
import { errText } from '@/lib/format';
export default function SafetyMenu({ subject, who, onBlocked }: { subject: string; who: string; onBlocked?: () => void }) {
  const { api } = useSchool(); const toast = useToast();
  const [el, setEl] = useState<HTMLElement | null>(null); const [mode, setMode] = useState<'report' | 'block' | null>(null); const [reason, setReason] = useState('');
  return (<>
    <IconButton aria-label={'Safety options for ' + who} onClick={e => setEl(e.currentTarget)}><MoreVert /></IconButton>
    <Menu anchorEl={el} open={!!el} onClose={() => setEl(null)}>
      <MenuItem onClick={() => { setEl(null); setReason(''); setMode('report'); }}><ListItemIcon><FlagOutlined fontSize="small" /></ListItemIcon>Report {who}</MenuItem>
      <MenuItem onClick={() => { setEl(null); setMode('block'); }} sx={{ color: 'error.main' }}><ListItemIcon><BlockOutlined fontSize="small" color="error" /></ListItemIcon>Block {who}</MenuItem>
    </Menu>
    <Confirm open={mode === 'report'} title={'Report ' + who} body="Your school admins will review this. They won't be told who reported them." confirmText="Send report" onClose={() => setMode(null)}
      onConfirm={async () => { if (reason.trim().length < 3) { toast('Add a short reason', 'error'); return; } try { await api('/reports', { body: { subject, reason: reason.trim() } }); toast('Report sent to your school'); setMode(null); } catch (e) { toast(errText(e), 'error'); } }}>
      <TextField multiline minRows={3} label="What happened?" value={reason} onChange={e => setReason(e.target.value.slice(0, 1000))} sx={{ mt: 2 }} autoFocus />
    </Confirm>
    <Confirm open={mode === 'block'} title={'Block ' + who + '?'} body="You won't be matched or able to chat with each other. You can unblock later in Settings." confirmText="Block" danger onClose={() => setMode(null)}
      onConfirm={async () => { try { await api('/blocks', { body: { subject } }); toast('Blocked'); setMode(null); onBlocked?.(); } catch (e) { toast(errText(e), 'error'); } }} />
  </>);
}
