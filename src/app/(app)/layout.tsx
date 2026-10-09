'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import HomeRounded from '@mui/icons-material/HomeRounded';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import { Wordmark } from '@/components/Brand';
import { useSchool } from '@/lib/school';
const nav = [
  { href: '/home', label: 'Today', icon: <HomeRounded /> },
  { href: '/rides', label: 'Rides', icon: <ConfirmationNumberOutlined /> },
  { href: '/chats', label: 'Chats', icon: <ChatBubbleOutline /> },
  { href: '/settings', label: 'Settings', icon: <SettingsOutlined /> },
];
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { picking, school, schools, schoolsError, me, meState, meError, refreshMe, flags } = useSchool(); const router = useRouter(); const path = usePathname();
  const isAdminPage = path.startsWith('/admin');
  useEffect(() => {
    if (isAdminPage && path.startsWith('/admin/central')) return;
    if (schools && !school) { if (!picking) router.replace('/school'); }
    else if (meState === 'ready' && !me?.verified) router.replace('/verify');
    else if (meState === 'ready' && !me?.role) router.replace('/role');
  }, [schools, school, picking, me, meState, router, isAdminPage, path]);
  const ready = (me?.verified && me.role) || path.startsWith('/admin/central');
  const extra = [
    ...(!!flags?.schoolAdminOf.length ? [{ href: '/admin/school', label: 'School admin', icon: <AdminPanelSettingsOutlined /> }] : []),
    ...(flags?.admin ? [{ href: '/admin/central', label: 'Network admin', icon: <HubOutlined /> }] : []),
  ];
  const active = nav.find(n => path.startsWith(n.href))?.href ?? false;
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex' }}>
      <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', width: 256, flexShrink: 0, bgcolor: 'rgba(234,239,247,.8)', backdropFilter: 'blur(24px)', borderRight: '1px solid', borderColor: 'divider', p: 2, position: 'sticky', top: 0, height: '100dvh' }}>
        <Box sx={{ px: 1, py: 1 }}><Link href="/home" style={{ color: 'inherit', textDecoration: 'none' }}><Wordmark /></Link></Box>
        {school && <Typography variant="body2" color="text.secondary" sx={{ px: 1.2, mt: 1 }}>{school.name}</Typography>}
        <List sx={{ mt: 2 }}>
          {[...nav, ...extra].map(n => (<ListItemButton key={n.href} component={Link} href={n.href} selected={path.startsWith(n.href)} sx={{ borderRadius: 3, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(23,100,192,.1)', color: 'primary.main', '& svg': { color: 'primary.main' }, '&:hover': { bgcolor: 'rgba(23,100,192,.15)' } } }}>
            <ListItemIcon sx={{ minWidth: 38 }}>{n.icon}</ListItemIcon><ListItemText primary={n.label} slotProps={{ primary: { fontWeight: 600 } }} /></ListItemButton>))}
        </List>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1 }}><UserButton /><Box sx={{ minWidth: 0 }}><Typography fontWeight={650} noWrap>{me?.name}</Typography><Typography variant="body2" color="text.secondary" textTransform="capitalize">{me?.role}</Typography></Box></Stack>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pb: { xs: 11, md: 4 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ display: { md: 'none' }, px: 2, py: 1.5, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(245,247,250,.86)', backdropFilter: 'blur(24px)', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Link href="/home" style={{ color: 'inherit', textDecoration: 'none' }}><Wordmark /></Link><UserButton />
        </Stack>
        <Container maxWidth="md" sx={{ pt: { xs: 3, md: 5 } }}>
          {schoolsError ? <Alert severity="error">{schoolsError}</Alert>
            : meState === 'error' ? <Alert severity="error" action={<Button color="inherit" onClick={() => refreshMe()}>Retry</Button>}>{meError}</Alert>
            : me?.banned ? <Alert severity="error">Your account has been suspended at this school. Contact your school admin.</Alert>
            : ready ? children : <Box sx={{ display: 'grid', placeItems: 'center', py: 12 }}><CircularProgress aria-label="Loading" /></Box>}
        </Container>
      </Box>
      <Paper component="nav" aria-label="Main" elevation={0} sx={{ display: { md: 'none' }, position: 'fixed', bottom: 0, left: 12, right: 12, borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 32px rgba(23,36,58,.06)', zIndex: 20, borderTop: '1px solid', borderColor: 'divider', pb: 'env(safe-area-inset-bottom)', bgcolor: 'rgba(255,255,255,.88)', backdropFilter: 'blur(24px)' }}>
        <BottomNavigation showLabels value={active} sx={{ bgcolor: 'transparent', height: 64 }}>
          {nav.map(n => <BottomNavigationAction key={n.href} value={n.href} label={n.label} icon={n.icon} component={Link} href={n.href} />)}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
