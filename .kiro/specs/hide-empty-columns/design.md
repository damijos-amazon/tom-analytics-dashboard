# Design Document

## Overview

This feature adds intelligent column visibility logic to the dynamic table generator and removes redundant UI elements. When a table has no prior month data, the system will automatically hide the "Prior Month" and "Change" columns to provide a cleaner interface. Additionally, the "Edit Benchmark" button will be removed since it duplicates functionality already available in the "Manage Tables" modal.

## Architecture

The solution will be implemented in the `DynamicTableGenerator` class by adding data inspection logic before rendering the table header and body.

## Components and Interfaces

### Modified Component: DynamicTableGenerator

**New Method: `detectAvailableData(data)`**
- Inspects the data array to determine which columns have values
- Returns an object indicating which data types are present:
  ```javascript
  {
    hasPriorMonth: boolean,
    hasCurrentMonth: boolean
  }
  ```

**Modified Method: `generateTableHeader(columns, dataAvailability)`**
- Accepts additional parameter `dataAvailability`
- Conditionally renders "Prior Month" and "Change" columns based on data availability
- Maintains "Rank", "Associate Name", "Current Month", "Status", and "Actions" columns

**Modified Method: `generateTable(tableConfig, data)`**
- Calls `detectAvailableData()` before generating header
- Passes data availability information to header generation

## Data Models

### DataAvailability Object
```javascript
{
  hasPriorMonth: boolean,  // true if any row has prior month data
  hasCurrentMonth: boolean // true if any row has current month data
}
```

## Error Handling

- If data is null or empty, default to showing all columns
- If data structure is unexpected, log warning and show all columns
- Gracefully handle mixed data (some rows with prior, some without)

## Testing Strategy

- Test with only current month data (should hide Prior Month and Change)
- Test with both prior and current month data (should show all columns)
- Test with empty data (should show all columns)
- Test data upload that adds prior month data (should reveal hidden columns)
