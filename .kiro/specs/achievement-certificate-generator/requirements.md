# Requirements Document

## Introduction

This feature provides a modal-based certificate generator that creates professional, printable achievement certificates for Driver of the Month and Employee of the Month awards. The system automatically generates personalized, motivating verbiage incorporating Amazon's 16 Leadership Principles and pulls employee names from the TOM Team Leaderboard. Certificates are designed to be printed and laminated for physical presentation.

## Glossary

- **Certificate Generator**: The modal interface that creates achievement certificates
- **Achievement Certificate**: A professional document recognizing Driver of the Month or Employee of the Month
- **Leadership Principles**: Amazon's 16 core leadership values integrated into certificate verbiage
- **Leaderboard**: The TOM Team Leaderboard table containing employee performance data
- **Print-Ready Format**: Certificate layout optimized for landscape letter-size printing and lamination
- **Personalized Verbiage**: Custom motivational text generated for each recipient based on their achievement
- **Award-Specific Logo**: A unique logo image displayed on certificates that corresponds to the specific award type (Driver of the Month, Employee of the Month, or Driver Star)
- **Driver of the Month (DOTM)**: An award given to top-performing drivers based on a monthly performance score calculated across five key metrics
- **Performance Score**: A weighted calculation based on SmartDrive Safety Score (50%), On-time performance (20%), Acceptance rate (20%), Relay mobile app usage (5%), and Rate of disruptions (5%)
- **SmartDrive Safety Score**: A safety metric measuring driver safety performance, weighted at 50% of the DOTM score
- **On-time Performance**: Punctuality metric measured at route origin and destination, weighted at 20% of the DOTM score
- **Acceptance Rate**: Metric based on drivers accepting and completing tendered trips, weighted at 20% of the DOTM score
- **Relay Mobile App Usage**: Metric based on app usage during key events, weighted at 5% of the DOTM score
- **Rate of Disruptions**: Metric based on driver-controlled disruptions, weighted at 5% of the DOTM score

## Requirements

### Requirement 1

**User Story:** As a TOM manager, I want to access a certificate generator from the navigation menu, so that I can quickly create achievement certificates for my team members

#### Acceptance Criteria

1. WHEN the user clicks a navigation menu item labeled "Achievement Certificates", THE Certificate Generator Modal SHALL open
2. THE Certificate Generator Modal SHALL display in a full-screen overlay with professional styling
3. THE Certificate Generator Modal SHALL include a close button that dismisses the modal
4. THE Certificate Generator Modal SHALL prevent background scrolling when open

### Requirement 2

**User Story:** As a TOM manager, I want to select an employee from the leaderboard and choose an award type, so that I can generate the appropriate certificate

#### Acceptance Criteria

1. THE Certificate Generator Modal SHALL display a dropdown populated with all employee names from the TOM Team Leaderboard
2. THE Certificate Generator Modal SHALL include radio buttons or dropdown to select between "Driver of the Month", "Employee of the Month", and "Driver Star" award types
3. THE Certificate Generator Modal SHALL include a "Generate Certificate" button
4. WHEN no employee is selected, THE Certificate Generator Modal SHALL disable the generate button or display a validation message

### Requirement 10

**User Story:** As a TOM manager, I want each award type to display its own unique logo on the certificate, so that the recognition is visually distinct and professional

#### Acceptance Criteria

1. THE System SHALL store award-specific logo images in a designated directory
2. WHEN a Driver of the Month certificate is generated, THE System SHALL display the Driver of the Month logo
3. WHEN an Employee of the Month certificate is generated, THE System SHALL display the Employee of the Month logo
4. WHEN a Driver Star certificate is generated, THE System SHALL display the Driver Star logo
5. THE System SHALL render logo images at high resolution suitable for printing
6. THE System SHALL position the logo prominently on the landscape-oriented certificate layout

### Requirement 3

**User Story:** As a TOM manager, I want the certificate to automatically include personalized, motivating verbiage with Amazon Leadership Principles, so that the recognition feels meaningful and specific

#### Acceptance Criteria

1. WHEN a certificate is generated, THE System SHALL create personalized motivational text that references the employee's name
2. THE System SHALL incorporate at least 3 of Amazon's 16 Leadership Principles into the certificate verbiage
3. THE System SHALL vary the Leadership Principles and verbiage for each certificate generation to create unique content
4. THE System SHALL use enthusiastic, professional language that makes the recipient feel valued
5. THE System SHALL include specific phrases that connect the employee's achievement to Amazon's culture

### Requirement 9

**User Story:** As a TOM manager, I want Driver of the Month certificates to specifically reference the DOTM performance metrics and their achievements, so that the recognition accurately reflects the criteria they excelled in

#### Acceptance Criteria

1. WHEN a Driver of the Month certificate is generated, THE System SHALL reference the five DOTM performance metrics in the certificate verbiage
2. THE System SHALL emphasize SmartDrive Safety Score achievements with greater prominence due to its 50% weighting
3. THE System SHALL incorporate language about on-time performance and acceptance rate achievements due to their 20% weightings
4. THE System SHALL include positive recognition language that connects the driver's performance to the specific DOTM criteria
5. THE System SHALL generate extra positive reward verbiage based on Amazon's 16 Leadership Principles that aligns with the DOTM achievement
6. THE System SHALL create verbiage that celebrates excellence across safety, reliability, acceptance, app usage, and disruption management
7. WHERE the driver has exceptional performance in SmartDrive Safety Score, THE System SHALL highlight this as the primary achievement in the certificate text

### Requirement 4

**User Story:** As a TOM manager, I want the certificate to display in a professional, print-ready format, so that I can print and laminate it for presentation

#### Acceptance Criteria

1. THE Certificate SHALL use a landscape-oriented letter-size layout (11" x 8.5") optimized for printing
2. THE Certificate SHALL include a specific logo image for each award type
3. THE Certificate SHALL display the award title prominently (Driver of the Month, Employee of the Month, or Driver Star)
4. THE Certificate SHALL include the employee's full name in large, readable text
5. THE Certificate SHALL include the current month and year
6. THE Certificate SHALL include decorative borders or design elements appropriate for a formal certificate
7. THE Certificate SHALL use high-contrast colors suitable for printing
8. THE Certificate SHALL maintain landscape orientation in both screen display and print output for all award types

### Requirement 5

**User Story:** As a TOM manager, I want to print the certificate directly from the modal, so that I can quickly produce physical certificates

#### Acceptance Criteria

1. THE Certificate Generator Modal SHALL include a "Print Certificate" button
2. WHEN the print button is clicked, THE System SHALL trigger the browser's print dialog
3. THE System SHALL apply print-specific CSS that removes modal chrome and optimizes the certificate for printing
4. THE System SHALL maintain certificate formatting and quality in print preview

### Requirement 6

**User Story:** As a TOM manager, I want to download the certificate as a PDF or image, so that I can save it digitally or send it electronically before printing

#### Acceptance Criteria

1. THE Certificate Generator Modal SHALL include a "Download PDF" button
2. THE Certificate Generator Modal SHALL include a "Download Image" button
3. WHEN the download PDF button is clicked, THE System SHALL generate and download a PDF file of the certificate
4. WHEN the download image button is clicked, THE System SHALL generate and download a high-resolution PNG or JPEG file
5. THE System SHALL name downloaded files with the format "Certificate_[EmployeeName]_[Month]_[Year].[extension]"

### Requirement 7

**User Story:** As a TOM manager, I want to generate a new certificate without closing the modal, so that I can efficiently create multiple certificates in one session

#### Acceptance Criteria

1. THE Certificate Generator Modal SHALL include a "Generate Another" or "Reset" button after a certificate is created
2. WHEN the reset button is clicked, THE System SHALL clear the current certificate and return to the employee selection interface
3. THE System SHALL maintain the modal open state during reset operations
4. THE System SHALL preserve the employee dropdown data without requiring a page refresh

### Requirement 8

**User Story:** As a TOM manager, I want to use a verbiage generator in TOM Shout Outs that restructures my input to sound caring and professional, so that I can recognize anyone (even non-team members) with polished, principle-based language

#### Acceptance Criteria

1. THE TOM Shout Outs Modal SHALL include a text input area where users can enter raw recognition verbiage
2. THE TOM Shout Outs Modal SHALL include a "Generate Professional Shout Out" button
3. WHEN the generate button is clicked, THE System SHALL accept the user's input text about any person
4. THE System SHALL restructure the input verbiage to sound like it is coming from a genuinely caring people manager
5. THE System SHALL identify and incorporate at least 1 relevant Amazon Leadership Principle from the 16 principles based on the content
6. THE System SHALL maintain the core message and intent of the original input while enhancing tone and professionalism
7. THE System SHALL display the generated shout out text in a formatted output area within the modal
8. THE System SHALL allow the user to copy the generated text or regenerate with different phrasing
