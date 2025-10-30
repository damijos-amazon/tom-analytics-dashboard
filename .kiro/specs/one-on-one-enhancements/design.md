# 1:1 Conversation Builder - Complete Enhancement Design

## Overview

Transform the 1:1 Conversation Builder into a fully-featured, data-persistent coaching system with granular refresh capabilities, comprehensive save/export functionality, and seamless integration with the complete backup system. This system will serve as the foundation for a future PWA with MySQL backend.

## Architecture

### Component Structure
```
one-on-one-system/
├── one-on-one.js (core generation logic)
├── one-on-one-save.js (persistence layer)
├── one-on-one-refresh.js (NEW - granular refresh logic)
├── one-on-one-export.js (NEW - individual export/import)
└── one-on-one-ui.js (NEW - UI enhancements)
```

### Data Flow
```
User Input → Generate Guide → Display with Refresh Buttons → 
User Edits/Refreshes → Save to localStorage → 
Export Individual JSON or Include in Backup All
```

## Refresh Button Locations

### 1. Leadership Principles Section
**Location**: Next to "Coaching Questions:" text within each principle card
**Count**: 16 buttons (one per principle)
**Function**: `refreshPrincipleQuestions(principleId)`
**Behavior**: Regenerates only that principle's coaching questions

### 2. Communicating to Earn Trust Section
**Location**: Next to section heading
**Function**: `refreshSection('communicating-trust')`
**Behavior**: Regenerates trust-building questions

### 3. Understanding Team Trust Section
**Location**: Next to section heading
**Function**: `refreshSection('team-trust')`
**Behavior**: Regenerates team trust assessment questions

### 4. Delivering Effective Feedback - Key Principles
**Location**: Next to "Key Principles:" subheading
**Function**: `refreshFeedbackPrinciples()`
**Behavior**: Regenerates key principles list

### 5. Delivering Effective Feedback - Practical Tips
**Location**: Next to "Practical Tips:" subheading
**Function**: `refreshFeedbackTips()`
**Behavior**: Regenerates practical tips list

### 6. Conversation Starters
**Location**: Next to "🎯 Conversation Starters" heading
**Function**: `refreshSection('conversation-starters')`
**Behavior**: Regenerates opening conversation prompts

### 7. Celebrating Strengths
**Location**: Next to "🌟 Celebrating Strengths:" heading
**Function**: `refreshSection('strengths')`
**Behavior**: Regenerates strength-based questions

### 8. General Check-In
**Location**: Next to "💬 General Check-In:" heading
**Function**: `refreshSection('general-checkin')`
**Behavior**: Regenerates general wellness questions

### 9. Recognition Categories
**Locations**: Next to each category heading:
- Public Recognition
- Formal Recognition
- Personal Touch
- Leadership Opportunity
- Visibility

**Function**: `refreshRecognitionCategory(category)`
**Behavior**: Regenerates suggestions for that specific category

## Scroll Position Preservation

### Implementation
```javascript
function refreshSection(sectionType) {
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Perform refresh
    regenerateSection(sectionType);
    
    // Restore scroll position
    window.scrollTo(0, scrollY);
}
```

### Alternative: Smooth Scroll to Refreshed Section
```javascript
function refreshSection(sectionType) {
    const sectionElement = document.getElementById(`section-${sectionType}`);
    regenerateSection(sectionType);
    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
```

## Save Functionality

### Save Button Location
- **Position**: Bottom of conversation guide container
- **Style**: Prominent, Amazon-branded button
- **Text**: "💾 Save This Conversation"

### Data Structure
```javascript
{
  conversationId: "unique-id",
  employeeBadgeId: "badge123",
  employeeName: "John Doe",
  savedAt: "2025-01-27T10:30:00Z",
  lastModified: "2025-01-27T11:45:00Z",
  sections: {
    conversationStarters: [...],
    strengths: [...],
    concerns: [...],
    generalCheckin: [...],
    leadershipPrinciples: {
      principle1: { questions: [...], notes: "" },
      principle2: { questions: [...], notes: "" },
      // ... all 16 principles
    },
    recognition: {
      publicRecognition: [...],
      formalRecognition: [...],
      personalTouch: [...],
      leadershipOpportunity: [...],
      visibility: [...]
    },
    feedback: {
      keyPrinciples: [...],
      practicalTips: [...]
    },
    trust: {
      communicating: [...],
      teamTrust: [...]
    },
    actionItems: {
      leaderCommitments: "",
      employeeCommitments: "",
      followUpDate: ""
    },
    managerNotes: ""
  }
}
```

### Manager Input Fields
- Action Items (Leader Commitments) - editable textarea
- Action Items (Employee Commitments) - editable textarea
- Follow-up Date - date picker
- Manager Notes - large textarea at bottom

## Export/Import Individual Conversations

### Export Button
**Location**: Next to Save button at bottom
**Text**: "📤 Export This Conversation"
**Filename Format**: `1on1_[EmployeeName]_[Date].json`

### JSON Structure
```json
{
  "type": "one_on_one_conversation",
  "version": "1.0",
  "exportDate": "2025-01-27T10:30:00Z",
  "employee": {
    "badgeId": "badge123",
    "fullName": "John Doe",
    "username": "jdoe"
  },
  "conversation": {
    // Full conversation data structure from above
  }
}
```

### Import via Drag & Drop
**Target Area**: Main upload area on index.html
**Detection**: Check for `type: "one_on_one_conversation"`
**Behavior**: 
1. Validate JSON structure
2. Check if conversation exists for this employee
3. Prompt: "Update existing conversation or create new version?"
4. Save to localStorage
5. Show success message

## Integration with Export All

### Modified Export All Structure
```json
{
  "exportDate": "2025-01-27T10:30:00Z",
  "version": "2.0",
  "tables": { ... },
  "employees": { ... },
  "conversations": {
    "type": "one_on_one_conversations",
    "recordCount": 15,
    "data": {
      "badge123": { /* full conversation */ },
      "badge456": { /* full conversation */ },
      // ... all conversations
    }
  },
  "shoutOuts": { ... }
}
```

### Import All Behavior
1. Import tables
2. Import employees
3. Import conversations (merge with existing, don't overwrite newer versions)
4. Import shout outs
5. Show comprehensive summary

## Question Generation Pools

### Expanded Question Banks
Each section needs 20-30 questions to ensure variety:

**Coaching Questions per Principle**: 15 questions each × 16 principles = 240 questions
**Conversation Starters**: 20 options
**Celebrating Strengths**: 15 questions
**General Check-In**: 20 questions
**Recognition Suggestions**: 10 per category × 5 categories = 50 suggestions
**Feedback Principles**: 12 principles
**Feedback Tips**: 15 tips
**Trust Questions**: 15 per section × 2 sections = 30 questions

### Smart Rotation
- Track last 5 questions shown per section
- Avoid repeating until all questions in pool have been used
- Store rotation state in localStorage per employee

## UI Enhancements

### Refresh Button Style
```css
.refresh-btn-small {
    background: linear-gradient(145deg, #5dade2, #3498db);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    color: white;
    font-size: 14px;
    margin-left: 10px;
    transition: all 0.3s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.refresh-btn-small:hover {
    transform: rotate(180deg) scale(1.1);
    box-shadow: 0 4px 10px rgba(52, 152, 219, 0.4);
}

.refresh-btn-small:active {
    transform: rotate(180deg) scale(0.95);
}
```

### Save Button Style
```css
.save-conversation-btn {
    background: linear-gradient(135deg, #067D62, #00A86B);
    color: white;
    border: none;
    padding: 15px 40px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(6, 125, 98, 0.3);
    transition: all 0.3s;
    margin: 20px 10px;
}

.save-conversation-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(6, 125, 98, 0.4);
}
```

## PWA & MySQL Migration Path

### Current State (localStorage)
```
localStorage
├── tom_one_on_one_conversations
├── simpleEmployeeData
├── tom_analytics_data (tables 1-6)
└── tom_leaderboard_data
```

### Future State (MySQL)
```sql
-- Conversations Table
CREATE TABLE conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id VARCHAR(255) UNIQUE,
    employee_badge_id VARCHAR(50),
    employee_name VARCHAR(255),
    created_at TIMESTAMP,
    last_modified TIMESTAMP,
    conversation_data JSON,
    manager_id VARCHAR(50),
    FOREIGN KEY (employee_badge_id) REFERENCES employees(badge_id)
);

-- Conversation History Table
CREATE TABLE conversation_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id VARCHAR(255),
    version INT,
    saved_at TIMESTAMP,
    conversation_snapshot JSON,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
);
```

### Migration Strategy
1. Export all localStorage data to JSON
2. Create MySQL schema
3. Build API endpoints (Node.js/Express or PHP)
4. Implement sync logic (localStorage ↔ MySQL)
5. Add offline-first PWA capabilities
6. Deploy to GitHub Pages + backend server

## Testing Checklist

- [ ] All 16 Leadership Principle refresh buttons work
- [ ] Each recognition category refreshes independently
- [ ] Scroll position maintained on refresh
- [ ] Save button persists all data
- [ ] Export creates valid JSON
- [ ] Import via drag & drop works
- [ ] Export All includes conversations
- [ ] Import All restores conversations
- [ ] No duplicate conversations on import
- [ ] Manager input fields save correctly
- [ ] Question rotation avoids repeats
- [ ] Performance with 50+ saved conversations

## Implementation Priority

### Phase 1 (MVP - Show Boss)
1. Add refresh buttons to all sections
2. Implement scroll position preservation
3. Add save button with basic persistence
4. Test with 2-3 employees

### Phase 2 (Full Feature)
1. Individual export/import
2. Expand question pools
3. Smart question rotation
4. Manager input fields
5. Integration with Export All

### Phase 3 (Production Ready)
1. Comprehensive testing
2. Error handling
3. Data validation
4. Performance optimization
5. Documentation

### Phase 4 (PWA Migration)
1. MySQL schema
2. API development
3. Sync logic
4. Offline capabilities
5. GitHub deployment

---

**This is going to be BADASS! 🔥**
