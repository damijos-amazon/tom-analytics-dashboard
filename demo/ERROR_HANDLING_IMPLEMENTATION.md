# Error Handling Implementation

## Overview

The global error handler provides comprehensive error management for the TOM Analytics Dashboard, including:

- **Global error catching**: Catches all unhandled errors and promise rejections
- **User-friendly messages**: Converts technical errors to readable messages
- **Automatic retry logic**: Retries failed operations with exponential backoff
- **Offline queue**: Queues actions when offline and syncs when connection is restored
- **Connection status**: Visual indicator for online/offline status
- **Toast notifications**: Non-intrusive error, success, and info messages

## Files

### Core Files
- `demo/js/error-handler.js` - Main error handler service
- `demo/js/connection-status.js` - Connection status indicator
- `demo/js/error-handler-integration.js` - Integration examples
- `demo/css/error-handler.css` - Styles for toasts and status bar

### Test Files
- `demo/test-error-handling.html` - Comprehensive test suite

## Features

### 1. Global Error Handling

The error handler automatically catches:
- Unhandled promise rejections
- Global JavaScript errors
- Network failures
- Authentication errors
- Permission errors

```javascript
// Errors are automatically caught
Promise.reject(new Error('Something went wrong'));
// User sees: "An unexpected error occurred. Please try again."
```

### 2. User-Friendly Error Messages

Technical errors are converted to user-friendly messages:

| Error Type | User Message |
|------------|--------------|
| Network errors | "Unable to connect to database. Please check your internet connection." |
| Auth errors | "Login failed. Please check your credentials and try again." |
| Permission errors | "You don't have permission to perform this action." |
| Session errors | "Your session has expired. Please log in again." |
| Validation errors | "Invalid data provided. Please check your input and try again." |
| Timeout errors | "Request timed out. Please try again." |
| Generic errors | "An unexpected error occurred. Please try again." |

### 3. Automatic Retry Logic

Failed operations are automatically retried with exponential backoff:

```javascript
// Retry an operation up to 3 times
await errorHandler.queueAction(
    async () => {
        return await databaseService.saveData(data);
    },
    {
        context: 'Save Data',
        maxRetries: 3,
        retryDelay: 2000  // 2 seconds base delay
    }
);
```

**Retry behavior:**
- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 4 seconds
- Attempt 4: After 6 seconds

### 4. Offline Queue

Actions are queued when offline and automatically synced when connection is restored:

```javascript
// This will queue if offline
await errorHandler.queueAction(
    async () => await api.updateRecord(id, data),
    { context: 'Update Record' }
);

// When connection is restored, queued actions are automatically processed
```

**Queue features:**
- Persistent storage in localStorage
- Automatic sync on reconnection
- Visual feedback with connection status bar
- Queue statistics and monitoring

### 5. Connection Status Indicator

A status bar appears at the top of the page showing connection status:

- **Offline**: Red bar with warning message
- **Online**: Green bar (auto-hides after 3 seconds)
- **Reconnecting**: Yellow bar with sync progress

### 6. Toast Notifications

Non-intrusive notifications appear in the top-right corner:

```javascript
// Error toast (red)
errorHandler.showErrorToast('Operation failed');

// Success toast (green)
errorHandler.showSuccessMessage('Saved successfully');

// Info toast (blue)
errorHandler.showInfoToast('Processing...');
```

**Toast features:**
- Auto-dismiss after 5 seconds
- Manual close button
- Stacked for multiple messages
- Smooth animations

## Usage

### Basic Setup

Include the required files in your HTML:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/error-handler.css">

<!-- JavaScript -->
<script src="js/error-handler.js"></script>
<script src="js/connection-status.js"></script>
```

The error handler is automatically initialized and available globally:

```javascript
const errorHandler = window.errorHandler;
const connectionStatus = window.connectionStatus;
```

### Wrapping Service Methods

#### Database Service

```javascript
class DatabaseServiceWithRetry {
    constructor(databaseService, errorHandler) {
        this.db = databaseService;
        this.errorHandler = errorHandler;
    }

    async saveTableData(tableId, employeeName, data) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.db.saveTableData(tableId, employeeName, data);
            },
            {
                context: 'Save Table Data',
                metadata: { tableId, employeeName },
                maxRetries: 3,
                retryDelay: 2000
            }
        );
    }

    async loadTableData(tableId) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.db.loadTableData(tableId);
            },
            {
                context: 'Load Table Data',
                metadata: { tableId },
                maxRetries: 3,
                retryDelay: 1000
            }
        );
    }
}
```

#### Authentication Service

```javascript
class AuthServiceWithErrorHandling {
    constructor(authService, errorHandler) {
        this.auth = authService;
        this.errorHandler = errorHandler;
    }

    async signInWithSSO(provider) {
        try {
            return await this.auth.signInWithSSO(provider);
        } catch (error) {
            this.errorHandler.handleError(error, 'Authentication', { provider });
            throw error;
        }
    }

    async loadUserProfile() {
        try {
            return await this.auth.loadUserProfile();
        } catch (error) {
            this.errorHandler.handleError(error, 'Load User Profile');
            throw error;
        }
    }
}
```

### Form Submission

```javascript
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    try {
        await errorHandler.queueAction(
            async () => {
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Submission failed');
                }
                
                return await response.json();
            },
            {
                context: 'Form Submission',
                maxRetries: 2,
                retryDelay: 1500
            }
        );
        
        errorHandler.showSuccessMessage('Form submitted successfully!');
    } catch (error) {
        // Error already handled by errorHandler
        console.error('Form submission failed:', error);
    }
}
```

### Batch Operations

```javascript
async function processBatchItems(items) {
    const results = [];
    const errors = [];

    for (const item of items) {
        try {
            const result = await errorHandler.queueAction(
                async () => await processItem(item),
                {
                    context: 'Batch Processing',
                    metadata: { itemId: item.id },
                    maxRetries: 2,
                    retryDelay: 1000
                }
            );
            results.push({ item, result, success: true });
        } catch (error) {
            errors.push({ item, error, success: false });
        }
    }

    return {
        results,
        errors,
        successCount: results.length,
        errorCount: errors.length
    };
}
```

### Event Listeners

```javascript
function addEventListenerWithErrorHandling(element, event, handler) {
    element.addEventListener(event, async (e) => {
        try {
            await handler(e);
        } catch (error) {
            errorHandler.handleError(error, `Event Handler: ${event}`, {
                elementId: element.id,
                elementClass: element.className
            });
        }
    });
}

// Usage
addEventListenerWithErrorHandling(
    document.getElementById('saveButton'),
    'click',
    async (e) => {
        await saveData();
    }
);
```

## API Reference

### ErrorHandler

#### Methods

**`handleError(error, context, metadata)`**
- Handles an error and displays user-friendly message
- Parameters:
  - `error`: Error object or string
  - `context`: String describing where error occurred
  - `metadata`: Additional error information (optional)

**`queueAction(action, options)`**
- Queues an action with retry logic
- Parameters:
  - `action`: Async function to execute
  - `options`: Configuration object
    - `context`: Description of action
    - `maxRetries`: Maximum retry attempts (default: 3)
    - `retryDelay`: Base delay between retries in ms (default: 2000)
    - `metadata`: Additional information (optional)
- Returns: Promise that resolves with action result

**`showErrorToast(message)`**
- Displays error toast notification
- Parameters:
  - `message`: Error message to display

**`showSuccessMessage(message)`**
- Displays success toast notification
- Parameters:
  - `message`: Success message to display

**`showInfoToast(message)`**
- Displays info toast notification
- Parameters:
  - `message`: Info message to display

**`getErrorStats()`**
- Returns error statistics
- Returns: Object with `totalErrors`, `queuedActions`, `isOnline`, `recentErrors`

**`clearErrorQueue()`**
- Clears the error log

**`clearRetryQueue()`**
- Clears the retry queue

### ConnectionStatus

#### Methods

**`showStatus(type, message, details)`**
- Shows connection status bar
- Parameters:
  - `type`: 'online', 'offline', or 'reconnecting'
  - `message`: Main status message
  - `details`: Additional details (optional)

**`hideStatus()`**
- Hides the connection status bar

**`getStatus()`**
- Returns current connection status
- Returns: Object with `isOnline`, `syncInProgress`, `queuedActions`

**`triggerSync()`**
- Manually triggers sync of queued actions
- Returns: Promise<boolean>

**`showTemporaryStatus(type, message, duration)`**
- Shows status for a specific duration
- Parameters:
  - `type`: Status type
  - `message`: Message to display
  - `duration`: Duration in ms (default: 3000)

## Testing

Open `demo/test-error-handling.html` in a browser to test all error handling features:

1. **Basic Error Handling**: Test different error types
2. **Retry Logic**: Test automatic retry with success/failure scenarios
3. **Offline Queue**: Simulate offline mode and queue actions
4. **Connection Status**: Test status bar display
5. **Toast Notifications**: Test different toast types
6. **Integration Examples**: Test with simulated service calls
7. **Statistics**: View error and queue statistics
8. **Activity Log**: Monitor all error handling activity

## Requirements Satisfied

This implementation satisfies the following requirements:

- **14.1**: Database connection errors display user-friendly message
- **14.2**: Authentication errors display user-friendly message
- **14.3**: Permission errors display user-friendly message
- **14.4**: Network errors trigger automatic retry and queue actions when offline
- **14.5**: Unexpected errors are logged and display user-friendly message

## Best Practices

1. **Always wrap critical operations** with `queueAction()` for automatic retry
2. **Use appropriate context** to help with debugging and logging
3. **Set reasonable retry limits** (2-3 attempts for most operations)
4. **Include metadata** for better error tracking
5. **Test offline scenarios** to ensure queue functionality works
6. **Monitor error statistics** to identify recurring issues
7. **Clear queues periodically** to prevent memory issues

## Future Enhancements

Potential improvements:
- Integration with remote logging service (Sentry, LogRocket)
- Error analytics and reporting dashboard
- Configurable retry strategies per operation type
- Smart retry based on error type
- Batch queue processing optimization
- Error rate limiting to prevent spam
- Custom error handlers per service
- Error recovery suggestions

## Support

For issues or questions about error handling:
1. Check the test page for examples
2. Review the integration examples in `error-handler-integration.js`
3. Check browser console for detailed error logs
4. Monitor error statistics for patterns
