import { createTheme } from '@mui/material/styles';

/**
 * The MUI theme for the app.
 *
 * Most styling decisions live here:
 * - palette (colors)
 * - typography
 * - shape (border radius)
 * - components (default props and styles for MUI components)
 *
 * Component-level styling uses the `sx` prop and references the theme via callbacks:
 *   sx={{ color: (theme) => theme.palette.primary.main }}
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': {
          width: '100%',
          minWidth: 0,
          height: '100%',
          minHeight: '100%',
          margin: 0,
          overflow: 'hidden',
          overscrollBehavior: 'none',
          touchAction: 'manipulation',
          background: '#022c22',
        },
        body: {
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
  },
});
