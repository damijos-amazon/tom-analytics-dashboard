# Critical Bug Analysis & Fix Plan

## Issues Identified

### 1. **Missing Global Functions**
- `clearAllData()` - Called from index.html but not defined
- `exportAllData()` - Called from index.html but not defined  
- `toggleFileNamingLegend()` - Called from index.html but not defined
- `toggleNav()`, `toggleBenchmarks()`, `goTo()` - Navigation functions missing
- `logout()` - Logout function missing

### 2. **Drag & Drop Issues**
- File upload drag & drop only initializes if `tableId === 'tableBody'`
- This breaks when tables are dynamically created
- Event listeners are conditionally set up, causing inconsistent behavior

### 3. **Table Row Drag & Drop**
- `updateDataOrder()` relies on finding rows by name in cells[1]
- This breaks with custom column configurations
- No validation that the row structure matches expectations

### 4. **Dashboard Initialization Race Condition**
- `window.dashboards` may not exist when drag & drop tries to access it
- File routing depends on `window.dashboards['tableBody']` existing
- No fallback if dashboards aren't initialized yet

### 5. **Missing Navigation Functions**
- Navigation panel buttons call undefined functions
- No scroll functionality implemented
- Benchmark navigation broken

## Fix Strategy

### Phase 1: Add Missing Global Functions
1. Create utility functions file
2. Add clearAllData, exportAllData, toggleFileNamingLegend
3. Add navigation functions
4. Add logout function

### Phase 2: Fix Drag & Drop
1. Remove conditional initialization based on tableId
2. Make drag & drop work with any dashboard
3. Add proper error handling
4. Ensure it works with dynamic tables

### Phase 3: Fix Table Row Reordering
1. Update `updateDataOrder()` to work with any column structure
2. Add data-attribute to track row identity
3. Make it work with custom columns

### Phase 4: Fix Initialization
1. Ensure proper initialization order
2. Add checks before accessing window.dashboards
3. Add loading states
4. Handle race conditions

## Implementation Order
1. Global utility functions (highest priority - breaks UI)
2. Drag & drop fixes (critical functionality)
3. Table reordering (important but less critical)
4. Initialization improvements (polish)
