import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import MemoryIcon from '@mui/icons-material/Memory';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TableChartIcon from '@mui/icons-material/TableChart';
import TuneIcon from '@mui/icons-material/Tune';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore, type SavedGameSession } from '@/state/useGameStore';
import { usePlayerProfilesStore } from '@/state/usePlayerProfilesStore';
import { logger } from '@/logger';

const WOOD_DARK = '#451a03';
const WOOD_MID = '#78350f';
const CREAM = '#fffaf0';
const CREAM_HOVER = '#f8eedb';
const CREAM_ALT = '#fdf3df';
const FELT = '#15803d';
const FELT_HOVER = '#166534';
const DANGER = '#991b1b';
const DANGER_HOVER = '#7f1d1d';
const SCORE_HEADER_BG = '#fef3c7';
const SCORE_TOTAL_BG = '#fde68a';
const MENU_WIDTH = 'min(100%, 430px)';
const BUTTON_WIDTH = 'min(100%, 340px)';
const MENU_BOTTOM_PADDING = 'max(54px, calc(env(safe-area-inset-bottom) + 38px))';
const PLAYER_STAT_FONT_SIZE = 8;
const SCORE_WHEEL_VALUES = Array.from({ length: 27 }, (_, index) => index);
const SCORE_WHEEL_STEP = 52;

type HomeMode =
  | 'main'
  | 'newGame'
  | 'resumeGame'
  | 'players'
  | 'scorecardSetup'
  | 'inPersonScorecard'
  | 'cpuOptions';
type ScoreTupleMutable = [number, number, number, number];
type ScoreEntryState = {
  editingRoundIndex: number | null;
  values: string[];
  hasInteracted: boolean;
};
type PlayerSortKey =
  | 'gamesDesc'
  | 'gamesAsc'
  | 'recentDesc'
  | 'recentAsc'
  | 'winsDesc'
  | 'winsAsc'
  | 'nameAsc'
  | 'nameDesc';

const PLAYER_SORT_OPTIONS: ReadonlyArray<{ value: PlayerSortKey; label: string }> = [
  { value: 'gamesDesc', label: 'Games played: High to Low' },
  { value: 'gamesAsc', label: 'Games played: Low to High' },
  { value: 'recentDesc', label: 'Last played: Recently' },
  { value: 'recentAsc', label: 'Last played: Long Ago' },
  { value: 'winsDesc', label: 'Wins: High to Low' },
  { value: 'winsAsc', label: 'Wins: Low to High' },
  { value: 'nameAsc', label: 'Name: A to Z' },
  { value: 'nameDesc', label: 'Name: Z to A' },
];

const sharedButtonSx = {
  textTransform: 'none',
  fontSize: 16,
  fontWeight: 600,
} as const;

const menuButtonSx = {
  ...sharedButtonSx,
  minHeight: 54,
  borderColor: WOOD_MID,
  color: WOOD_DARK,
  background: CREAM,
  '&:hover': {
    borderColor: WOOD_DARK,
    background: CREAM_HOVER,
  },
  '&.Mui-disabled': {
    borderColor: 'rgba(120, 53, 15, 0.34)',
    color: 'rgba(69, 26, 3, 0.48)',
    background: 'rgba(255, 250, 240, 0.56)',
  },
} as const;

const newGameButtonSx = {
  ...sharedButtonSx,
  minHeight: 58,
  background: FELT,
  color: '#ffffff',
  fontWeight: 600,
  px: 3,
  boxShadow: 'none',
  '&:hover': {
    background: FELT_HOVER,
  },
  '&.Mui-disabled': {
    background: 'rgba(120, 53, 15, 0.24)',
    color: WOOD_MID,
  },
} as const;

const dangerButtonSx = {
  ...sharedButtonSx,
  minHeight: 54,
  background: DANGER,
  color: '#ffffff',
  px: 3,
  boxShadow: 'none',
  '&:hover': {
    background: DANGER_HOVER,
  },
} as const;

const scoreCellSx = {
  py: 0.45,
  px: 0.7,
  fontSize: 12,
  borderBottomColor: WOOD_DARK,
  borderRight: `1px solid ${WOOD_DARK}`,
  color: WOOD_DARK,
  textAlign: 'center',
  whiteSpace: 'nowrap',
} as const;

const scoreLastCellSx = {
  ...scoreCellSx,
  borderRight: 'none',
} as const;

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

function formatLastPlayed(playedAt: string | undefined): string {
  if (!playedAt) return 'Never';
  const timestamp = new Date(playedAt);
  if (Number.isNaN(timestamp.getTime())) return 'Unknown';
  const elapsedDays = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 86_400_000));
  return `${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'}`;
}

function formatGameStarted(startedAt: string | null): string {
  if (!startedAt) return '';
  const timestamp = new Date(startedAt);
  if (Number.isNaN(timestamp.getTime())) return '';
  return timestamp.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function lastPlayedMs(profile: { createdAt: string; games: { playedAt: string }[] }): number {
  return profile.games
    .map((game) => new Date(game.playedAt).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0] ?? 0;
}

function winCount(profile: { games: { place: number }[] }): number {
  return profile.games.filter((game) => game.place === 1).length;
}

function lossCount(profile: { games: { place: number }[] }): number {
  return profile.games.filter((game) => game.place === 4).length;
}

const scorecardSelectSx = {
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

function LabeledControl({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box
      sx={{
        position: 'relative',
        border: `2px solid ${WOOD_DARK}`,
        borderRadius: '8px',
        background: CREAM,
        mt: 1.25,
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

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<HomeMode>('main');
  const [scorecardExiting, setScorecardExiting] = useState(false);
  const [playersExiting, setPlayersExiting] = useState(false);
  const playersListRef = useRef<HTMLDivElement | null>(null);
  const [playersListAtTop, setPlayersListAtTop] = useState(true);
  const [playersListAtBottom, setPlayersListAtBottom] = useState(true);
  const [playerSort, setPlayerSort] = useState<PlayerSortKey>('gamesDesc');
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNameError, setNewPlayerNameError] = useState('');
  const [scorecardPlayerIds, setScorecardPlayerIds] = useState(['', '', '', '']);
  const [inPersonPlayerIds, setInPersonPlayerIds] = useState<string[]>([]);
  const [inPersonRounds, setInPersonRounds] = useState<ScoreTupleMutable[]>([]);
  const [inPersonStartedAt, setInPersonStartedAt] = useState<string | null>(null);
  const [scoreEntry, setScoreEntry] = useState<ScoreEntryState | null>(null);
  const scoreWheelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [finishInPersonOpen, setFinishInPersonOpen] = useState(false);
  const newGame = useGameStore((s) => s.newGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const savedGames = useGameStore((s) => s.savedGames);
  const humanProfiles = usePlayerProfilesStore((s) => s.humanProfiles);
  const cpuProfiles = usePlayerProfilesStore((s) => s.cpuProfiles);
  const mainHumanProfileId = usePlayerProfilesStore((s) => s.mainHumanProfileId);
  const addHumanProfile = usePlayerProfilesStore((s) => s.addHumanProfile);
  const archiveHumanProfile = usePlayerProfilesStore((s) => s.archiveHumanProfile);
  const recordHumanGame = usePlayerProfilesStore((s) => s.recordHumanGame);
  const activeHumanProfiles = humanProfiles.filter((profile) => !profile.archivedAt);
  const deletePlayer = humanProfiles.find((profile) => profile.id === deletePlayerId) ?? null;
  const mainHumanProfile = activeHumanProfiles.find((profile) => profile.id === mainHumanProfileId);
  const gamePlayerNames = [
    mainHumanProfile?.name ?? 'You',
    cpuProfiles[0]?.name ?? 'CPU 1',
    cpuProfiles[1]?.name ?? 'CPU 2',
    cpuProfiles[2]?.name ?? 'CPU 3',
  ];
  const inPersonPlayers = inPersonPlayerIds.map((id) =>
    activeHumanProfiles.find((profile) => profile.id === id)
  );
  const inPersonPlayerNames = inPersonPlayers.map((profile, index) => profile?.name ?? `Player ${index + 1}`);
  const inPersonTotals: ScoreTupleMutable = inPersonRounds.reduce<ScoreTupleMutable>(
    (totals, round) => [
      totals[0] + round[0],
      totals[1] + round[1],
      totals[2] + round[2],
      totals[3] + round[3],
    ],
    [0, 0, 0, 0]
  );
  const inPersonStartedLabel = formatGameStarted(inPersonStartedAt);
  logger.debug({ module: 'HomePage', action: 'render' }, 'Rendering');

  useEffect(() => {
    if (!mainHumanProfileId) return;
    setScorecardPlayerIds((players) => {
      if (players.some(Boolean)) return players;
      return [mainHumanProfileId, '', '', ''];
    });
  }, [mainHumanProfileId]);

  useEffect(() => {
    if (!scoreEntry) return;
    window.setTimeout(() => {
      scoreEntry.values.forEach((value, index) => {
        if (index < 2) return;
        const wheel = scoreWheelRefs.current[index];
        if (!wheel) return;
        wheel.scrollLeft = Number(value) * SCORE_WHEEL_STEP;
      });
    }, 0);
  }, [scoreEntry?.editingRoundIndex]);

  const updatePlayersListFade = (element: HTMLDivElement | null) => {
    if (!element) return;
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    setPlayersListAtTop(element.scrollTop <= 1);
    setPlayersListAtBottom(element.scrollTop >= maxScrollTop - 1);
  };

  const startLocalGame = () => {
    newGame();
    navigate('/game');
  };

  const openScorecardSetup = () => {
    setScorecardExiting(false);
    setMode('scorecardSetup');
  };

  const closeScorecardSetup = () => {
    setScorecardExiting(true);
    window.setTimeout(() => {
      setMode('newGame');
      setScorecardExiting(false);
    }, 220);
  };

  const startInPersonGame = () => {
    if (!canStartInPersonGame) return;
    setInPersonPlayerIds([...scorecardPlayerIds]);
    setInPersonRounds([]);
    setInPersonStartedAt(new Date().toISOString());
    setMode('inPersonScorecard');
    setScorecardExiting(false);
  };

  const openScoreEntry = (roundIndex: number | null) => {
    const existing = roundIndex === null ? null : inPersonRounds[roundIndex];
    setScoreEntry({
      editingRoundIndex: roundIndex,
      values: existing ? existing.map(String) : ['0', '0', '0', '0'],
      hasInteracted: false,
    });
  };

  const getScoreValidation = (entry: ScoreEntryState | null): { valid: boolean; error: string | null } => {
    if (!entry) return { valid: false, error: null };
    const parsed = entry.values.map((value) => {
      const trimmed = value.trim();
      if (trimmed === '') return null;
      const score = Number(trimmed);
      return Number.isInteger(score) && score >= 0 && score <= 26 ? score : Number.NaN;
    });
    if (parsed.some((score) => Number.isNaN(score))) {
      return { valid: false, error: 'Scores must be whole numbers from 0 to 26' };
    }

    const filled = parsed.filter((score): score is number => score !== null);
    const has26 = filled.some((score) => score === 26);
    if (has26) {
      if (filled.length < entry.values.length) return { valid: false, error: null };
      const count26 = filled.filter((score) => score === 26).length;
      const count0 = filled.filter((score) => score === 0).length;
      if (count26 === 3 && count0 === 1) return { valid: true, error: null };
      return { valid: false, error: 'Shooting the moon requires three players with 26 and one with 0' };
    }

    const total = filled.reduce((a, b) => a + b, 0);
    if (total > 26) return { valid: false, error: 'Scores cannot total more than 26' };
    if (filled.length < entry.values.length) return { valid: false, error: null };
    if (Math.max(...filled) < 13) return { valid: false, error: 'At least one player must have 13 or more points' };
    if (total === 26) return { valid: true, error: null };
    return { valid: false, error: `Scores must total 26 (currently ${total})` };
  };

  const scoreValidation = getScoreValidation(scoreEntry);
  const hasValidScoreEntry = scoreValidation.valid;
  const scoreErrorMessage = scoreEntry?.hasInteracted ? scoreValidation.error : null;

  const setScoreEntryValue = (index: number, score: number) => {
    setScoreEntry((entry) => {
      if (!entry) return entry;
      const nextValue = String(Math.min(26, Math.max(0, score)));
      const nextValues = [...entry.values];
      nextValues[index] = nextValue;
      return { ...entry, values: nextValues, hasInteracted: true };
    });
  };

  const adjustScoreEntryValue = (index: number, delta: number) => {
    const current = Number(scoreEntry?.values[index] || 0);
    setScoreEntryValue(index, current + delta);
  };

  const handleScoreWheelScroll = (index: number, element: HTMLDivElement) => {
    const score = Math.min(26, Math.max(0, Math.round(element.scrollLeft / SCORE_WHEEL_STEP)));
    if (scoreEntry?.values[index] === String(score)) return;
    setScoreEntryValue(index, score);
  };

  const selectScoreWheelValue = (index: number, score: number) => {
    setScoreEntryValue(index, score);
    scoreWheelRefs.current[index]?.scrollTo({
      left: score * SCORE_WHEEL_STEP,
      behavior: 'smooth',
    });
  };

  const submitScoreEntry = () => {
    if (!scoreEntry || !hasValidScoreEntry) return;
    const round = scoreEntry.values.map((value) => Number(value)) as ScoreTupleMutable;
    setInPersonRounds((rounds) => {
      if (scoreEntry.editingRoundIndex === null) return [...rounds, round];
      return rounds.map((existing, index) => (index === scoreEntry.editingRoundIndex ? round : existing));
    });
    setScoreEntry(null);
  };

  const placeForScore = (score: number, scores: ScoreTupleMutable): 1 | 2 | 3 | 4 => {
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    if (score === minScore) return 1;
    if (score === maxScore) return 4;
    const lowerScoreCount = new Set(scores.filter((candidate) => candidate < score)).size;
    return Math.min(4, lowerScoreCount + 1) as 1 | 2 | 3 | 4;
  };

  const finishInPersonGame = () => {
    const playedAt = new Date().toISOString();
    inPersonPlayerIds.forEach((id, index) => {
      recordHumanGame(id, {
        playedAt,
        finalScore: inPersonTotals[index],
        place: placeForScore(inPersonTotals[index], inPersonTotals),
      });
    });
    setFinishInPersonOpen(false);
    setMode('main');
  };

  const openPlayers = () => {
    setPlayersExiting(false);
    setMode('players');
  };

  const closePlayers = () => {
    setPlayersExiting(true);
    window.setTimeout(() => {
      setMode('main');
      setPlayersExiting(false);
    }, 220);
  };

  const resumeGame = () => {
    if (savedGames.length === 0) return;
    setMode('resumeGame');
  };

  const resumeSavedGame = (id: string) => {
    loadGame(id);
    navigate('/game');
  };

  const selectedScorecardPlayerIds = new Set(scorecardPlayerIds.filter(Boolean));
  const canStartInPersonGame = scorecardPlayerIds.every(Boolean);
  const featuredPlayer = activeHumanProfiles
    .filter((profile) => !selectedScorecardPlayerIds.has(profile.id))
    .map((profile) => {
      const lastGame = profile.games
        .map((game) => new Date(game.playedAt).getTime())
        .sort((a, b) => b - a)[0];
      return {
        profile,
        lastPlayedAt: lastGame ?? 0,
      };
    })
    .sort((a, b) => a.lastPlayedAt - b.lastPlayedAt || a.profile.games.length - b.profile.games.length)[0]?.profile;

  const sortedHumanProfiles = [...activeHumanProfiles].sort((a, b) => {
    switch (playerSort) {
      case 'gamesAsc':
        return a.games.length - b.games.length || a.name.localeCompare(b.name);
      case 'gamesDesc':
        return b.games.length - a.games.length || a.name.localeCompare(b.name);
      case 'recentAsc':
        return lastPlayedMs(a) - lastPlayedMs(b) || a.name.localeCompare(b.name);
      case 'recentDesc':
        return lastPlayedMs(b) - lastPlayedMs(a) || a.name.localeCompare(b.name);
      case 'winsAsc':
        return winCount(a) - winCount(b) || a.name.localeCompare(b.name);
      case 'winsDesc':
        return winCount(b) - winCount(a) || a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'nameAsc':
      default:
        return a.name.localeCompare(b.name);
    }
  });
  const playersListMask = `linear-gradient(to bottom, ${
    playersListAtTop ? 'black 0, black 0' : 'transparent 0, black 54px'
  }, black ${playersListAtBottom ? '100%' : 'calc(100% - 54px)'}, ${
    playersListAtBottom ? 'black 100%' : 'transparent 100%'
  })`;

  useEffect(() => {
    if (mode !== 'players') return;
    requestAnimationFrame(() => updatePlayersListFade(playersListRef.current));
  }, [mode, playerSort, sortedHumanProfiles.length]);

  const updateScorecardPlayer = (index: number, value: string) => {
    setScorecardPlayerIds((players) => {
      const next = [...players];
      next[index] = value;
      return next;
    });
  };

  const clearScorecardPlayer = (index: number) => {
    setScorecardPlayerIds((players) => {
      const next = [...players];
      next[index] = '';
      return next;
    });
  };

  const deleteHumanPlayer = (id: string) => {
    archiveHumanProfile(id);
    setScorecardPlayerIds((players) => players.map((playerId) => (playerId === id ? '' : playerId)));
    setDeletePlayerId(null);
  };

  const createHumanPlayer = () => {
    const trimmedName = newPlayerName.trim();
    const nameExists = humanProfiles.some(
      (profile) => profile.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (!trimmedName) {
      setNewPlayerNameError('Enter a player name.');
      return;
    }
    if (nameExists) {
      setNewPlayerNameError('That player already exists.');
      return;
    }
    const profile = addHumanProfile(trimmedName);
    setScorecardPlayerIds((players) => {
      const next = [...players];
      const emptySlot = next.findIndex((id) => id === '');
      next[emptySlot === -1 ? 0 : emptySlot] = profile.id;
      return next;
    });
    setNewPlayerName('');
    setNewPlayerNameError('');
    setCreatePlayerOpen(false);
  };

  const renderSavedGame = (savedGame: SavedGameSession) => {
    const scores = savedGame.state.totalScores;

    return (
      <Button
        key={savedGame.id}
        variant="outlined"
        size="large"
        fullWidth
        startIcon={<PlayArrowIcon />}
        onClick={() => resumeSavedGame(savedGame.id)}
        sx={{
          ...menuButtonSx,
          minHeight: 'auto',
          justifyContent: 'flex-start',
          p: 1,
          '& .MuiButton-startIcon': {
            alignSelf: 'flex-start',
            mt: 0.55,
          },
        }}
      >
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            background: CREAM,
            border: `2px solid ${WOOD_DARK}`,
            borderRadius: '6px',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <Table size="small" aria-label={`Resume game from round ${savedGame.state.roundNumber}`}>
            <TableHead>
              <TableRow sx={{ background: SCORE_HEADER_BG }}>
                <TableCell sx={{ ...scoreCellSx, fontWeight: 700 }}>Round</TableCell>
                {gamePlayerNames.map((name, index) => (
                  <TableCell
                    key={`${savedGame.id}-head-${index}`}
                    title={name}
                    sx={{
                      ...(index === gamePlayerNames.length - 1 ? scoreLastCellSx : scoreCellSx),
                      maxWidth: '7ch',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 700,
                    }}
                  >
                    {name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ background: CREAM_ALT }}>
                <TableCell sx={{ ...scoreCellSx, fontWeight: 700 }}>
                  {savedGame.state.roundNumber}
                </TableCell>
                {scores.map((score, index) => (
                  <TableCell
                    key={`${savedGame.id}-score-${index}`}
                    sx={{
                      ...(index === scores.length - 1 ? scoreLastCellSx : scoreCellSx),
                      fontWeight: 400,
                    }}
                  >
                    {score}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow sx={{ background: SCORE_TOTAL_BG }}>
                <TableCell sx={{ ...scoreCellSx, borderBottom: 0, fontWeight: 700 }}>
                  Total
                </TableCell>
                {scores.map((score, index) => (
                  <TableCell
                    key={`${savedGame.id}-total-${index}`}
                    sx={{
                      ...(index === scores.length - 1 ? scoreLastCellSx : scoreCellSx),
                      borderBottom: 0,
                      fontWeight: 700,
                    }}
                  >
                    {score}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography
          component="span"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          Resume game, round {savedGame.state.roundNumber}
        </Typography>
      </Button>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
        p: 0,
        background: '#022c22',
        color: CREAM,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
      }}
    >
      <Dialog
        open={createPlayerOpen}
        onClose={() => {
          setCreatePlayerOpen(false);
          setNewPlayerNameError('');
        }}
        PaperProps={{
          sx: {
            ...popupPaperSx,
            width: 'min(360px, calc(100vw - 24px))',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Create New Player</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={0.75} sx={{ pt: 1 }}>
            <LabeledControl label="Player name">
            <TextField
            id="new-player-name"
            autoFocus
            value={newPlayerName}
              variant="standard"
              onChange={(event) => {
                setNewPlayerName(event.target.value);
                setNewPlayerNameError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  createHumanPlayer();
                }
              }}
              error={Boolean(newPlayerNameError)}
              fullWidth
              size="small"
              sx={{
                '& .MuiInputBase-input': {
                  px: 2,
                  py: 1.15,
                  color: WOOD_DARK,
                  fontWeight: 600,
                },
                '& .MuiInput-root:before, & .MuiInput-root:after': {
                  display: 'none',
                },
              }}
            />
            </LabeledControl>
            {newPlayerNameError && (
              <Typography sx={{ color: DANGER, fontSize: 12, fontWeight: 700, pl: 0.5 }}>
                {newPlayerNameError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={popupActionsSx}>
          <Button
            variant="outlined"
            onClick={() => {
              setCreatePlayerOpen(false);
              setNewPlayerNameError('');
            }}
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
            onClick={createHumanPlayer}
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
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deletePlayer)}
        onClose={() => setDeletePlayerId(null)}
        PaperProps={{
          sx: popupPaperSx,
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Delete Player?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: WOOD_MID, fontSize: 14, fontWeight: 600 }}>
            Are you sure you want to delete {deletePlayer?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={popupActionsSx}>
          <Button
            variant="outlined"
            onClick={() => setDeletePlayerId(null)}
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
            onClick={() => {
              if (deletePlayer) deleteHumanPlayer(deletePlayer.id);
            }}
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={finishInPersonOpen}
        onClose={() => setFinishInPersonOpen(false)}
        PaperProps={{ sx: popupPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Finish Game?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: WOOD_MID, fontSize: 14, fontWeight: 600 }}>
            Are you sure you want to finish the game?
          </Typography>
        </DialogContent>
        <DialogActions sx={popupActionsSx}>
          <Button
            variant="contained"
            onClick={() => setFinishInPersonOpen(false)}
            sx={{
              background: DANGER,
              color: '#ffffff',
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 600,
              px: 3,
              '&:hover': { background: DANGER_HOVER },
            }}
          >
            No
          </Button>
          <Button
            variant="contained"
            onClick={finishInPersonGame}
            sx={{
              background: FELT,
              color: '#ffffff',
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 600,
              px: 3,
              '&:hover': { background: FELT_HOVER },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(scoreEntry)}
        onClose={() => setScoreEntry(null)}
        PaperProps={{ sx: popupPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Enter Scores</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {inPersonPlayerNames.map((name, index) => {
              const score = Number(scoreEntry?.values[index] ?? 0);
              return (
                <Box key={index}>
                  <Typography sx={{ color: WOOD_MID, fontSize: 13, fontWeight: 600, mb: 0.55 }}>
                    {name}'s Score
                  </Typography>
                  {index >= 2 ? (
                    <Box
                      sx={{
                        position: 'relative',
                        minHeight: 58,
                        border: `2px solid ${WOOD_DARK}`,
                        borderRadius: '8px',
                        background: CREAM,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          bottom: 8,
                          left: '50%',
                          width: 46,
                          transform: 'translateX(-50%)',
                          border: `2px solid ${WOOD_DARK}`,
                          borderRadius: '7px',
                          pointerEvents: 'none',
                          opacity: 0.4,
                        }}
                      />
                      <Box
                        ref={(element: HTMLDivElement | null) => {
                          scoreWheelRefs.current[index] = element;
                        }}
                        onScroll={(event) => handleScoreWheelScroll(index, event.currentTarget)}
                        role="listbox"
                        aria-label={`${name}'s score`}
                        aria-valuemin={0}
                        aria-valuemax={26}
                        aria-valuenow={score}
                        tabIndex={0}
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          height: 58,
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          scrollSnapType: 'x mandatory',
                          px: 'calc(50% - 22px)',
                          scrollbarWidth: 'none',
                          maskImage: 'linear-gradient(90deg, transparent 0%, black 24%, black 76%, transparent 100%)',
                          WebkitMaskImage:
                            'linear-gradient(90deg, transparent 0%, black 24%, black 76%, transparent 100%)',
                          '&::-webkit-scrollbar': { display: 'none' },
                        }}
                      >
                        {SCORE_WHEEL_VALUES.map((value) => (
                          <Button
                            key={value}
                            role="option"
                            aria-selected={value === score}
                            onClick={() => selectScoreWheelValue(index, value)}
                            sx={{
                              flex: '0 0 44px',
                              minWidth: 44,
                              scrollSnapAlign: 'center',
                              color: value === score ? WOOD_DARK : WOOD_MID,
                              fontSize: value === score ? 25 : 18,
                              fontWeight: value === score ? 900 : 600,
                              lineHeight: 1,
                              textTransform: 'none',
                              borderRadius: 0,
                              '&:hover': { background: 'rgba(120, 53, 15, 0.08)' },
                            }}
                          >
                            {value}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '54px 1fr 54px',
                        alignItems: 'center',
                        minHeight: 52,
                        border: `2px solid ${WOOD_DARK}`,
                        borderRadius: '8px',
                        background: CREAM,
                        overflow: 'hidden',
                      }}
                    >
                      <IconButton
                        aria-label={`Decrease ${name}'s score`}
                        disabled={score <= 0}
                        onClick={() => adjustScoreEntryValue(index, -1)}
                        sx={{
                          height: '100%',
                          borderRadius: 0,
                          color: WOOD_DARK,
                          '&:hover': { background: CREAM_HOVER },
                          '&.Mui-disabled': { color: 'rgba(69, 26, 3, 0.32)' },
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography
                        sx={{
                          borderLeft: `2px solid ${WOOD_DARK}`,
                          borderRight: `2px solid ${WOOD_DARK}`,
                          color: WOOD_DARK,
                          fontSize: 26,
                          fontWeight: 900,
                          lineHeight: 1,
                          textAlign: 'center',
                        }}
                      >
                        {score}
                      </Typography>
                      <IconButton
                        aria-label={`Increase ${name}'s score`}
                        disabled={score >= 26}
                        onClick={() => adjustScoreEntryValue(index, 1)}
                        sx={{
                          height: '100%',
                          borderRadius: 0,
                          color: WOOD_DARK,
                          '&:hover': { background: CREAM_HOVER },
                          '&.Mui-disabled': { color: 'rgba(69, 26, 3, 0.32)' },
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
            })}
            <Typography
              sx={{
                color: '#b91c1c',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.35,
                minHeight: 44,
                pt: 0.5,
                visibility: scoreErrorMessage ? 'visible' : 'hidden',
              }}
            >
              {scoreErrorMessage ?? 'Scores must total 26'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={popupActionsSx}>
          <Button
            variant="outlined"
            onClick={() => setScoreEntry(null)}
            sx={{
              borderColor: WOOD_MID,
              color: WOOD_DARK,
              background: CREAM,
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 600,
              '&:hover': {
                borderColor: WOOD_DARK,
                background: CREAM_HOVER,
              },
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            disabled={!hasValidScoreEntry}
            onClick={submitScoreEntry}
            sx={newGameButtonSx}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {mode === 'players' && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 20 }}>
          <Box
            onClick={closePlayers}
            sx={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.42)' }}
          />
          <Stack
            component={motion.main}
            initial={{ x: '-100%', opacity: 0.8 }}
            animate={playersExiting ? { x: '-100%', opacity: 0.8 } : { x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }}
            sx={{
              position: 'relative',
              zIndex: 1,
              width: 'min(430px, calc(100vw - 54px))',
              height: '100dvh',
              overflowY: 'auto',
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                height: '100%',
                background: CREAM,
                border: `6px solid ${WOOD_DARK}`,
                outline: '3px solid rgba(146, 64, 14, 0.4)',
                outlineOffset: 0,
                borderRadius: '0 24px 24px 0',
                color: WOOD_DARK,
                boxShadow: '0 18px 36px rgba(0,0,0,0.22)',
                px: { xs: 2, sm: 2.5 },
                py: { xs: 3, sm: 3.5 },
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
                  Players
                </Typography>

                <Stack spacing={2.5} sx={{ minHeight: 0, flex: 1 }}>
                  <LabeledControl label="Sort players">
                    <FormControl size="small" fullWidth>
                      <Select
                        aria-label="Sort players"
                        variant="standard"
                        value={playerSort}
                        onChange={(event) => setPlayerSort(event.target.value as PlayerSortKey)}
                        sx={scorecardSelectSx}
                      >
                        {PLAYER_SORT_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </LabeledControl>

                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      border: `1px solid ${WOOD_MID}`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <Stack
                      ref={playersListRef}
                      spacing={1.4}
                      onScroll={(event) => updatePlayersListFade(event.currentTarget)}
                      sx={{
                        height: '100%',
                        overflowY: 'auto',
                        px: 1,
                        py: 1.4,
                        pr: 1.25,
                        maskImage: playersListMask,
                        WebkitMaskImage: playersListMask,
                      }}
                    >
                    {sortedHumanProfiles.map((profile) => {
                      const lastPlayed = profile.games
                        .map((game) => game.playedAt)
                        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
                      const gamesWon = winCount(profile);
                      const gamesLost = lossCount(profile);
                      return (
                        <Paper
                          key={profile.id}
                          variant="outlined"
                          sx={{
                            background: CREAM,
                            borderColor: WOOD_MID,
                            color: WOOD_DARK,
                            p: 1.35,
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.15 }}>
                                {profile.name}
                              </Typography>
                              <Box sx={{ flexGrow: 1 }} />
                              <IconButton
                                aria-label={`Delete ${profile.name}`}
                                onClick={() => setDeletePlayerId(profile.id)}
                                sx={{
                                  color: DANGER,
                                  background: 'transparent',
                                  borderRadius: '8px',
                                  p: 0.25,
                                  '& .MuiSvgIcon-root': { fontSize: 20 },
                                  '&:hover': { background: 'rgba(153, 27, 27, 0.08)' },
                                }}
                              >
                                <DeleteForeverIcon />
                              </IconButton>
                            </Box>
                            <Box sx={{ borderTop: `1px solid ${WOOD_MID}`, my: 1 }} />
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '1.35fr 0.85fr',
                                columnGap: 1.25,
                                rowGap: 0.45,
                              }}
                            >
                              <Typography sx={{ color: WOOD_MID, fontSize: PLAYER_STAT_FONT_SIZE, lineHeight: 1.25 }}>
                                Games played: {profile.games.length}
                              </Typography>
                              <Typography sx={{ color: WOOD_MID, fontSize: PLAYER_STAT_FONT_SIZE, lineHeight: 1.25 }}>
                                Games won: {gamesWon}
                              </Typography>
                              <Typography sx={{ color: WOOD_MID, fontSize: PLAYER_STAT_FONT_SIZE, lineHeight: 1.25 }}>
                                Last played: {formatLastPlayed(lastPlayed)}
                              </Typography>
                              <Typography sx={{ color: WOOD_MID, fontSize: PLAYER_STAT_FONT_SIZE, lineHeight: 1.25 }}>
                                Games lost: {gamesLost}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                    </Stack>
                  </Box>
                </Stack>

                <Box>
                  <Box sx={{ borderTop: `1px solid ${WOOD_DARK}`, mb: 2 }} />
                  <Stack spacing={2.35}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      startIcon={<PersonAddIcon />}
                      onClick={() => setCreatePlayerOpen(true)}
                      sx={menuButtonSx}
                    >
                      Create New Player
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<ArrowBackIcon />}
                      onClick={closePlayers}
                      sx={dangerButtonSx}
                    >
                      Back
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      )}

      {mode === 'scorecardSetup' && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 20 }}>
          <Box
            onClick={closeScorecardSetup}
            sx={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.42)' }}
          />
          <Stack
            component={motion.main}
            initial={{ x: '-100%', opacity: 0.8 }}
            animate={scorecardExiting ? { x: '-100%', opacity: 0.8 } : { x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }}
            sx={{
              position: 'relative',
              zIndex: 1,
              width: 'min(430px, calc(100vw - 54px))',
              height: '100dvh',
              overflowY: 'auto',
            }}
          >
          <Paper
            variant="outlined"
            sx={{
              height: '100%',
              background: CREAM,
              border: `6px solid ${WOOD_DARK}`,
              outline: '3px solid rgba(146, 64, 14, 0.4)',
              outlineOffset: 0,
              borderRadius: '0 24px 24px 0',
              color: WOOD_DARK,
              boxShadow: '0 18px 36px rgba(0,0,0,0.22)',
              px: { xs: 2, sm: 2.5 },
              py: { xs: 3, sm: 3.5 },
            }}
          >
            <Stack spacing={3} sx={{ height: '100%' }}>
              <Stack spacing={2.3}>
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
                  In-Person Game
                </Typography>
                <Typography
                  sx={{
                    color: WOOD_MID,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: 'center',
                    minHeight: 20,
                  }}
                >
                  {featuredPlayer
                    ? `It's been a while since ${featuredPlayer.name}'s played...`
                    : 'Finish selecting players to start the game.'}
                </Typography>
              </Stack>
              <Stack spacing={2.5}>
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
                    Player Settings
                  </Typography>
                  <Box sx={{ borderTop: `1px solid ${WOOD_DARK}` }} />
                </Box>
                {scorecardPlayerIds.map((playerId, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 44px',
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >
                    <LabeledControl label={`Player ${index + 1}`}>
                      <FormControl size="small" fullWidth>
                        <Select
                          aria-label={`Player ${index + 1}`}
                          variant="standard"
                          value={playerId}
                          displayEmpty
                          renderValue={(selected) => {
                            const selectedProfile = activeHumanProfiles.find((profile) => profile.id === selected);
                            return selectedProfile?.name ?? (
                              <Typography
                                component="span"
                                sx={{ color: 'rgba(69, 26, 3, 0.58)', fontWeight: 600 }}
                              >
                                Select player
                              </Typography>
                            );
                          }}
                          onChange={(event) => updateScorecardPlayer(index, event.target.value)}
                          sx={scorecardSelectSx}
                        >
                          {activeHumanProfiles.map((profile) => (
                            <MenuItem
                              key={profile.id}
                              value={profile.id}
                              disabled={selectedScorecardPlayerIds.has(profile.id) && playerId !== profile.id}
                              sx={{
                                '&.Mui-disabled': {
                                  color: 'rgba(69, 26, 3, 0.42)',
                                  background: 'rgba(69, 26, 3, 0.08)',
                                  opacity: 1,
                                },
                              }}
                            >
                              {profile.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </LabeledControl>
                    <IconButton
                      aria-label={`Clear player ${index + 1}`}
                      disabled={!playerId}
                      onClick={() => clearScorecardPlayer(index)}
                      sx={{
                        height: 44,
                        width: 44,
                        borderRadius: '8px',
                        alignSelf: 'center',
                        color: DANGER,
                        background: 'transparent',
                        '&:hover': { background: 'rgba(153, 27, 27, 0.08)' },
                        '&.Mui-disabled': {
                          background: 'transparent',
                          color: 'rgba(153, 27, 27, 0.28)',
                        },
                      }}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<PersonAddIcon />}
                  onClick={() => setCreatePlayerOpen(true)}
                  sx={menuButtonSx}
                >
                  Create New Player
                </Button>
              </Stack>
              <Box sx={{ flexGrow: 1, minHeight: 32 }} />
              <Box>
                <Box sx={{ borderTop: `1px solid ${WOOD_DARK}`, mb: 2 }} />
                <Stack spacing={2.35}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<TableChartIcon />}
                    disabled={!canStartInPersonGame}
                    onClick={startInPersonGame}
                    sx={newGameButtonSx}
                  >
                    Start Game
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<ArrowBackIcon />}
                    onClick={closeScorecardSetup}
                    sx={dangerButtonSx}
                  >
                    Back
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
          </Stack>
        </Box>
      )}

      <Stack
        component="main"
        spacing={3}
        sx={{
          width: MENU_WIDTH,
          minHeight: '100%',
          px: 'max(18px, env(safe-area-inset-left))',
          pb: MENU_BOTTOM_PADDING,
          justifyContent: 'space-between',
        }}
      >
        {mode === 'inPersonScorecard' && (
          <Stack
            spacing={2}
            sx={{
              minHeight: '100%',
              width: '100%',
              py: 'max(18px, env(safe-area-inset-top))',
              color: WOOD_DARK,
              justifyContent: 'center',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                ...popupPaperSx,
                width: '100%',
                maxWidth: '100%',
                p: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100dvh - 48px)',
              }}
            >
              <Typography
                component="h1"
                sx={{
                  color: WOOD_DARK,
                  fontSize: 24,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  textAlign: 'center',
                  mb: 0.75,
                }}
              >
                In-Person Game
              </Typography>
              {inPersonStartedLabel && (
                <Typography
                  sx={{
                    color: 'rgba(69, 26, 3, 0.68)',
                    fontSize: 13,
                    fontStyle: 'italic',
                    fontWeight: 500,
                    textAlign: 'center',
                    mb: 2,
                  }}
                >
                  Started {inPersonStartedLabel}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', minHeight: 0 }}>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    background: CREAM,
                    border: `2px solid ${WOOD_DARK}`,
                    borderRadius: '6px',
                    width: 'auto',
                    display: 'inline-block',
                  }}
                >
                  <Table size="small" aria-label="In-person scoreboard" sx={{ width: 'auto' }}>
                    <TableHead>
                      <TableRow sx={{ background: SCORE_HEADER_BG }}>
                        <TableCell sx={{ ...scoreCellSx, fontWeight: 700 }}>Round</TableCell>
                        {inPersonPlayerNames.map((name, index) => (
                          <TableCell
                            key={`${name}-${index}`}
                            title={name}
                            sx={{
                              ...scoreCellSx,
                              maxWidth: '9ch',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: 700,
                            }}
                          >
                            {name}
                          </TableCell>
                        ))}
                        <TableCell sx={{ ...scoreLastCellSx, fontWeight: 700 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inPersonRounds.map((round, rowIndex) => (
                        <TableRow key={rowIndex} sx={{ background: rowIndex % 2 === 0 ? CREAM : CREAM_ALT }}>
                          <TableCell sx={{ ...scoreCellSx, fontWeight: 700 }}>{rowIndex + 1}</TableCell>
                          {round.map((score, index) => (
                            <TableCell key={index} sx={scoreCellSx}>
                              {score}
                            </TableCell>
                          ))}
                          <TableCell sx={scoreLastCellSx}>
                            <IconButton
                              aria-label={`Edit round ${rowIndex + 1}`}
                              onClick={() => openScoreEntry(rowIndex)}
                              sx={{
                                color: WOOD_MID,
                                p: 0.25,
                                '&:hover': { background: 'rgba(120, 53, 15, 0.08)' },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ background: SCORE_TOTAL_BG }}>
                        <TableCell sx={{ ...scoreCellSx, borderBottom: 0, fontWeight: 700 }}>Total</TableCell>
                        {inPersonTotals.map((score, index) => (
                          <TableCell key={index} sx={{ ...scoreCellSx, borderBottom: 0, fontWeight: 700 }}>
                            {score}
                          </TableCell>
                        ))}
                        <TableCell sx={{ ...scoreLastCellSx, borderBottom: 0 }} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <Box sx={{ flexGrow: 1, minHeight: 28 }} />
              <Box sx={{ borderTop: `1px solid ${WOOD_MID}`, mb: 2 }} />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<EmojiEventsIcon />}
                  onClick={() => setFinishInPersonOpen(true)}
                  sx={{
                    minHeight: 48,
                    borderColor: WOOD_MID,
                    color: WOOD_DARK,
                    background: CREAM,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { borderColor: WOOD_DARK, background: CREAM_HOVER },
                  }}
                >
                  Finish Game
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<SkipNextIcon />}
                  onClick={() => openScoreEntry(null)}
                  sx={{
                    minHeight: 48,
                    background: FELT,
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': { background: FELT_HOVER },
                  }}
                >
                  End round
                </Button>
              </Stack>
            </Paper>
          </Stack>
        )}

        {mode !== 'inPersonScorecard' && (
          <>
        <Box
          sx={{
            width: '100vw',
            alignSelf: 'center',
            borderBottom: '1px solid rgba(253, 230, 138, 0.75)',
            background: 'rgba(0, 0, 0, 0.16)',
            px: 'max(18px, env(safe-area-inset-left))',
            pt: 'max(12px, env(safe-area-inset-top))',
            pb: 1.25,
            minHeight: 'calc(max(12px, env(safe-area-inset-top)) + 42px)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              color: CREAM,
              fontSize: '0.8125rem',
              fontWeight: 800,
              lineHeight: 1.75,
            }}
          >
            Welcome back {mainHumanProfile?.name ?? 'player'}!
          </Typography>
        </Box>

        {(mode === 'main' || mode === 'players') && (
          <Box sx={{ pt: { xs: 4, sm: 6 }, textAlign: 'center' }}>
            <Box
              sx={{
                mx: 'auto',
                width: 108,
                height: 148,
                borderRadius: '12px',
                background: CREAM,
                border: '2px solid rgba(253, 230, 138, 0.9)',
                boxShadow: '0 22px 45px rgba(0,0,0,0.35)',
                color: '#dc2626',
                display: 'grid',
                placeItems: 'center',
                fontSize: 64,
                fontWeight: 800,
                transform: 'rotate(-5deg)',
              }}
              aria-hidden="true"
            >
              {'\u2665'}
            </Box>
          </Box>
        )}

        <Stack
          spacing={2.35}
          sx={{
            width: BUTTON_WIDTH,
            alignSelf: 'center',
          }}
        >
          {(mode === 'main' || mode === 'players') && (
            <>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<RestartAltIcon />}
                onClick={() => setMode('newGame')}
                sx={newGameButtonSx}
              >
                New Game
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<PlayArrowIcon />}
                onClick={resumeGame}
                disabled={savedGames.length === 0}
                sx={menuButtonSx}
              >
                Resume Game
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<PersonAddIcon />}
                onClick={openPlayers}
                sx={menuButtonSx}
              >
                Players
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<MemoryIcon />}
                onClick={() => setMode('cpuOptions')}
                sx={menuButtonSx}
              >
                CPU Options
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<TuneIcon />}
                onClick={() => navigate('/settings', { state: { backgroundLocation: location } })}
                sx={menuButtonSx}
              >
                Preferences
              </Button>
            </>
          )}

          {mode === 'resumeGame' && (
            <Stack sx={{ minHeight: 'min(440px, calc(100dvh - 150px))' }}>
              <Stack spacing={1.4}>
                {savedGames.map((savedGame) => renderSavedGame(savedGame))}
              </Stack>
              <Box sx={{ flexGrow: 1, minHeight: 32 }} />
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => setMode('main')}
                sx={dangerButtonSx}
              >
                Back
              </Button>
            </Stack>
          )}

          {(mode === 'newGame' || mode === 'scorecardSetup') && (
            <Stack sx={{ minHeight: 'min(360px, calc(100dvh - 150px))' }}>
              <Stack spacing={2.35}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<TableChartIcon />}
                onClick={openScorecardSetup}
                sx={menuButtonSx}
              >
                In-Person Game
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<GroupsIcon />}
                onClick={startLocalGame}
                sx={menuButtonSx}
              >
                Solo Game
              </Button>
              </Stack>
              <Box sx={{ flexGrow: 1, minHeight: 32 }} />
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => setMode('main')}
                sx={dangerButtonSx}
              >
                Back
              </Button>
            </Stack>
          )}

          {mode === 'cpuOptions' && (
            <Stack sx={{ minHeight: 'min(440px, calc(100dvh - 150px))' }}>
              <Stack spacing={1.4}>
                {cpuProfiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<MemoryIcon />}
                    sx={menuButtonSx}
                  >
                    {profile.name}
                  </Button>
                ))}
              </Stack>
              <Box sx={{ flexGrow: 1, minHeight: 32 }} />
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => setMode('main')}
                sx={dangerButtonSx}
              >
                Back
              </Button>
            </Stack>
          )}

        </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
