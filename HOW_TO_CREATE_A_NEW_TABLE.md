# How to Create a New Table - Step-by-Step Guide

This guide explains how to add a new table to the TOM Analytics Dashboard in simple, clear steps.

---

## Quick Overview

To create a new table, you need to:
1. Add a table configuration to the JSON file
2. The system will automatically generate the table HTML
3. Upload data files that match your file patterns

That's it! The system handles everything else automatically.

---

## Step-by-Step Instructions

### Step 1: Open the Configuration File

**File Location:** `demo/assets/table-config.json`

This JSON file contains all table definitions. Open it in your text editor.

---

### Step 2: Add Your New Table Configuration

Copy this template and add it to the `tables` array in the JSON file:

```json
{
  "tableId": "your-table-id",
  "tableName": "Your Table Name",
  "displayName": "Your Table Display Name",
  "description": "What this table tracks",
  "tableBodyId": "tableBody7",
  "storageKey": "tom_analytics_data_7",
  "direction": "higher",
  "defaultBenchmark": 100,
  "color": "#FF9900",
  "visible": true,
  "includeInLeaderboard": true,
  "filePatterns": [
    {
      "pattern": "prior-your-metric",
      "type": "exact",
      "priority": 1
    },
    {
      "pattern": "current-your-metric",
      "type": "exact",
      "priority": 1
    }
  ],
  "columns": null
}
```

---

### Step 3: Customize Each Field

Here's what each field means and how to fill it out:

#### **tableId** (required)
- **What it is:** Unique identifier for your table
- **Format:** lowercase-with-dashes (kebab-case)
- **Example:** `"safety-incidents"`, `"quality-score"`, `"attendance-rate"`
- **Rule:** Must be unique - no two tables can have the same ID

#### **tableName** (required)
- **What it is:** Internal name for the table
- **Example:** `"Safety Incidents"`, `"Quality Score"`
- **Tip:** Keep it simple and descriptive

#### **displayName** (required)
- **What it is:** The name shown to users on the dashboard
- **Example:** `"Safety Incidents per Month"`, `"Quality Score %"`
- **Tip:** Can be more descriptive than tableName

#### **description** (optional)
- **What it is:** Brief explanation shown under the table title
- **Example:** `"Tracks workplace safety incidents per associate"`
- **Tip:** Helps users understand what the table measures

#### **tableBodyId** (required)
- **What it is:** HTML element ID for the table body
- **Format:** `tableBody` + number
- **How to choose:** Look at existing tables and use the next number
  - If you have tableBody through tableBody6, use `tableBody7`
- **Rule:** Must be unique

#### **storageKey** (required)
- **What it is:** Key used to store data in localStorage or database
- **Format:** `tom_analytics_data_` + number
- **How to choose:** Use the same number as your tableBodyId
  - If tableBodyId is `tableBody7`, use `tom_analytics_data_7`
- **Rule:** Must be unique

#### **direction** (required)
- **What it is:** Whether higher or lower values are better
- **Options:**
  - `"higher"` - Higher numbers are better (e.g., compliance %, quality score)
  - `"lower"` - Lower numbers are better (e.g., defects, idle time, incidents)
- **Example:** 
  - Compliance rate: `"higher"`
  - Error count: `"lower"`

#### **defaultBenchmark** (required)
- **What it is:** The target/goal value for this metric
- **Type:** Number (can be decimal)
- **Examples:**
  - For 100% compliance: `100`
  - For 0 defects: `0`
  - For 5 minutes max: `5.0`

#### **color** (optional)
- **What it is:** Accent color for the table header
- **Format:** Hex color code
- **Default:** `"#FF9900"` (Amazon orange)
- **Examples:** `"#FF9900"`, `"#232F3E"`, `"#00A8E1"`

#### **visible** (required)
- **What it is:** Whether the table shows on the dashboard
- **Options:** `true` or `false`
- **Default:** `true`
- **Tip:** Set to `false` to hide without deleting

#### **includeInLeaderboard** (required)
- **What it is:** Whether this table's data counts toward the leaderboard
- **Options:** `true` or `false`
- **Default:** `true`

#### **filePatterns** (required)
- **What it is:** Patterns to match uploaded file names
- **Format:** Array of pattern objects
- **Purpose:** Tells the system which files contain data for this table

**Pattern Object Structure:**
```json
{
  "pattern": "file-name-pattern",
  "type": "exact",
  "priority": 1
}
```

**Pattern Types:**
- `"exact"` - File name must match exactly
- `"contains"` - File name must contain this text
- `"prefix"` - File name must start with this text
- `"suffix"` - File name must end with this text

**Priority:**
- Lower numbers = higher priority
- Use `1` for exact matches
- Use `2` for contains/prefix/suffix matches

**Example File Patterns:**
```json
"filePatterns": [
  {
    "pattern": "prior-safety-incidents",
    "type": "exact",
    "priority": 1
  },
  {
    "pattern": "current-safety-incidents",
    "type": "exact",
    "priority": 1
  },
  {
    "pattern": "safety",
    "type": "contains",
    "priority": 2
  }
]
```

This means:
- Files named exactly "prior-safety-incidents" will be recognized (priority 1)
- Files named exactly "current-safety-incidents" will be recognized (priority 1)
- Files containing "safety" anywhere in the name will be recognized (priority 2)

#### **columns** (optional)
- **What it is:** Custom column definitions
- **Default:** `null` (uses standard columns: Name, Prior Month, Current Month, Change, Status)
- **Tip:** Leave as `null` unless you need custom columns

---

### Step 4: Complete Example

Here's a complete example for a "Safety Incidents" table:

```json
{
  "tableId": "safety-incidents",
  "tableName": "Safety Incidents",
  "displayName": "Safety Incidents per Month",
  "description": "Tracks workplace safety incidents per associate",
  "tableBodyId": "tableBody7",
  "storageKey": "tom_analytics_data_7",
  "direction": "lower",
  "defaultBenchmark": 0,
  "color": "#D13212",
  "visible": true,
  "includeInLeaderboard": true,
  "filePatterns": [
    {
      "pattern": "prior-safety-incidents",
      "type": "exact",
      "priority": 1
    },
    {
      "pattern": "current-safety-incidents",
      "type": "exact",
      "priority": 1
    },
    {
      "pattern": "safety",
      "type": "contains",
      "priority": 2
    }
  ],
  "columns": null
}
```

**Why these values?**
- `direction: "lower"` - Fewer incidents is better
- `defaultBenchmark: 0` - Goal is zero incidents
- `color: "#D13212"` - Red color for safety-related metric
- File patterns match "prior-safety-incidents.csv" and "current-safety-incidents.csv"

---

### Step 5: Add to the JSON File

1. Open `demo/assets/table-config.json`
2. Find the `"tables"` array
3. Add a comma after the last table
4. Paste your new table configuration
5. Save the file

**Before:**
```json
{
  "version": "1.0",
  "defaultTable": "vti-compliance",
  "tables": [
    {
      "tableId": "andon-response-time",
      ...
    }
  ]
}
```

**After:**
```json
{
  "version": "1.0",
  "defaultTable": "vti-compliance",
  "tables": [
    {
      "tableId": "andon-response-time",
      ...
    },
    {
      "tableId": "safety-incidents",
      "tableName": "Safety Incidents",
      ...
    }
  ]
}
```

---

### Step 6: Verify Your Configuration

Before testing, check:

- [ ] `tableId` is unique and in kebab-case
- [ ] `tableBodyId` is unique (e.g., tableBody7)
- [ ] `storageKey` is unique (e.g., tom_analytics_data_7)
- [ ] `direction` is either "higher" or "lower"
- [ ] `defaultBenchmark` is a number
- [ ] `filePatterns` array has at least one pattern
- [ ] All commas are in the right places (JSON syntax)
- [ ] No trailing comma after the last table

---

### Step 7: Test Your New Table

1. **Refresh the dashboard page**
   - Press F5 or Ctrl+R
   - The new table should appear automatically

2. **Check the browser console**
   - Press F12 to open developer tools
   - Look for any error messages
   - Should see: "Generating table: safety-incidents"

3. **Upload test data**
   - Create a CSV file named according to your file patterns
   - Example: `prior-safety-incidents.csv`
   - Upload it using the file upload feature
   - Data should appear in your new table

---

## Common Issues and Solutions

### Issue: Table doesn't appear

**Possible causes:**
1. JSON syntax error (missing comma, bracket, etc.)
2. `visible` is set to `false`
3. Browser cache needs clearing

**Solutions:**
1. Validate JSON at [jsonlint.com](https://jsonlint.com)
2. Check `visible: true` in your config
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

### Issue: File upload doesn't work

**Possible causes:**
1. File name doesn't match any pattern
2. Pattern type is wrong

**Solutions:**
1. Check file name matches exactly (case-sensitive)
2. Use `"type": "contains"` for more flexible matching
3. Check browser console for pattern matching logs

---

### Issue: Duplicate ID error

**Possible causes:**
1. `tableId` already exists
2. `tableBodyId` already exists
3. `storageKey` already exists

**Solutions:**
1. Choose a different, unique ID
2. Increment the number (tableBody7, tableBody8, etc.)
3. Use the next available number in sequence

---

## Quick Reference: Field Checklist

When creating a new table, fill out these fields:

```
✓ tableId: _________________ (unique, kebab-case)
✓ tableName: _________________ (descriptive name)
✓ displayName: _________________ (user-facing name)
✓ description: _________________ (what it tracks)
✓ tableBodyId: tableBody___ (next available number)
✓ storageKey: tom_analytics_data___ (same number)
✓ direction: higher / lower (circle one)
✓ defaultBenchmark: _______ (target number)
✓ color: #______ (hex color)
✓ visible: true / false (circle one)
✓ includeInLeaderboard: true / false (circle one)
✓ filePatterns: [list your patterns]
✓ columns: null (or custom array)
```

---

## Advanced: Custom Columns

If you need custom columns instead of the default (Name, Prior Month, Current Month, Change, Status), you can define them:

```json
"columns": [
  {
    "id": "name",
    "label": "Associate Name",
    "dataType": "text",
    "visible": true,
    "sortable": true
  },
  {
    "id": "incidents",
    "label": "Incident Count",
    "dataType": "number",
    "visible": true,
    "sortable": true
  },
  {
    "id": "severity",
    "label": "Severity Level",
    "dataType": "text",
    "visible": true,
    "sortable": true
  }
]
```

**Column Data Types:**
- `"text"` - Text strings
- `"number"` - Numeric values
- `"percentage"` - Percentage values (adds % symbol)
- `"date"` - Date values
- `"status"` - Status indicators (colors based on value)

**Tip:** For most cases, leave `columns: null` to use the default columns.

---

## Need Help?

If you're stuck:

1. **Check the browser console** (F12) for error messages
2. **Validate your JSON** at [jsonlint.com](https://jsonlint.com)
3. **Compare with existing tables** in the config file
4. **Look at the complete example** in Step 4 above

---

## Summary

Creating a new table is simple:

1. Copy the template
2. Fill in the fields (especially tableId, tableBodyId, storageKey, direction, filePatterns)
3. Add to table-config.json
4. Refresh the page
5. Upload data files

The system automatically:
- Generates the HTML table
- Creates the header and controls
- Handles data storage
- Updates the leaderboard
- Manages file uploads

You just need to provide the configuration!

---

*Last Updated: October 2025*
