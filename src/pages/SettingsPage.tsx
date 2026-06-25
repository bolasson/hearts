import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SettingsContent } from '@/components/features/SettingsDrawer';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const CREAM_HOVER = '#f8eedb';
const FELT = '#15803d';
const DANGER = '#991b1b';
const DANGER_HOVER = '#7f1d1d';
const FELT_HOVER = '#166534';
const popupPaperSx = {
  background: CREAM,
  border: { xs: `4px solid ${WOOD_DARK}`, sm: `6px solid ${WOOD_DARK}` },
  outline: { xs: '2px solid rgba(146, 64, 14, 0.4)', sm: '3px solid rgba(146, 64, 14, 0.4)' },
  outlineOffset: 0,
  borderRadius: { xs: '18px', sm: '24px' },
  color: WOOD_DARK,
  width: 'min(380px, calc(100vw - 24px))',
  maxWidth: 'calc(100vw - 24px)',
  m: 0,
} as const;

const popupActionsSx = {
  px: { xs: 2, sm: 3 },
  py: 2,
  borderTop: `1px solid ${WOOD_MID}`,
  mx: { xs: 2, sm: 3 },
  justifyContent: 'center',
  gap: 1,
  '& .MuiButton-root': {
    minHeight: 48,
    flex: { xs: '1 1 0', sm: '0 0 auto' },
  },
} as const;

export function SettingsPage() {
  const navigate = useNavigate();
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const clearData = () => {
    localStorage.removeItem('hearts-player-profiles');
    localStorage.removeItem('hearts-game-settings');
    localStorage.removeItem('hearts-active-games');
    window.history.replaceState(null, '', '/');
    window.location.reload();
  };

  const closeSettings = () => {
    setExiting(true);
    window.setTimeout(() => navigate(-1), 220);
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
        p: 0,
        background: 'transparent',
        color: CREAM,
        display: 'flex',
        justifyContent: 'flex-start',
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
      }}
    >
      <Box
        onClick={closeSettings}
        sx={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.42)' }}
      />

      <Dialog
        open={clearDataOpen}
        onClose={() => setClearDataOpen(false)}
        PaperProps={{
          sx: popupPaperSx,
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Clear Data?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.25}>
            <Typography sx={{ color: WOOD_DARK, fontWeight: 700 }}>
              This will delete data stored on this device:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, color: WOOD_MID }}>
              <li>Human player profiles and game history</li>
              <li>CPU player profiles and strategies</li>
              <li>Unfinished local games</li>
              <li>Saved game settings</li>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={popupActionsSx}>
          <Button
            variant="outlined"
            onClick={() => setClearDataOpen(false)}
            sx={{
              borderColor: WOOD_MID,
              color: WOOD_DARK,
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 600,
              '&:hover': {
                borderColor: WOOD_DARK,
                background: CREAM_HOVER,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteForeverIcon />}
            onClick={clearData}
            sx={{
              background: DANGER,
              color: '#ffffff',
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: DANGER_HOVER,
              },
            }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      <Stack
        component={motion.main}
        initial={{ x: '-100%', opacity: 0.8 }}
        animate={exiting ? { x: '-100%', opacity: 0.8 } : { x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }}
        sx={{
          width: 'min(430px, calc(100vw - 54px))',
          height: '100%',
          m: 0,
          pr: 0,
          pl: 0,
          pb: 0,
          pt: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <SettingsContent
          fullHeight
          onClearDataClick={() => setClearDataOpen(true)}
          footer={
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={closeSettings}
              sx={{
                minHeight: 54,
                color: '#ffffff',
                background: FELT,
                textTransform: 'none',
                fontSize: 16,
                fontWeight: 600,
                px: 3,
                boxShadow: 'none',
                '&:hover': {
                  background: FELT_HOVER,
                },
              }}
            >
              Save
            </Button>
          }
        />
      </Stack>
    </Box>
  );
}
