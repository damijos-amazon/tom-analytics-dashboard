# Error Handler Quick Reference

## Setup (Add to every page)

```html
<!-- In <head> -->
<link rel="stylesheet" href="css/error-handler.css">

<!-- Before </body> -->
<script src="js/error-handler.js"></script>
<script src="js/connection-status.js"></script>
```

## Common Patterns

### 1. Database Operation with Retry
```javascript
await errorHandler.queueAction(
    async () => await db.saveData(data),
    { context: 'Save Data', maxRetries: 3 }
);
```

### 2. Operation with Success Message
```javascript
try {
    await errorHandler.queueAction(
        async () => await api.update(id, data),
        { context: 'Update Record' }
    );
    errorHandler.showSuccessMessage('Updated successfully!');
} catch (error) {
    // Error already shown to user
}
```

### 3. Simple Error Handling
```javascript
try {
    await someOperation();
} catch (error) {
    errorHandler.handleError(error, 'Operation Name');
}
```

### 4. Form Submission
```javascript
async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        await errorHandler.queueAction(
            async () => await submitForm(formData),
            { context: 'Form Submit', maxRetries: 2 }
        );
        errorHandler.showSuccessMessage('Form submitted!');
    } catch (error) {
        // Error handled
    }
}
```

### 5. Batch Operations
```javascript
for (const item of items) {
    try {
        await errorHandler.queueAction(
            async () => await process(item),
            { context: `Process ${item.id}` }
        );
    } catch (error) {
        console.error(`Failed: ${item.id}`);
    }
}
```

## API Quick Reference

### ErrorHandler
```javascript
const errorHandler = window.errorHandler;

// Handle error
errorHandler.handleError(error, 'Context', { metadata });

// Queue action with retry
await errorHandler.queueAction(action, {
    context: 'Action Name',
    maxRetries: 3,
    retryDelay: 2000,
    metadata: {}
});

// Show notifications
errorHandler.showErrorToast('Error message');
errorHandler.showSuccessMessage('Success message');
errorHandler.showInfoToast('Info message');

// Get stats
const stats = errorHandler.getErrorStats();
// { totalErrors, queuedActions, isOnline, recentErrors }

// Clear queues
errorHandler.clearErrorQueue();
errorHandler.clearRetryQueue();
```

### ConnectionStatus
```javascript
const connectionStatus = window.connectionStatus;

// Show status
connectionStatus.showStatus('offline', 'No connection', 'Details');
connectionStatus.showStatus('online', 'Connected');
connectionStatus.showStatus('reconnecting', 'Syncing...');

// Hide status
connectionStatus.hideStatus();

// Get status
const status = connectionStatus.getStatus();
// { isOnline, syncInProgress, queuedActions }

// Manual sync
await connectionStatus.triggerSync();
```

## Error Message Mapping

| Error Type | User Message |
|------------|--------------|
| Network | "Unable to connect to database. Please check your internet connection." |
| Auth | "Login failed. Please check your credentials and try again." |
| Permission | "You don't have permission to perform this action." |
| Session | "Your session has expired. Please log in again." |
| Validation | "Invalid data provided. Please check your input and try again." |
| Timeout | "Request timed out. Please try again." |
| Generic | "An unexpected error occurred. Please try again." |

## Options Reference

### queueAction Options
```javascript
{
    context: 'Operation Name',      // Required: Description
    maxRetries: 3,                  // Optional: Max retry attempts
    retryDelay: 2000,               // Optional: Base delay in ms
    metadata: {}                    // Optional: Additional info
}
```

## Testing

Open `test-error-handling.html` to test all features.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `errorHandler is not defined` | Load `error-handler.js` before your script |
| Toasts not showing | Load `error-handler.css` in `<head>` |
| Status bar not showing | Load `connection-status.js` after `error-handler.js` |
| Actions not queuing | Use `queueAction()` instead of plain try/catch |

## Best Practices

✅ Always wrap database operations with `queueAction()`
✅ Use descriptive context names
✅ Set reasonable retry limits (2-3)
✅ Show success messages for user feedback
✅ Test offline scenarios
✅ Monitor error statistics

❌ Don't retry non-network errors
❌ Don't set excessive retry limits
❌ Don't ignore errors silently
❌ Don't forget to load CSS file

## Full Documentation

- **Implementation**: `ERROR_HANDLING_IMPLEMENTATION.md`
- **Integration Guide**: `ERROR_HANDLER_INTEGRATION_GUIDE.md`
- **Test Page**: `test-error-handling.html`
