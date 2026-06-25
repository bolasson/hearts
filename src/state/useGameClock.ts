/**
 * Time-based transitions for the game.
 *
 * The store doesn't know about setTimeout — it just exposes synchronous actions.
 * This hook watches the store's phase and fires the right follow-up action at
 * the right time. All timings come from the SPEED_PROFILE in `@/game/layout`,
 * so the player's speed selection affects every animation and pause in lockstep.
 *
 * Phase flow this hook drives:
 *   awaitingCpuPlay → (cpuDelay)        → playCpuTurn → playAnimating
 *   playAnimating   → (cardAnim + pad)  → finishPlayAnimation → awaiting* or trickShowing
 *   trickShowing    → (trickShow)       → startTrickResolve → trickResolving
 *   trickResolving  → (trickResolve)    → endTrick → awaiting* / roundOver / gameOver
 *   passAnimating   → (passAnim)        → completePassAnimation → awaiting*
 */

import { useEffect } from 'react';
import { SPEED_PROFILE } from '@/game/layout';
import { useGameStore } from './useGameStore';

const PLAY_ANIM_PAD_MS = 60;

export function useGameClock(): void {
  const phase = useGameStore((s) => s.phase);
  const cpuSpeed = useGameStore((s) => s.cpuSpeed);
  const profile = SPEED_PROFILE[cpuSpeed];

  useEffect(() => {
    if (phase !== 'awaitingCpuPlay') return undefined;
    const t = setTimeout(() => useGameStore.getState().playCpuTurn(), profile.cpuDelay);
    return () => clearTimeout(t);
  }, [phase, profile.cpuDelay]);

  useEffect(() => {
    if (phase !== 'playAnimating') return undefined;
    const t = setTimeout(
      () => useGameStore.getState().finishPlayAnimation(),
      profile.cardAnim + PLAY_ANIM_PAD_MS
    );
    return () => clearTimeout(t);
  }, [phase, profile.cardAnim]);

  useEffect(() => {
    if (phase !== 'trickShowing') return undefined;
    const t = setTimeout(() => useGameStore.getState().startTrickResolve(), profile.trickShow);
    return () => clearTimeout(t);
  }, [phase, profile.trickShow]);

  useEffect(() => {
    if (phase !== 'trickResolving') return undefined;
    const t = setTimeout(() => useGameStore.getState().endTrick(), profile.trickResolve);
    return () => clearTimeout(t);
  }, [phase, profile.trickResolve]);

  useEffect(() => {
    if (phase !== 'passAnimating') return undefined;
    const t = setTimeout(() => useGameStore.getState().completePassAnimation(), profile.passAnim);
    return () => clearTimeout(t);
  }, [phase, profile.passAnim]);
}
