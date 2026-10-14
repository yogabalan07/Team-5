import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb',
        light: isDark ? '#60a5fa' : '#3b82f6',
        dark: isDark ? '#1d4ed8' : '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#94a3b8' : '#475569',
        light: isDark ? '#cbd5e1' : '#64748b',
        dark: isDark ? '#64748b' : '#334155',
        contrastText: '#ffffff',
      },
      success: {
        main: '#16a34a',
        light: '#22c55e',
        dark: '#15803d',
        contrastText: '#ffffff',
      },
      error: {
        main: '#dc2626',
        light: '#ef4444',
        dark: '#b91c1c',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#d97706',
        light: '#f59e0b',
        dark: '#b45309',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0284c7',
        light: '#38bdf8',
        dark: '#0369a1',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0b1329' : '#f8fafc',
        paper: isDark ? '#111c38' : '#ffffff',
        subtle: isDark ? '#172554' : '#f1f5f9',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
        disabled: isDark ? '#64748b' : '#94a3b8',
      },
      divider: isDark ? '#1e293b' : '#e2e8f0',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.25rem',
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 700,
        fontSize: '1.875rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.25,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '-0.015em',
        lineHeight: 1.35,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.1rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '0.95rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.8125rem',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0b1329' : '#f8fafc',
            color: isDark ? '#f8fafc' : '#0f172a',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 6,
            fontWeight: 600,
            padding: '6px 14px',
            transition: 'all 0.15s ease-in-out',
          },
          containedPrimary: {
            backgroundColor: isDark ? '#3b82f6' : '#2563eb',
            '&:hover': {
              backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
            },
          },
          outlined: {
            borderColor: isDark ? '#1e293b' : '#cbd5e1',
            '&:hover': {
              borderColor: isDark ? '#3b82f6' : '#2563eb',
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
              : '0 1px 3px 0 rgba(15, 23, 42, 0.03)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            backgroundColor: isDark ? '#0d152c' : '#ffffff',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            backgroundColor: isDark ? '#0d152c' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
            padding: '10px 14px',
            fontSize: '0.8125rem',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: isDark ? '#94a3b8' : '#64748b',
            backgroundColor: isDark ? '#0b1329' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },
    },
  });
};

const defaultTheme = getTheme('light');
export default defaultTheme;