import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
export function Mark({ size = 30 }: { size?: number }) {
  return (<Box aria-hidden sx={{ width: size, height: size, borderRadius: '30%', bgcolor: 'secondary.main', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 -3px 0 rgba(19,32,59,.25)' }}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none"><path d="M4 15.5V11l2.2-4.4A2 2 0 0 1 8 5.5h8a2 2 0 0 1 1.8 1.1L20 11v4.5a1 1 0 0 1-1 1h-1M4 15.5a1 1 0 0 0 1 1h1M8.5 16.5h7" stroke="#13203B" strokeWidth="2" strokeLinecap="round" /><circle cx="7" cy="16.5" r="1.8" fill="#13203B" /><circle cx="17" cy="16.5" r="1.8" fill="#13203B" /><path d="M4.5 11h15" stroke="#13203B" strokeWidth="2" /></svg>
  </Box>);
}
export function Wordmark() { return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Mark /><Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, letterSpacing: '-0.03em' }}>carpschool</Typography></Box>; }
