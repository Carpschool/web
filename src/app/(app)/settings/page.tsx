'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import LockOutlined from '@mui/icons-material/LockOutlined';
import HouseOutlined from '@mui/icons-material/HouseOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Logout from '@mui/icons-material/Logout';
import ChevronRight from '@mui/icons-material/ChevronRight';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import { Loading, ErrorState, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import { errText, shortId } from '@/lib/format';
function Row({ k, v }: { k: string; v?: React.ReactNode }) { return <Stack direction="row" justifyContent="space-between" gap={2} sx={{ py: 1 }}><Typography color="text.secondary">{k}</Typography><Typography fontWeight={600} textAlign="right" sx={{ wordBreak: 'break-word' }}>{v || '—'}</Typography></Stack>; }
export default function Settings() {
  const { me, school, chooseSchool, api, flags } = useSchool(); const { user } = useUser(); const clerk = useClerk(); const router = useRouter(); const toast = useToast();
  const blocks = useApi<{ _id: string; subject: string }[]>('/blocks');
  return (<>
    <PageHead kicker="Account" title="Settings" />
    <Card sx={{ p: { xs: 2, sm: 3 }, mb: 3 }} className="rise">
      <Stack direction="row" gap={2} alignItems="center" sx={{ mb: 2 }}>
        <Avatar src={user?.imageUrl} alt="" sx={{ width: 64, height: 64 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="h6">{me?.name}</Typography><Typography color="text.secondary" noWrap>{me?.eduEmail}</Typography></Box>
        <Chip icon={<LockOutlined />} label={me?.role === 'driver' ? 'Driver' : 'Rider'} sx={{ textTransform: 'capitalize' }} />
      </Stack>
      <Divider />
      <Row k="School" v={school?.name} /><Row k="Phone" v={me?.phone} />
      {me?.role === 'driver' && <><Row k="Personal email" v={me.personalEmail} /><Row k="Car" v={me.car && `${me.car.color} ${me.car.make}`} /><Row k="Plate" v={<span style={{ fontFamily: 'var(--font-mono)' }}>{me.car?.plate}</span>} /></>}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Your role is locked. Profile photo and sign-in methods are managed in your account.</Typography>
    </Card>
    <Card sx={{ mb: 3 }}><List disablePadding>
      <ListItemButton component={Link} href="/homes"><ListItemIcon><HouseOutlined /></ListItemIcon><ListItemText primary="Homes" secondary="Pickup locations and walking distance" /><ChevronRight /></ListItemButton>
      <Divider component="li" />
      <ListItemButton onClick={() => clerk.openUserProfile()}><ListItemIcon><ManageAccountsOutlined /></ListItemIcon><ListItemText primary="Manage account" secondary="Photo, email, sign-in methods" /><ChevronRight /></ListItemButton>
      {flags?.schoolAdminOf.includes(school?._id || '-') && <><Divider component="li" /><ListItemButton component={Link} href="/admin/school"><ListItemIcon><AdminPanelSettingsOutlined /></ListItemIcon><ListItemText primary="School admin" /><ChevronRight /></ListItemButton></>}
      {flags?.admin && <><Divider component="li" /><ListItemButton component={Link} href="/admin/central"><ListItemIcon><HubOutlined /></ListItemIcon><ListItemText primary="Network admin" /><ChevronRight /></ListItemButton></>}
      <Divider component="li" />
      <ListItemButton onClick={() => { chooseSchool(null); router.push('/school'); }}><ListItemIcon><SwapHoriz /></ListItemIcon><ListItemText primary="Switch school" /><ChevronRight /></ListItemButton>
      <Divider component="li" />
      <ListItemButton onClick={() => clerk.signOut({ redirectUrl: '/' })} sx={{ color: 'error.main' }}><ListItemIcon><Logout color="error" /></ListItemIcon><ListItemText primary="Sign out" /></ListItemButton>
    </List></Card>
    <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Blocked people</Typography>
    {blocks.isLoading ? <Loading rows={1} h={56} /> : blocks.error ? <ErrorState error={blocks.error} retry={blocks.refetch} /> : !blocks.data?.length ? <Typography color="text.secondary">You haven't blocked anyone.</Typography> :
      <Card><List disablePadding>{blocks.data.map(b => <ListItem key={b._id} secondaryAction={<Button size="small" onClick={async () => { try { await api('/blocks/' + encodeURIComponent(b.subject), { method: 'DELETE' }); toast('Unblocked'); blocks.refetch(); } catch (e) { toast(errText(e), 'error'); } }}>Unblock</Button>}><ListItemText primary={'User ' + shortId(b.subject)} /></ListItem>)}</List></Card>}
  </>);
}
