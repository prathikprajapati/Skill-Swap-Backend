v# Implementation Plan

## Overview
Update the Skill Swap frontend with a new light theme color palette, add pagination to the Dashboard page, integrate glass-folder components with language icons, and apply LightRays background effects. The LandingPage and AuthPage remain unchanged.

## Types

### Color Palette Types
```
typescript
// New Light Theme Palette (60-30-10 Rule)
interface ColorPalette {
  // 60% - Dominant (Background)
  ivoryWhite: '#F5F1EC';
  // 30% - Secondary (Balance)
  softSage: '#ACC8A2';
  mutedSage: '#8CB79B';
  // 10% - Accent (CTAs)
  deepOlive: '#1A2517';
  darkSlate: '#2F3640';
  // Dark Mode
  charcoalBlack: '#121418';
}

// Language to Color Mapping
interface LanguageColors {
  [language: string]: string;
}

// Card Glass Effect Types
interface GlassCardProps {
  baseColor: string;
  gradientColors?: string[];
  isGlassEffect?: boolean;
}
```

### Pagination Types
```
typescript
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}
```

## Files

### New Files to Create
1. `src/app/components/ui/LanguageIcons.tsx` - Language icon components mapping
2. `src/app/components/ui/TopicFolder.tsx` - Glass folder with language icons

### Existing Files to Modify

1. **`src/styles/theme.css`**
   - Replace entire color palette with new 60-30-10 accessible colors
   - Add CSS variables for language-based colors
   - Update glass effect classes

2. **`src/app/pages/DashboardPage.tsx`**
   - Add LightRays background component (lighter version)
   - Replace infinite scroll with pagination (max 5 cards per page)
   - Add "Browse based on Topics" heading
   - Add TopicFolder component below cards
   - Apply glass effect to MatchCard components
   - Add language-based gradient colors to cards

3. **`src/app/components/ui/match-card.tsx`**
   - Add glass effect styling
   - Add language-based color/gradient support
   - Update to accept language prop for color mapping

4. **`src/app/components/ui/SpotlightCard.tsx`** (if needed)
   - Add glass effect variant

### Configuration Updates
- Update `src/app/constants/index.ts` with language-to-color mappings

## Functions

### New Functions
1. **`getLanguageColor(language: string): string`** - Maps programming language to its color
2. **`getGradientColors(languages: string[]): string`** - Creates gradient from multiple languages
3. **`usePagination(totalItems: number, itemsPerPage: number): PaginationState`** - Custom hook for pagination logic

### Modified Functions
- **`DashboardPage.tsx`**
  - Replace `displayedMatches` state with `currentPage` state
  - Replace infinite scroll observer with pagination controls
  - Add pagination rendering logic
  - Add topic/folder section rendering

## Classes

### New Components
1. **`TopicFolder`** (`src/app/components/ui/TopicFolder.tsx`)
   - Props: `language: string`, `folderName: string`, `onClick?: () => void`
   - Uses glass-folder.tsx with language icons
   - Displays folder name below icon

2. **`LanguageIcon`** (`src/app/components/ui/LanguageIcons.tsx`)
   - Maps language names to appropriate icons
   - Uses tech/stack icons for identification

## Dependencies
- No new npm packages required
- Reuse existing `pagination.tsx` from lightswind
- Reuse existing `glass-folder.tsx` from lightswind
- Reuse existing `LightRays.tsx` component

## Testing
- Test pagination navigation (prev/next/page numbers)
- Verify glass effect rendering on cards
- Verify language color mapping displays correctly
- Verify gradient displays for multi-language cards
- Test LightRays background performance (lighter settings)
- Verify responsive design with new theme

## Implementation Order

### Step 1: Update Theme CSS
- [ ] Replace color variables in `src/styles/theme.css` with new 60-30-10 palette
- [ ] Add glass effect CSS classes
- [ ] Add language color CSS variables

### Step 2: Create Language Icons Component
- [ ] Create `src/app/components/ui/LanguageIcons.tsx`
- [ ] Map common programming languages to icons
- [ ] Include fallback icon for unknown languages

### Step 3: Create TopicFolder Component
- [ ] Create `src/app/components/ui/TopicFolder.tsx`
- [ ] Integrate glass-folder with language icons
- [ ] Add folder name display

### Step 4: Update MatchCard Component
- [ ] Add glass effect styling
- [ ] Add language color support
- [ ] Update props interface

### Step 5: Update DashboardPage
- [ ] Add LightRays background (lighter settings)
- [ ] Implement pagination (5 cards per page)
- [ ] Add "Browse based on Topics" heading
- [ ] Add TopicFolder section
- [ ] Connect language colors to cards

### Step 6: Update Updates_requirement.md
- [ ] Document all changes made
- [ ] Update implementation checklist
