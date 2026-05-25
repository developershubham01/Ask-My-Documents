import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4F46E5',
      light: '#818CF8',
      dark: '#3730A3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#000000',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      disabled: '#475569',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
    error: {
      main: '#EF4444',
      light: '#F87171',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h2: {
      fontWeight: 700,
      letterSpacing: 0,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: 0,
    },
    h4: {
      fontWeight: 600,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: 0,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.8125rem',
      letterSpacing: 0,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.65,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: 0,
    },
    overline: {
      fontWeight: 700,
      letterSpacing: 0,
      fontSize: '0.6875rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.3)',
    '0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3)',
    '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.3)',
    '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.3)',
    '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
    '0 25px 50px -12px rgba(0,0,0,0.5)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#334155 transparent',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#334155',
            borderRadius: 3,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5B52F0 0%, #8B49F7 100%)',
            boxShadow: '0 6px 20px 0 rgba(79, 70, 229, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(79, 70, 229, 0.5)',
          '&:hover': {
            borderColor: '#4F46E5',
            background: 'rgba(79, 70, 229, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
          border: '1px solid rgba(148, 163, 184, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.08)',
            background: 'rgba(79, 70, 229, 0.12)',
          },
        },
      },
    },
  },
});

const lightTheme = createTheme({
  ...darkTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5',
      light: '#818CF8',
      dark: '#3730A3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      disabled: '#94A3B8',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
    error: {
      main: '#EF4444',
    },
    success: {
      main: '#10B981',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
  },
  components: {
    ...darkTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

export { darkTheme, lightTheme };
