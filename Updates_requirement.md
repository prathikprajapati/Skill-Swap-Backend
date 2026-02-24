# Skill Swap Frontend - Updates Requirement Document (26/02/25)

## Project Overview
This document outlines updates requested for DashboardPage including LightRays background, pagination, glass-folders with language icons, and glass effects on match cards.

---

## COMPLETED COMPONENTS ✅

### 1. LanguageIcons.tsx (NEW FILE)
**Location**: `src/app/components/ui/LanguageIcons.tsx`
- Created language-to-icon mapping component
- Includes getLanguageIcon(), getLanguageColor(), getGradientColors(), getLanguageGradient() functions
- Maps common programming languages (javascript, python, react, nodejs, etc.) to appropriate icons

### 2. TopicFolder.tsx (NEW FILE)
**Location**: `src/app/components/ui/TopicFolder.tsx`
- Created wrapper component using GlassFolder from lightswind
- Displays language icon inside glass folder effect
- Shows folder name below each icon
- Includes TopicFoldersRow component for rendering multiple topic folders

---

## PENDING IMPLEMENTATION 🔄

### DashboardPage.tsx Changes Required:

1. **Add Imports**:
   - Import LightRays from "@/app/components/ui/LightRays"
   - Import Pagination components from "@/app/components/lightswind/pagination"
   - Import TopicFoldersRow from "@/app/components/ui/TopicFolder"

2. **Add Pagination State**:
   
```typescript
   const ITEMS_PER_PAGE = 5;
   const [currentPage setCurrentPage] = useState(1);
   
   // Calculate pagination indices  
   const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
   const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
   
    // Replace infinite scroll logic with simple slice: 
    paginatedMatches.slice(indexOfFirstItem indexOfLastItem)
    
    // Add page change handler function 
    function handlePageChange(page: number) { ... }
    
     // Reset page when filters change via useEffect...
     
3. **Add LightRays Background**:
```jsx  
<div className="absolute inset-0 z-[−1]">
 <LightRays raysOrigin="top-center" raysColor="#F2EAB2" raysSpeed={0 .15} lightSpread={0 .8} rayLength={3} pulsating={false} fadeDistance=8 saturation=.04/>
</div>
```

4.**Add Browse based on Topics Section:**
```jsx  
{/* After card grid */}
<div className="mt−12">
 <h3 className="text-xl font-semibold mb−4 text-center">Browse based on Topics</h3> 
<TopicFoldersRow />
</div> 
```

5.**Remove Infinite Scroll Code:**
Remove IntersectionObserver effect + loadMoreRef state variable since replaced by pagination.

---

### MatchCard Glass Effect Enhancement:

Optional enhancement for src/app /components /ui/match-card .tsx:

Apply glassmorphism styling using backdrop-blur semi-transparent backgrounds border gradients based upon skill types passed as props...

---

## Implementation Notes:

Due file size/complexity modifications being applied incrementally rather than all-at-once due risk of introducing syntax errors during large replacements; each targeted edit tested individually before proceeding further!

---
 

Document Version: 1 .1  

Created For :Dashboard Page Update Request  

Last Updated :2025 −02 −26 

Status :In Progress — Components Complete Dashboard Page Pending Final Integration Testing!
