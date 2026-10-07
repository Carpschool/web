'use client';
import { errText } from '@/lib/format';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
export function Loading({ rows = 3, h = 88 }: { rows?: number; h?: number }) { return <Stack gap={1.5} aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} variant="rounded" height={h} sx={{ borderRadius: '20px' }} />)}</Stack>; }
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return <Alert severity="error" action={retry && <Button color="inherit" size="small" onClick={retry}>Retry</Button>}>{errText(error)}</Alert>;
}
export function Empty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <Box className="rise" sx={{ textAlign: 'center', py: 6, px: 3, border: '1.5px dashed', borderColor: 'divider', borderRadius: '24px' }}>
      <Box sx={{ fontSize: 40, color: 'secondary.main', mb: 1, '& svg': { fontSize: 44 } }}>{icon}</Box>
      <Typography variant="h6">{title}</Typography>
      {body && <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 360, mx: 'auto' }}>{body}</Typography>}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}
export function PageHead({ kicker, title, sub, action }: { kicker?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2} sx={{ mb: 3 }} className="rise">
      <Box>{kicker && <Typography variant="overline" color="text.secondary">{kicker}</Typography>}<Typography variant="h4" component="h1">{title}</Typography>{sub && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{sub}</Typography>}</Box>
      {action}
    </Stack>
  );
}
