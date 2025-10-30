# Implementation Plan: 1:1 Thrives Modal

- [x] 1. Create question database with comprehensive question library


  - Create `demo/one-on-one-questions.js` file with question database structure
  - Add 100+ questions for each of the 6 benchmark categories (PPO Compliance, VTI DPMO, VTI Compliance, TA Idle Time, Andon Response, Seal Validation)
  - Organize questions by context: achievements (recognition), barriers (exploration), development (growth)
  - Add 50+ safety questions covering physical safety, psychological safety, and procedural safety
  - Map questions to Amazon's 16 Leadership Principles with at least 30 questions per principle
  - Tag each question with metadata: id, text, category, benchmark, principles, context, tags
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_





- [ ] 2. Build data access layer for employee and conversation management
  - Create `demo/one-on-one-data.js` file with data persistence functions
  - Implement `getActiveEmployees()` to filter non-excluded employees from `window.simpleEmployees`
  - Implement `getEmployeeBenchmarks()` to extract benchmark data from existing tables
  - Create conversation history storage using localStorage with key `oneOnOne_conversations`

  - Implement `saveConversation()` and `getConversationHistory()` functions


  - Create question tracking system to mark questions as used and filter them in future sessions
  - Add storage functions for session data, used questions, and action items
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3, 6.4_

- [x] 3. Implement performance analysis engine

  - Create `demo/one-on-one-guide.js` file with core application logic
  - Implement `analyzeBenchmarkPerformance()` to evaluate all 6 benchmark metrics

  - Create `identifyTopStrengths()` to find top 2 performing benchmarks
  - Create `identifyGrowthAreas()` to find top 2 areas needing improvement
  - Implement visual indicator logic (green for strong, yellow for average, red for needs improvement)
  - Calculate performance scores and improvement percentages
  - _Requirements: 1.4, 1.5, 2.5, 3.1_


- [ ] 4. Build question generation and rotation system
  - Implement `generateQuestionsForEmployee()` to select contextual questions based on performance


  - Create `selectRelevantQuestions()` to match questions to employee's strengths and weaknesses
  - Implement `rotateQuestions()` to provide variety across multiple conversation sessions
  - Create `filterUsedQuestions()` to deprioritize recently used questions
  - Implement random selection within relevant question pools
  - Add logic to prioritize questions for top 2 strengths and top 2 growth areas
  - _Requirements: 2.1, 2.5, 3.1, 5.1, 9.5, 10.4, 10.5_


- [ ] 5. Create modal HTML structure with tabbed interface
  - Create `demo/one-on-one-modal.html` file with full modal structure
  - Build full-screen modal overlay with Amazon branding (colors: #232F3E, #FF9900, #FFD700)
  - Add employee selection dropdown that populates with active employees only
  - Create performance dashboard section displaying all 6 benchmark metrics with visual indicators

  - Build tabbed interface with 5 tabs: Achievements, Barriers, Safety, Development, Leadership Principles
  - Add pagination controls (Previous/Next buttons, page indicators)

  - Create notes text areas for each section
  - Add action items tracker with checkboxes
  - Include close button with confirmation dialog
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 10.1, 10.6_

- [ ] 6. Implement tab management and navigation system
  - Create `switchTab()` function to handle tab switching


  - Implement tab progress tracking with completion indicators
  - Add visual feedback for completed sections (checkmarks)
  - Create `getTabCompletionStatus()` to track which sections are done
  - Implement navigation controls to move between tabs
  - Add keyboard shortcuts for tab navigation
  - Display progress bar showing overall conversation completion
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.2_



- [ ] 7. Build pagination system for question display
  - Implement `displayQuestionsPage()` to show 10 questions per page
  - Create `nextPage()` and `previousPage()` navigation functions
  - Add page number indicators (e.g., "Page 1 of 5")
  - Implement pagination controls with enabled/disabled states
  - Add smooth transitions between pages
  - Track current page per tab
  - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7_



- [ ] 8. Implement notes and documentation system
  - Create text areas for documenting conversation notes in each section
  - Implement `documentAchievement()` to save recognized achievements
  - Implement `documentBarrier()` to save identified barriers
  - Implement `documentSafetyRisk()` to save safety concerns with priority flags
  - Create `addActionItem()` to add follow-up tasks with due dates
  - Add auto-save functionality (save every 30 seconds)

  - Implement character count and validation for notes
  - _Requirements: 6.1, 6.2, 2.4, 3.3, 4.3, 5.4_


- [ ] 9. Build conversation session management
  - Implement `startConversationSession()` to initialize new session with timestamp
  - Create `saveConversationSession()` to persist complete conversation data

  - Implement `loadConversationHistory()` to display previous conversations
  - Add session duration tracking

  - Create conversation summary view before saving
  - Implement `exportConversationNotes()` to download notes as text/JSON
  - Add confirmation dialog before closing with unsaved changes
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.5_

- [ ] 10. Implement Leadership Principles integration
  - Display Leadership Principle badges on each question card

  - Create principle coverage tracker showing which of 16 principles have been discussed
  - Implement `getQuestionsForPrinciple()` to filter questions by specific principle
  - Add principle filter dropdown in Leadership Principles tab
  - Display principle coverage percentage indicator
  - Highlight principles that need more coverage
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Integrate with existing employee management system
  - Connect to `window.simpleEmployees` array for employee data
  - Filter out employees with `excludeFromTables: true`


  - Extract manager information (name, username, email) from employee records
  - Implement employee search/filter in dropdown
  - Handle case when no active employees exist
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 12. Integrate with existing benchmark data tables
  - Create `extractBenchmarkData()` to pull data from existing table bodies
  - Extract PPO Compliance data from `tableBody5`

  - Extract VTI DPMO data from `tableBody2`
  - Extract VTI Compliance data from `tableBody`
  - Extract TA Idle Time data from `tableBody3`
  - Extract Andon Response data from `tableBody6`


  - Extract Seal Validation data from `tableBody4`
  - Handle missing or incomplete benchmark data gracefully
  - _Requirements: 1.4, 1.5_

- [x] 13. Add modal to navigation menu

  - Add "1:1 Thrives" button to navigation panel in `demo/index.html`
  - Style button with distinctive color scheme (e.g., purple gradient)





  - Add icon (e.g., 💬 or 🤝)
  - Create `openOneOnOneModal()` function to launch modal
  - Position button logically in navigation (after Shout Outs, before Employee Management)

  - _Requirements: All_

- [ ] 14. Implement error handling and validation
  - Add validation for employee selection (must select employee before proceeding)
  - Handle missing benchmark data with fallback to general questions
  - Implement error messages for save failures
  - Add try-catch blocks around localStorage operations
  - Create fallback to sessionStorage if localStorage fails
  - Display user-friendly error messages


  - Add loading states for data operations
  - _Requirements: 1.5, 6.2_

- [ ] 15. Add responsive design and mobile support
  - Make modal responsive for tablet and desktop screens
  - Adjust layout for smaller screens (stack sections vertically)
  - Make touch-friendly controls (larger buttons, swipe gestures)
  - Test on different screen sizes
  - Ensure text remains readable on all devices
  - _Requirements: All_

- [ ] 16. Inject modal HTML into index.html and wire up JavaScript
  - Add script tag to load `one-on-one-questions.js` in `demo/index.html`
  - Add script tag to load `one-on-one-data.js`
  - Add script tag to load `one-on-one-guide.js`
  - Inject modal HTML into page (either inline or via JavaScript)
  - Verify all functions are accessible globally
  - Test modal open/close functionality
  - Verify integration with existing navigation
  - _Requirements: All_

- [ ] 17. Test complete user flow end-to-end
  - Test opening modal from navigation
  - Test selecting employee and loading benchmark data
  - Test navigating through all tabs
  - Test pagination within each tab
  - Test documenting notes and action items
  - Test saving conversation session
  - Test loading conversation history
  - Test exporting conversation notes
  - Test closing modal with and without unsaved changes
  - Verify question rotation across multiple sessions
  - _Requirements: All_
