import Link from 'next/link';
export function LegalFooter() {
  return (
    <footer className="legal-foot">
      <Link href="/tos">Terms</Link><span aria-hidden>·</span><Link href="/privacy">Privacy</Link>
    </footer>
  );
}

