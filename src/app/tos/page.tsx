import { LegalPage, LEGAL_TITLES } from '@/lib/legal';
export const dynamic = 'force-dynamic';
export const metadata = { title: LEGAL_TITLES.tos + ' · Carpschool' };
export default function Page() { return <LegalPage doc="tos" />; }

