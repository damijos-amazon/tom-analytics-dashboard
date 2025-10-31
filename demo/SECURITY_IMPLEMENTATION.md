# Security Implementation Guide

## Overview

This document describes the security measures implemented in the TOM Analytics Dashboard authentication and database system.

## Security Features

### 1. HTTPS Enforcement and Secure Headers

**Implementation**: `demo/js/security-config.js`

#### Features:
- **HTTPS Enforcement**: Automatically redirects HTTP requests to HTTPS in production
- **Content Security Policy (CSP)**: Restricts content sources to prevent XSS attacks
- **X-Frame-Options**: Prevents clickjacking by blocking iframe embedding
- **X-Content-Type-Options**: Prevents MIME type sniffing attacks
- **Secure Cookie Flags**: Configures cookies with Secure, HttpOnly, and SameSite attributes

#### Usage:
```javascript
const securityConfig = new SecurityConfig();
securityConfig.initialize();

// Validate URLs before making requests
if (securityConfig.validateSecureURL(apiUrl)) {
    // Make secure request
}

// Use secure fetch wrapper
const response = await securityConfig.secureFetch(url, options);
```

#### CSP Directives:
- `default-src 'self'`: Only load resources from same origin by default
- `script-src`: Allow scripts from self, CDN, and Supabase
- `connect-src`: Allow connections to Supabase and IP lookup service
- `frame-ancestors 'none'`: Prevent embedding in iframes
- `form-action 'self'`: Only allow form submissions to same origin

### 2. Token Management

**Implementation**: `demo/js/token-manager.js`

#### Features:
- **Secure Token Storage**: Uses sessionStorage (cleared on tab close)
- **Token Validation**: Validates JWT format and expiry
- **Automatic Token Rotation**: Rotates tokens 10 minutes before expiry
- **Token Invalidation**: Properly invalidates tokens on logout
- **Expiry Checking**: Monitors token expiry with 5-minute buffer

#### Usage:
```javascript
const tokenManager = new TokenManager(supabase);

// Store tokens after authentication
tokenManager.storeTokens(session);

// Get current access token
const accessToken = tokenManager.getAccessToken();

// Check if token is expired
if (tokenManager.isTokenExpired()) {
    await tokenManager.rotateTokens();
}

// Invalidate tokens on logout
await tokenManager.invalidateTokens();
```

#### Token Lifecycle:
1. **Storage**: Tokens stored in sessionStorage after authentication
2. **Validation**: Checked for expiry before each use
3. **Rotation**: Automatically rotated 10 minutes before expiry
4. **Invalidation**: Cleared from storage and server on logout

### 3. Data Encryption

**Implementation**: `demo/js/encryption-service.js`

#### Features:
- **AES-GCM Encryption**: Industry-standard encryption algorithm
- **Key Derivation**: PBKDF2 with 100,000 iterations for key generation
- **SSO Credential Encryption**: Encrypts sensitive SSO configuration data
- **Secure Random Generation**: Uses Web Crypto API for random values
- **Data Sanitization**: Prevents XSS through input sanitization

#### Usage:
```javascript
const encryptionService = new EncryptionService();
await encryptionService.initialize();

// Encrypt sensitive data
const encrypted = await encryptionService.encrypt(plaintext);

// Decrypt data
const decrypted = await encryptionService.decrypt(encrypted);

// Encrypt SSO configuration
const encryptedConfig = await encryptionService.encryptSSOConfig(ssoConfig);

// Decrypt SSO configuration
const decryptedConfig = await encryptionService.decryptSSOConfig(encryptedConfig);

// Generate secure random token
const token = encryptionService.generateSecureToken(32);

// Hash sensitive data (one-way)
const hash = await encryptionService.hash(data);
```

#### Encrypted Fields:
SSO configurations encrypt the following sensitive fields:
- `clientSecret`
- `apiKey`
- `privateKey`
- `certificate`
- `password`
- `token`

### 4. Supabase Security Configuration

**Implementation**: `demo/js/security-init.js`

#### Features:
- **Secure Cookie Configuration**: Proper SameSite, Secure, and HttpOnly flags
- **Auto Token Refresh**: Automatic token refresh before expiry
- **Session Persistence**: Secure session storage
- **Rate Limiting**: Events per second limits on realtime connections

#### Configuration:
```javascript
const supabase = createSecureSupabaseClient(supabaseUrl, supabaseKey, securityConfig);
```

Cookie options:
- `secure: true` (production only)
- `sameSite: 'Strict'`
- `httpOnly: true`
- `maxAge: 28800` (8 hours)

## Security Best Practices

### 1. Authentication
- ✅ Use SSO providers (Azure, Google, Okta) for authentication
- ✅ Implement session timeout (8 hours with 30-minute warning)
- ✅ Automatic token rotation before expiry
- ✅ Proper token invalidation on logout
- ✅ Audit logging for all authentication events

### 2. Authorization
- ✅ Role-based access control (Super Admin, Admin, Manager)
- ✅ Row-Level Security (RLS) policies in Supabase
- ✅ Permission checks before sensitive operations
- ✅ Cannot modify Super Admin accounts

### 3. Data Protection
- ✅ HTTPS enforcement in production
- ✅ Encryption of sensitive SSO credentials
- ✅ Secure token storage (sessionStorage)
- ✅ Input sanitization to prevent XSS
- ✅ Content Security Policy headers

### 4. Monitoring
- ✅ Audit logging for all user actions
- ✅ Security event logging
- ✅ CSP violation monitoring
- ✅ Failed authentication tracking

## Database Security

### Row-Level Security (RLS) Policies

**Users Table**:
- Users can view their own record
- Admins can view all users
- Only Super Admin can modify user roles

**Table Data**:
- All authenticated users can read/write table data
- Changes are logged with user ID

**Audit Logs**:
- Only Admins can read audit logs
- All users' actions are automatically logged

**SSO Configuration**:
- Only Super Admin can read/write SSO config
- Sensitive credentials are encrypted before storage

## Security Checklist

### Production Deployment

- [ ] Ensure HTTPS is enabled on hosting platform
- [ ] Configure proper CORS settings in Supabase
- [ ] Set up proper environment variables (no hardcoded keys)
- [ ] Enable Supabase RLS policies on all tables
- [ ] Configure proper CSP headers at server level
- [ ] Set up security monitoring and alerting
- [ ] Regular security audits of audit logs
- [ ] Implement rate limiting on API endpoints
- [ ] Set up backup encryption for data exports
- [ ] Configure proper session timeout values
- [ ] Test token rotation and invalidation
- [ ] Verify SSO provider configurations
- [ ] Enable 2FA for Super Admin accounts (if supported)

### Development

- [ ] Never commit API keys or secrets to version control
- [ ] Use environment variables for configuration
- [ ] Test security features in staging environment
- [ ] Validate all user inputs
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Keep dependencies up to date
- [ ] Regular security scanning of code

## Security Incident Response

### If a Security Breach is Suspected:

1. **Immediate Actions**:
   - Invalidate all active sessions
   - Rotate all API keys and secrets
   - Review audit logs for suspicious activity
   - Block affected user accounts if necessary

2. **Investigation**:
   - Check audit logs for unauthorized access
   - Review CSP violation logs
   - Analyze authentication patterns
   - Identify compromised data

3. **Remediation**:
   - Patch security vulnerabilities
   - Update affected credentials
   - Notify affected users
   - Document incident and response

4. **Prevention**:
   - Implement additional security measures
   - Update security policies
   - Conduct security training
   - Regular security audits

## API Security

### Secure API Calls

All API calls should:
- Use HTTPS only
- Include proper authentication headers
- Validate responses
- Handle errors securely (no sensitive data in error messages)
- Implement retry logic with exponential backoff
- Use the secure fetch wrapper

Example:
```javascript
const response = await securityConfig.secureFetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
});
```

## Compliance

### Data Protection
- User data is encrypted in transit (HTTPS)
- Sensitive credentials are encrypted at rest
- Audit logs track all data access
- Users can request data export/deletion

### Access Control
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews
- Audit trail for all changes

## Testing Security

### Manual Testing
1. Verify HTTPS redirect works
2. Test token expiry and rotation
3. Verify session timeout warning appears
4. Test logout invalidates tokens
5. Verify CSP blocks unauthorized scripts
6. Test encryption/decryption of SSO config
7. Verify RLS policies block unauthorized access

### Automated Testing
- Unit tests for encryption/decryption
- Integration tests for authentication flow
- Security scanning tools
- Dependency vulnerability scanning

## Support and Updates

### Keeping Security Up to Date
- Monitor Supabase security advisories
- Update dependencies regularly
- Review and update CSP policies
- Audit security logs weekly
- Conduct security reviews quarterly

### Resources
- [Supabase Security Documentation](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Contact

For security concerns or to report vulnerabilities, contact your security team immediately.
