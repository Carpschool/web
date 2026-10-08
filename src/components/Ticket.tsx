'use client';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
// Boarding-pass style card with a perforated stub edge.
export default function Ticket({ children, stub, accent = '#F2A900', onClick, sx }: { children: React.ReactNode; stub?: React.ReactNode; accent?: string; onClick?: () => void; sx?: any }) {
  return (
    <Box onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={e => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      className="rise" sx={{ display: 'flex', bgcolor: 'background.paper', borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .15s ease, box-shadow .2s ease', '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 10px 24px ${alpha('#13203B', 0.09)}` } : {}, '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main' }, ...sx }}>
      <Box sx={{ width: 6, bgcolor: accent, flexShrink: 0 }} />
      <Box sx={{ flex: 1, p: 2, minWidth: 0 }}>{children}</Box>
      {stub && <Box sx={{ borderLeft: '2px dashed', borderColor: 'divider', px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 84, position: 'relative',
        '&::before,&::after': { content: '""', position: 'absolute', left: -9, width: 16, height: 16, borderRadius: '50%', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }, '&::before': { top: -9 }, '&::after': { bottom: -9 } }}>{stub}</Box>}
    </Box>
  );
}
