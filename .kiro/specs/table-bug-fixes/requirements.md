# Requirements Document - Table Bug Fixes

## Introduction

This specification addresses critical bugs in the TOM Analytics Dashboard table system including edit button persistence, status calculation accuracy, raw data percentage conversion, and name update delays.

## Glossary

- **Edit Buttons**: Inline edit functionality (✏️ icon) in Prior Month and Current Month columns for VTI DPMO and PPO Compliance tables
- **Status Logic**: The algorithm that determines whether performance is Excellent, Improved, Maintained, or Decreased
- **Raw Data**: Violation count data where 0 = 100% compliance (used in PPO and VTI DPMO tables)
- **Percentage Conversion**: Converting raw violation counts to compliance percentages for display
- **renderTable Override**: JavaScript prototype modification that customizes table rendering behavior
- **Full Name Resolution**: Converting usernames/badge IDs to full employee names from the employee management system

## Requirements

### Requirement 1

**User Story:** As a team leader, I want edit buttons to persist after page refresh, so that I can continue editing table data without losing functionality.

#### Acceptance Criteria

1. WHEN a user refreshes the page after editing VTI DPMO or PPO Compliance data, THE System SHALL display edit buttons (✏️) in the Prior Month and Current Month columns
2. WHEN the System loads persisted data from localStorage, THE System SHALL apply the custom renderTable override for tables with edit functionality
3. WHEN the System initializes dashboard instances, THE System SHALL ensure edit file overrides are applied after the base renderTable function is defined
4. WHEN the leaderboard update triggers a table re-render, THE System SHALL preserve the custom renderTable implementation with edit buttons
5. WHEN a user clicks an edit button after refresh, THE System SHALL open the edit prompt and allow value modification

### Requirement 2

**User Story:** As a team leader, I want accurate status calculations for all performance metrics, so that I can trust the Excellent, Improved, Decreased, and Maintained labels.

#### Acceptance Criteria

1. WHEN an associate's performance decreases below 100%, THE System SHALL display the change percentage as a negative number in red color
2. WHEN an associate's performance is at or above 100%, THE System SHALL assign status as Excellent, Improved, Maintained, or Decreased based on the change value
3. WHEN the System calculates status for "lower is better" metrics (PPO, VTI DPMO, TA Idle Time, Andon Response), THE System SHALL treat negative changes as improvements
4. WHEN the System calculates status for "higher is better" metrics (VTI Compliance, Seal Validation), THE System SHALL treat positive changes as improvements
5. WHEN an associate has a low score with Decreased status, THE System SHALL display the percentage change as negative with red styling

### Requirement 3

**User Story:** As a team leader, I want PPO and VTI DPMO tables to correctly convert raw violation data to compliance percentages, so that I can understand performance at a glance.

#### Acceptance Criteria

1. WHEN the System displays a raw value of 0 in PPO or VTI DPMO tables, THE System SHALL show this as 100.00% compliance
2. WHEN a user enters a value of 1 in the edit field for PPO or VTI DPMO, THE System SHALL calculate and display the change as 99.00% in the Change column with two decimal places
3. WHEN the System imports raw data with decimal values (e.g., 0.9333), THE System SHALL convert to percentage format (93.33%) with two decimal places
4. WHEN the System calculates change percentages for PPO and VTI DPMO, THE System SHALL use the formula: (priorMonth - currentMonth) to show compliance improvement
5. WHEN the System displays PPO or VTI DPMO values, THE System SHALL maintain raw violation counts internally while showing percentage compliance to users

### Requirement 4

**User Story:** As a team leader, I want all tables to display two decimal places consistently, so that performance data is precise and standardized across all metrics.

#### Acceptance Criteria

1. WHEN the System displays percentage values in any table, THE System SHALL format numbers with exactly two decimal places (e.g., 93.33%, not 93.3%)
2. WHEN the System displays change values, THE System SHALL format numbers with exactly two decimal places including the +/- prefix
3. WHEN the System displays raw violation counts in PPO and VTI DPMO tables, THE System SHALL round to whole numbers (e.g., 0, 1, 2) in the Prior/Current Month columns
4. WHEN the System displays time-based metrics (TA Idle Time, Andon Response), THE System SHALL format numbers with two decimal places
5. WHEN the System displays compliance percentages converted from raw data, THE System SHALL use two decimal places (e.g., 0.9333 becomes 93.33%)

### Requirement 5

**User Story:** As a team leader, I want tables and podiums to automatically update with full employee names immediately, so that I don't see usernames or badge IDs instead of recognizable names.

#### Acceptance Criteria

1. WHEN the System loads performance data containing usernames or badge IDs, THE System SHALL immediately resolve these to full names from the employee management system
2. WHEN the System renders table rows, THE System SHALL display full names (e.g., "John Smith") instead of usernames (e.g., "johnsmit") or badge IDs
3. WHEN the System updates podium displays, THE System SHALL show full names without delay or placeholder text
4. WHEN the System cannot find a matching employee record, THE System SHALL display the original identifier (username or badge ID) as a fallback
5. WHEN new employee data is added to the employee management system, THE System SHALL automatically update all table and podium displays with the new full names

### Requirement 6

**User Story:** As a team leader, I want VTI Compliance table to have inline edit functionality like PPO and VTI DPMO tables, so that I can quickly correct data entry errors.

#### Acceptance Criteria

1. WHEN the System renders the VTI Compliance table, THE System SHALL display edit buttons (✏️) in the Prior Month and Current Month columns
2. WHEN a user clicks an edit button in VTI Compliance, THE System SHALL open a prompt showing the current percentage value
3. WHEN a user enters a new percentage value, THE System SHALL validate that the number is between 0 and 100
4. WHEN a user saves an edited value, THE System SHALL recalculate the change percentage and status
5. WHEN a user edits VTI Compliance data, THE System SHALL persist the changes to localStorage and update the podium display

### Requirement 7

**User Story:** As a team leader, I want the System to handle edge cases in status calculation, so that unusual data scenarios don't produce incorrect or confusing status labels.

#### Acceptance Criteria

1. WHEN both Prior Month and Current Month values are 0, THE System SHALL assign status as "Excellent" regardless of table type
2. WHEN Current Month value is 0 and Prior Month is greater than 0 for "lower is better" metrics, THE System SHALL assign status as "Excellent" with positive change indication
3. WHEN Current Month value is 100 and Prior Month is less than 100 for "higher is better" metrics, THE System SHALL assign status as "Excellent" with positive change indication
4. WHEN change value is between -0.1 and +0.1, THE System SHALL assign status as "Maintained" to avoid noise from insignificant fluctuations
5. IF a table has no benchmark configured (TA Idle Time), THEN THE System SHALL use simple change-based status logic instead of fair score calculations

### Requirement 8

**User Story:** As a team leader, I want the prototype override for renderTable to be managed correctly, so that custom table rendering doesn't conflict with leaderboard updates or other system features.

#### Acceptance Criteria

1. WHEN the System initializes, THE System SHALL store the original renderTable function before applying any overrides
2. WHEN edit files (ppo-edit.js, vti-dpmo-edit.js) apply custom renderTable functions, THE System SHALL check the tableId before executing custom logic
3. WHEN the leaderboard update system calls renderTable, THE System SHALL use the appropriate version (custom or original) based on the table type
4. WHEN multiple overrides are applied to the same prototype, THE System SHALL maintain a chain of overrides that preserves all functionality
5. WHEN the System detects a conflict between overrides, THE System SHALL log a warning to the console and use the most recently applied override
