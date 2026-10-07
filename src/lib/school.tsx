'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { Me, School, SchoolMeta } from './types';

export class ApiError extends Error { constructor(msg: string, public status: number) { super(msg); } }
async function parse(r: Response) {
  const text = await r.text(); let j: any = null; try { j = text ? JSON.parse(text) : null; } catch {}
  if (!r.ok) {
    let m = j?.message ?? j?.error ?? r.statusText;
    if (typeof m === 'object') { const fe = m.fieldErrors ? Object.entries(m.fieldErrors).map(([k, v]: any) => k + ': ' + v[0]) : []; m = [...(m.formErrors || []), ...fe].join('. ') || 'Invalid input'; }
    if (Array.isArray(m)) m = m.join('. ');
    if (r.status === 429) m = 'Too many tries. Wait a minute and try again.';
    throw new ApiError(String(m || 'Request failed'), r.status);
  }
  return j;
}
type Opts = { method?: string; body?: unknown };
type Ctx = {
  central: string; schools: School[] | null; schoolsError: string | null; school: School | null; meta: SchoolMeta | null;
  me: Me | null; meState: 'idle' | 'loading' | 'ready' | 'error'; meError: string | null;
  flags: { admin: boolean; schoolAdminOf: string[] } | null;
  chooseSchool: (s: School | null) => void; refreshMe: () => Promise<Me | null>;
  api: <T = any>(path: string, o?: Opts) => Promise<T>; centralApi: <T = any>(path: string, o?: Opts) => Promise<T>;
  token: () => Promise<string>; reloadSchools: () => void;
};
const C = createContext<Ctx | null>(null);
export const useSchool = () => { const c = useContext(C); if (!c) throw new Error('no SchoolProvider'); return c; };
const KEY = 'carpschool.school';

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded, userId } = useAuth();
  const [central, setCentral] = useState('');
  const [schools, setSchools] = useState<School[] | null>(null);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [meta, setMeta] = useState<SchoolMeta | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [meState, setMeState] = useState<Ctx['meState']>('idle');
  const [meError, setMeError] = useState<string | null>(null);
  const [flags, setFlags] = useState<Ctx['flags']>(null);
  const [n, setN] = useState(0);
  const tok = useRef<{ code: string; token: string; exp: number; user: string } | null>(null);
  const inflight = useRef<Promise<string> | null>(null);

  useEffect(() => { setCode(localStorage.getItem(KEY)); }, []);
  useEffect(() => { (async () => {
    try { setSchoolsError(null); const c = (await parse(await fetch('/api/config'))).central as string; setCentral(c);
      setSchools(await parse(await fetch(c + '/schools'))); }
    catch { setSchoolsError('Could not reach the Carpschool network.'); setSchools(null); }
  })(); }, [n]);
  useEffect(() => { if (isSignedIn) fetch('/api/flags').then(parse).then(setFlags).catch(() => setFlags({ admin: false, schoolAdminOf: [] })); else setFlags(null); }, [isSignedIn, userId]);

  const school = useMemo(() => schools?.find(s => s.schoolCode === code) ?? null, [schools, code]);
  useEffect(() => { setMeta(null); if (school) fetch(school.baseUrl + '/.well-known/carpschool.json').then(parse).then(setMeta).catch(() => {}); }, [school]);

  const centralApi = useCallback(async (path: string, o: Opts = {}) => {
    const jwt = await getToken(); if (!jwt) throw new ApiError('Signed out', 401);
    return parse(await fetch(central + path, { method: o.method ?? (o.body ? 'POST' : 'GET'), headers: { Authorization: 'Bearer ' + jwt, ...(o.body ? { 'Content-Type': 'application/json' } : {}) }, body: o.body ? JSON.stringify(o.body) : undefined }));
  }, [central, getToken]);

  const token = useCallback(async (force = false) => {
    if (!school || !userId) throw new ApiError('Pick a school first', 400);
    const t = tok.current;
    if (!force && t && t.code === school.schoolCode && t.user === userId && t.exp - Date.now() > 30_000) return t.token;
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      const { ticket } = await centralApi('/tickets', { body: { schoolCode: school.schoolCode } });
      const s = await parse(await fetch(school.baseUrl + '/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }) }));
      tok.current = { code: school.schoolCode, token: s.token, exp: new Date(s.expiresAt).getTime(), user: userId };
      return s.token as string;
    })().finally(() => { inflight.current = null; });
    return inflight.current;
  }, [school, userId, centralApi]);

  const api = useCallback(async (path: string, o: Opts = {}) => {
    const go = async (force: boolean) => fetch(school!.baseUrl + path, { method: o.method ?? (o.body ? 'POST' : 'GET'), headers: { Authorization: 'Bearer ' + (await token(force)), ...(o.body ? { 'Content-Type': 'application/json' } : {}) }, body: o.body ? JSON.stringify(o.body) : undefined });
    let r = await go(false); if (r.status === 401) r = await go(true);
    return parse(r);
  }, [school, token]);

  const refreshMe = useCallback(async () => {
    if (!school) return null; setMeState('loading'); setMeError(null);
    try { const m = (await api("/me")) as Me | null; setMe(m ?? null); setMeState('ready'); return m; }
    catch (e) { setMeError(e instanceof Error ? e.message : 'Failed'); setMeState('error'); return null; }
  }, [api, school]);
  useEffect(() => { setMe(null); setMeState('idle'); if (isLoaded && isSignedIn && school) refreshMe(); }, [isLoaded, isSignedIn, school, userId]); // eslint-disable-line

  const chooseSchool = useCallback((s: School | null) => { tok.current = null; if (s) localStorage.setItem(KEY, s.schoolCode); else localStorage.removeItem(KEY); setCode(s?.schoolCode ?? null); }, []);
  const value: Ctx = { central, schools, schoolsError, school, meta, me, meState, meError, flags, chooseSchool, refreshMe, api, centralApi, token: () => token(false), reloadSchools: () => setN(x => x + 1) };
  return <C.Provider value={value}>{children}</C.Provider>;
}
