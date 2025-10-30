# Design Document

## Overview

The advanced leaderboard algorithm enhances the existing TOMDashboard class with a sophisticated fair scoring system that balances improvement and consistency. Each of the 6 compliance tables will independently calculate fair scores, and a unified leaderboard will aggregate these scores to determine the overall employee of the month.

## Architecture

### Core Components

1. **Enhanced calculateFairScore()** - Universal scoring function applied to all 6 tables
2. **Enhanced calculateChanges()** - Integrates fair score calculation into existing change detection
3. **Enhanced sorting logic** - Sorts all 6 tables by fair score instead of simple metrics
4. **Unified Leaderboard Module** - New component that aggregates scores across tables
5. **Benchmark Configuration System** - Stores and retrieves benchmark values per table

### Data Flow

```
File Upload → Parse Data → Merge Data → calculateChanges() → calculateFairScore() → Sort by Fair Score → Render Table → Update Podium
                                                                                                              ↓
                                                                                            Aggregate to Unified Leaderboard
```

## Components and Interfaces

### 1. Enhanced calculateFairScore() Method

**Location:** TOMDashboard class in script-clean.js

**Signature:**
```javascript
calculateFairScore(value, benchmark, direction, change = 0, tableId = null)
```

**Parameters:**
- `value`: Current month performance value
- `benchmark`: Target threshold for the metric
- `direction`: 'below' (lower is better) or 'above' (higher is better)
- `change`: Difference between current and prior month
- `tableId`: Identifier for the specific table (for table-specific logic)

**Returns:** Numeric fair score (0 to ~2000+ range)

**Logic:**
- Base score: 800 for compliant, 400 for non-compliant
- Improvement bonus: 300x multiplier for compliant, 400x for non-compliant
- Decline penalty: 200x for compliant, 300x for non-compliant
- Consistency bonus: 100 points for zero change while compliant
- Excellence multiplier: 1.2x for exceptional performance
- Distance penalty: Proportional to distance from benchmark

### 2. Enhanced calculateChanges() Method

**Location:** TOMDashboard class in script-clean.js

**Modifications:**
- Apply fair score calculation to ALL 6 tables (not just TA Idle Time)
- Store fair score in `item.fairScore` for each associate
- Use table-specific benchmark values from localStorage
- Apply direction-aware logic based on tableId

**Table-Specific Configurations:**
```javascript
const tableConfigs = {
    'tableBody': { direction: 'above', defaultBenchmark: 100, metric: 'VTI Compliance' },
    'tableBody2': { direction: 'below', defaultBenchmark: 0, metric: 'VTI DPMO' },
    'tableBody3': { direction: 'below', defaultBenchmark: 5.0, metric: 'TA Idle Time' },
    'tableBody4': { direction: 'above', defaultBenchmark: 100, metric: 'Seal Validation' },
    'tableBody5': { direction: 'below', defaultBenchmark: 0, metric: 'PPO Compliance' },
    'tableBody6': { direction: 'below', defaultBenchmark: 3.0, metric: 'Andon Response Time' }
};
```

### 3. Enhanced Sorting Logic

**Location:** TOMDashboard.calculateChanges() method

**Current State:** Each table has custom sorting logic
**New State:** All tables use fair score sorting

**Implementation:**
```javascript
// Universal fair score sorting for all tables
this.data.sort((a, b) => {
    const fairScoreA = a.fairScore || 0;
    const fairScoreB = b.fairScore || 0;
    
    if (Math.abs(fairScoreA - fairScoreB) > 0.01) {
        return fairScoreB - fairScoreA; // Higher score = better rank
    }
    return a.name.localeCompare(b.name); // Alphabetical tiebreaker
});
```

### 4. Unified Leaderboard Module

**Location:** New file `demo/unified-leaderboard.js`

**Class:** UnifiedLeaderboard

**Methods:**

```javascript
class UnifiedLeaderboard {
    constructor() {
        this.aggregatedScores = new Map();
    }
    
    // Aggregate scores from all 6 dashboards
    aggregateScores(dashboards) {
        // Collect fair scores from each table
        // Sum scores per associate
        // Return sorted leaderboard
    }
    
    // Render unified leaderboard table
    renderLeaderboard(containerId) {
        // Display aggregated rankings
    }
    
    // Update main podium with top 3 overall
    updateMainPodium(podiumId) {
        // Show top 3 from aggregated scores
    }
}
```

**Data Structure:**
```javascript
{
    associateName: {
        totalScore: 0,
        tableScores: {
            'VTI Compliance': 850,
            'VTI DPMO': 920,
            'TA Idle Time': 1100,
            // ... other tables
        },
        tableCount: 3,
        averageScore: 956.67,
        status: 'Excellent'
    }
}
```

### 5. Benchmark Configuration UI

**Location:** New modal in index.html

**Features:**
- Input fields for each table's benchmark
- Direction toggle (higher/lower is better)
- Save to localStorage
- Reset to defaults button

**Storage Keys:**
```javascript
localStorage.setItem('vti_compliance_benchmark', '100');
localStorage.setItem('vti_dpmo_benchmark', '0');
localStorage.setItem('ta_idle_benchmark', '5.0');
localStorage.setItem('seal_validation_benchmark', '100');
localStorage.setItem('ppo_compliance_benchmark', '0');
localStorage.setItem('andon_response_benchmark', '3.0');
```

## Data Models

### Associate Performance Record
```javascript
{
    name: string,              // Associate identifier
    priorMonth: number,        // Previous period value
    currentMonth: number,      // Current period value
    change: number,            // Calculated difference
    fairScore: number,         // Calculated fair score
    status: string,            // 'Excellent', 'Improved', 'Maintained', 'Decreased'
    rank: number              // Position in table ranking
}
```

### Unified Leaderboard Entry
```javascript
{
    name: string,
    fullName: string,
    totalScore: number,
    tableScores: Map<string, number>,
    tableCount: number,
    averageScore: number,
    status: string,
    rank: number
}
```

## Error Handling

1. **Missing Benchmark:** Use default benchmark value for table type
2. **Invalid Score Calculation:** Return 0 and log error
3. **Missing Employee Data:** Skip associate in leaderboard aggregation
4. **Division by Zero:** Handle edge cases in percentage calculations

## Testing Strategy

1. **Unit Tests:** Test calculateFairScore() with various scenarios
   - Compliant + improving
   - Compliant + declining
   - Non-compliant + improving
   - Non-compliant + declining
   - Edge cases (zero values, extreme values)

2. **Integration Tests:** Test full workflow
   - Upload files → Calculate scores → Verify rankings
   - Change benchmarks → Verify recalculation
   - Aggregate leaderboard → Verify totals

3. **Visual Tests:** Verify UI updates
   - Table rankings match fair scores
   - Podiums show correct top 3
   - Status badges display correctly

## Performance Considerations

- Fair score calculation is O(n) per table
- Sorting is O(n log n) per table
- Leaderboard aggregation is O(n * m) where n = associates, m = tables
- Total complexity: O(n log n) - acceptable for typical dataset sizes (< 1000 associates)

## Migration Strategy

1. Deploy enhanced calculateFairScore() to all 6 tables
2. Update sorting logic in calculateChanges()
3. Add unified leaderboard module
4. Add benchmark configuration UI
5. Test with existing data
6. No data migration needed - calculations are real-time
