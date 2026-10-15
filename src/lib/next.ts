// Remember where a signed-in but not yet onboarded user was headed, so onboarding can send them back.
const KEY = 'carpschool.next';
const ok = (p: string | null): p is string => !!p && p.startsWith('/') && !p.startsWith('//');
export function saveNext(path: string) {
  try { if (ok(path) && !/^\/(school|verify|role|sign-in|sign-up)/.test(path)) sessionStorage.setItem(KEY, path); } catch {}
}
// Peek only: repeated effects must keep getting the same answer. clearNext runs once the user has arrived.
export function takeNext(fallback = '/home') {
  try { const p = sessionStorage.getItem(KEY); if (ok(p)) return p; } catch {}
  return fallback;
}
export function clearNext() { try { sessionStorage.removeItem(KEY); } catch {} }
