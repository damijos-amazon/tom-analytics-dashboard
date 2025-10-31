/**
 * Reset Password Page Script
 * Handles password reset form submission with token validation
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const resetBtn = document.getElementById('resetBtn');
    const messageDiv = document.getElementById('message');

    // Initialize auth manager
    await authManager.initialize();

    // Verify user has valid reset token
    const hasValidToken = await authManager.hasValidResetToken();
    
    if (!hasValidToken) {
        messageDiv.textContent = 'Invalid or expired reset link. Please request a new password reset.';
        messageDiv.className = 'message error show';
        form.style.display = 'none';
        
        // Add link back to forgot password page
        setTimeout(() => {
            window.location.href = 'forgot-password.html';
        }, 3000);
        
        return;
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match';
            messageDiv.className = 'message error show';
            return;
        }
        
        // Disable button and show loading
        resetBtn.disabled = true;
        const originalText = resetBtn.textContent;
        resetBtn.innerHTML = 'Resetting... <span class="loading"></span>';
        messageDiv.classList.remove('show');
        
        // Reset password
        const result = await authManager.resetPassword(password);
        
        // Show message
        messageDiv.textContent = result.message;
        messageDiv.className = 'message ' + (result.success ? 'success' : 'error') + ' show';
        
        // Re-enable button
        resetBtn.disabled = false;
        resetBtn.textContent = originalText;
        
        // Redirect to login on success
        if (result.success) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });

    // Real-time password match validation
    confirmPasswordInput.addEventListener('input', () => {
        if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.style.borderColor = '#dc3545';
        } else {
            confirmPasswordInput.style.borderColor = '#e0e0e0';
        }
    });
});
