# Performance Optimization Guide

This document describes the performance optimizations implemented in the TOM Analytics Dashboard authentication and database system.

## Overview

The system implements three main categories of performance optimizations:
1. **Data Pagination** - Load data in manageable chunks
2. **Loading Indicators** - Provide visual feedback during operations
3. **Query Optimization** - Improve database query performance

## 1. Data Pagination

### Implementation

Pagination is implemented across all major data queries to prevent loading large datasets at once.

#### DatabaseService Pagination

```javascript
// Load table data with pagination
const result = await databaseService.loadTableData('table-1', {
    page: 0,
    pageSize: 100
});

console.log(result.data); // Array of records
console.log(result.pagination); // Pagination metadata
```

#### AdminPanelService Pagination

```javascript
// Load users with pagination
const result = await adminPanelService.getUsers({
    page: 0,
    pageSize: 100
});

// Load audit logs with pagination
const logs = await adminPanelService.getAuditLogs({
    page: 0,
    pageSize: 100,
    startDate: '2024-01-01',
    action: 'login'
});
```

### Pagination Component

A reusable pagination component is provided for UI implementation:

```javascript
// Button-based pagination
const pagination = new PaginationComponent({
    container: document.getElementById('pagination'),
    mode: 'buttons',
    onPageChange: async (page) => {
        const data = await loadData(page);
        renderData(data);
    }
});

// Infinite scroll pagination
const infinitePagination = new PaginationComponent({
    container: document.getElementById('content'),
    scrollContainer: document.getElementById('scroll-area'),
    mode: 'infinite',
    onPageChange: async (page) => {
        const data = await loadData(page);
        appendData(data);
    }
});
```

### Benefits

- Reduces initial page load time
- Decreases memory usage
- Improves responsiveness for large datasets
- Supports both button navigation and infinite scroll

## 2. Loading Indicators

### Implementation

Multiple types of loading indicators are available for different UI contexts.

#### Spinner Overlay

```javascript
// Show spinner on a specific element
const id = loadingIndicator.showSpinner('#data-table', {
    message: 'Loading data...',
    size: 'medium'
});

// Hide when done
loadingIndicator.hideSpinner(id);
```

#### Progress Bar

```javascript
// Show progress bar for file uploads
const progressBar = loadingIndicator.showProgressBar('#upload-area', {
    progress: 0,
    message: 'Uploading file...'
});

// Update progress
progressBar.update(50, 'Processing...');

// Hide when complete
progressBar.hide();
```

#### Skeleton Screen

```javascript
// Show skeleton for initial load
const id = loadingIndicator.showSkeleton('#content', {
    rows: 5,
    type: 'table'
});

// Hide when data loads
loadingIndicator.hideSpinner(id);
```

#### Inline Spinner (Buttons)

```javascript
// Show spinner in button
const id = loadingIndicator.showInlineSpinner('#submit-btn');

// Hide and restore button content
loadingIndicator.hideInlineSpinner(id);
```

#### Global Loader

```javascript
// Show full-screen loader
const id = loadingIndicator.showGlobalLoader('Processing...');

// Hide when done
loadingIndicator.hideSpinner(id);
```

### Loading Wrapper

Utility to wrap async operations with loading indicators:

```javascript
const wrapper = new LoadingWrapper(loadingIndicator);

// Wrap with spinner
await wrapper.withSpinner(
    async () => await fetchData(),
    '#data-container',
    { message: 'Loading...' }
);

// Wrap with progress bar
await wrapper.withProgressBar(
    async (updateProgress) => {
        for (let i = 0; i <= 100; i += 10) {
            await processChunk(i);
            updateProgress(i);
        }
    },
    '#progress-container'
);

// Wrap file upload
await wrapper.withFileUploadProgress(
    file,
    async (file, updateProgress) => {
        return await uploadFile(file, updateProgress);
    },
    '#upload-container'
);
```

### Benefits

- Improves perceived performance
- Provides clear feedback to users
- Reduces user frustration during long operations
- Prevents duplicate submissions

## 3. Query Optimization

### Database Indexes

Indexes are created on frequently queried columns to improve query performance.

#### Key Indexes

```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Table data
CREATE INDEX idx_table_data_table_id ON table_data(table_id);
CREATE INDEX idx_table_data_composite ON table_data(table_id, employee_name);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_composite ON audit_logs(user_id, action, created_at DESC);

-- JSONB indexes
CREATE INDEX idx_table_data_data_gin ON table_data USING GIN(data);
```

#### Partial Indexes

Partial indexes for common query patterns:

```sql
-- Active users only
CREATE INDEX idx_users_active ON users(id, email, role) 
WHERE status = 'active';

-- Recent audit logs (90 days)
CREATE INDEX idx_audit_logs_recent ON audit_logs(created_at DESC, user_id, action)
WHERE created_at > NOW() - INTERVAL '90 days';
```

### Database Views

Materialized and regular views for complex queries:

```sql
-- User activity summary
CREATE VIEW user_activity_summary AS
SELECT u.id, u.email, COUNT(al.id) as action_count
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id
GROUP BY u.id, u.email;

-- Daily login statistics (materialized)
CREATE MATERIALIZED VIEW daily_login_statistics AS
SELECT DATE(created_at) as login_date, COUNT(*) as login_count
FROM audit_logs
WHERE action = 'login'
GROUP BY DATE(created_at);
```

Refresh materialized views:

```sql
-- Manual refresh
SELECT refresh_performance_views();

-- Automatic refresh (with pg_cron)
SELECT cron.schedule('refresh-performance-views', '0 */6 * * *', 
    'SELECT refresh_performance_views()');
```

### Query Cache

Client-side query caching to reduce database load:

```javascript
// Initialize cache
const cache = new QueryCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enabled: true
});

// Use cache with DatabaseService
const dbService = new DatabaseService(supabase, authService, null, cache);

// Queries are automatically cached
const data = await dbService.loadTableData('table-1', { useCache: true });

// Invalidate cache on updates
cache.invalidate('loadTableData');

// Get cache statistics
const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate}`);
```

### Benefits

- Reduces database query time by 50-90%
- Decreases database load
- Improves response times for common queries
- Enables efficient handling of large datasets

## Performance Monitoring

### PerformanceMonitor

Track and analyze operation performance:

```javascript
// Measure an operation
await performanceMonitor.measure('loadTableData', async () => {
    return await databaseService.loadTableData('table-1');
});

// Get metrics
const metrics = performanceMonitor.getMetrics('loadTableData');
console.log(`Average time: ${metrics.averageTime}ms`);
console.log(`Slow operations: ${metrics.slowCount}`);

// Get summary
const summary = performanceMonitor.getSummary();
console.log(`Total operations: ${summary.totalOperations}`);
console.log(`Slow percentage: ${summary.slowPercentage}%`);

// Log report
performanceMonitor.logReport();

// Export metrics
const json = performanceMonitor.exportMetrics();
```

### Performance Thresholds

Default thresholds:
- **Slow**: > 1000ms (1 second)
- **Very Slow**: > 3000ms (3 seconds)

Customize thresholds:

```javascript
performanceMonitor.setThresholds({
    slow: 500,
    verySlow: 2000
});
```

## Best Practices

### 1. Always Use Pagination

```javascript
// ❌ Bad - loads all records
const data = await dbService.loadAllTableData('table-1');

// ✅ Good - loads paginated records
const result = await dbService.loadTableData('table-1', { page: 0, pageSize: 100 });
```

### 2. Show Loading Indicators

```javascript
// ❌ Bad - no feedback
const data = await fetchData();

// ✅ Good - shows loading state
await wrapper.withSpinner(
    async () => await fetchData(),
    '#container'
);
```

### 3. Use Query Cache

```javascript
// ❌ Bad - always hits database
const data = await dbService.loadTableData('table-1', { useCache: false });

// ✅ Good - uses cache when available
const data = await dbService.loadTableData('table-1', { useCache: true });
```

### 4. Monitor Performance

```javascript
// Wrap critical operations
await performanceMonitor.measure('criticalOperation', async () => {
    return await performCriticalOperation();
});

// Review metrics regularly
performanceMonitor.logReport();
```

### 5. Invalidate Cache on Updates

```javascript
// After updating data
await dbService.saveTableData('table-1', 'John Doe', data);

// Cache is automatically invalidated
// Next load will fetch fresh data
```

## Performance Targets

Based on requirements:

| Metric | Target | Implementation |
|--------|--------|----------------|
| Dashboard load time | < 2 seconds | Skeleton screens, pagination |
| Query response time | < 1 second | Indexes, caching, pagination |
| File upload (< 5MB) | < 5 seconds | Progress bars, chunked uploads |
| Concurrent users | Maintain < 3s response | Connection pooling, caching |
| Large datasets (100k+ records) | Paginated | Pagination, indexes |

## Troubleshooting

### Slow Queries

1. Check if indexes are being used:
```sql
EXPLAIN ANALYZE SELECT * FROM table_data WHERE table_id = 'table-1';
```

2. Review query cache hit rate:
```javascript
const stats = queryCache.getStats();
console.log(`Hit rate: ${stats.hitRate}`);
```

3. Check performance metrics:
```javascript
performanceMonitor.logReport();
```

### High Memory Usage

1. Reduce page size:
```javascript
const data = await dbService.loadTableData('table-1', { pageSize: 50 });
```

2. Clear query cache:
```javascript
queryCache.invalidateAll();
```

3. Use skeleton screens instead of spinners for large lists

### Cache Issues

1. Check cache statistics:
```javascript
const stats = queryCache.getStats();
```

2. Manually invalidate stale cache:
```javascript
queryCache.invalidate('loadTableData');
```

3. Disable cache for debugging:
```javascript
queryCache.disable();
```

## Files Reference

### JavaScript Files
- `demo/js/pagination-component.js` - Pagination UI component
- `demo/js/loading-indicator.js` - Loading indicators
- `demo/js/loading-wrapper.js` - Loading wrapper utility
- `demo/js/query-cache.js` - Query caching
- `demo/js/performance-monitor.js` - Performance monitoring

### CSS Files
- `demo/css/pagination.css` - Pagination styles
- `demo/css/loading-indicator.css` - Loading indicator styles

### SQL Files
- `demo/sql/06-performance-indexes.sql` - Database indexes
- `demo/sql/07-performance-views.sql` - Database views

## Conclusion

These performance optimizations ensure the TOM Analytics Dashboard remains responsive and efficient even with large datasets and multiple concurrent users. Regular monitoring and adherence to best practices will maintain optimal performance.
