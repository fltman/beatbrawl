# HITSTER AI - Design Guidelines

## Design Approach

**Selected Approach:** Custom Gaming Interface with Material Design Foundation

This real-time multiplayer music game requires a vibrant, energetic design that balances playful gaming aesthetics with clear functional hierarchy. The interface must support rapid decision-making while maintaining excitement across synchronized devices.

**Core Principles:**
- **Instant Clarity:** Game state and actions must be immediately obvious
- **Energetic Gaming Vibe:** Music-focused, dynamic without distracting animations
- **Multi-Device Harmony:** Consistent visual language across master and player devices
- **Swedish-First:** All text in Swedish with natural, conversational tone

## Typography

**Font Selection:**
- Primary: **Poppins** (Google Fonts) - Bold, modern, excellent for gaming UI
  - Headings: 700-800 weight
  - Body: 400-600 weight
- Monospace: **JetBrains Mono** - Timeline years and scores

**Hierarchy:**
- Game Title/Headers: text-4xl to text-6xl, font-bold
- Section Titles: text-2xl to text-3xl, font-semibold  
- Body Text: text-base to text-lg, font-medium
- Timeline Years: text-xl, font-mono, font-bold
- Scores/Stats: text-3xl to text-5xl, font-bold, font-mono

## Layout System

**Spacing Units:** Tailwind units of **2, 4, 6, and 12** (p-4, m-6, gap-12, etc.)

**Container Strategy:**
- Master Device: Full-viewport sections with max-w-6xl inner containers
- Player Device: Mobile-first single column with max-w-2xl
- Cards/Components: Consistent p-6 padding, rounded-2xl corners

**Grid Patterns:**
- Player Timeline: Horizontal scrollable flex layout
- Score Display: 2-column grid for player stats
- Song Cards: Single focus element, full-width on mobile

## Component Library

### Master Device Components

**AI Chat Interface:**
- Chat bubble design with asymmetric layout (user right, AI left)
- AI messages: Gradient background with rounded-3xl, p-6
- User messages: Solid background, rounded-2xl, p-4
- Input: Large text-lg field with rounded-full, p-4
- Submit button: Prominent, rounded-full with icon

**QR Code Display:**
- Centered on full-screen background with radial gradient
- QR code: Large (300x300px minimum), white background, rounded-3xl, shadow-2xl
- Game code: Display prominently above QR in text-5xl, font-mono, font-black
- Instructions: Below QR in text-xl, max-w-md
- Player count indicator: Floating badge showing connected players

**Game Control Panel:**
- Top bar with game status, round counter, and controls
- Player grid: 2-3 columns showing avatars, names, scores
- Action buttons: Full-width, text-xl, rounded-2xl, p-6
- Progress indicator: Visual round tracker (1-10 dots/bars)

**Spotify Player:**
- Album artwork: Large square (400x400px), rounded-2xl, shadow-xl
- Track info: Song title (text-3xl), artist (text-xl), year (text-2xl, font-mono)
- Playback controls: Large touch-friendly buttons
- Waveform visualization: Animated bars below player (minimal, not distracting)

### Player Device Components

**Timeline Interface:**
- Horizontal scrollable container with snap points
- Song cards: Compact vertical design (160x240px)
  - Album cover: rounded-xl, full-width
  - Year badge: Absolute positioned, top-right, font-mono, font-bold
  - Title/artist: Below cover, truncated text
- Placement indicators: Gap markers between cards showing "+" icons
- Drop zones: Highlighted areas (dashed borders) during drag

**Card Placement:**
- Current song: Large floating card (280x400px) with shadow-2xl
- Drag handle: Visual indicator at top of card
- Placement preview: Ghost card showing where it will land
- Confirm button: Bottom-fixed, full-width, text-xl, rounded-t-3xl

**Score Display:**
- Player name: text-2xl, font-bold at top
- Current score: Huge text-6xl, font-mono, font-black, centered
- Target display: "/ 10" in muted text-3xl
- Timeline length: Visual progress bar showing card count

### Shared Components

**Reveal Screen:**
- Full-screen overlay with backdrop blur
- Correct/Incorrect banner: Bold text-4xl with icon
- Animated card flip showing placement
- All players' results: Grid layout showing who got it right
- Continue button: Prominent bottom placement

**Game Status Bar:**
- Compact top bar (h-16) with round number, timer if needed
- Synchronized across all devices
- Pulsing indicator for active player's turn

**Audio Visualization:**
- Subtle reactive bars during playback
- Positioned near album artwork
- Low-key animation (no distraction from gameplay)

## Images

**Master Device:**
- Hero/Welcome Screen: Music-themed abstract background (vinyl records, waveforms, or colorful gradient meshes) - full viewport height
- AI Avatar: Circular icon with gradient or illustrated character
- Placeholder album covers: Use Spotify artwork when available

**Player Device:**
- Welcome/Join Screen: Simplified music background - partial height (60vh)
- Timeline: Album artwork from Spotify for each song card
- Empty timeline state: Illustration of empty music timeline

**Shared:**
- Winner celebration: Confetti overlay effect or trophy illustration
- Loading states: Animated music note or vinyl record icon

## Visual Treatment Notes

- **Rounded Corners:** Heavily rounded elements (rounded-2xl to rounded-3xl) for friendly, modern gaming feel
- **Shadows:** Generous use of shadow-xl and shadow-2xl for depth and card separation
- **Borders:** Minimal use - rely on shadows and backgrounds for separation
- **Icons:** Material Icons or Heroicons for consistent iconography throughout
- **Glassmorphism:** Subtle backdrop-blur for overlays and floating elements
- **Card Aesthetics:** Elevated cards with hover states that slightly scale (scale-105)

## Accessibility

- High contrast text for scores and years (critical game information)
- Touch targets minimum 48x48px for mobile placement interactions
- Clear focus states for keyboard navigation on master device
- Screen reader announcements for round changes and score updates
- Alternative text for all album artwork

This design creates an energetic, modern gaming experience that prioritizes quick comprehension and smooth multi-device coordination while maintaining visual excitement appropriate for a social music game.