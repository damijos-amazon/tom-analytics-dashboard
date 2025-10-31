# Security Quick Reference Guide

## Quick Start

### Initialize Security Services

```javascript
// Initialize all security services at once
const services = await initializeSecurityServices(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
);

// Access individual services
const { 
    supabase, 
    securityConfig, 
    encryptionService, 
    tokenManager, 
    authService, 
    databaseService, 
    adminPanelService 
} = services;
```

## Common Tasks

### 1. User Authentication

```javascript
// Sign in with SSO
await authService.signInWithSSO('azure'); // or 'google', 'okta'

// Check if authenticated
if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
}

// Check user role
if (authService.hasRole('admin')) {
    // Admin-only functionality
}

// Sign out
await authService.signOut();
```

### 2. Token Management

```javascript
// Get current access token
const token = tokenManager.getAccessToken();

// Check if token is expired
if (tokenManager.isTokenExpired()) {
    await tokenManager.rotateTokens();
}

// Get token info
const info = tokenManager.getTokenInfo();
console.log('Token expires in:', info.timeUntilExpiry, 'seconds');
```

### 3. Data Encryption

```javascript
// Initialize encryption
const encryptionService = new EncryptionService();
await encryptionService.initialize();

// Encrypt sensitive data
const encrypted = await encryptionService.encrypt('sensitive data');

// Decrypt data
const decrypted = await encryptionService.decrypt(encrypted);

// Encrypt SSO configuration
const ssoConfig = {
    clientId: 'abc123',
    clientSecret: 'secret',
    apiKey: 'key123'
};
const encryptedConfig = await encryptionService.encryptSSOConfig(ssoConfig);
```

### 4. Secure API Calls

```javascript
// Validate URL is secure
if (securityConfig.validateSecureURL(apiUrl)) {
    // Make request
}

// Use secure fetch wrapper
const response = await securityConfig.secureFetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

### 5. Input Sanitization

```javascript
// Sanitize user input
const userInput = '<script>alert("xss")</script>';
const safe = securityConfig.sanitizeInput(userInput);

// Sanitize JSON data
const jsonString = '{"name": "<script>alert(1)</script>"}';
const safeData = securityConfig.sanitizeJSON(jsonString);
```

### 6. Admin Operations

```javascript
// Configure SSO (Super Admin only)
await adminPanelService.configureSSOProvider('azure', {
    clientId: 'your-client-id',
    clientSecret: 'your-secret',
    tenantId: 'your-tenant'
});

// Get SSO configuration (decrypted)
const config = await adminPanelService.getSSOConfiguration('azure');

// Block user
await adminPanelService.blockUser(userId, 'Violation of terms');

// Get audit logs
const logs = await adminPanelService.getAuditLogs({
    startDate: '2025-01-01',
    action: 'login',
    limit: 100
});
```

## Security Checklist

### Before Deployment

- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Supabase RLS policies enabled
- [ ] CSP headers configured
- [ ] Session timeout tested
- [ ] Token rotation verified
- [ ] Encryption tested
- [ ] Audit logging enabled

### Regular Maintenance

- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Rotate API keys as needed
- [ ] Monitor CSP violations
- [ ] Check for failed login attempts

## Security Headers

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://api.ipify.org;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### Cookie Configuration

```javascript
{
    name: 'sb-auth-token',
    secure: true,           // HTTPS only
    sameSite: 'Strict',     // CSRF protection
    httpOnly: true,         // XSS protection
    maxAge: 28800           // 8 hours
}
```

## Error Handling

### Authentication Errors

```javascript
try {
    await authService.signInWithSSO('azure');
} catch (error) {
    if (error.message.includes('blocked')) {
        // User is blocked
        showBlockedMessage();
    } else {
        // Other authentication error
        showErrorMessage('Login failed. Please try again.');
    }
}
```

### Encryption Errors

```javascript
try {
    const encrypted = await encryptionService.encrypt(data);
} catch (error) {
    console.error('Encryption failed:', error);
    // Handle encryption failure
}
```

### Token Errors

```javascript
try {
    await tokenManager.rotateTokens();
} catch (error) {
    // Token rotation failed - force re-login
    await authService.signOut();
    window.location.href = '/login';
}
```

## Testing

### Run Security Tests

Open `demo/test-security.html` in your browser and click "Run All Tests".

### Manual Testing

1. **HTTPS Redirect**: Visit HTTP URL, verify redirect to HTTPS
2. **Session Timeout**: Wait for timeout warning (or modify timeout for testing)
3. **Token Rotation**: Monitor console for automatic rotation
4. **Encryption**: Use test page to verify encrypt/decrypt
5. **CSP**: Check browser console for CSP violations

## Troubleshooting

### Issue: "Encryption service not initialized"

**Solution**: Call `await encryptionService.initialize()` before using encryption.

### Issue: "Token has expired"

**Solution**: Token manager should auto-rotate. If not, call `await tokenManager.rotateTokens()`.

### Issue: "Insecure URL not allowed"

**Solution**: Ensure all API URLs use HTTPS. Localhost is allowed for development.

### Issue: "Only super admin can..."

**Solution**: Check user role with `authService.hasRole('super_admin')`.

### Issue: CSP violations in console

**Solution**: Update CSP directives in `security-config.js` to allow required sources.

## Best Practices

### DO ✅

- Always use HTTPS in production
- Initialize security services on app startup
- Validate all user inputs
- Use encryption for sensitive data
- Log all security events
- Rotate tokens before expiry
- Check user permissions before operations
- Use secure cookie flags
- Implement CSP headers
- Regular security audits

### DON'T ❌

- Store tokens in localStorage (use sessionStorage)
- Hardcode API keys or secrets
- Skip input validation
- Ignore CSP violations
- Allow HTTP in production
- Store sensitive data unencrypted
- Skip audit logging
- Use weak encryption
- Expose error details to users
- Trust client-side validation alone

## Resources

- [Full Security Documentation](./SECURITY_IMPLEMENTATION.md)
- [Test Suite](./test-security.html)
- [Supabase Security Docs](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Support

For security issues or questions, contact your security team immediately.

**Never commit sensitive data to version control!**
