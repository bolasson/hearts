/**
 * The game state machine, modeled as a Zustand store.
 *
 * State shape is much flatter than the original monolith: a single `phase` enum
 * replaces the eight overlapping boolean flags that used to encode where in the
 * game flow we were. Actions are explicit transitions on that enum.
 *
 * Time-based transitions (CPU plays a card N ms after its turn starts, a trick
 * pauses before resolving, etc.) are NOT scheduled from inside the store. The
 * store is pure-ish: actions mutate state synchronously. The GamePage uses a
 * companion hook (useGameClock) that watches `phase` and fires the right
 * follow-up action at the right time. This keeps the store testable and
 * makes the timing policy a single-file concern.
 */

import { create } from 'zustand';
import { logger } from '@/logger';
import type { Card } from '@/game/Card';
import { handHasId, sortHand, isPointCard } from '@/game/Card';
import { dealHands } from '@/game/Deck';
import {
  MAIN_PLAYER,
  PLAYER_NAMES,
  type PlayerIndex,
  nextClockwise,
} from '@/game/Players';
import {
  passDirection,
  passShortLabel,
  passTo,
  type PassDirection,
} from '@/game/passing';
import type { Trick, TrickPlay, AnimationOrigin } from '@/game/Trick';
import {
  allowedCards,
  badPlayReason,
  gameResult,
  isGameOver,
  isRoundComplete,
  shotTheMoon,
  trickPoints,
  trickWinner,
} from '@/game/rules';
import { type Speed } from '@/game/layout';
import { makePassAnimations, type PassAnimation } from '@/game/passAnimations';
import { getCpuStrategy } from '@/game/ai';
import {
  DEFAULT_HAND_SORT_CONFIG,
  sortHandWith,
  type HandSortConfig,
} from '@/game/sort';

const TWO_OF_CLUBS = '2♣';
const GAME_TARGET = 100;
const SETTINGS_STORAGE_KEY = 'hearts-game-settings';
const GAME_SESSIONS_STORAGE_KEY = 'hearts-active-games';

type SavedGameSettings = {
  cpuSpeed: Speed;
  handSortConfig: HandSortConfig;
};

const SPEED_VALUES: readonly Speed[] = ['extraSlow', 'slow', 'normal', 'fast', 'turbo', 'instant'];

function isSpeed(value: unknown): value is Speed {
  return typeof value === 'string' && SPEED_VALUES.includes(value as Speed);
}

function isHandSortConfig(value: unknown): value is HandSortConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<HandSortConfig>;
  return (
    Array.isArray(config.suitOrder) &&
    config.suitOrder.length === 4 &&
    (config.numberOrder === 'asc' ||
      config.numberOrder === 'desc' ||
      config.numberOrder === 'random') &&
    (config.sortFirstBy === 'suit' || config.sortFirstBy === 'number')
  );
}

function loadSavedGameSettings(): SavedGameSettings {
  if (typeof localStorage === 'undefined') {
    return { cpuSpeed: 'fast', handSortConfig: DEFAULT_HAND_SORT_CONFIG };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { cpuSpeed: 'fast', handSortConfig: DEFAULT_HAND_SORT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<SavedGameSettings>;
    return {
      cpuSpeed: isSpeed(parsed.cpuSpeed) ? parsed.cpuSpeed : 'fast',
      handSortConfig: isHandSortConfig(parsed.handSortConfig)
        ? parsed.handSortConfig
        : DEFAULT_HAND_SORT_CONFIG,
    };
  } catch {
    return { cpuSpeed: 'fast', handSortConfig: DEFAULT_HAND_SORT_CONFIG };
  }
}

function saveGameSettings(settings: SavedGameSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function createGameSessionId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `game-${random}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function snapshotTitle(state: GameSnapshot): string {
  const scores = state.totalScores.join('-');
  return `Round ${state.roundNumber} · ${scores}`;
}

function snapshotFromState(state: GameState): GameSnapshot {
  return {
    phase: state.phase,
    currentPlayer: state.currentPlayer,
    hands: state.hands,
    currentTrick: state.currentTrick,
    heartsBroken: state.heartsBroken,
    passDirection: state.passDirection,
    selectedPassCards: state.selectedPassCards,
    passAnimations: state.passAnimations,
    inFlightPassIds: state.inFlightPassIds,
    pendingHandsAfterPass: state.pendingHandsAfterPass,
    pendingStarterAfterPass: state.pendingStarterAfterPass,
    roundNumber: state.roundNumber,
    trickNumber: state.trickNumber,
    roundPoints: state.roundPoints,
    totalScores: state.totalScores,
    tricksWon: state.tricksWon,
    roundHistory: state.roundHistory,
    message: state.message,
    inlineMessage: state.inlineMessage,
    lastTrick: state.lastTrick,
    cpuSpeed: state.cpuSpeed,
    handSortConfig: state.handSortConfig,
    drawerOpen: state.drawerOpen,
    resultsDismissed: state.resultsDismissed,
  };
}

function loadSavedGameSessions(): SavedGameSession[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GAME_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((session): session is SavedGameSession =>
      Boolean(
        session &&
          typeof session.id === 'string' &&
          typeof session.createdAt === 'string' &&
          typeof session.updatedAt === 'string' &&
          typeof session.title === 'string' &&
          session.state &&
          session.state.phase !== 'gameOver'
      )
    );
  } catch {
    return [];
  }
}

function saveGameSessions(sessions: SavedGameSession[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GAME_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

const INITIAL_SETTINGS = loadSavedGameSettings();
const INITIAL_SAVED_GAMES = loadSavedGameSessions();

/**
 * The game's phases. Together with `currentPlayer`, this captures every meaningful
 * state in the flow.
 */
export type GamePhase =
  | 'choosingPass'      // passing round, human selecting which 3 to send
  | 'passAnimating'     // submitted pass; cards flying across the table
  | 'awaitingHumanPlay' // human's turn; waiting for a card tap
  | 'awaitingCpuPlay'   // CPU's turn; clock will schedule the play
  | 'playAnimating'     // card just played; mid-animation
  | 'trickShowing'      // 4 cards down; brief pause before resolution
  | 'trickResolving'    // resolved trick animating to winner's pile
  | 'roundOver'         // hands empty; awaiting "Next Round"
  | 'gameOver';         // someone reached the target

export type Hands = [Card[], Card[], Card[], Card[]];
export type ScoreTuple = readonly [number, number, number, number];

interface GameState {
  activeGameId: string | null;
  savedGames: SavedGameSession[];

  // ---- Core state ----
  phase: GamePhase;
  currentPlayer: PlayerIndex | null;
  hands: Hands;
  currentTrick: Trick;
  heartsBroken: boolean;

  // ---- Passing ----
  passDirection: PassDirection;
  selectedPassCards: Card[];
  passAnimations: readonly PassAnimation[];
  inFlightPassIds: readonly string[];
  pendingHandsAfterPass: Hands | null;
  pendingStarterAfterPass: PlayerIndex | null;

  // ---- Round / game ----
  roundNumber: number;
  trickNumber: number;
  roundPoints: [number, number, number, number];
  totalScores: [number, number, number, number];
  tricksWon: [number, number, number, number];
  /** Per-player points scored in each completed round, oldest first.
   *  After moon-shoot adjustment, so the entries reflect what was added
   *  to `totalScores`. */
  roundHistory: ReadonlyArray<ScoreTuple>;

  // ---- Display ----
  message: string;
  inlineMessage: string;
  lastTrick: { winner: PlayerIndex; points: number; cards: Trick } | null;
  cpuSpeed: Speed;
  /** The player's hand-sort configuration: suit priority order, number direction, and primary key. */
  handSortConfig: HandSortConfig;
  /** Whether the settings drawer is open. Lifted into the store so other
   *  components (e.g., the Home button in ResultsDialog) can open it. */
  drawerOpen: boolean;
  /** When true, suppress the results dialog even though phase === 'gameOver'.
   *  Set by the Home button so the player can see the drawer without the
   *  results modal on top. Reset on newGame so the next game's results show. */
  resultsDismissed: boolean;
  // ---- Actions ----
  newGame(): void;
  loadGame(id: string): void;
  newRound(): void;
  finishGame(): void;
  selectPassCard(card: Card): void;
  submitPass(): void;
  completePassAnimation(): void;
  playHuman(card: Card, animationOrigin: AnimationOrigin | null): void;
  playCpuTurn(): void;
  finishPlayAnimation(): void;
  startTrickResolve(): void;
  endTrick(): void;
  setSpeed(speed: Speed): void;
  setHandSortConfig(partial: Partial<HandSortConfig>): void;
  setDrawerOpen(open: boolean): void;
  dismissResults(): void;
}

type GameActionKey =
  | 'newGame'
  | 'loadGame'
  | 'newRound'
  | 'finishGame'
  | 'selectPassCard'
  | 'submitPass'
  | 'completePassAnimation'
  | 'playHuman'
  | 'playCpuTurn'
  | 'finishPlayAnimation'
  | 'startTrickResolve'
  | 'endTrick'
  | 'setSpeed'
  | 'setHandSortConfig'
  | 'setDrawerOpen'
  | 'dismissResults';

export type GameSnapshot = Omit<GameState, GameActionKey | 'activeGameId' | 'savedGames'>;

export type SavedGameSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  state: GameSnapshot;
};

// ---------------------------------------------------------------------------
// Helpers used by actions
// ---------------------------------------------------------------------------

/** Build the state for a new round. Scores and history carry over; everything else resets. */
function freshRound(
  totalScores: [number, number, number, number],
  roundNumber: number,
  cpuSpeed: Speed,
  roundHistory: ReadonlyArray<ScoreTuple>,
  handSortConfig: HandSortConfig,
  drawerOpen: boolean
): Pick<
  GameState,
  | 'phase'
  | 'currentPlayer'
  | 'hands'
  | 'currentTrick'
  | 'heartsBroken'
  | 'passDirection'
  | 'selectedPassCards'
  | 'passAnimations'
  | 'inFlightPassIds'
  | 'pendingHandsAfterPass'
  | 'pendingStarterAfterPass'
  | 'roundNumber'
  | 'trickNumber'
  | 'roundPoints'
  | 'totalScores'
  | 'tricksWon'
  | 'roundHistory'
  | 'message'
  | 'inlineMessage'
  | 'lastTrick'
  | 'cpuSpeed'
  | 'handSortConfig'
  | 'drawerOpen'
  | 'resultsDismissed'
> {
  const dealt = dealHands();
  // Human hand uses the player's chosen sort. CPU hands use the canonical
  // suit-then-rank sort — CPU sort order isn't displayed, but the AI and
  // pass-animation index math depend on a stable order.
  const sorted: Hands = [
    sortHandWith(dealt[0], handSortConfig),
    sortHand(dealt[1]),
    sortHand(dealt[2]),
    sortHand(dealt[3]),
  ];
  const direction = passDirection(roundNumber);
  const isPassingRound = direction !== 'none';
  const starter: PlayerIndex | null = isPassingRound
    ? null
    : (sorted.findIndex((h) => handHasId(h, TWO_OF_CLUBS)) as PlayerIndex);

  const startingPhase: GamePhase = isPassingRound
    ? 'choosingPass'
    : starter === MAIN_PLAYER
      ? 'awaitingHumanPlay'
      : 'awaitingCpuPlay';

  return {
    phase: startingPhase,
    currentPlayer: starter,
    hands: sorted,
    currentTrick: [],
    heartsBroken: false,
    passDirection: direction,
    selectedPassCards: [],
    passAnimations: [],
    inFlightPassIds: [],
    pendingHandsAfterPass: null,
    pendingStarterAfterPass: null,
    roundNumber,
    trickNumber: 1,
    roundPoints: [0, 0, 0, 0],
    totalScores,
    tricksWon: [0, 0, 0, 0],
    roundHistory,
    message: isPassingRound
      ? `${passShortLabel(direction)} before play begins.`
      : `${PLAYER_NAMES[starter ?? 0]} starts with 2 ♣.`,
    inlineMessage: '',
    lastTrick: null,
    cpuSpeed,
    handSortConfig,
    drawerOpen,
    resultsDismissed: false,
  };
}

/**
 * Apply a card play. Returns the new state slice for the parts that change.
 * Does NOT decide what happens next — the calling action sets phase.
 */
function applyPlay(
  state: GameState,
  player: PlayerIndex,
  card: Card,
  animationStart: AnimationOrigin | null,
  animationCardIndex: number | null
): {
  hands: Hands;
  currentTrick: Trick;
  heartsBroken: boolean;
  message: string;
  inlineMessage: string;
} {
  // Filter every hand by the played card's id. Only the playing seat actually
  // contains the card, so the other three filters are no-ops — cheaper than branching.
  const hands: Hands = [
    state.hands[0].filter((x) => x.id !== card.id),
    state.hands[1].filter((x) => x.id !== card.id),
    state.hands[2].filter((x) => x.id !== card.id),
    state.hands[3].filter((x) => x.id !== card.id),
  ];

  const newPlay: TrickPlay = {
    player,
    card,
    animationStart,
    animationCardIndex,
  };
  const currentTrick: Trick = [...state.currentTrick, newPlay];
  const trickComplete = currentTrick.length === 4;
  const heartsBroken = state.heartsBroken || card.suit === '♥';

  return {
    hands,
    currentTrick,
    heartsBroken,
    inlineMessage: '',
    message: trickComplete
      ? `${PLAYER_NAMES[player]} played ${card.rank} ${card.suit}. Resolving trick...`
      : `${PLAYER_NAMES[player]} played ${card.rank} ${card.suit}.`,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>((set, get) => ({
  activeGameId: null,
  savedGames: INITIAL_SAVED_GAMES,
  ...freshRound(
    [0, 0, 0, 0],
    1,
    INITIAL_SETTINGS.cpuSpeed,
    [],
    INITIAL_SETTINGS.handSortConfig,
    false
  ),

  newGame: () => {
    logger.info({ module: 'gameStore', action: 'newGame' }, 'Starting new game');
    set({
      activeGameId: createGameSessionId(),
      ...freshRound([0, 0, 0, 0], 1, get().cpuSpeed, [], get().handSortConfig, get().drawerOpen),
    });
  },

  loadGame: (id) => {
    const session = get().savedGames.find((savedGame) => savedGame.id === id);
    if (!session) return;
    logger.info({ module: 'gameStore', action: 'loadGame', meta: { id } }, 'Loading saved game');
    set({
      activeGameId: session.id,
      ...freshRound(
        [...session.state.totalScores],
        session.state.roundNumber,
        get().cpuSpeed,
        session.state.roundHistory,
        get().handSortConfig,
        get().drawerOpen
      ),
    });
  },

  newRound: () => {
    const { totalScores, roundNumber, cpuSpeed, roundHistory, handSortConfig, drawerOpen } = get();
    logger.info(
      { module: 'gameStore', action: 'newRound', meta: { round: roundNumber + 1 } },
      'Starting new round'
    );
    set(freshRound(totalScores, roundNumber + 1, cpuSpeed, roundHistory, handSortConfig, drawerOpen));
  },

  /**
   * User-initiated end-of-game. Snaps phase to 'gameOver' so the ResultsDialog
   * opens. Totals reflect the last completed round; an in-progress round is
   * discarded (its partial points were never added to totalScores).
   */
  finishGame: () => {
    logger.info({ module: 'gameStore', action: 'finishGame' }, 'User finished game early');
    set({
      phase: 'gameOver',
      currentPlayer: null,
      currentTrick: [],
    });
  },

  setSpeed: (cpuSpeed) => {
    saveGameSettings({ cpuSpeed, handSortConfig: get().handSortConfig });
    set({ cpuSpeed });
  },

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  dismissResults: () => set({ resultsDismissed: true }),

  setHandSortConfig: (partial) =>
    set((state) => {
      const handSortConfig: HandSortConfig = { ...state.handSortConfig, ...partial };
      saveGameSettings({ cpuSpeed: state.cpuSpeed, handSortConfig });
      const hands: Hands = [
        sortHandWith(state.hands[0], handSortConfig),
        state.hands[1],
        state.hands[2],
        state.hands[3],
      ];
      logger.info(
        { module: 'gameStore', action: 'setHandSortConfig', meta: partial },
        'Hand sort config changed'
      );
      return { handSortConfig, hands };
    }),

  selectPassCard: (card) =>
    set((state) => {
      if (state.phase !== 'choosingPass') return state;
      const already = state.selectedPassCards.some((x) => x.id === card.id);
      if (already) {
        return {
          selectedPassCards: state.selectedPassCards.filter((x) => x.id !== card.id),
          inlineMessage: '',
        };
      }
      if (state.selectedPassCards.length >= 3) {
        return { inlineMessage: 'You can only pass 3 cards. Deselect one before choosing another.' };
      }
      return {
        selectedPassCards: [...state.selectedPassCards, card],
        inlineMessage: '',
      };
    }),

  submitPass: () =>
    set((state) => {
      if (state.phase !== 'choosingPass') return state;
      if (state.selectedPassCards.length !== 3) {
        return { inlineMessage: 'Choose exactly 3 cards to pass.' };
      }

      const strategy = getCpuStrategy();
      const picks: Card[][] = [
        state.selectedPassCards,
        strategy.choosePassCards(state.hands[1]),
        strategy.choosePassCards(state.hands[2]),
        strategy.choosePassCards(state.hands[3]),
      ];

      // Apply the passes to produce the final hands.
      const next: Hands = [
        [...state.hands[0]],
        [...state.hands[1]],
        [...state.hands[2]],
        [...state.hands[3]],
      ];
      picks.forEach((cards, rawFrom) => {
        const from = rawFrom as PlayerIndex;
        cards.forEach((card) => {
          const to = passTo(from, state.passDirection);
          next[from] = next[from].filter((x) => x.id !== card.id);
          next[to].push(card);
        });
      });
      const finalHands: Hands = [
        sortHandWith(next[0], state.handSortConfig),
        sortHand(next[1]),
        sortHand(next[2]),
        sortHand(next[3]),
      ];
      const starter = finalHands.findIndex((h) => handHasId(h, TWO_OF_CLUBS)) as PlayerIndex;
      const { animations, inFlightIds } = makePassAnimations(
        state.hands,
        finalHands,
        picks,
        state.passDirection
      );

      logger.info(
        { module: 'gameStore', action: 'submitPass', meta: { direction: state.passDirection } },
        'Pass submitted, animating'
      );

      return {
        phase: 'passAnimating',
        passAnimations: animations,
        inFlightPassIds: inFlightIds,
        pendingHandsAfterPass: finalHands,
        pendingStarterAfterPass: starter,
        selectedPassCards: [],
        inlineMessage: '',
        message: `${passShortLabel(state.passDirection)} in progress...`,
      };
    }),

  completePassAnimation: () =>
    set((state) => {
      if (state.phase !== 'passAnimating') return state;
      const hands = state.pendingHandsAfterPass ?? state.hands;
      const starter = state.pendingStarterAfterPass ?? 0;
      logger.info({ module: 'gameStore', action: 'completePassAnimation' }, 'Pass animation complete');
      return {
        phase: starter === MAIN_PLAYER ? 'awaitingHumanPlay' : 'awaitingCpuPlay',
        hands,
        currentPlayer: starter,
        passAnimations: [],
        inFlightPassIds: [],
        pendingHandsAfterPass: null,
        pendingStarterAfterPass: null,
        message: `${passShortLabel(state.passDirection)} complete. ${PLAYER_NAMES[starter]} starts with 2 ♣.`,
      };
    }),

  playHuman: (card, animationOrigin) =>
    set((state) => {
      if (state.phase !== 'awaitingHumanPlay' || state.currentPlayer !== MAIN_PLAYER) return state;

      const legal = allowedCards(
        state.hands[MAIN_PLAYER],
        state.currentTrick,
        state.heartsBroken,
        state.trickNumber === 1
      );
      if (!legal.some((c) => c.id === card.id)) {
        return {
          inlineMessage: badPlayReason(
            card,
            state.hands[MAIN_PLAYER],
            state.currentTrick,
            state.heartsBroken,
            state.trickNumber === 1
          ),
        };
      }

      const slice = applyPlay(state, MAIN_PLAYER, card, animationOrigin, null);
      const trickComplete = slice.currentTrick.length === 4;
      return {
        ...slice,
        phase: 'playAnimating',
        currentPlayer: trickComplete ? null : nextClockwise(MAIN_PLAYER),
      };
    }),

  playCpuTurn: () =>
    set((state) => {
      if (state.phase !== 'awaitingCpuPlay' || state.currentPlayer === null || state.currentPlayer === MAIN_PLAYER) {
        return state;
      }
      const seat = state.currentPlayer;
      const hand = state.hands[seat];
      const strategy = getCpuStrategy();
      const card = strategy.chooseCardToPlay(
        hand,
        state.currentTrick,
        state.heartsBroken,
        state.trickNumber === 1
      );
      if (!card) {
        logger.warn(
          { module: 'gameStore', action: 'playCpuTurn', meta: { seat } },
          'CPU returned no legal card; this should not happen'
        );
        return state;
      }
      const visible = sortHand(hand);
      const animationCardIndex = visible.findIndex((c) => c.id === card.id);
      const slice = applyPlay(state, seat, card, null, animationCardIndex);
      const trickComplete = slice.currentTrick.length === 4;
      return {
        ...slice,
        phase: 'playAnimating',
        currentPlayer: trickComplete ? null : nextClockwise(seat),
      };
    }),

  finishPlayAnimation: () =>
    set((state) => {
      if (state.phase !== 'playAnimating') return state;
      const trickComplete = state.currentTrick.length === 4;
      if (trickComplete) {
        return { phase: 'trickShowing' };
      }
      const next = state.currentPlayer;
      return {
        phase: next === MAIN_PLAYER ? 'awaitingHumanPlay' : 'awaitingCpuPlay',
      };
    }),

  startTrickResolve: () =>
    set((state) => {
      if (state.phase !== 'trickShowing') return state;
      return { phase: 'trickResolving' };
    }),

  endTrick: () =>
    set((state) => {
      if (state.phase !== 'trickResolving') return state;
      const winner = trickWinner(state.currentTrick);
      const points = trickPoints(state.currentTrick);
      const roundPoints: [number, number, number, number] = [...state.roundPoints];
      const tricksWon: [number, number, number, number] = [...state.tricksWon];
      roundPoints[winner] += points;
      tricksWon[winner] += 1;

      const baseMessage = points
        ? `${PLAYER_NAMES[winner]} took the trick and gained ${points} point${points === 1 ? '' : 's'}.`
        : `${PLAYER_NAMES[winner]} took the trick with 0 points.`;

      const lastTrick = { winner, points, cards: state.currentTrick };
      const roundDone = isRoundComplete([
        state.hands[0],
        state.hands[1],
        state.hands[2],
        state.hands[3],
      ]);

      if (!roundDone) {
        return {
          phase: winner === MAIN_PLAYER ? 'awaitingHumanPlay' : 'awaitingCpuPlay',
          currentPlayer: winner,
          currentTrick: [],
          trickNumber: state.trickNumber + 1,
          roundPoints,
          tricksWon,
          lastTrick,
          message: baseMessage,
        };
      }

      // Round complete. Score, check for moon shot, check for game over.
      let appliedRoundPoints: ScoreTuple = [
        roundPoints[0],
        roundPoints[1],
        roundPoints[2],
        roundPoints[3],
      ];
      let moonMsg = '';
      const shooter = shotTheMoon(roundPoints);
      if (shooter !== null) {
        const adjusted: [number, number, number, number] = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
          adjusted[i] = i === shooter ? 0 : 26;
        }
        appliedRoundPoints = adjusted;
        moonMsg = `${PLAYER_NAMES[shooter]} shot the moon! Everyone else gets 26 points.`;
      }
      const newScores: [number, number, number, number] = [
        state.totalScores[0] + appliedRoundPoints[0],
        state.totalScores[1] + appliedRoundPoints[1],
        state.totalScores[2] + appliedRoundPoints[2],
        state.totalScores[3] + appliedRoundPoints[3],
      ];
      const over = isGameOver(newScores);
      const newHistory: ScoreTuple[] = [...state.roundHistory, appliedRoundPoints];

      logger.info(
        {
          module: 'gameStore',
          action: 'endTrick',
          meta: { roundComplete: true, gameOver: over, scores: newScores },
        },
        'Round complete'
      );

      return {
        phase: over ? 'gameOver' : 'roundOver',
        currentPlayer: null,
        currentTrick: [],
        roundPoints,
        tricksWon,
        totalScores: newScores,
        roundHistory: newHistory,
        lastTrick,
        message: over
          ? `${baseMessage} ${moonMsg ? `${moonMsg} ` : ''}${gameResult(newScores, PLAYER_NAMES)}`
          : `${baseMessage} ${moonMsg ? `${moonMsg} ` : ''}Round complete.`,
      };
    }),
}));

let syncingSavedGames = false;

useGameStore.subscribe((state) => {
  if (syncingSavedGames) return;

  const activeGameId = state.activeGameId;
  let nextSavedGames = state.savedGames;

  if (activeGameId) {
    if (state.phase === 'gameOver') {
      nextSavedGames = state.savedGames.filter((session) => session.id !== activeGameId);
    } else {
      const timestamp = nowIso();
      const existing = state.savedGames.find((session) => session.id === activeGameId);
      const snapshot = snapshotFromState(state);
      const session: SavedGameSession = {
        id: activeGameId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        title: snapshotTitle(snapshot),
        state: snapshot,
      };
      nextSavedGames = [
        session,
        ...state.savedGames.filter((savedGame) => savedGame.id !== activeGameId),
      ];
    }
  }

  saveGameSessions(nextSavedGames);

  if (nextSavedGames !== state.savedGames) {
    syncingSavedGames = true;
    useGameStore.setState({ savedGames: nextSavedGames });
    syncingSavedGames = false;
  }
});

// Use isPointCard somewhere so it doesn't show up as unused if/when we add UI affordances.
// (Imported here for re-export; harmless tree-shake.)
export { isPointCard };

// Re-export the targe

// Re-export the target so tests / UI can reference it without importing this module.
export const HEARTS_GAME_TARGET = GAME_TARGET;
