'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
type T = { msg: string; sev: 'success' | 'error' | 'info' };
const Ctx = createContext<(msg: string, sev?: T['sev']) => void>(() => {});
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<T | null>(null); const [open, setOpen] = useState(false);
  const show = useCallback((msg: string, sev: T['sev'] = 'success') => { setT({ msg, sev }); setOpen(true); }, []);
  return (<Ctx.Provider value={show}>{children}
    <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: { xs: 88, md: 24 } }}>
      <Alert onClose={() => setOpen(false)} severity={t?.sev} variant="filled" sx={{ width: '100%' }}>{t?.msg}</Alert>
    </Snackbar></Ctx.Provider>);
}
