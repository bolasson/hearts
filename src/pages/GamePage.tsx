import { Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SettingsDrawer } from '@/components/features/SettingsDrawer';
import { Table } from '@/components/features/Table';
import { RoundEndDialog } from '@/components/features/RoundEndDialog';
import { ResultsDialog } from '@/components/features/ResultsDialog';
import { useGameClock } from '@/state/useGameClock';
import { logger } from '@/logger';

export function GamePage() {
  // Drives time-based transitions (CPU turns, trick reveal/resolve, pass animation).
  useGameClock();
  const navigate = useNavigate();
  logger.debug({ module: 'GamePage', action: 'render' }, 'Rendering');

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: '100dvh',
        background: '#022c22',
        p: {
          xs: 'max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))',
          md: 2,
        },
        color: '#0f172a',
        overflow: 'hidden',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
      }}
    >
      <IconButton
        aria-label="Go home"
        onClick={() => navigate('/')}
        sx={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: 'max(16px, env(safe-area-inset-left))',
          zIndex: 1200,
          background: '#451a03',
          color: '#fffaf0',
          border: '2px solid #451a03',
          boxShadow: '0 4px 12px -2px rgba(0,0,0,0.4)',
          '&:hover': { background: '#78350f' },
        }}
      >
        <HomeIcon />
      </IconButton>
      <SettingsDrawer />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          pt: { xs: 7, sm: 0 },
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'center',
        }}
      >
        <Table />
      </Box>
      <RoundEndDialog />
      <ResultsDialog />
    </Box>
  );
}
