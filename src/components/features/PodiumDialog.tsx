/**
 * @module hearts
 * Podium dialog: shows current standings ranked by total score (lowest wins in
 * Hearts), with podium-block heights and medal colors. Opened from the settings
 * drawer's "Finish Game" button. Doesn't change game state — viewing only —
 * but offers a "New Game" action so the player can start over from the podium.
 */

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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { PLAYER_NAMES } from '@/game/Players';
import { useGameStore } from '@/state/useGameStore';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const WOOD_TRIM = '#fde68a';
const CREAM = '#fffaf0';
const FELT = '#15803d';
const FELT_HOVER = '#166534';

// Medal palette per rank position (0 = 1st place).
type Medal = { fill: string; border: string; label: string };
const MEDALS: ReadonlyArray<Medal> = [
  { fill: '#fde047', border: '#a16207', label: '1st' }, // gold
  { fill: '#e5e7eb', border: '#6b7280', label: '2nd' }, // silver
  { fill: '#f59e0b', border: '#92400e', label: '3rd' }, // bronze
  { fill: '#d6d3d1', border: '#78716c', label: '4th' }, // stone neutral
];

const BLOCK_HEIGHTS = [140, 110, 80, 50];

export type PodiumDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function PodiumDialog({ open, onClose }: PodiumDialogProps) {
  const totalScores = useGameStore((s) => s.totalScores);
  const newGame = useGameStore((s) => s.newGame);

  // Rank players: lowest score first. Stable sort keeps the original seating
  // order when two players tie, so the visual order is at least deterministic.
  const ranked = PLAYER_NAMES.map((name, i) => ({ name, score: totalScores[i] }))
    .map((entry, originalIndex) => ({ ...entry, originalIndex }))
    .sort((a, b) => a.score - b.score || a.originalIndex - b.originalIndex);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: CREAM,
          border: `2px solid ${WOOD_DARK}`,
          color: WOOD_DARK,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: WOOD_DARK, pb: 1 }}>
        Standings
      </DialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ pt: 3, pb: 1 }}
        >
          {ranked.map((player, rank) => {
            const medal = MEDALS[rank];
            return (
              <Stack key={player.name} alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: medal.border }}>
                  {medal.label}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: BLOCK_HEIGHTS[rank],
                    background: medal.fill,
                    border: `2px solid ${medal.border}`,
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)',
                  }}
                >
                  {rank === 0 && (
                    <EmojiEventsIcon sx={{ color: medal.border, fontSize: 36 }} />
                  )}
                </Box>
                <Typography
                  sx={{ fontSize: 13, fontWeight: 700, color: WOOD_DARK, mt: 0.5 }}
                >
                  {player.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: WOOD_MID }}>
                  {player.score} pts
                </Typography>
              </Stack>
            );
          })}
        </Stack>
        <Typography
          sx={{ mt: 2, fontSize: 11, color: WOOD_MID, opacity: 0.7, textAlign: 'center' }}
        >
          In Hearts, the lowest score wins.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${WOOD_TRIM}` }}>
        <Button
          variant="text"
          onClick={onClose}
          sx={{ color: WOOD_MID, textTransform: 'none', fontWeight: 600 }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<RestartAltIcon />}
          onClick={() => {
            newGame();
            onClose();
          }}
          sx={{
            background: FELT,
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { background: FELT_HOVER },
          }}
        >
          New Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
