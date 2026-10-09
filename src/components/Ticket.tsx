'use client';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
// Grouped commute surface with a distinct pickup summary.
export default function Ticket({ children, stub, accent = '#1764C0', onClick, sx }: { children: React.ReactNode; stub?: React.ReactNode; accent?: string; onClick?: () => void; sx?: any }) {
  return (
    <Box onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={e => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      className="rise" sx={{ display: 'flex', bgcolor: 'background.paper', borderRadius: '22px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .15s ease, box-shadow .2s ease', '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 10px 24px ${alpha('#13203B', 0.09)}` } : {}, '&:active': onClick ? { transform: 'scale(.985)' } : {}, '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main' }, ...sx }}>
      <Box sx={{ width: 4, bgcolor: accent, flexShrink: 0 }} />
      <Box sx={{ flex: 1, p: 2, minWidth: 0 }}>{children}</Box>
      {stub && <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 84, position: 'relative',
        bgcolor: 'rgba(23,100,192,.035)' }}>{stub}</Box>}
    </Box>
  );
}
