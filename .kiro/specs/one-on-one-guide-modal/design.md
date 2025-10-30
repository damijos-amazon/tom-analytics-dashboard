# Design Document: 1:1 Thrives Modal

## Overview

The 1:1 Thrives Modal is an intelligent conversation assistant that helps managers conduct effective one-on-one meetings with their team members. The system analyzes employee benchmark performance data across six metrics and generates contextual questions aligned with Amazon's 16 Leadership Principles. The modal provides a structured conversation flow covering achievements, barriers, safety concerns, and development opportunities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    1:1 Thrives Modal UI                      │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ Achievements │   Barriers   │    Safety    │  Develop │ │
│  │     Tab      │     Tab      │     Tab      │   Tab    │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Question Generation Engine                      │
│  • Performance Analysis  • Context Matching                  │
│  • Question Selection    • Rotation Logic                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  • Employee Data (localStorage)                              │
│  • Benchmark Data (6 metrics)                                │
│  • Question Database (JSON)                                  │
│  • Conversation History (localStorage)                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

1. **Modal Container** - Full-screen overlay with Amazon branding
2. **Employee Selection Panel** - Dropdown with active employees only
3. **Performance Dashboard** - Visual display of 6 benchmark metrics
4. **Tabbed Interface** - Achievements, Barriers, Safety, Development, Leadership Principles
5. **Question Display** - Paginated question cards with context
6. **Notes Section** - Text areas for documenting conversation
7. **Action Items Tracker** - Checklist for follow-up items
8. **Navigation Controls** - Tab switching, pagination, progress indicators

## Components and Interfaces

### 1. Modal UI Component (`one-on-one-modal.html`)

**Purpose:** Main modal structure and layout

**Structure:**
- Full-screen modal overlay (z-index: 99999)
- Amazon-themed styling (colors: #232F3E, #FF9900, #FFD700)
- Responsive grid layout
- Close button with confirmation if notes exist

### 2. Question Database (`one-on-one-questions.js`)

**Purpose:** Comprehensive question library organized by context

**Structure:**
```javascript
const questionDatabase = {
  achievements: {
    ppo_compliance: [...],
    vti_dpmo: [...],
    vti_compliance: [...],
    ta_idle_time: [...],
    andon_response: [...],
    seal_validation: [...]
  },
  barriers: {
    ppo_compliance: [...],
    vti_dpmo: [...],
    // ... same structure
  },
  safety: {
    physical: [...],
    psychological: [...],
    procedural: [...]
  },
  development: {
    ppo_compliance: [...],
    // ... same structure
  },
  leadershipPrinciples: {
    customerObsession: [...],
    ownership: [...],
    inventAndSimplify: [...],
    // ... all 16 principles
  }
};
```

**Question Object Schema:**
```javascript
{
  id: "unique_id",
  text: "Question text",
  category: "achievements|barriers|safety|development",
  benchmark: "ppo_compliance|vti_dpmo|...",
  principles: ["Customer Obsession", "Deliver Results"],
  context: "strength|weakness|neutral",
  tags: ["recognition", "growth", "barrier"]
}
```

### 3. Core Logic Component (`one-on-one-guide.js`)

**Purpose:** Main application logic and state management

**Key Functions:**

```javascript
// Modal Management
function openOneOnOneModal()
function closeOneOnOneModal()
function confirmClose()

// Employee Management
function loadActiveEmployees()
function selectEmployee(employeeId)
function getEmployeeBenchmarkData(employeeId)

// Performance Analysis
function analyzeBenchmarkPerformance(benchmarkData)
function identifyTopStrengths(benchmarkData)
function identifyGrowthAreas(benchmarkData)
function calculatePerformanceIndicators(benchmarkData)

// Question Generation
function generateQuestionsForEmployee(employeeId, category)
function selectRelevantQuestions(category, context, benchmarkData)
function rotateQuestions(employeeId, questionPool)
function filterUsedQuestions(employeeId, questions)

// Tab Management
function switchTab(tabName)
function updateTabProgress(tabName, completed)
function getTabCompletionStatus()

// Pagination
function displayQuestionsPage(pageNumber)
function nextPage()
function previousPage()
function updatePaginationControls()

// Notes and Documentation
function saveConversationNotes(section, notes)
function documentAchievement(achievement)
function documentBarrier(barrier)
function documentSafetyRisk(risk)
function addActionItem(item)

// Session Management
function startConversationSession(employeeId)
function saveConversationSession()
function loadConversationHistory(employeeId)
function exportConversationNotes()

// Leadership Principles
function getQuestionsForPrinciple(principleName)
function trackPrincipleCoverage()
function displayPrincipleIndicator()
```

### 4. Data Access Layer (`one-on-one-data.js`)

**Purpose:** Handle all data persistence and retrieval

**Key Functions:**

```javascript
// Employee Data
function getActiveEmployees()
function getEmployeeById(id)
function getEmployeeBenchmarks(employeeId)

// Conversation History
function saveConversation(conversationData)
function getConversationHistory(employeeId)
function getLastConversation(employeeId)

// Question Tracking
function markQuestionAsUsed(employeeId, questionId)
function getUsedQuestions(employeeId)
function resetQuestionHistory(employeeId)

// Storage Keys
const STORAGE_KEYS = {
  conversations: 'oneOnOne_conversations',
  usedQuestions: 'oneOnOne_usedQuestions',
  sessionData: 'oneOnOne_currentSession'
};
```

## Data Models

### Employee Profile
```javascript
{
  id: "emp_123",
  site: "DFW7",
  badgeId: "12345",
  fullName: "John Doe",
  username: "jdoe",
  email: "jdoe@example.com",
  managerName: "Jane Smith",
  managerUsername: "jsmith",
  managerEmail: "jsmith@example.com",
  excludeFromTables: false,
  benchmarks: {
    ppo_compliance: { prior: 95, current: 98, change: 3 },
    vti_dpmo: { prior: 150, current: 100, change: -33.3 },
    vti_compliance: { prior: 92, current: 96, change: 4 },
    ta_idle_time: { prior: 6.5, current: 5.2, change: -20 },
    andon_response: { prior: 15, current: 12, change: -20 },
    seal_validation: { prior: 88, current: 94, change: 6 }
  }
}
```

### Conversation Session
```javascript
{
  id: "session_123",
  employeeId: "emp_123",
  employeeName: "John Doe",
  managerName: "Jane Smith",
  timestamp: "2025-10-29T10:30:00Z",
  duration: 45, // minutes
  sections: {
    achievements: {
      completed: true,
      notes: "Excellent improvement in VTI DPMO...",
      documented: [
        { type: "achievement", text: "Reduced DPMO by 33%", principle: "Deliver Results" }
      ]
    },
    barriers: {
      completed: true,
      notes: "Discussed workload challenges...",
      documented: [
        { type: "barrier", text: "Limited training time", impact: "medium" }
      ]
    },
    safety: {
      completed: true,
      notes: "No safety concerns raised",
      documented: []
    },
    development: {
      completed: true,
      notes: "Focus on PPO compliance improvement",
      documented: [
        { type: "suggestion", text: "Shadow top performer", timeline: "2 weeks" }
      ]
    }
  },
  actionItems: [
    { text: "Schedule PPO training", dueDate: "2025-11-05", completed: false },
    { text: "Follow up on workload", dueDate: "2025-11-01", completed: false }
  ],
  principlesCovered: ["Customer Obsession", "Deliver Results", "Learn and Be Curious"],
  questionsUsed: ["q_001", "q_045", "q_123"]
}
```

### Performance Analysis Result
```javascript
{
  employeeId: "emp_123",
  topStrengths: [
    { benchmark: "ppo_compliance", score: 98, improvement: 3, rank: 1 },
    { benchmark: "seal_validation", score: 94, improvement: 6, rank: 2 }
  ],
  growthAreas: [
    { benchmark: "vti_dpmo", score: 100, improvement: -33.3, rank: 1 },
    { benchmark: "andon_response", score: 12, improvement: -20, rank: 2 }
  ],
  overallPerformance: "excellent",
  improvementTrend: "positive",
  recommendedFocus: ["vti_dpmo", "andon_response"]
}
```

## User Interface Design

### Tab Structure

**1. Achievements Tab**
- Performance dashboard showing all 6 benchmarks with visual indicators
- Highlighted top 2 strengths
- 10 questions per page focused on recognition
- Text area for documenting achievements
- Leadership principles alignment badges

**2. Barriers Tab**
- Growth areas highlighted
- 10 questions per page focused on exploration
- Text area for documenting barriers
- Severity selector (low/medium/high)
- Action item quick-add

**3. Safety Tab**
- 10 questions per page covering physical, psychological, procedural safety
- Text area for safety concerns
- Priority flag (normal/high/critical)
- Escalation button

**4. Development Tab**
- Actionable suggestions based on growth areas
- 10 questions per page focused on improvement strategies
- Text area for development plans
- Timeline selector
- Resource links

**5. Leadership Principles Tab**
- Grid of 16 principles with coverage indicators
- Filter questions by principle
- 10 questions per page
- Principle-specific notes

### Visual Design Elements

**Color Scheme:**
- Primary: #232F3E (Amazon Dark Blue)
- Accent: #FF9900 (Amazon Orange)
- Highlight: #FFD700 (Gold)
- Success: #067D62 (Green)
- Warning: #D13212 (Red)

**Performance Indicators:**
- 🟢 Green: Strong performance (above benchmark)
- 🟡 Yellow: Average performance (at benchmark)
- 🔴 Red: Needs improvement (below benchmark)

**Progress Indicators:**
- Tab completion checkmarks
- Section progress bars
- Question pagination dots
- Principle coverage percentage

## Question Generation Algorithm

### Step 1: Analyze Performance
```javascript
function analyzeBenchmarkPerformance(benchmarkData) {
  const analysis = {
    strengths: [],
    weaknesses: [],
    neutral: []
  };
  
  for (const [benchmark, data] of Object.entries(benchmarkData)) {
    const score = calculateScore(data);
    if (score >= 90) analysis.strengths.push({ benchmark, score, data });
    else if (score < 70) analysis.weaknesses.push({ benchmark, score, data });
    else analysis.neutral.push({ benchmark, score, data });
  }
  
  // Sort by score and improvement
  analysis.strengths.sort((a, b) => b.score - a.score);
  analysis.weaknesses.sort((a, b) => a.score - b.score);
  
  return analysis;
}
```

### Step 2: Select Relevant Questions
```javascript
function selectRelevantQuestions(category, context, benchmarkData) {
  const relevantQuestions = [];
  
  // Get questions for top strengths/weaknesses
  const focusAreas = context === 'achievements' 
    ? benchmarkData.strengths.slice(0, 2)
    : benchmarkData.weaknesses.slice(0, 2);
  
  for (const area of focusAreas) {
    const questions = questionDatabase[category][area.benchmark];
    relevantQuestions.push(...questions);
  }
  
  return relevantQuestions;
}
```

### Step 3: Rotate and Filter
```javascript
function rotateQuestions(employeeId, questionPool) {
  const usedQuestions = getUsedQuestions(employeeId);
  
  // Filter out recently used questions
  const availableQuestions = questionPool.filter(q => 
    !usedQuestions.includes(q.id) || 
    usedQuestions.indexOf(q.id) < usedQuestions.length - 50
  );
  
  // Shuffle for variety
  return shuffleArray(availableQuestions);
}
```

## Error Handling

### Data Validation
- Validate employee selection before loading modal
- Check for benchmark data availability
- Handle missing or incomplete employee records
- Validate note length and format

### Error States
```javascript
const ERROR_MESSAGES = {
  NO_EMPLOYEES: "No active employees found. Please add employees first.",
  NO_BENCHMARK_DATA: "Benchmark data not available for this employee.",
  SAVE_FAILED: "Failed to save conversation. Please try again.",
  LOAD_FAILED: "Failed to load conversation history.",
  INVALID_EMPLOYEE: "Selected employee not found."
};
```

### Fallback Behavior
- If benchmark data unavailable, show general questions
- If no conversation history, start fresh session
- If save fails, cache data in sessionStorage
- If question database fails to load, use minimal question set

## Testing Strategy

### Unit Tests
- Question selection algorithm
- Performance analysis calculations
- Data persistence functions
- Question rotation logic

### Integration Tests
- Employee data retrieval
- Benchmark data integration
- Conversation save/load cycle
- Tab navigation flow

### User Acceptance Tests
- Complete 1:1 conversation flow
- Question variety across multiple sessions
- Note-taking and action item creation
- Export functionality
- Mobile responsiveness

### Performance Tests
- Modal load time < 1 second
- Question generation < 500ms
- Smooth pagination (60fps)
- Large conversation history handling

## Implementation Notes

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Edge, Safari)
- ES6+ JavaScript features
- LocalStorage API
- No external dependencies required

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- High contrast mode support

### Mobile Considerations
- Responsive design for tablets
- Touch-friendly controls
- Simplified layout for small screens
- Swipe gestures for pagination

### Performance Optimization
- Lazy load question database
- Virtual scrolling for long lists
- Debounced search input
- Cached performance calculations

## Integration Points

### Existing System Integration
- Uses `simpleEmployees` array from employee management system
- Accesses benchmark data from existing tables (tableBody, tableBody2, etc.)
- Integrates with navigation menu
- Shares localStorage namespace

### Data Sources
```javascript
// Employee data
const employees = window.simpleEmployees || [];

// Benchmark data extraction
function extractBenchmarkData(employeeName) {
  return {
    ppo_compliance: extractFromTable('tableBody5', employeeName),
    vti_dpmo: extractFromTable('tableBody2', employeeName),
    vti_compliance: extractFromTable('tableBody', employeeName),
    ta_idle_time: extractFromTable('tableBody3', employeeName),
    andon_response: extractFromTable('tableBody6', employeeName),
    seal_validation: extractFromTable('tableBody4', employeeName)
  };
}
```

## Security Considerations

### Data Privacy
- All data stored locally (no external transmission)
- No PII in question database
- Conversation notes encrypted in localStorage (optional)
- Clear data option for compliance

### Input Sanitization
- Sanitize all user input in notes
- Prevent XSS in dynamically generated content
- Validate file uploads (if export/import added)

## Future Enhancements

### Phase 2 Features
- AI-powered question suggestions based on conversation flow
- Integration with HR systems
- Email summary generation
- Calendar integration for scheduling follow-ups
- Team-wide analytics dashboard

### Phase 3 Features
- Voice-to-text for note-taking
- Multi-language support
- Custom question builder
- Conversation templates
- Mobile app version

## Deployment

### File Structure
```
demo/
├── one-on-one-modal.html          # Modal UI structure
├── one-on-one-guide.js            # Core logic
├── one-on-one-questions.js        # Question database
├── one-on-one-data.js             # Data layer
└── one-on-one-styles.css          # Custom styles (optional)
```

### Integration Steps
1. Add modal HTML to index.html
2. Include JavaScript files in correct order
3. Add navigation button to menu
4. Test with existing employee data
5. Verify benchmark data integration

### Rollout Plan
1. Internal testing with sample data
2. Pilot with 2-3 managers
3. Gather feedback and iterate
4. Full deployment to all managers
5. Training session and documentation
