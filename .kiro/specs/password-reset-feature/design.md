# Design Document

## Overview

This design adds password reset functionality to the TOM Analytics Dashboard authentication system. The feature leverages Supabase Auth's built-in password reset capabilities, which handle token generation, email delivery, and token validation. The implementation includes UI components for requesting resets and setting new passwords, along with proper error handling and user feedback.

## Architecture

### High-Level Flow

```
Password Reset Flow:

1. User clicks "Forgot Password?" on login page
2. User enters email address
3. System calls Supabase resetPasswordForEmail()
4. Supabase sends email with reset link
5. User clicks link in email
6. User redirected to reset-password.html with token
7. User enters new password (twice)
8. System calls Supabase updateUser() with new password
9. Password updated, user redirected to login
```

### Component Responsibilities

1. **Login Page (login.html)**: Add "Forgot Password?" link
2. **Password Reset Request Page (forgot-password.html)**: Form to request reset email
3. **Password Reset Page (reset-password.html)**: Form to set new password
4. **AuthManager (auth-manager.js)**: Add password reset methods
5. **Supabase Auth**: Handle token generation, email delivery, and validation

## Components and Interfaces

### 1. Update Login Page

**File**: `demo/login.html`

**Changes**: Add "Forgot Password?" link below the password field

### 2. Create Password Reset Request Page

**File**: `demo/forgot-password.html`

**Purpose**: Allow users to request a password reset email

**Key Features**:
- Email input field with @amazon.com validation
- Submit button with loading state
- Success/error message display
- Back to login link
- Same styling as login.html for consistency

### 3. Create Password Reset Page

**File**: `demo/reset-password.html`

**Purpose**: Allow users to set a new password using the reset token

**Key Features**:
- Two password input fields (password and confirm password)
- Submit button with loading state
- Token validation on page load
- Success/error message display
- Automatic redirect to login after success

### 4. Update AuthManager Class

**File**: `demo/js/auth-manager.js`

**New Methods**:
- `requestPasswordReset(email)` - Request password reset email
- `resetPassword(newPassword)` - Reset password with new password
- `hasValidResetToken()` - Verify if user has a valid reset token

### 5. Create Supporting Scripts

**Files**:
- `demo/js/forgot-password.js` - Handle forgot password form
- `demo/js/reset-password.js` - Handle reset password form

## Error Handling

### Client-Side Validation
- Email format validation
- @amazon.com domain validation
- Password length validation (minimum 6 characters)
- Password match validation

### Error Messages
- Invalid email format: "Please enter a valid email address"
- Non-Amazon email: "Only Amazon employees can access this dashboard"
- Password too short: "Password must be at least 6 characters long"
- Passwords don't match: "Passwords do not match"
- Invalid/expired token: "Invalid or expired reset link"
- Generic success: "If an account exists with this email, you will receive a password reset link shortly"

## Security Considerations

- Supabase generates cryptographically secure tokens
- Tokens are single-use and expire after 60 minutes
- Generic success messages prevent account enumeration
- Built-in rate limiting (3 requests per hour per email)

## Testing Strategy

- Test full password reset flow
- Test expired token handling
- Test invalid token handling
- Test email validation
- Test password validation
