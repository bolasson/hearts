import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { AppRouter } from './router';
import { usePlayerProfilesStore } from './state/usePlayerProfilesStore';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const FELT = '#15803d';
const FELT_HOVER = '#166534';

function MainPlayerGate() {
  const [name, setName] = useState('');
  const mainHumanProfileId = usePlayerProfilesStore((s) => s.mainHumanProfileId);
  const createMainHumanProfile = usePlayerProfilesStore((s) => s.createMainHumanProfile);
  const needsMainPlayer = mainHumanProfileId === null;

  const saveMainPlayer = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMainHumanProfile(trimmed);
    setName('');
  };

  return (
    <Dialog
      open={needsMainPlayer}
      PaperProps={{
        sx: {
          width: 'min(360px, calc(100vw - 32px))',
          borderRadius: '14px',
          background: CREAM,
          color: WOOD_DARK,
          border: `3px solid ${WOOD_DARK}`,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Enter Your Name</DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Stack spacing={0.75}>
          <TextField
            id="main-player-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveMainPlayer();
            }}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          disabled={name.trim().length === 0}
          onClick={saveMainPlayer}
          sx={{
            background: FELT,
            color: '#ffffff',
            textTransform: 'none',
            fontSize: 16,
            fontWeight: 600,
            px: 3,
            '&:hover': {
              background: FELT_HOVER,
            },
            '&.Mui-disabled': {
              background: 'rgba(120, 53, 15, 0.24)',
              color: WOOD_MID,
            },
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function App() {
  return (
    <>
      <AppRouter />
      <MainPlayerGate />
    </>
  );
}
