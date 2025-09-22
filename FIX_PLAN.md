# Fix Plan - Amazon Research Playbook

**Generated**: September 22, 2025  
**Based on**: AUDIT.md comprehensive codebase review  
**Priority**: Critical → High → Medium → Low

## Priority Matrix Legend
- **Effort**: S (Small, <4h), M (Medium, 4-16h), L (Large, 16h+)
- **Risk**: Low/Medium/High (breaking changes, user impact, complexity)

---

## CRITICAL PRIORITY (Ship Immediately)

### CRIT-001: JSON.parse Vulnerabilities ⚠️
- **Files**: `src/utils/OpportunityStorage.ts` (lines 94, 144, 158, 164)
- **Impact**: App crash with corrupted localStorage
- **Effort**: S (2-3h)
- **Risk**: Low (pure enhancement)
- **Fix**: Create `utils/safeJson.ts` with try-catch wrapper; replace all raw JSON.parse calls

### CRIT-002: Missing Error Boundaries ⚠️
- **Files**: `src/App.tsx` (dynamic imports), route components
- **Impact**: White screen on component errors
- **Effort**: S (3-4h)
- **Risk**: Low (additive only)
- **Fix**: Wrap Suspense/routes with ErrorBoundary; create reusable component

### CRIT-003: Accessibility Dialog Issues ⚠️
- **Files**: Multiple dialog components
- **Impact**: Screen reader navigation broken
- **Effort**: M (6-8h)
- **Risk**: Medium (UI behavior changes)
- **Fix**: Add DialogDescription, focus traps, proper ARIA semantics

---

## HIGH PRIORITY (Same Sprint)

### HIGH-001: Array Index Selection Logic
- **Files**: `src/components/OpportunitiesList.tsx` (lines 426, 428, 438)
- **Impact**: Wrong items selected after sorting
- **Effort**: S (2-3h)
- **Risk**: Low (internal logic only)
- **Fix**: Use opportunity.id consistently instead of array indices

### HIGH-002: Keyboard Navigation Traps
- **Files**: `src/components/ProductTour.tsx`, modal components
- **Impact**: Keyboard users trapped in overlays
- **Effort**: M (8-10h)
- **Risk**: Medium (interaction changes)
- **Fix**: Proper focus management, Esc handling, tab order

### HIGH-003: Import Error Handling
- **Files**: `src/pages/Import.tsx` (lines 529-531, 399-407)
- **Impact**: Silent failures during data import
- **Effort**: M (6-8h)
- **Risk**: Medium (error flow changes)
- **Fix**: Comprehensive error handling with user feedback

### HIGH-004: Dynamic Tailwind Class Construction
- **Files**: `src/pages/Score.tsx` (line 75), various components
- **Impact**: Styling inconsistencies, maintenance issues
- **Effort**: S (3-4h)
- **Risk**: Low (internal refactor)
- **Fix**: Replace template strings with classMap objects

### HIGH-005: Event Listener Memory Leaks
- **Files**: `src/components/ProductTour.tsx`, `src/components/QuickTutorial.tsx`
- **Impact**: Performance degradation over time
- **Effort**: S (2-3h)
- **Risk**: Low (cleanup addition)
- **Fix**: Proper cleanup in useEffect return functions

### HIGH-006: Print CSS Support
- **Files**: `src/index.css` (lines 160-178), packet components
- **Impact**: Poor print quality for sourcing packets
- **Effort**: M (4-6h)
- **Risk**: Low (additive only)
- **Fix**: Comprehensive print styles for all components

### HIGH-007: Score Calculation Inconsistency
- **Files**: `src/utils/scoringUtils.ts`, scoring implementations
- **Impact**: Inconsistent scores across application
- **Effort**: M (8-10h)
- **Risk**: High (could change user scores)
- **Fix**: Centralize logic, add validation tests

---

## MEDIUM PRIORITY (Next Sprint)

### MED-001: Missing ARIA Labels
- **Files**: `src/components/OpportunitiesList.tsx` (lines 392, 404)
- **Effort**: S (2-3h), **Risk**: Low
- **Fix**: Add aria-label attributes to Select components

### MED-002: Empty State Loading Variants
- **Files**: `src/components/EmptyState.tsx`
- **Effort**: S (2-3h), **Risk**: Low
- **Fix**: Add loading state differentiation

### MED-003: File Upload Security
- **Files**: `src/pages/Import.tsx` (lines 295-307)
- **Effort**: M (4-6h), **Risk**: Medium
- **Fix**: Add file type/size validation

### MED-004: Navigation State Management
- **Files**: `src/components/Navigation.tsx`
- **Effort**: S (2-3h), **Risk**: Low
- **Fix**: Close mobile menu on route change

### MED-005: Inconsistent Error Messaging
- **Files**: Multiple components with toast usage
- **Effort**: M (6-8h), **Risk**: Low
- **Fix**: Create consistent error message patterns

### MED-006: Tutorial Deep Link Safety
- **Files**: `src/components/QuickTutorial.tsx`
- **Effort**: S (2-3h), **Risk**: Medium
- **Fix**: Add existence checks before navigation

### MED-007: Refresh Operation Race Conditions
- **Files**: `src/components/RefreshModal.tsx`
- **Effort**: M (6-8h), **Risk**: Medium
- **Fix**: Implement operation queuing/locking

### MED-008: Form Validation Indicators
- **Files**: `src/pages/Import.tsx`, `src/components/ScoringSystem.tsx`
- **Effort**: S (3-4h), **Risk**: Low
- **Fix**: Add visual required field indicators

### MED-009: Decision Tree Edge Cases
- **Files**: `src/pages/Decision.tsx`
- **Effort**: M (4-6h), **Risk**: Medium
- **Fix**: Robust gate calculation with fallbacks

### MED-010: Help Content Security
- **Files**: `src/pages/Help.tsx`
- **Effort**: S (2-3h), **Risk**: Medium
- **Fix**: Validate section IDs against whitelist

### MED-011: Component Type Safety
- **Files**: Multiple UI components
- **Effort**: L (12-16h), **Risk**: Medium
- **Fix**: Strengthen TypeScript interfaces

### MED-012: Build Security Scanning
- **Files**: CI configuration, `package.json`
- **Effort**: M (4-6h), **Risk**: Low
- **Fix**: Add automated dependency security scanning

---

## LOW PRIORITY (Future Sprints)

### LOW-001: Production Console Logs
- **Effort**: S (1-2h), **Risk**: Low
- **Fix**: Remove/replace with proper logging

### LOW-002: Hardcoded Timeouts
- **Effort**: S (2-3h), **Risk**: Low
- **Fix**: Make timeouts configurable

### LOW-003: Missing Async Loading States
- **Effort**: M (4-6h), **Risk**: Low
- **Fix**: Add loading indicators for all operations

### LOW-004: Icon Usage Inconsistency
- **Effort**: S (2-3h), **Risk**: Low
- **Fix**: Audit and standardize icon usage

### LOW-005: Component Key Patterns
- **Effort**: S (2-3h), **Risk**: Low
- **Fix**: Use unique IDs for all list keys

### LOW-006: Mobile Responsive Gaps
- **Effort**: M (6-8h), **Risk**: Medium
- **Fix**: Comprehensive responsive design audit

### LOW-007: SEO Meta Tags
- **Effort**: M (4-6h), **Risk**: Low
- **Fix**: Add comprehensive meta tags and structured data

### LOW-008: Performance Optimizations
- **Effort**: L (12-16h), **Risk**: Medium
- **Fix**: Add React.memo, useMemo, useCallback optimizations

---

## Sprint Planning Recommendations

### Sprint 1 (Week 1): Critical Issues Only
- **Total Effort**: ~20h
- **Risk**: Low-Medium
- **Items**: CRIT-001, CRIT-002, CRIT-003

### Sprint 2 (Week 2): High Priority Batch 1
- **Total Effort**: ~25h
- **Risk**: Low-Medium
- **Items**: HIGH-001, HIGH-004, HIGH-005, HIGH-006

### Sprint 3 (Week 3): High Priority Batch 2
- **Total Effort**: ~30h
- **Risk**: Medium-High
- **Items**: HIGH-002, HIGH-003, HIGH-007

### Sprint 4+ (Week 4+): Medium & Low Priority
- **Effort**: Varies by priority
- **Risk**: Mixed
- **Items**: All MED and LOW items by business priority

---

## Risk Mitigation Strategy

### High-Risk Changes
- **Score Calculation Logic**: Requires extensive testing with existing data
- **Keyboard Navigation**: May affect user workflows
- **Dialog Semantics**: Could break existing automation/tests

### Testing Requirements
- **Unit Tests**: All scoring logic changes
- **Integration Tests**: Import workflow and error handling
- **Accessibility Tests**: Screen reader compatibility
- **Manual Tests**: Keyboard navigation, print functionality

### Rollback Plan
- **Feature Flags**: For major changes (scoring logic)
- **Incremental Deployment**: One area at a time
- **Monitoring**: Error tracking for new error boundaries
- **User Feedback**: Collection mechanism for accessibility improvements

---

*This fix plan should be reviewed after each sprint and updated based on user feedback and business priorities.*