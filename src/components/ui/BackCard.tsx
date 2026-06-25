import { Box } from '@mui/material';

/**
 * The back of a playing card. Used in CPU side stacks, during pass animations,
 * and as the "face-down" side of CardAnim while a CPU card is in flight.
 *
 * No props — it's a pure visual. If a future feature needs differently-themed
 * card backs (e.g., per-player colors), promote it to take a `variant` prop and
 * keep this default in place.
 */
export function BackCard() {
  return (
    <Box
      sx={{
        width: 80,
        height: 112,
        borderRadius: '12px',
        border: '2px solid #ffffff',
        background: '#1e40af',
        padding: '6px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '6px',
          border: '1px solid #bfdbfe',
          background:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 3px, transparent 3px, transparent 7px)',
        }}
      />
    </Box>
  );
}
