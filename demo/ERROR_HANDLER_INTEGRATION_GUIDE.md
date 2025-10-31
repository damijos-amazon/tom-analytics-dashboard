# Error Handler Integration Guide

## Quick Start

This guide shows how to integrate the global error handler into existing pages.

## Step 1: Add Required Files

Add these lines to the `<head>` section of your HTML:

```html
<!-- Error Handler CSS -->
<link rel="stylesheet" href="css/error-handler.css">
```

Add these lines before the closing `</body>` tag:

```html
<!-- Error Handler Scripts -->
<script src="js/error-handler.js"></script>
<script src="js/connection-status.js"></script>
<script src="js/error-handler-integration.js"></script>
```

## Step 2: Access Global Instance

The error handler is automatically initialized and available globally:

```javascript
// Access the error handler
const errorHandler = window.errorHandler;
const connectionStatus = window.connectionStatus;
```

## Step 3: Wrap Existing Service Calls

### Example: Dashboard Initialization

**Before:**
```javascript
async function initDashboard() {
    const data = await databaseService.loadTableData('dashboard');
    renderDashboard(data);
}
```

**After:**
```javascript
async function initDashboard() {
    try {
        const data = await errorHandler.queueAction(
            async () => await databaseService.loadTableData('dashboard'),
            {
                context: 'Load Dashboard',
                maxRetries: 3,
                retryDelay: 2000
            }
        );
        renderDashboard(data);
    } catch (error) {
        // Error already displayed to user
        console.error('Dashboard load failed:', error);
    }
}
```

### Example: Form Submission

**Before:**
```javascript
async function saveForm(formData) {
    const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
        alert('Save failed!');
        return;
    }
    
    alert('Saved successfully!');
}
```

**After:**
```javascript
async function saveForm(formData) {
    try {
        await errorHandler.queueAction(
            async () => {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    throw new Error('Save failed');
                }
                
                return await response.json();
            },
            {
                context: 'Save Form',
                maxRetries: 2,
                retryDelay: 1500
            }
        );
        
        errorHandler.showSuccessMessage('Saved successfully!');
    } catch (error) {
        // Error already displayed to user
    }
}
```

### Example: Authentication

**Before:**
```javascript
async function login(provider) {
    try {
        await authService.signInWithSSO(provider);
        window.location.href = '/dashboard';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}
```

**After:**
```javascript
async function login(provider) {
    try {
        await authService.signInWithSSO(provider);
        window.location.href = '/dashboard';
    } catch (error) {
        errorHandler.handleError(error, 'Authentication', { provider });
    }
}
```

## Step 4: Update Existing Pages

### Login Page (login.html)

Add to `<head>`:
```html
<link rel="stylesheet" href="css/error-handler.css">
```

Add before `</body>`:
```html
<script src="js/error-handler.js"></script>
<script src="js/connection-status.js"></script>
```

Update login handlers:
```javascript
document.getElementById('loginMicrosoft').addEventListener('click', async () => {
    try {
        await authService.signInWithSSO('azure');
    } catch (error) {
        errorHandler.handleError(error, 'Microsoft Login');
    }
});
```

### Dashboard (index.html)

Add to `<head>`:
```html
<link rel="stylesheet" href="css/error-handler.css">
```

Add before `</body>`:
```html
<script src="js/error-handler.js"></script>
<script src="js/connection-status.js"></script>
```

Wrap data loading:
```javascript
async function loadDashboardData() {
    try {
        const data = await errorHandler.queueAction(
            async () => await databaseService.loadTableData('main'),
            { context: 'Load Dashboard Data', maxRetries: 3 }
        );
        
        updateDashboard(data);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}
```

### Admin Panel (admin-panel.html)

Add to `<head>`:
```html
<link rel="stylesheet" href="css/error-handler.css">
```

Add before `</body>`:
```html
<script src="js/error-handler.js"></script>
<script src="js/connection-status.js"></script>
```

Wrap admin operations:
```javascript
async function promoteUser(userId) {
    try {
        await errorHandler.queueAction(
            async () => await adminService.promoteToAdmin(userId),
            { context: 'Promote User', maxRetries: 2 }
        );
        
        errorHandler.showSuccessMessage('User promoted successfully');
        await refreshUserList();
    } catch (error) {
        console.error('Promotion failed:', error);
    }
}
```

## Step 5: Test Integration

1. Open the page in a browser
2. Open browser console (F12)
3. Verify you see: "Error handler initialized and ready for testing"
4. Test an operation that might fail
5. Verify error toast appears with user-friendly message
6. Simulate offline mode (DevTools > Network > Offline)
7. Perform an action and verify it's queued
8. Go back online and verify action is synced

## Common Patterns

### Pattern 1: Simple Operation with Retry

```javascript
await errorHandler.queueAction(
    async () => await someOperation(),
    { context: 'Operation Name', maxRetries: 3 }
);
```

### Pattern 2: Operation with Success Message

```javascript
try {
    await errorHandler.queueAction(
        async () => await someOperation(),
        { context: 'Operation Name' }
    );
    errorHandler.showSuccessMessage('Operation completed!');
} catch (error) {
    // Error already handled
}
```

### Pattern 3: Batch Operations

```javascript
for (const item of items) {
    try {
        await errorHandler.queueAction(
            async () => await processItem(item),
            { context: `Process ${item.id}`, maxRetries: 2 }
        );
    } catch (error) {
        console.error(`Failed to process ${item.id}`);
    }
}
```

### Pattern 4: Critical Operation (No Retry)

```javascript
try {
    await criticalOperation();
} catch (error) {
    errorHandler.handleError(error, 'Critical Operation');
    // Handle failure appropriately
}
```

## Checklist

- [ ] Added CSS file to `<head>`
- [ ] Added JS files before `</body>`
- [ ] Wrapped database operations with `queueAction()`
- [ ] Wrapped authentication operations with error handling
- [ ] Wrapped form submissions with error handling
- [ ] Added success messages for user feedback
- [ ] Tested offline scenario
- [ ] Tested error scenarios
- [ ] Verified toast notifications appear
- [ ] Verified connection status bar works

## Troubleshooting

### Error handler not defined
**Problem:** `errorHandler is not defined`
**Solution:** Ensure `error-handler.js` is loaded before your script

### Toasts not appearing
**Problem:** Error toasts don't show up
**Solution:** Ensure `error-handler.css` is loaded in `<head>`

### Connection status not showing
**Problem:** Connection status bar doesn't appear
**Solution:** Ensure `connection-status.js` is loaded after `error-handler.js`

### Actions not queuing offline
**Problem:** Actions fail immediately when offline
**Solution:** Wrap operations with `queueAction()` instead of try/catch only

## Next Steps

1. Review `ERROR_HANDLING_IMPLEMENTATION.md` for detailed documentation
2. Open `test-error-handling.html` to see all features in action
3. Check `error-handler-integration.js` for more integration examples
4. Monitor error statistics using `errorHandler.getErrorStats()`

## Support

For questions or issues:
1. Check browser console for error messages
2. Review the test page for working examples
3. Verify all required files are loaded
4. Check network tab for failed requests
