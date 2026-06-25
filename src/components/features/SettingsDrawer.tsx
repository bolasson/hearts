import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import TuneIcon from '@mui/icons-material/Tune';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { ReactNode } from 'react';
import { Reorder } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Suit } from '@/game/Card';
import type { Speed } from '@/game/layout';
import type { NumberOrder, SortFirstBy } from '@/game/sort';
import { useGameStore } from '@/state/useGameStore';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const DANGER = '#991b1b';
const DANGER_HOVER = '#7f1d1d';

const SPEED_OPTIONS: ReadonlyArray<{ value: Speed; label: string }> = [
  { value: 'extraSlow', label: 'Extra Slow - 3.0s' },
  { value: 'slow', label: 'Slow - 1.0s' },
  { value: 'normal', label: 'Normal - 0.5s' },
  { value: 'fast', label: 'Fast - 0.2s' },
  { value: 'turbo', label: 'Turbo - 0.08s' },
  { value: 'instant', label: 'Instant' },
];

const NUMBER_ORDER_OPTIONS: ReadonlyArray<{ value: NumberOrder; label: string }> = [
  { value: 'asc', label: 'Low to High' },
  { value: 'desc', label: 'High to Low' },
  { value: 'random', label: 'Random' },
];

const SORT_FIRST_OPTIONS: ReadonlyArray<{ value: SortFirstBy; label: string }> = [
  { value: 'suit', label: 'Suit' },
  { value: 'number', label: 'Number' },
];

function SuitChip({ suit }: { suit: Suit }) {
  const isRed = suit === '\u2665' || suit === '\u2666';
  return (
    <Box
      sx={{
        width: 46,
        height: 62,
        borderRadius: '6px',
        border: `1.5px solid ${WOOD_DARK}`,
        background: '#ffffff',
        color: isRed ? '#dc2626' : '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 700,
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {suit}
    </Box>
  );
}

const selectSx = {
  color: WOOD_DARK,
  '& .MuiSelect-select': {
    py: 1.15,
    px: 2,
  },
  '&:before, &:after': {
    display: 'none',
  },
  '& .MuiSvgIcon-root': { color: WOOD_MID },
} as const;

function SettingsSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: WOOD_MID,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ borderTop: `1px solid ${WOOD_DARK}`, mb: 2 }} />
      {children}
    </Box>
  );
}

function LabeledControl({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        border: `2px solid ${WOOD_DARK}`,
        borderRadius: '8px',
        background: CREAM,
        pt: 0.55,
        '&:focus-within': {
          boxShadow: '0 0 0 2px rgba(69, 26, 3, 0.12)',
        },
      }}
    >
      <Typography
        component="span"
        sx={{
          position: 'absolute',
          top: -11,
          left: 20,
          px: 0.7,
          background: CREAM,
          color: WOOD_MID,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.2,
          zIndex: 1,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export function SettingsLauncher() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <IconButton
      aria-label="Open settings"
      onClick={() => navigate('/settings', { state: { backgroundLocation: location } })}
      sx={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top))',
        right: 'max(16px, env(safe-area-inset-right))',
        zIndex: 1200,
        background: WOOD_DARK,
        color: CREAM,
        border: `2px solid ${WOOD_DARK}`,
        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.4)',
        '&:hover': { background: WOOD_MID },
      }}
    >
      <TuneIcon />
    </IconButton>
  );
}

export function SettingsContent({
  footer,
  fullHeight = false,
  onClearDataClick,
}: {
  footer?: ReactNode;
  fullHeight?: boolean;
  onClearDataClick?: () => void;
}) {
  const cpuSpeed = useGameStore((s) => s.cpuSpeed);
  const handSortConfig = useGameStore((s) => s.handSortConfig);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setHandSortConfig = useGameStore((s) => s.setHandSortConfig);

  const handleSpeedChange = (event: SelectChangeEvent<Speed>) => {
    setSpeed(event.target.value as Speed);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        height: fullHeight ? '100%' : 'auto',
        px: { xs: 2, sm: 2.5 },
        py: { xs: 3, sm: 3.5 },
        background: CREAM,
        border: `6px solid ${WOOD_DARK}`,
        outline: `3px solid rgba(146, 64, 14, 0.4)`,
        outlineOffset: 0,
        borderRadius: fullHeight ? '0 24px 24px 0' : '24px',
        color: WOOD_DARK,
        boxShadow: '0 18px 36px rgba(0,0,0,0.22)',
      }}
    >
    <Stack spacing={3} sx={{ height: '100%' }}>
      <Typography
        component="h2"
        sx={{
          color: WOOD_DARK,
          fontSize: 24,
          fontWeight: 900,
          lineHeight: 1.1,
          textAlign: 'center',
        }}
      >
        Preferences
      </Typography>
      <SettingsSection title="Animation">
        <LabeledControl label="Card Movement">
          <FormControl size="small" fullWidth>
            <Select<Speed>
              aria-label="Card Movement"
              variant="standard"
              value={cpuSpeed}
              onChange={handleSpeedChange}
              sx={selectSx}
            >
              {SPEED_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </LabeledControl>
      </SettingsSection>

      <SettingsSection title="Hand Sorting">
        <Stack spacing={2.5}>
          <LabeledControl label="Sort first by">
            <FormControl size="small" fullWidth>
              <Select<SortFirstBy>
                aria-label="Sort first by"
                variant="standard"
                value={handSortConfig.sortFirstBy}
                onChange={(event) =>
                  setHandSortConfig({ sortFirstBy: event.target.value as SortFirstBy })
                }
                sx={selectSx}
              >
                {SORT_FIRST_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </LabeledControl>

          <LabeledControl label="Suit order">
            <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
              <Reorder.Group
                axis="x"
                values={[...handSortConfig.suitOrder]}
                onReorder={(newOrder) =>
                  setHandSortConfig({ suitOrder: newOrder as readonly Suit[] })
                }
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 0,
                  margin: 0,
                  listStyle: 'none',
                }}
            >
              {handSortConfig.suitOrder.map((suit) => (
                <Reorder.Item
                  key={suit}
                  value={suit}
                  style={{ listStyle: 'none', cursor: 'grab' }}
                  whileDrag={{ scale: 1.08, zIndex: 1 }}
                >
                  <SuitChip suit={suit} />
                </Reorder.Item>
              ))}
            </Reorder.Group>
            </Box>
          </LabeledControl>

          <LabeledControl label="Number order">
            <FormControl size="small" fullWidth>
              <Select<NumberOrder>
                aria-label="Number order"
                variant="standard"
                value={handSortConfig.numberOrder}
                onChange={(event) =>
                  setHandSortConfig({ numberOrder: event.target.value as NumberOrder })
                }
                sx={selectSx}
              >
                {NUMBER_ORDER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </LabeledControl>
        </Stack>
      </SettingsSection>

      {onClearDataClick && (
        <SettingsSection title="Data">
          <Button
            variant="contained"
            fullWidth
            startIcon={<DeleteForeverIcon />}
            onClick={onClearDataClick}
            sx={{
              minHeight: 48,
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
            Clear Data
          </Button>
        </SettingsSection>
      )}
      {footer && (
        <>
          <Box sx={{ flexGrow: 1, minHeight: 18 }} />
          {footer}
        </>
      )}
    </Stack>
    </Paper>
  );
}

export function SettingsDrawer() {
  return <SettingsLauncher />;
}
