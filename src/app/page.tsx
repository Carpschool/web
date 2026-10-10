'use client';
import Link from 'next/link';
import { SignInButton, useAuth } from '@clerk/nextjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function Landing() {
  const { isSignedIn } = useAuth();
  const buttonStyles = {
    mt: 3, bgcolor: '#007AFF', color: '#FFFFFF', borderRadius: '999px',
    px: 3.5, minHeight: 44, fontSize: '1rem', fontWeight: 600,
    '&:hover': { bgcolor: '#0066D6' },
    '&:focus-visible': { outline: '3px solid #005BBF', outlineOffset: 4 },
  };
  return (
    <Box component="main" id="main-content" tabIndex={-1} sx={{
      minHeight: '100dvh', boxSizing: 'border-box', bgcolor: '#FFFFFF',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', p: 3,
    }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Typography component="h1" sx={{
        fontSize: '2.125rem', fontWeight: 700, color: '#111111',
        letterSpacing: '-0.025em', lineHeight: 1.15,
      }}>CarpSchool</Typography>
      <Typography sx={{ mt: 1.5, fontSize: '1rem', color: '#6E6E73', lineHeight: 1.5 }}>
        Share a ride with your school.
      </Typography>
      {isSignedIn ? (
        <Button component={Link} href="/home" variant="contained" sx={buttonStyles}>Open app</Button>
      ) : (
        <SignInButton mode="modal" forceRedirectUrl="/home" signUpForceRedirectUrl="/school">
          <Button variant="contained" sx={buttonStyles}>Sign in</Button>
        </SignInButton>
      )}
    </Box>
  );
}
