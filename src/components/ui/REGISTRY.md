# Component Registry

This file is the source of truth for reusable UI compositions in `src/components/ui/`. Every component in that directory must have a corresponding entry below. The `verify` step enforces this.

### How entries are formatted

Each registered component gets a level-2 heading whose text matches the component's filename, followed by a short list of facts. For example, for a component at `src/components/ui/CurrencyInput.tsx`, the entry would look like a heading `## CurrencyInput` followed by:

- a `**Location**:` line with the file path
- a `**Purpose**:` line describing what it does and when to use it
- a `**Props**:` line summarizing the props (or pointing at the type definition)

The level-2 heading is what `verify` parses. It must match the filename exactly. Other section headings in this file (like the one above this paragraph) use level-3 (`###`) so they aren't confused with components.

### Why this exists

Without a single source of truth for "what's reusable here," Claude (and humans) re-create primitives that already exist. The registry is the first thing the planning checklist reads. As long as it stays up to date, duplicate components stop being a thing.

### Registered components

## PlayingCard
- **Location**: src/components/ui/PlayingCard.tsx
- **Purpose**: Renders a single playing card face-up with rank and suit indicators in the corners and a large suit glyph in the center. Used in the player's hand, in the trick area, and as the face of a flipped CPU card.
- **Props**: `card`, optional `size` ('player' | 'tableLarge' | 'small'), optional `highlight` ('none' | 'selected'), optional `noEntrance` to suppress entrance animation.

## BackCard
- **Location**: src/components/ui/BackCard.tsx
- **Purpose**: Renders the back of a card — blue with diagonal stripe pattern. Used in CPU side stacks and during pass and flip animations.
- **Props**: none.

## CardAnim
- **Location**: src/components/ui/CardAnim.tsx
- **Purpose**: A flip-ready wrapper that renders both a card back and its face-up version in a 3D container, so a parent's `rotateY` animation flips between them. Falls back to a plain face-up card when `showBack` is false.
- **Props**: `card`, `showBack`.
