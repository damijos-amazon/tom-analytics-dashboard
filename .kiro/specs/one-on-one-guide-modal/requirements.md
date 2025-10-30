# Requirements Document

## Introduction

The 1:1 Guide Modal is an intelligent conversation assistant that helps managers conduct more effective one-on-one meetings with their team members. The system analyzes employee benchmark performance data and generates thoughtful, contextual questions aligned with leadership principles. The modal guides managers through recognition of achievements, identification of barriers, safety concerns, and development opportunities, making 1:1 conversations more productive and meaningful.

## Glossary

- **Modal System**: The interactive user interface component that displays the 1:1 conversation guide
- **Benchmark Data**: The six performance metrics tracked for each employee (PPO Compliance, VTI DPMO, VTI Compliance, TA Idle Time, Andon Response Time, and Invalid Seal Compliance)
- **PPO Compliance**: Process Path Observation compliance measuring adherence to safety procedures and standard work across multiple categories including trailer door operations, coupling/decoupling, driving/steering, seal cutting, visual inspections, pre/post-trips, yard behaviors, and ascending/descending procedures
- **VTI DPMO**: Visual Trailer Inspection Defects Per Million Opportunities, measuring the rate at which a Transportation Associate misses trailer defects during inspections that are later identified by other team members or third-party drivers, with a goal of 100% compliance (zero missed defects)
- **VTI Compliance**: Compliance with properly documenting Visual Trailer Inspection results in the Relay App on TOMY iPhones, including logging defects found or marking trailers as healthy, with non-compliance occurring when associates forget to log, experience WiFi connectivity issues preventing entry recording, or fail to follow documentation procedures
- **TA Idle Time**: Transportation Associate idle time measured as the time between trailer moves, calculated as either (start time - create time) or (start time - previous complete time), with valid idle time ranging from 0 to 40 minutes
- **Andon Response Time**: The time it takes for Transportation Associates to respond to Andons pulled in the system, with a network average of 14.91 minutes and a target goal of 7 minutes (8 minutes for sites with Outbound Dock Automation), measured from when the Andon is pulled to when it is accepted and resolved
- **Invalid Seal Compliance**: Compliance with proper seal verification procedures, measuring instances when associates identify incorrect seal numbers but proceed with the process without escalating to a manager for assistance, resulting in flags for not following proper protocol
- **Andon**: A signal or alert in the system that requires Transportation Associate response and resolution before hostler moves can be accepted
- **Relay App**: The mobile application on TOMY iPhones used by Transportation Associates to document trailer inspection results
- **STU**: Seek to Understand conversation conducted when investigating performance issues or violations
- **Leadership Principles**: The 16 core principles used to guide leadership behaviors and decisions
- **Question Database**: The collection of contextual questions organized by benchmark performance and principle alignment
- **Employee Profile**: The complete performance and historical data for a specific team member
- **Excluded Employee**: An employee marked as excluded from performance tables and reporting
- **Active Employee**: An employee who is not excluded and participates in performance tracking
- **Manager Profile**: The manager information including full name, email, and username associated with employees
- **Conversation Session**: A single 1:1 meeting interaction tracked within the system
- **Achievement Recognition**: Documented positive performance or milestone reached by an employee
- **Barrier**: An obstacle or challenge preventing an employee from optimal performance
- **Safety Risk**: Any concern related to workplace safety that requires attention
- **Development Suggestion**: Actionable recommendations to help an employee improve performance

## Requirements

### Requirement 1

**User Story:** As a manager, I want to select an employee and view their benchmark performance data, so that I can prepare for a meaningful 1:1 conversation based on their actual metrics.

#### Acceptance Criteria

1. WHEN the manager opens the Modal System, THE Modal System SHALL display a list of only Active Employees associated with the Manager Profile
2. THE Modal System SHALL exclude all Excluded Employees from the employee selection list
3. THE Modal System SHALL retrieve employee associations using the manager's full name, email, and username from the Manager Profile
4. WHEN the manager selects a team member, THE Modal System SHALL retrieve and display the Employee Profile including all six Benchmark Data metrics
3. THE Modal System SHALL display visual indicators for each benchmark showing whether performance is strong, average, or needs improvement
4. WHEN Benchmark Data is displayed, THE Modal System SHALL highlight the top two strengths and top two areas needing growth
5. IF Benchmark Data cannot be retrieved, THEN THE Modal System SHALL display an error message and allow the manager to proceed with general questions

### Requirement 2

**User Story:** As a manager, I want to see contextual questions based on my employee's benchmark strengths, so that I can recognize their achievements and reinforce positive behaviors.

#### Acceptance Criteria

1. WHEN an employee has strong Benchmark Data in any metric, THE Question Database SHALL provide recognition-focused questions for that benchmark
2. THE Modal System SHALL display at least three achievement recognition questions aligned with the employee's top performing benchmarks
3. WHEN a recognition question is displayed, THE Modal System SHALL indicate which Leadership Principles align with that strength
4. THE Modal System SHALL allow the manager to mark achievements as documented for future reference
5. WHERE an employee has multiple strong benchmarks, THE Question Database SHALL prioritize questions that connect multiple strengths

### Requirement 3

**User Story:** As a manager, I want to receive thoughtful questions about areas where my employee is struggling, so that I can understand their barriers and provide meaningful support.

#### Acceptance Criteria

1. WHEN an employee has below-average Benchmark Data in any metric, THE Question Database SHALL provide barrier-exploration questions for that benchmark
2. THE Modal System SHALL display at least three questions designed to uncover obstacles and challenges
3. THE Modal System SHALL provide a text area for the manager to document identified Barriers
4. WHEN barrier questions are displayed, THE Modal System SHALL suggest which Leadership Principles can guide the conversation
5. THE Question Database SHALL include questions that explore both work-related and personal barriers affecting performance

### Requirement 4

**User Story:** As a manager, I want to address safety concerns during 1:1 meetings, so that I can ensure my team members feel safe and supported in their work environment.

#### Acceptance Criteria

1. THE Modal System SHALL include a dedicated safety section with questions about workplace Safety Risks
2. THE Modal System SHALL provide at least five safety-focused questions covering physical, mental, and procedural safety
3. WHEN a manager documents a Safety Risk, THE Modal System SHALL mark it with high priority for follow-up
4. THE Modal System SHALL allow the manager to escalate safety concerns directly from the modal
5. THE Question Database SHALL include questions about psychological safety and team dynamics

### Requirement 5

**User Story:** As a manager, I want to receive actionable development suggestions based on benchmark performance, so that I can provide specific guidance to help my team member improve.

#### Acceptance Criteria

1. WHEN an employee has areas needing improvement, THE Modal System SHALL generate Development Suggestions specific to those benchmarks
2. THE Modal System SHALL provide at least three actionable suggestions for each area of growth
3. WHEN displaying Development Suggestions, THE Modal System SHALL align recommendations with relevant Leadership Principles
4. THE Modal System SHALL allow the manager to select and save specific suggestions to discuss with the employee
5. THE Question Database SHALL include questions that help the employee identify their own improvement strategies

### Requirement 6

**User Story:** As a manager, I want to save notes and action items from my 1:1 conversation, so that I can track progress over time and follow up on commitments.

#### Acceptance Criteria

1. THE Modal System SHALL provide text areas for documenting conversation notes throughout each section
2. WHEN the manager completes a Conversation Session, THE Modal System SHALL save all notes, documented achievements, barriers, and action items
3. THE Modal System SHALL associate each Conversation Session with the specific employee and timestamp
4. WHEN viewing an Employee Profile, THE Modal System SHALL display a history of previous Conversation Sessions
5. THE Modal System SHALL allow the manager to export conversation notes and action items

### Requirement 7

**User Story:** As a manager, I want the modal to guide me through a structured conversation flow, so that I don't miss important topics and can conduct 1:1s more efficiently.

#### Acceptance Criteria

1. THE Modal System SHALL organize questions into logical sections: achievements, barriers, safety, and development
2. THE Modal System SHALL provide navigation controls to move between sections
3. THE Modal System SHALL display progress indicators showing which sections have been completed
4. WHERE the manager has limited time, THE Modal System SHALL allow skipping to priority sections based on Benchmark Data
5. THE Modal System SHALL provide a summary view of all documented items before saving the Conversation Session

### Requirement 8

**User Story:** As a manager, I want questions aligned with the 16 Leadership Principles, so that I can develop my team members in alignment with organizational values.

#### Acceptance Criteria

1. THE Question Database SHALL tag each question with one or more relevant Leadership Principles
2. THE Modal System SHALL display which Leadership Principles are being addressed in each section
3. WHERE an employee needs development in a specific principle, THE Modal System SHALL prioritize questions aligned with that principle
4. THE Modal System SHALL provide a principle coverage indicator showing which of the 16 principles have been discussed
5. THE Modal System SHALL allow filtering questions by specific Leadership Principles

### Requirement 9

**User Story:** As a manager, I want access to a comprehensive database of hundreds of specific questions, so that I have diverse and meaningful conversation starters for every situation.

#### Acceptance Criteria

1. THE Question Database SHALL contain at least 100 questions for each of the six Benchmark Data categories
2. THE Question Database SHALL organize questions by context: recognition for strengths, exploration for areas needing improvement, and development for growth
3. THE Question Database SHALL include at least 50 safety-focused questions covering physical safety, psychological safety, and procedural safety
4. THE Question Database SHALL map questions to specific Leadership Principles with at least 30 questions per principle
5. THE Modal System SHALL randomly select from relevant questions to provide variety across multiple Conversation Sessions with the same employee
6. THE Question Database SHALL include questions that address common barriers such as workload, resources, training gaps, and interpersonal challenges
7. WHERE an employee has a specific benchmark strength or weakness, THE Modal System SHALL prioritize the most relevant questions from the database

### Requirement 10

**User Story:** As a manager, I want the modal to use tabs and pagination to organize hundreds of questions, so that I see different questions each time and the interface remains manageable.

#### Acceptance Criteria

1. THE Modal System SHALL organize content using tabs for major categories: Achievements, Barriers, Safety, Development, and Leadership Principles
2. THE Modal System SHALL implement pagination within each tab to display questions in manageable sets
3. THE Modal System SHALL display no more than 10 questions per page to maintain readability
4. WHEN the manager opens the Modal System for the same employee multiple times, THE Modal System SHALL rotate which questions are displayed first
5. THE Modal System SHALL track which questions have been used in previous Conversation Sessions and deprioritize showing the same questions repeatedly
6. THE Modal System SHALL provide navigation controls to move between pages and tabs
7. WHERE a manager wants to see more questions, THE Modal System SHALL allow loading additional pages within each tab
