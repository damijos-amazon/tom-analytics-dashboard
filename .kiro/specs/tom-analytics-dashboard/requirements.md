# TOM Analytics Dashboard – Employee Recognition & Appreciation System (Mobile-Friendly)

## Page Layout

### Header
- Title: TOM Analytics Dashboard
- Subtitle: Employee Recognition & Appreciation System
- Centered text
- Styling: bold, beveled, subtle shadow effects
- Responsive font sizes for mobile devices

### File Upload / Mapping System
- Positioned above the VTI Compliance table
- Multi-file drag-and-drop support
- Supports .xlsx and .csv files
- Column mapping interface for each uploaded file
- Automatically populates table as soon as files are uploaded and mapped
- Buttons:
  - Import All → loads all uploaded files into the table
  - Backup All → saves a copy of all uploaded and mapped data
- Mobile-friendly layout: stacked input fields, collapsible mapping interface if needed

### VTI Compliance Table
- Columns: Rank, Associate Name, Prior Month %, Current Month %, Change %, Status, Actions
- Styling: Center-aligned content, Bevel effects on table cells, Heavy shadowing on headers, Row highlight on hover
- Drag-and-drop row reordering
- Sortable columns (ascending/descending)
- Actions: Delete single row, Clear all rows (Clear Data button)
- Export buttons: Export Excel, Export CSV, Export JSON
- Responsive behavior: Scrollable table on small screens, Columns collapse or wrap gracefully on mobile, Table and buttons scale appropriately for touch interaction

## Data Handling

### Excel/CSV Sources
- prior-vti file: Column E (user_id) → Associate Name (deduplicated), Column I (Relay VTI % (100% Capped)) → Prior Month % (average if multiple entries)
- current-vti file: Column E (user_id) → Associate Name (deduplicated), Column I (Relay VTI % (100% Capped)) → Current Month % (average if multiple entries)

### Raw Data Normalization
- .853 → 85.30%
- 1 → 100.00%
- All percentages displayed with two decimal places

### Calculations
- Change % = Current Month % - Prior Month %
- Status: Improved → positive change, Maintained → no change, Decreased → negative change
- Rank: Sorted by most improvement first, then maintained compliance, Employees with consistent 100% compliance prioritized if no improvement

## Persistence & Backup

### Persistent Storage
- Data remains after page refresh
- Supports desktop folder shortcut to WorkDocs for auto storage

### Backup & Restore
- Backup All → saves all uploaded and mapped data without overwriting previous backups
- Import All → loads all saved backup data into the table
- Automatic storage of each imported file
- Multiple backup versions supported

## Visual Enhancements

### Table and page styling
- Bevel effects on table borders
- Heavy shadowing on text
- Hover effects on rows
- Centered content
- Mobile-friendly adjustments: scaled fonts, responsive buttons, collapsible sections if needed

### Podium for Top 3 Performers
- Positioned beneath table
- Amazon branded trophies/icons for 1st, 2nd, 3rd place
- Hover effect: trophy pops out and returns, 1st place front and center
- Heading: "Top 3 Performers" with heavy shadow and glow effect
- Mobile: podium scales and trophies stack vertically if needed

## Branding & Theme
- Amazon-inspired color palette: dark blue, orange, yellow accents
- Include Amazon logos for branding
- Professional, visually appealing, user-friendly
- Responsive design for all screen sizes

## Technical Requirements
- Use HTML5, CSS3, JavaScript
- Fully interactive: Drag-and-drop row reordering, Sortable columns, Auto-populated from mapped files immediately, Persistent storage and backup system, Multi-file upload and mapping, Export options: Excel, CSV, JSON
- Mobile-first design: Table scrollable on small screens, Buttons large enough for touch interaction, Layout adapts to portrait and landscape orientations
- Browser compatibility: Chrome, Firefox, Edge, Safari, mobile browsers