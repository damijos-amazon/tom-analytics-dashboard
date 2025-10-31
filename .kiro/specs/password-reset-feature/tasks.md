wh# Implementation Plan

- [x] 1. Update login page with forgot password link


  - Add "Forgot Password?" link below password field in demo/login.html
  - Link should navigate to forgot-password.html
  - Style link to match existing design
  - _Requirements: 5.1_



- [ ] 2. Add password reset methods to AuthManager
  - Add requestPasswordReset(email) method to demo/js/auth-manager.js
  - Implement email validation with @amazon.com check
  - Call Supabase resetPasswordForEmail() with redirect URL
  - Return generic success message for security

  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.1 Add resetPassword method
  - Add resetPassword(newPassword) method to AuthManager
  - Implement password length validation (min 6 characters)
  - Call Supabase updateUser() to change password

  - Handle token validation errors
  - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3_

- [x] 2.2 Add token validation method


  - Add hasValidResetToken() method to AuthManager
  - Check for valid password recovery session
  - Return boolean indicating token validity
  - _Requirements: 2.3, 4.2, 4.3_

- [ ] 3. Create forgot password page
  - Create demo/forgot-password.html with email form


  - Copy styling from login.html for consistency
  - Add email input field with placeholder
  - Add submit button with loading state
  - Add "Back to Login" link
  - Add message div for success/error display
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [ ] 4. Create forgot password script
  - Create demo/js/forgot-password.js

  - Initialize authManager on page load
  - Handle form submission
  - Validate email format and domain
  - Call authManager.requestPasswordReset()
  - Display success/error messages
  - Show loading indicator during processing
  - Clear form on success
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.2_

- [x] 5. Create reset password page

  - Create demo/reset-password.html with password form
  - Copy styling from login.html for consistency
  - Add two password input fields (password and confirm)
  - Add submit button with loading state
  - Add message div for success/error display
  - _Requirements: 3.1, 5.3_

- [x] 6. Create reset password script



  - Create demo/js/reset-password.js
  - Initialize authManager on page load
  - Validate reset token on page load using hasValidResetToken()
  - Redirect to forgot-password.html if token invalid
  - Handle form submission
  - Validate password length (min 6 characters)
  - Validate passwords match
  - Call authManager.resetPassword()
  - Display success/error messages
  - Show loading indicator during processing
  - Redirect to login.html after 2 seconds on success
  - Add real-time password match validation
  - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 5.2, 5.4, 5.5_

- [ ] 7. Configure Supabase email settings
  - Log into Supabase dashboard
  - Navigate to Authentication > Email Templates
  - Customize "Reset Password" email template
  - Add redirect URL to Authentication > URL Configuration
  - Add http://localhost:5500/demo/reset-password.html for development
  - Test email delivery
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 8. Test password reset flow
  - Test requesting password reset with valid email
  - Verify email is received with reset link
  - Test clicking reset link and redirecting to reset page
  - Test entering new password and confirming
  - Verify redirect to login page
  - Test logging in with new password
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Test error scenarios
  - Test requesting reset with invalid email format
  - Test requesting reset with non-@amazon.com email
  - Test using expired reset token
  - Test using invalid reset token
  - Test entering password shorter than 6 characters
  - Test entering mismatched passwords
  - Verify all error messages display correctly
  - _Requirements: 1.4, 2.3, 3.2, 3.3, 4.2, 4.3, 5.4_

- [ ] 10. Test security features
  - Verify generic success message for non-existent emails
  - Test rate limiting by requesting multiple resets
  - Verify token is invalidated after successful reset
  - Verify old password no longer works after reset
  - Test that reset link cannot be reused
  - _Requirements: 2.4, 2.5, 4.1, 4.4, 4.5_
