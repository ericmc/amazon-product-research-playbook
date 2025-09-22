# Changelog - Critical & High Priority Fixes

## [Critical Fixes] - 2025-09-22

### 🛡️ Security & Stability

**JSON Parse Vulnerabilities (CRIT-001)**
- Added `src/utils/safeJson.ts` with safe parsing utilities
- Replaced all raw `JSON.parse` calls in `OpportunityStorage.ts` with safe alternatives
- Added localStorage quota/undefined guards to prevent app crashes
- Added proper error handling with user-friendly messages

**Missing Error Boundaries (CRIT-002)**
- Enhanced `ErrorBoundary.tsx` with chunk load error handling
- Wrapped lazy-loaded routes (Import, SourcingPacket, Help) with error boundaries
- Added specific fallback messages for each route
- Automatic page reload for chunk loading errors

**Accessibility Improvements (CRIT-003)**
- Added skip-to-content link for keyboard navigation
- Implemented proper semantic HTML landmarks (`<header>`, `<main>`, `<footer>`)
- Added ARIA labels to Select components in OpportunitiesList
- Enhanced focus management for better screen reader support

### 🔧 Data Integrity & UX

**Array Index vs ID Mapping (HIGH-001)**
- Fixed selection logic in `OpportunitiesList.tsx` to use opportunity IDs instead of array indices
- Prevents wrong items being selected after sorting/filtering
- Updated all selection handlers to use consistent ID-based operations
- Improved data integrity for bulk operations

**Dynamic Tailwind Class Removal (HIGH-004)**
- Created `src/utils/classMap.ts` with predefined class mappings
- Replaced dynamic class construction in `Score.tsx` with static class maps
- Added utility functions for badge, score, progress, and gate styling
- Improved maintainability and prevented styling inconsistencies

### 🎨 Print & Visual Improvements

**Print CSS Enhancement (HIGH-006)**
- Comprehensive print styles for sourcing packets and reports
- Hide navigation and non-essential elements in print mode
- Added page numbers and generation date
- Prevent awkward page breaks in tables and content blocks
- Keep competitive analysis tables together
- Force light mode for better print contrast

## Technical Details

### Files Created
- `src/utils/safeJson.ts` - Safe JSON parsing utilities
- `src/utils/classMap.ts` - Static class mapping helpers
- `FIX_PLAN.md` - Prioritized fix roadmap
- `CHANGELOG.md` - This changelog

### Files Modified
- `src/utils/OpportunityStorage.ts` - Safe JSON parsing implementation
- `src/components/ErrorBoundary.tsx` - Enhanced error handling
- `src/App.tsx` - Error boundaries and semantic HTML
- `src/pages/Score.tsx` - Static class mapping usage
- `src/components/OpportunitiesList.tsx` - ID-based selection logic and ARIA labels
- `src/index.css` - Comprehensive print styles

### Breaking Changes
- None - All changes are backwards compatible

### Migration Notes
- Existing localStorage data will continue to work with new safe parsing
- Selection state will reset to empty on first load (one-time impact)
- Print layouts may look different (improved) but functionality unchanged

## Next Steps
See `FIX_PLAN.md` for remaining high and medium priority items planned for future sprints.