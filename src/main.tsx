import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './theme';
import { App } from './App';
import { logger } from './logger';

logger.info({ module: 'main', action: 'boot' }, 'Application starting');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
