export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function schedule(c: { dates: string[]; days: number[] }) {
  if (c.days?.length) { const d = [...c.days].sort(); if (d.join() === '1,2,3,4,5') return 'Weekdays'; return 'Every ' + d.map(i => DAYS[i]).join(', '); }
  return c.dates.map(d => new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })).join(', ');
}
export const dirLabel = (d: string) => (d === 'to-school' ? 'To school' : 'Home');
export const shortId = (s: string) => s.replace(/^user_/, '').slice(-5).toUpperCase();
const NET = /failed to fetch|networkerror|load failed|network request failed|fetch failed/i;
export function errText(e: unknown) {
  if (e instanceof Error) { if (e.name === 'TypeError' && NET.test(e.message) || NET.test(e.message)) return "Couldn't reach the server. Check your connection and try again."; if ((e as any).status >= 500) return 'The school server had a problem. Try again in a moment.'; return e.message; }
  return 'Something went wrong';
}
export function todayISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }
export function runsToday(c: { dates: string[]; days: number[] }) { return c.days?.includes(new Date().getDay()) || c.dates?.includes(todayISO()); }
export function timeAgo(iso: string) { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return new Date(iso).toLocaleDateString(); }
