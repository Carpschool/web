'use client';
import { createTheme, alpha } from '@mui/material/styles';
export const ink = '#13203B', paper = '#F5F0E6', amber = '#F2A900', moss = '#2F7A57', brick = '#C4462B';
const display = 'var(--font-display), system-ui, sans-serif';
const body = 'var(--font-body), system-ui, sans-serif';
export const mono = 'var(--font-mono), ui-monospace, monospace';
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: ink, contrastText: paper },
    secondary: { main: amber, contrastText: ink },
    success: { main: moss }, error: { main: brick }, warning: { main: '#D9822B' },
    background: { default: paper, paper: '#FFFCF6' },
    text: { primary: ink, secondary: alpha(ink, 0.66) },
    divider: alpha(ink, 0.12),
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.95 },
    h2: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontFamily: display, fontWeight: 750, letterSpacing: '-0.025em' },
    h4: { fontFamily: display, fontWeight: 750, letterSpacing: '-0.02em', fontSize: '1.85rem' },
    h5: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.01em' },
    overline: { fontFamily: mono, letterSpacing: '0.14em', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20, minHeight: 44, transition: 'transform .12s ease, background-color .2s' , '&:active': { transform: 'scale(0.97)' } },
        sizeLarge: { minHeight: 52, fontSize: '1.02rem', paddingInline: 26 },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: alpha(ink, 0.12), borderRadius: 20 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: '#FFFCF6' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 999 } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 12, '&.Mui-selected': { backgroundColor: ink, color: paper, '&:hover': { backgroundColor: alpha(ink, 0.9) } } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiBottomNavigationAction: { styleOverrides: { root: { '&.Mui-selected': { color: ink } } } },
    MuiSkeleton: { defaultProps: { animation: 'wave' } },
  },
});
