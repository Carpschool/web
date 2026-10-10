'use client';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { UserButton } from '@clerk/nextjs';
import { Wordmark } from './Brand';
const labels = ['School', 'Verify', 'Role', 'Home'];
export default function Onboard({ step, title, sub, children }: { step: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh' }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Container maxWidth="sm" sx={{ py: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Wordmark /><UserButton /></Stack>
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography variant="overline" color="text.secondary">Step {step + 1} of 4 · {labels[step]}</Typography></Stack>
          <LinearProgress variant="determinate" value={((step + 1) / 4) * 100} color="primary" sx={{ height: 6, borderRadius: 9, bgcolor: 'rgba(19,32,59,.08)' }} aria-label="Onboarding progress" />
        </Box>
        <Box component="main" id="main-content" tabIndex={-1} className="rise" sx={{ mt: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 2.5, sm: 4 } }} key={step}>
          <Typography variant="h4" component="h1">{title}</Typography>
          {sub && <Typography color="text.secondary" sx={{ mt: 1 }}>{sub}</Typography>}
          <Box sx={{ mt: 3.5 }}>{children}</Box>
        </Box>
      </Container>
    </Box>
  );
}
