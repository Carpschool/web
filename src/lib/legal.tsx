import { readFileSync } from 'node:fs';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { Wordmark } from '@/components/Brand';
import { LegalFooter } from '@/components/LegalFooter';

export type LegalDoc = 'tos' | 'privacy';
export const LEGAL_TITLES: Record<LegalDoc, string> = { tos: 'Terms of Service', privacy: 'Privacy Policy' };

function centralUrl() {
  let c = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || '';
  const f = process.env.CENTRAL_URL_FILE;
  if (f) { try { c = readFileSync(f, 'utf8').trim() || c; } catch {} }
  return c.replace(/\/$/, '');
}

async function load(doc: LegalDoc): Promise<{ markdown: string; updatedAt: string | null } | null> {
  const c = centralUrl();
  if (!c) return null;
  try {
    const r = await fetch(c + '/legal/' + doc, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const j = await r.json();
    return { markdown: typeof j.markdown === 'string' ? j.markdown : '', updatedAt: j.updatedAt ?? null };
  } catch { return null; }
}

// Only http(s), mailto and relative links survive; everything else is dropped.
function safeUrl(u: string) {
  return /^(https?:|mailto:|\/|#)/i.test(u.trim()) ? u : '';
}

export async function LegalPage({ doc }: { doc: LegalDoc }) {
  const data = await load(doc);
  const md = data?.markdown.trim() ?? '';
  return (
    <main className="legal">
      <header className="legal-top"><Link href="/" aria-label="Carpschool home" style={{ color: 'inherit', textDecoration: 'none' }}><Wordmark /></Link></header>
      <article className="legal-body">
        <h1>{LEGAL_TITLES[doc]}</h1>
        {md ? (
          <>
            {data?.updatedAt && <p className="legal-date">Last updated {new Date(data.updatedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Vancouver' })}</p>}
            <Markdown skipHtml urlTransform={safeUrl}>{md}</Markdown>
          </>
        ) : data ? <p className="legal-soon">Coming soon.</p> : <p className="legal-soon">This page couldn&apos;t be loaded right now. Try again in a minute.</p>}
      </article>
      <LegalFooter />
    </main>
  );
}


