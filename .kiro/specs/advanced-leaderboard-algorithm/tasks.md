# Implementation Plan

- [x] 1. Enhance calculateFairScore() for universal application


  - Update calculateFairScore() method to accept tableId parameter
  - Add table configuration mapping for all 6 tables (direction, default benchmark)
  - Ensure scoring logic works for both "higher is better" and "lower is better" metrics
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_




- [x] 2. Update calculateChanges() to apply fair scoring to all 6 tables


  - Remove table-specific sorting logic (VTI Compliance improvement-first, etc.)
  - Apply calculateFairScore() to all 6 tables with appropriate benchmarks
  - Store fairScore in each associate's data object

  - Implement universal fair score sorting for all tables


  - Add console logging for score calculations and rankings
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_



- [ ] 3. Update benchmark configuration system
  - Add localStorage keys for all 6 table benchmarks





  - Set appropriate default benchmarks per table
  - Ensure benchmark retrieval in calculateChanges() for each table


  - Trigger recalculation when benchmarks are updated
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 4. Create unified leaderboard aggregation module
  - Create new file demo/unified-leaderboard.js
  - Implement UnifiedLeaderboard class with aggregateScores() method
  - Collect fair scores from all 6 dashboards

  - Sum scores per associate across tables
  - Calculate average scores and assign status based on percentile ranking

  - Filter excluded employees from aggregation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 9.3_


- [ ] 5. Create unified leaderboard UI
  - Add unified leaderboard section to index.html
  - Implement renderLeaderboard() method to display aggregated rankings
  - Show associate name, total score, table count, average score, and status
  - Implement updateMainPodium() to show top 3 overall associates
  - Add refresh button to recalculate leaderboard on demand




  - _Requirements: 11.2, 11.6_



- [ ] 6. Update status assignment logic
  - Implement percentile-based status assignment (top 25% = Excellent, etc.)
  - Apply status assignment to individual tables after fair score sorting
  - Apply status assignment to unified leaderboard after aggregation
  - _Requirements: 6.1, 6.2, 6.3, 6.4_




- [ ] 7. Integrate unified leaderboard with existing dashboard initialization
  - Add unified leaderboard initialization in DOMContentLoaded event
  - Connect unified leaderboard to all 6 dashboard instances
  - Trigger leaderboard update after any table data changes
  - Ensure podium displays update correctly for both individual tables and unified leaderboard
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 8. Add benchmark configuration UI modal
  - Create benchmark settings modal in index.html
  - Add input fields for each table's benchmark value
  - Add direction indicators (higher/lower is better) for each table
  - Implement save functionality to update localStorage
  - Add reset to defaults button
  - Trigger recalculation of all tables when benchmarks are saved
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
