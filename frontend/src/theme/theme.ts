import { createTheme, alpha } from '@mui/material/styles';

// Luxury hotel color palette
const palette = {
  navy:      '#0B1D3A',
  deepNavy:  '#06101F',
  gold:      '#C9A84C',
  goldLight: '#E2C97E',
  slate:     '#94A3B8',
  white:     '#F8FAFC',
  surface:   '#0F2548',
  error:     '#EF4444',
  success:   '#22C55E',
  info:      '#3B82F6',
  warning:   '#F59E0B',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.gold,
      light: palette.goldLight,
      contrastText: palette.deepNavy,
    },
    secondary: {
      main: palette.slate,
      contrastText: palette.white,
    },
    background: {
      default: palette.deepNavy,
      paper: palette.navy,
    },
    text: {
      primary: palette.white,
      secondary: palette.slate,
    },
    error:   { main: palette.error },
    success: { main: palette.success },
    info:    { main: palette.info },
    warning: { main: palette.warning },
    divider: alpha(palette.slate, 0.15),
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'none',
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(palette.slate, 0.3)} transparent`,
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.deepNavy, 0.85),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(palette.slate, 0.1)}`,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${palette.gold} 0%, ${palette.goldLight} 100%)`,
          color: palette.deepNavy,
          '&:hover': {
            background: `linear-gradient(135deg, ${palette.goldLight} 0%, ${palette.gold} 100%)`,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 20px ${alpha(palette.gold, 0.4)}`,
          },
        },
        outlined: {
          borderColor: alpha(palette.gold, 0.5),
          color: palette.gold,
          '&:hover': {
            borderColor: palette.gold,
            backgroundColor: alpha(palette.gold, 0.08),
          },
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.navy, 0.6),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(palette.slate, 0.1)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            border: `1px solid ${alpha(palette.gold, 0.3)}`,
            boxShadow: `0 8px 32px ${alpha(palette.gold, 0.1)}`,
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: alpha(palette.slate, 0.2),
            },
            '&:hover fieldset': {
              borderColor: alpha(palette.gold, 0.5),
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.gold,
            },
          },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.navy,
          borderRight: `1px solid ${alpha(palette.slate, 0.1)}`,
        },
      },
    },
  },
});

export default theme;
