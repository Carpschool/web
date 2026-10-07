'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CommuteForm, { useCommute } from '@/components/CommuteForm';
import { ErrorState, Loading, PageHead } from '@/components/States';
import { useApi } from '@/lib/hooks';
import { useSchool } from '@/lib/school';
import { useToast } from '@/components/Toast';
import type { Home } from '@/lib/types';
import { errText } from '@/lib/format';
export default function NewRequest() {
  const homes = useApi<Home[]>('/homes'); const c = useCommute(homes.data, 'carpschool.draft.request'); const { api } = useSchool(); const router = useRouter(); const toast = useToast(); const qc = useQueryClient();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function submit() { setBusy(true); setErr(''); try { await api('/requests', { body: c.value }); c.clearDraft(); await qc.invalidateQueries(); toast("Request posted. We'll show drivers as they reach out."); router.push('/home'); } catch (e) { setErr(errText(e)); setBusy(false); } }
  return (<>
    <PageHead kicker="Rider" title="Request a ride" sub="Drivers heading your way will see this and reach out." />
    {homes.isLoading ? <Loading rows={3} h={64} /> : homes.error ? <ErrorState error={homes.error} retry={homes.refetch} /> : (
      <Card sx={{ p: { xs: 2, sm: 3 } }} className="rise">
        <CommuteForm c={c} homes={homes.data || []} />
        {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
        {!!homes.data?.length && <Button fullWidth size="large" variant="contained" sx={{ mt: 3 }} disabled={!c.valid || busy} onClick={submit}>{busy ? 'Posting…' : 'Post request'}</Button>}
      </Card>)}
  </>);
}
