'use client';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import RouteOutlined from '@mui/icons-material/RouteOutlined';
import PinOutlined from '@mui/icons-material/PinOutlined';
import { Wordmark } from '@/components/Brand';
import { mono } from '@/theme';
import { LegalFooter } from '@/components/LegalFooter';
const steps = [
  { icon: <VerifiedUserOutlined />, t: 'Students only', b: 'Everyone verifies a school email before they can see a single ride.' },
  { icon: <RouteOutlined />, t: 'On your way', b: 'Drivers see riders who live within a short walk of their actual route.' },
  { icon: <PinOutlined />, t: 'PIN to board', b: 'Riders show a 4 digit code at pickup. No live tracking, ever.' },
];
export default function Landing() {
  const { isSignedIn } = useAuth();
  return (
    <Box sx={{ minHeight: '100dvh', overflow: 'hidden', position: 'relative' }}>
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 80% 15%, rgba(23,100,192,.08), transparent 55%)' }} />
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Wordmark />
          <Button component={Link} href={isSignedIn ? '/home' : '/sign-in'} color="primary" variant="outlined">{isSignedIn ? 'Open app' : 'Sign in'}</Button>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' }, gap: { xs: 5, md: 8 }, alignItems: 'center', pt: { xs: 5, md: 10 }, pb: 8 }}>
          <Box className="rise">
            <Typography variant="overline" color="text.secondary">Your school. Your way there.</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.8rem', sm: '3.8rem', md: '4.6rem' }, mt: 1 }}>
              Get a ride with people from <Box component="span" sx={{ whiteSpace: 'nowrap', color: 'primary.main' }}>your school</Box>.
            </Typography>
            <Typography sx={{ mt: 3, fontSize: '1.15rem', color: 'text.secondary', maxWidth: 480 }}>Riders post when they need to get to class. Drivers already heading that way pick them up. Everyone is a verified student.</Typography>
            <Stack direction="row" gap={1.5} sx={{ mt: 4 }} flexWrap="wrap">
              <Button component={Link} href={isSignedIn ? '/home' : '/sign-up'} size="large" variant="contained" endIcon={<ArrowForward />}>Get started</Button>
              {!isSignedIn && <Button component={Link} href="/sign-in" size="large" color="primary">I have an account</Button>}
            </Stack>
          </Box>
          <Box className="rise" sx={{ animationDelay: '120ms' }}>
            <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: '32px', p: { xs: 2.5, sm: 4 }, boxShadow: '0 24px 64px -20px rgba(23,36,58,.18)' }}>
              <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontFamily: mono, fontSize: 12, color: 'text.secondary', letterSpacing: '.14em' }}>YOUR MORNING COMMUTE</Typography><Typography sx={{ fontFamily: mono, fontSize: 12, color: 'text.secondary' }}>MON 07:45</Typography></Stack>
              <Stack direction="row" alignItems="center" gap={2} sx={{ my: 3 }}>
                <Box><Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>HOME</Typography><Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Chartwell Dr</Typography></Box>
                <Box sx={{ flex: 1, borderTop: '1px solid rgba(23,36,58,.18)', position: 'relative' }}><Box sx={{ position: 'absolute', left: '50%', top: -13, transform: 'translateX(-50%)', bgcolor: 'secondary.main', color: 'text.primary', borderRadius: 99, px: 1, fontSize: 12, fontWeight: 700 }}>12 min</Box></Box>
                <Box textAlign="right"><Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>SCH</Typography><Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Main entrance</Typography></Box>
              </Stack>
              <Box sx={{ borderTop: '1px solid rgba(23,36,58,.1)', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Box><Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Driver</Typography><Typography fontWeight={700} noWrap>Grey Civic · 3 seats</Typography></Box>
                <Box textAlign="right"><Typography sx={{ color: 'text.secondary', fontSize: 12 }}>PIN</Typography><Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 28, letterSpacing: '.18em', whiteSpace: 'nowrap', color: 'primary.main' }}>4816</Typography></Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, pb: 10 }}>
          {steps.map((s, i) => (<Box key={s.t} className="rise" sx={{ animationDelay: 200 + i * 80 + 'ms', p: 3, borderRadius: '24px', bgcolor: 'rgba(255,255,255,.75)', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ color: 'primary.main', mb: 2, bgcolor: 'secondary.main', borderRadius: '14px', width: 44, height: 44, display: 'grid', placeItems: 'center' }}>{s.icon}</Box><Typography variant="h6">{s.t}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{s.b}</Typography></Box>))}
        </Box>
        <LegalFooter />
      </Container>
    </Box>
  );
}
