# Design Document

## Overview

The Achievement Certificate Generator will be enhanced to support landscape-oriented certificates with award-specific logos and DOTM-specific verbiage that references the five performance metrics. The system will maintain the existing modal interface while updating the certificate layout, logo management, and verbiage generation logic.

## Architecture

### Component Structure
- **Certificate Modal UI** - Existing modal interface (no changes needed)
- **Certificate Layout Engine** - Updated to render landscape format (11" x 8.5")
- **Logo Management System** - New component to handle award-specific logo rendering
- **Verbiage Generator** - Enhanced to include DOTM metrics and weighted performance criteria
- **Print/Export System** - Updated to maintain landscape orientation

### File Structure
```
demo/
├── certificate-generator-v2.js (main implementation)
├── certificate-modal.html (modal structure)
├── logos/
│   ├── driver-of-month.png (DOTM logo)
│   ├── employee-of-month.png (EOTM logo)
│   └── driver-star.png (Driver Star logo)
```

## Components and Interfaces

### 1. Certificate Layout Component

**Landscape Format Specifications:**
- Dimensions: 11" width x 8.5" height
- CSS class: `.certificate-container-v2`
- Print media query: `@page { size: landscape; }`

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│  [Award-Specific Logo]                          │
│                                                 │
│         CERTIFICATE OF ACHIEVEMENT              │
│                                                 │
│              [Award Title]                      │
│                                                 │
│         Presented to: [Employee Name]           │
│                                                 │
│  [Personalized Verbiage with LP & Metrics]      │
│                                                 │
│              [Month Year]                       │
│                                                 │
│  [Signature Lines]                              │
└─────────────────────────────────────────────────┘
```

### 2. Logo Management System

**Logo Configuration Object:**
```javascript
const AWARD_LOGOS = {
    driver: 'logos/driver-of-month.png',
    employee: 'logos/employee-of-month.png',
    driverstar: 'logos/driver-star.png'
};
```

**Logo Rendering:**
- Position: Top center of certificate
- Max height: 120px
- Maintain aspect ratio
- High-resolution rendering for print quality

### 3. Enhanced Verbiage Generator

**DOTM-Specific Verbiage Structure:**

For Driver of the Month awards, the verbiage generator will:
1. Reference the five DOTM performance metrics
2. Emphasize SmartDrive Safety Score (50% weight) prominently
3. Acknowledge on-time performance and acceptance rate (20% each)
4. Mention app usage and disruption management (5% each)
5. Integrate 3-4 Amazon Leadership Principles
6. Create enthusiastic, reward-focused language

**Verbiage Template Pattern:**
```
[Name] has earned the prestigious Driver of the Month award through 
exceptional performance across all key metrics. Your outstanding 
[SmartDrive Safety Score emphasis] demonstrates unwavering commitment 
to safety excellence. Combined with your remarkable [on-time performance] 
and [acceptance rate], you've set the gold standard for our team. 
Your consistent [app usage] and minimal [disruptions] showcase your 
dedication to operational excellence. Through [Leadership Principle 1], 
[Leadership Principle 2], and [Leadership Principle 3], you embody 
what it means to be a world-class Amazon driver.
```

**Metric-Specific Phrases:**
- SmartDrive Safety: "exceptional safety record", "unwavering commitment to safe driving", "exemplary safety performance"
- On-time Performance: "punctuality excellence", "reliable delivery timing", "consistent on-time arrivals"
- Acceptance Rate: "outstanding trip acceptance", "commitment to completing every assignment", "reliability in accepting routes"
- App Usage: "exemplary technology adoption", "consistent app engagement", "digital excellence"
- Disruptions: "smooth operations", "minimal service interruptions", "operational consistency"

## Data Models

### Certificate Data Structure
```javascript
{
    employeeName: string,
    awardType: 'driver' | 'employee' | 'driverstar',
    month: string,
    year: number,
    logoPath: string,
    verbiage: string,
    principles: string[] // 3-4 Leadership Principles
}
```

### DOTM Metrics Reference
```javascript
const DOTM_METRICS = {
    smartDriveSafety: { weight: 50, name: 'SmartDrive Safety Score' },
    onTimePerformance: { weight: 20, name: 'On-time Performance' },
    acceptanceRate: { weight: 20, name: 'Acceptance Rate' },
    appUsage: { weight: 5, name: 'Relay Mobile App Usage' },
    disruptions: { weight: 5, name: 'Rate of Disruptions' }
};
```

## Error Handling

1. **Missing Logo Files**: Fall back to Amazon logo if award-specific logo not found
2. **Invalid Award Type**: Default to generic certificate layout
3. **Empty Employee Selection**: Disable generate button and show validation message
4. **Print Failures**: Provide download options as backup

## Testing Strategy

### Manual Testing Checklist
1. Generate Driver of the Month certificate - verify landscape format and DOTM logo
2. Generate Employee of the Month certificate - verify landscape format and EOTM logo
3. Generate Driver Star certificate - verify landscape format and Driver Star logo
4. Verify DOTM verbiage includes all five metrics with proper emphasis
5. Test print functionality maintains landscape orientation
6. Verify certificates display correctly on screen in landscape
7. Test with multiple employees to ensure verbiage variation
8. Verify Leadership Principles are properly integrated

### Print Quality Verification
- Print test certificate on standard letter paper
- Verify landscape orientation
- Check logo clarity and resolution
- Confirm text readability
- Validate border and design elements

## Implementation Notes

### CSS Updates Required
```css
.certificate-container-v2 {
    width: 11in;
    height: 8.5in;
    /* Landscape orientation */
}

@media print {
    @page {
        size: landscape;
    }
}
```

### JavaScript Updates Required
1. Update `generateCertificateV2()` to use landscape dimensions
2. Add logo selection logic based on award type
3. Enhance `generateVerbiageV2()` with DOTM metric references
4. Update certificate HTML template for landscape layout
5. Add DOTM-specific verbiage templates

## Migration Path

Existing certificates will continue to work. New features:
- Landscape format applies to all new certificates
- Award-specific logos require logo files in `demo/logos/` directory
- DOTM verbiage enhancement is automatic for Driver of the Month awards
- No breaking changes to existing functionality
