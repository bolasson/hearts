/**
 * @module hearts
 * The shared scoreboard table. Rounds run down the rows, players across the
 * columns, with a Totals row at the bottom. Used by both RoundEndDialog and
 * GameOverDialog.
 *
 * Style: warm scoresheet — wood-toned header strip with centered labels,
 * alternating cream rows, dark-brown grid lines, content-sized player columns
 * that ellipsize long names. Round-column entries are bold; in each row the
 * round-winner's cell is also bold so a glance shows who took the round.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { PLAYER_NAMES, type PlayerIndex } from '@/game/Players';
import type { ScoreTuple } from '@/state/useGameStore';
import { useGameStore } from '@/state/useGameStore';

const WOOD_DARK = '#451a03';
const CREAM = '#fffaf0';
const CREAM_ALT = '#fdf3df';
const HEADER_BG = '#fef3c7';
const TOTAL_ROW_BG = '#fde68a';
const LEADER_BG = '#bbf7d0';

const PLAYER_COL_COUNT = PLAYER_NAMES.length;

// All grid lines use WOOD_DARK so the table reads as wood-framed.
const cellBase = {
  py: { xs: 0.45, sm: 0.5 },
  px: { xs: 0.7, sm: 1 },
  fontSize: { xs: 12, sm: 13 },
  borderBottomColor: WOOD_DARK,
  borderRight: `1px solid ${WOOD_DARK}`,
} as const;

const lastCellBase = {
  ...cellBase,
  borderRight: 'none',
} as const;

const playerColSx = {
  minWidth: { xs: '5ch', sm: '6ch' },
  maxWidth: '14ch',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

/** Indexes of round-winners in a row (lowest score; multiple if tied). */
function roundWinnerSet(row: ScoreTuple): ReadonlySet<PlayerIndex> {
  const min = Math.min(...row);
  const winners = new Set<PlayerIndex>();
  row.forEach((p, i) => {
    if (p === min) winners.add(i as PlayerIndex);
  });
  return winners;
}

export function ScoreTable({ highlightLeader = false }: { highlightLeader?: boolean }) {
  const roundHistory = useGameStore((s) => s.roundHistory);
  const totalScores = useGameStore((s) => s.totalScores);

  const minTotal = highlightLeader ? Math.min(...totalScores) : -1;

  return (
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
      <Table size="small" aria-label="Scoreboard" sx={{ width: 'auto' }}>
        <TableHead>
          <TableRow sx={{ background: HEADER_BG }}>
            <TableCell
              align="center"
              sx={{ ...cellBase, fontWeight: 700, color: WOOD_DARK, textAlign: 'center' }}
            >
              Round
            </TableCell>
            {PLAYER_NAMES.map((name, i) => {
              const isLast = i === PLAYER_COL_COUNT - 1;
              return (
                <TableCell
                  key={name}
                  align="center"
                  sx={{
                    ...(isLast ? lastCellBase : cellBase),
                    ...playerColSx,
                    fontWeight: 700,
                    color: WOOD_DARK,
                    textAlign: 'center',
                  }}
                  title={name}
                >
                  {name}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {roundHistory.map((points, rowIdx) => {
            const winners = roundWinnerSet(points);
            return (
              <TableRow
                key={rowIdx}
                sx={{ background: rowIdx % 2 === 0 ? CREAM : CREAM_ALT }}
              >
                <TableCell
                  align="center"
                  sx={{
                    ...cellBase,
                    fontWeight: 700,
                    color: WOOD_DARK,
                    textAlign: 'center',
                  }}
                >
                  {rowIdx + 1}
                </TableCell>
                {points.map((p, j) => {
                  const isLast = j === PLAYER_COL_COUNT - 1;
                  const isWinner = winners.has(j as PlayerIndex);
                  return (
                    <TableCell
                      key={j}
                      align="center"
                      sx={{
                        ...(isLast ? lastCellBase : cellBase),
                        ...playerColSx,
                        color: WOOD_DARK,
                        fontWeight: isWinner ? 700 : 400,
                        textAlign: 'center',
                      }}
                    >
                      {p}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
          <TableRow sx={{ background: TOTAL_ROW_BG }}>
            <TableCell
              align="center"
              sx={{
                ...cellBase,
                fontWeight: 700,
                color: WOOD_DARK,
                borderBottom: 0,
                textAlign: 'center',
              }}
            >
              Total
            </TableCell>
            {totalScores.map((s, i) => {
              const isLast = i === PLAYER_COL_COUNT - 1;
              return (
                <TableCell
                  key={i}
                  align="center"
                  sx={{
                    ...(isLast ? lastCellBase : cellBase),
                    ...playerColSx,
                    fontWeight: 700,
                    color: WOOD_DARK,
                    borderBottom: 0,
                    textAlign: 'center',
                    ...(highlightLeader && s === minTotal ? { background: LEADER_BG } : null),
                  }}
                >
                  {s}
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
