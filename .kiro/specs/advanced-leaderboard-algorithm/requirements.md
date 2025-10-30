# Requirements Document

## Introduction

This feature implements an advanced leaderboard algorithm that calculates the most improved associate while giving consistently compliant associates a fair chance at employee of the month recognition. The algorithm applies to all individual compliance tables (VTI Compliance, VTI DPMO, TA Idle Time, Seal Validation, PPO Compliance, and Andon Response Time) and aggregates results into a unified leaderboard that ranks associates across all metrics.

## Glossary

- **System**: The TOM Analytics Dashboard leaderboard calculation engine
- **Associate**: An employee whose performance is tracked across compliance metrics
- **Compliance Metric**: A measurable performance indicator (VTI Compliance, VTI DPMO, TA Idle Time, Seal Validation, PPO Compliance, Andon Response Time)
- **Benchmark**: The target performance threshold for a specific metric
- **Fair Score**: A calculated value that balances current performance, improvement, and consistency
- **Leaderboard**: The unified ranking of all associates across all compliance metrics
- **Excellence Score**: A weighted score component rewarding sustained high performance
- **Improvement Score**: A weighted score component rewarding positive performance changes
- **Consistency Bonus**: Additional points awarded for maintaining compliant performance

## Requirements

### Requirement 1: Individual Table Scoring

**User Story:** As a team manager, I want each compliance table to calculate fair scores for associates, so that both improving and consistently compliant associates have equal opportunity for recognition.

#### Acceptance Criteria

1. WHEN an associate's performance data is loaded into a compliance table, THE System SHALL calculate a fair score based on current performance, improvement trajectory, and benchmark compliance.

2. WHEN an associate meets or exceeds the benchmark threshold, THE System SHALL award a base excellence score of at least 800 points.

3. WHEN an associate shows improvement while already compliant, THE System SHALL apply a 300-point multiplier to the improvement magnitude.

4. WHEN an associate shows improvement while non-compliant, THE System SHALL apply a 400-point multiplier to the improvement magnitude to enable competitive ranking.

5. WHEN an associate maintains consistent compliant performance with zero change, THE System SHALL award a 100-point consistency bonus.

### Requirement 2: Direction-Aware Scoring

**User Story:** As a team manager, I want the algorithm to understand whether higher or lower values are better for each metric, so that scoring is accurate across different compliance types.

#### Acceptance Criteria

1. WHERE a metric uses "lower is better" logic (TA Idle Time, VTI DPMO, PPO Compliance, Andon Response Time), THE System SHALL award higher scores for lower values and negative changes.

2. WHERE a metric uses "higher is better" logic (VTI Compliance, Seal Validation), THE System SHALL award higher scores for higher values and positive changes.

3. WHEN calculating improvement for "lower is better" metrics, THE System SHALL treat negative changes as positive improvements.

4. WHEN calculating improvement for "higher is better" metrics, THE System SHALL treat positive changes as positive improvements.

### Requirement 3: Excellence Multiplier

**User Story:** As a team manager, I want exceptional performers to receive additional recognition, so that sustained excellence is rewarded beyond basic compliance.

#### Acceptance Criteria

1. WHEN an associate performs 20 percent below benchmark for "lower is better" metrics, THE System SHALL apply a 1.2 excellence multiplier to their fair score.

2. WHEN an associate performs 5 percent above benchmark for "higher is better" metrics, THE System SHALL apply a 1.2 excellence multiplier to their fair score.

3. WHEN calculating the excellence multiplier, THE System SHALL apply it after all other score components are calculated.

### Requirement 4: Penalty System for Declining Performance

**User Story:** As a team manager, I want declining performance to be penalized appropriately, so that associates are incentivized to maintain or improve their metrics.

#### Acceptance Criteria

1. WHEN a compliant associate shows declining performance, THE System SHALL apply a 200-point penalty multiplier to the decline magnitude.

2. WHEN a non-compliant associate shows declining performance, THE System SHALL apply a 300-point penalty multiplier to the decline magnitude.

3. WHEN an associate's performance declines below the benchmark threshold, THE System SHALL reduce their base score proportionally to their distance from the benchmark.

### Requirement 5: Unified Leaderboard Aggregation

**User Story:** As a team manager, I want a unified leaderboard that ranks associates across all compliance metrics, so that I can identify the overall employee of the month candidate.

#### Acceptance Criteria

1. WHEN all compliance tables have calculated fair scores, THE System SHALL aggregate scores across all metrics for each associate.

2. WHEN aggregating scores, THE System SHALL weight each metric equally unless custom weights are configured.

3. WHEN an associate appears in multiple compliance tables, THE System SHALL sum their fair scores from all tables.

4. WHEN an associate appears in only some compliance tables, THE System SHALL calculate their leaderboard score using only the tables where they have data.

5. WHEN calculating the unified leaderboard ranking, THE System SHALL sort associates by their aggregated fair score in descending order.

### Requirement 6: Status Assignment Based on Ranking

**User Story:** As a team manager, I want associates to receive status labels based on their leaderboard ranking, so that performance tiers are clearly communicated.

#### Acceptance Criteria

1. WHEN the leaderboard is calculated, THE System SHALL assign "Excellent" status to associates in the top 25 percent of rankings.

2. WHEN the leaderboard is calculated, THE System SHALL assign "Improved" status to associates in the 26th to 50th percentile of rankings.

3. WHEN the leaderboard is calculated, THE System SHALL assign "Maintained" status to associates in the 51st to 75th percentile of rankings.

4. WHEN the leaderboard is calculated, THE System SHALL assign "Decreased" status to associates in the bottom 25 percent of rankings.

### Requirement 7: Benchmark Configuration

**User Story:** As a team manager, I want to configure benchmark thresholds for each compliance metric, so that scoring reflects current operational standards.

#### Acceptance Criteria

1. THE System SHALL allow benchmark values to be configured for each compliance table independently.

2. THE System SHALL persist benchmark configurations in local storage for session continuity.

3. WHEN a benchmark is not configured for a table, THE System SHALL use a default benchmark value appropriate for that metric type.

4. WHEN a benchmark is updated, THE System SHALL recalculate all fair scores and rankings immediately.

### Requirement 8: Excluded Employee Filtering

**User Story:** As a team manager, I want excluded employees to be filtered from leaderboard calculations, so that only active team members are ranked.

#### Acceptance Criteria

1. WHEN calculating fair scores, THE System SHALL exclude associates marked as excluded in the employee management system.

2. WHEN aggregating leaderboard scores, THE System SHALL exclude associates marked as excluded in the employee management system.

3. WHEN rendering leaderboard rankings, THE System SHALL exclude associates marked as excluded in the employee management system.

### Requirement 9: Score Transparency and Debugging

**User Story:** As a system administrator, I want detailed logging of score calculations, so that I can verify algorithm accuracy and troubleshoot issues.

#### Acceptance Criteria

1. WHEN calculating a fair score, THE System SHALL log the associate name, current value, benchmark, calculated score, and status to the console.

2. WHEN sorting associates by fair score, THE System SHALL log the comparison details for each pair of associates.

3. WHEN aggregating leaderboard scores, THE System SHALL log the individual table scores and final aggregated score for each associate.

### Requirement 10: Individual Table Ranking Display

**User Story:** As a team manager, I want each of the 6 compliance tables to display rankings based on the fair score algorithm, so that I can see who is performing best in each specific metric.

#### Acceptance Criteria

1. WHEN fair scores are calculated for VTI Compliance table, THE System SHALL sort and display associates by their fair score in descending order.

2. WHEN fair scores are calculated for VTI DPMO table, THE System SHALL sort and display associates by their fair score in descending order.

3. WHEN fair scores are calculated for TA Idle Time table, THE System SHALL sort and display associates by their fair score in descending order.

4. WHEN fair scores are calculated for Seal Validation table, THE System SHALL sort and display associates by their fair score in descending order.

5. WHEN fair scores are calculated for PPO Compliance table, THE System SHALL sort and display associates by their fair score in descending order.

6. WHEN fair scores are calculated for Andon Response Time table, THE System SHALL sort and display associates by their fair score in descending order.

7. WHEN displaying table rankings, THE System SHALL show rank number, associate name, prior month value, current month value, change percentage, and status for each associate.

### Requirement 11: Podium Display Integration

**User Story:** As a team manager, I want the top 3 associates from each table and the unified leaderboard to be displayed on podiums, so that recognition is visually prominent.

#### Acceptance Criteria

1. WHEN fair scores are calculated for a table, THE System SHALL update the table's podium display with the top 3 ranked associates.

2. WHEN the unified leaderboard is calculated, THE System SHALL update the main podium display with the top 3 overall associates.

3. WHEN displaying associates on the podium, THE System SHALL show their first name, fair score, and status badge.

4. WHEN an associate has a photo in the employee management system, THE System SHALL display their photo in the podium avatar circle.

5. WHEN updating any of the 6 individual table podiums, THE System SHALL reflect the fair score rankings specific to that table.

6. WHEN updating the unified leaderboard podium, THE System SHALL reflect the aggregated fair scores across all 6 tables.
