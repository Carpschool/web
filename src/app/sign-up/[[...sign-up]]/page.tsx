import { SignUp } from '@clerk/nextjs';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { Wordmark } from '@/components/Brand';
export default function Page() {
  return (<Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, p: 2 }}>
    <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }} aria-label="Carpschool home"><Wordmark /></Link>
    <SignUp forceRedirectUrl="/school" signInUrl="/sign-in" />
  </Box>);
}
