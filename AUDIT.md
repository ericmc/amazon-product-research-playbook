# Amazon Research Playbook - Bug & Risk Register

**Generated**: September 22, 2025  
**Scope**: Complete codebase audit for bugs, risks, and best practice violations

## Executive Summary

| Severity | Count | Areas Most Affected |
|----------|-------|-------------------|
| **Critical** | 3 | Import, A11y, Performance |
| **High** | 7 | Import, Scoring, A11y, Performance |
| **Medium** | 12 | Validation, Decision, Help/Tour, Build/CI |
| **Low** | 8 | Opportunities, Performance, A11y |

**Total Issues**: 30

---

## Critical Issues (Immediate Action Required)

### CRIT-001: JSON.parse Vulnerability in OpportunityStorage
- **File**: `src/utils/OpportunityStorage.ts`
- **Lines**: 94, 144, 158, 164
- **Symptom**: Unprotected JSON.parse calls could crash app with malformed localStorage data
- **User Impact**: App crash/white screen when localStorage is corrupted
- **Repro**: Manually corrupt localStorage data and refresh page
- **Fix**: Add try-catch blocks around all JSON.parse calls with fallback values

### CRIT-002: Missing Error Boundary for Dynamic Imports
- **File**: `src/App.tsx`
- **Lines**: 21-23, 65-67, 75-77, 86-89
- **Symptom**: Lazy-loaded components (Import, SourcingPacket, Help) have no error boundary fallback
- **User Impact**: White screen if dynamic import fails or component throws
- **Repro**: Network interruption during route navigation or component error
- **Fix**: Wrap each Suspense with ErrorBoundary or create higher-level error handling

### CRIT-003: Accessibility Dialog Description Missing
- **File**: Multiple dialog components
- **Lines**: Various (see console warning)
- **Symptom**: Console warning about missing Description for DialogContent
- **User Impact**: Screen readers cannot properly announce dialog purpose
- **Repro**: Open any modal/dialog and check console
- **Fix**: Add DialogDescription component to all dialogs

---

## High Severity Issues

### HIGH-001: Array Index Assumptions in OpportunitiesList
- **File**: `src/components/OpportunitiesList.tsx`
- **Lines**: 426, 428, 438
- **Symptom**: Uses array index instead of opportunity.id for selection logic
- **User Impact**: Wrong opportunities selected after sorting/filtering
- **Repro**: Select items, change sort order, notice selection mismatch
- **Fix**: Use opportunity.id consistently instead of array indices

### HIGH-002: Keyboard Navigation Traps in ProductTour
- **File**: `src/components/ProductTour.tsx`
- **Lines**: 184-208, 288
- **Symptom**: Focus management issues when tour overlays page content
- **User Impact**: Keyboard users cannot escape tour or access underlying content
- **Repro**: Start tour, try to tab to page content
- **Fix**: Implement proper focus trapping within tour modal

### HIGH-003: Unhandled Promise Rejections in Import Process
- **File**: `src/pages/Import.tsx`
- **Lines**: 529-531, 399-407
- **Symptom**: Database operations lack comprehensive error handling
- **User Impact**: Silent failures during import process
- **Repro**: Import data while offline or with invalid Supabase credentials
- **Fix**: Add proper error handling and user feedback for all async operations

### HIGH-004: Dynamic Tailwind Class Construction
- **File**: `src/pages/Score.tsx`
- **Lines**: 75
- **Symptom**: Badge variant mapping using ternary operators instead of proper class mapping
- **User Impact**: Potential styling inconsistencies, harder maintenance
- **Repro**: Check badge styling in different states
- **Fix**: Use proper class mapping object instead of inline ternary logic

### HIGH-005: Memory Leaks in Event Listeners
- **File**: `src/components/ProductTour.tsx`, `src/components/QuickTutorial.tsx`
- **Lines**: 176-178, 206-207, 311-312
- **Symptom**: Event listeners added in useEffect without proper cleanup
- **User Impact**: Performance degradation over time
- **Repro**: Open/close tour multiple times, monitor event listener count
- **Fix**: Ensure all event listeners are properly removed in cleanup functions

### HIGH-006: Incomplete Print CSS Support
- **File**: `src/index.css`
- **Lines**: 160-178
- **Symptom**: Print styles only handle dark mode but miss component-specific print styles
- **User Impact**: Poor print quality for sourcing packets and reports
- **Repro**: Print any page with complex components
- **Fix**: Add comprehensive print styles for all components

### HIGH-007: Score Calculation Logic Inconsistency
- **File**: `src/utils/scoringUtils.ts` vs scoring implementations
- **Lines**: Various scoring calculations
- **Symptom**: Different score calculation logic between utility and components
- **User Impact**: Inconsistent scores across the application
- **Repro**: Compare scores calculated in different parts of the app
- **Fix**: Centralize all scoring logic in utilities and use consistently

---

## Medium Severity Issues

### MED-001: Missing ARIA Labels on Interactive Elements
- **File**: `src/components/OpportunitiesList.tsx`
- **Lines**: 392, 404
- **Symptom**: Select components lack proper ARIA labeling
- **User Impact**: Screen reader users cannot understand dropdown purpose
- **Repro**: Use screen reader to navigate sort/filter controls
- **Fix**: Add aria-label attributes to Select components

### MED-002: Empty State Component Missing Loading States
- **File**: `src/components/EmptyState.tsx`
- **Lines**: 25-40
- **Symptom**: No loading state differentiation from actual empty state
- **User Impact**: Users cannot distinguish between loading and no data
- **Repro**: Reload page with slow network
- **Fix**: Add loading variant to EmptyState component

### MED-003: File Upload Security Gaps
- **File**: `src/pages/Import.tsx`
- **Lines**: 295-307
- **Symptom**: No file type validation or size limits on CSV uploads
- **User Impact**: App could hang with large files or unexpected formats
- **Repro**: Upload very large file or wrong file type
- **Fix**: Add file validation (type, size) before processing

### MED-004: Navigation State Management Issues
- **File**: `src/components/Navigation.tsx`
- **Lines**: 28, 114
- **Symptom**: Mobile menu state not properly managed with route changes
- **User Impact**: Menu stays open after navigation on mobile
- **Repro**: Open mobile menu, navigate, menu remains open
- **Fix**: Close mobile menu on route change

### MED-005: Inconsistent Error Messaging
- **File**: Multiple components with toast usage
- **Lines**: Various
- **Symptom**: Error messages are inconsistent and sometimes not user-friendly
- **User Impact**: Poor user experience during error conditions
- **Repro**: Trigger various error conditions
- **Fix**: Create consistent error message patterns and user-friendly text

### MED-006: QuickTutorial Deep Link Vulnerabilities
- **File**: `src/components/QuickTutorial.tsx`
- **Lines**: 172-185, 201-214
- **Symptom**: Navigation assumes opportunities exist without checking
- **User Impact**: Tutorial breaks if no opportunities are saved
- **Repro**: Start tutorial on fresh install
- **Fix**: Add existence checks before navigation

### MED-007: Refresh Logic Race Conditions
- **File**: `src/components/RefreshModal.tsx` (referenced but not in audit scope)
- **Lines**: Various refresh operations
- **Symptom**: Multiple refresh operations can conflict
- **User Impact**: Data inconsistencies during concurrent refreshes
- **Repro**: Trigger multiple refreshes simultaneously
- **Fix**: Implement refresh operation queuing/locking

### MED-008: Form Validation Missing Required Field Indicators
- **File**: `src/pages/Import.tsx`, `src/components/ScoringSystem.tsx`
- **Lines**: Various form fields
- **Symptom**: Required fields not visually indicated to users
- **User Impact**: Users don't know which fields are required
- **Repro**: Try to submit forms with missing required data
- **Fix**: Add visual indicators (asterisks, labels) for required fields

### MED-009: Decision Tree Logic Edge Cases
- **File**: `src/pages/Decision.tsx`
- **Lines**: 66-78, 182-184
- **Symptom**: Gate calculations assume criteria exist with specific names
- **User Impact**: Decision logic fails with custom or missing criteria
- **Repro**: Import data with non-standard field names
- **Fix**: Make gate calculation more robust with fallbacks

### MED-010: Help Content Routing Vulnerabilities
- **File**: `src/pages/Help.tsx`
- **Lines**: 182-184
- **Symptom**: Direct DOM manipulation for navigation without validation
- **User Impact**: Potential XSS if section IDs are manipulated
- **Repro**: Manipulate URL hash with script tags
- **Fix**: Validate section IDs against whitelist

### MED-011: Component Props Type Safety
- **File**: Multiple UI components
- **Lines**: Various prop interfaces
- **Symptom**: Some components accept any as props without proper typing
- **User Impact**: Type safety issues and potential runtime errors
- **Repro**: Pass incorrect prop types
- **Fix**: Strengthen TypeScript interfaces for all components

### MED-012: Build Dependencies Security Concerns
- **File**: `package.json`, CI configuration
- **Lines**: Dependency declarations
- **Symptom**: No automated security scanning for dependencies
- **User Impact**: Potential security vulnerabilities in dependencies
- **Repro**: Run npm audit
- **Fix**: Add automated dependency security scanning to CI

---

## Low Severity Issues

### LOW-001: Console Logs in Production Code
- **File**: Multiple files
- **Lines**: Various console.error statements
- **Symptom**: Debug console statements present in production code
- **User Impact**: Information exposure, performance impact
- **Repro**: Check browser console in production
- **Fix**: Remove or replace with proper logging service

### LOW-002: Hardcoded Timeouts and Delays
- **File**: `src/App.tsx`, `src/components/QuickTutorial.tsx`
- **Lines**: 38, 167, 340
- **Symptom**: Magic numbers for timeouts without configuration
- **User Impact**: Poor performance on slow devices, not respecting user preferences
- **Repro**: Test on slow devices
- **Fix**: Make timeouts configurable or responsive to device capabilities

### LOW-003: Missing Loading States for Async Operations
- **File**: `src/components/OpportunitiesList.tsx`
- **Lines**: 61-73
- **Symptom**: Some async operations don't show loading indicators
- **User Impact**: Users don't know when operations are in progress
- **Repro**: Perform operations with slow network
- **Fix**: Add loading states for all async operations

### LOW-004: Inconsistent Icon Usage
- **File**: Multiple components
- **Lines**: Various icon imports
- **Symptom**: Some icons imported but not used, inconsistent icon sizing
- **User Impact**: Bundle size bloat, visual inconsistency
- **Repro**: Build analysis for unused imports
- **Fix**: Audit and standardize icon usage

### LOW-005: Component Key Prop Patterns
- **File**: Multiple list rendering components
- **Lines**: Various map operations
- **Symptom**: Some list items use array index as key instead of unique identifiers
- **User Impact**: React rendering issues with dynamic lists
- **Repro**: Reorder lists and observe rendering
- **Fix**: Use unique IDs for all list item keys

### LOW-006: Mobile Responsive Gaps
- **File**: Multiple components
- **Lines**: Various responsive classes
- **Symptom**: Some components don't have proper mobile responsive behavior
- **User Impact**: Poor mobile user experience
- **Repro**: Test on various mobile screen sizes
- **Fix**: Audit and improve responsive design

### LOW-007: SEO Meta Tags Missing
- **File**: `index.html`, page components
- **Lines**: HTML head section
- **Symptom**: No meta descriptions, Open Graph tags, or structured data
- **User Impact**: Poor social sharing and search visibility
- **Repro**: Check social media preview
- **Fix**: Add comprehensive meta tags and structured data

### LOW-008: Performance Optimization Opportunities
- **File**: Multiple components
- **Lines**: Various render logic
- **Symptom**: Missing React.memo, useMemo, useCallback optimizations
- **User Impact**: Unnecessary re-renders affecting performance
- **Repro**: Profile component renders
- **Fix**: Add appropriate memoization where beneficial

---

## Area-Specific Risk Assessment

### Import System
- **Critical Risk**: JSON parsing vulnerabilities, file upload security
- **Primary Concerns**: Data validation, error handling, large file processing
- **Recommendation**: Implement comprehensive input validation and error recovery

### Scoring System
- **High Risk**: Calculation inconsistencies, dynamic class generation
- **Primary Concerns**: Logic centralization, type safety
- **Recommendation**: Centralize scoring logic, improve type definitions

### Opportunities Management
- **Medium Risk**: Array index assumptions, selection logic
- **Primary Concerns**: Data integrity, user experience
- **Recommendation**: Refactor to use consistent ID-based operations

### Tour/Help System
- **Medium Risk**: Keyboard navigation, deep linking
- **Primary Concerns**: Accessibility, error handling
- **Recommendation**: Improve focus management and error boundaries

### Performance
- **Ongoing Risk**: Event listener leaks, render optimizations
- **Primary Concerns**: Memory usage, user experience
- **Recommendation**: Implement performance monitoring and optimization

---

## Recommended Action Plan

### Phase 1: Critical Issues (Week 1)
1. Fix JSON.parse vulnerabilities with proper error handling
2. Add error boundaries for dynamic imports
3. Resolve accessibility dialog warnings

### Phase 2: High Severity (Week 2-3)
1. Fix array index selection logic
2. Implement proper keyboard navigation
3. Add comprehensive error handling
4. Replace dynamic class construction

### Phase 3: Medium Issues (Week 4-6)
1. Improve accessibility across components
2. Strengthen form validation
3. Fix tutorial navigation edge cases
4. Enhance error messaging consistency

### Phase 4: Low Priority (Ongoing)
1. Remove debug code from production
2. Optimize performance bottlenecks
3. Improve responsive design
4. Add SEO improvements

---

## Testing Recommendations

### Automated Testing
- Add unit tests for scoring logic
- Implement integration tests for import workflow
- Create accessibility testing with jest-axe
- Add performance regression testing

### Manual Testing
- Screen reader compatibility testing
- Keyboard-only navigation testing
- Mobile device testing across different screen sizes
- Network connectivity edge cases

### Security Testing
- Input validation testing
- XSS vulnerability scanning
- Dependency security auditing
- Authentication flow testing

---

*This audit report should be reviewed and updated regularly as code changes. Priority should be given to Critical and High severity issues before new feature development.*