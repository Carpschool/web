// Remember where a signed-in but not yet onboarded user was headed, so onboarding can send them back.
const KEY = 'carpschool.next';
export function saveNext(path: string) {
  try { if (path.startsWith('/') && !path.startsWith('//') && !/^\/(school|verify|role|sign-in|sign-up)/.test(path)) sessionStorage.setItem(KEY, path); } catch {}
}
export function takeNext(fallback = '/home') {
  try { const p = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); if (p && p.startsWith('/') && !p.startsWith('//')) return p; } catch {}
  return fallback;
}
