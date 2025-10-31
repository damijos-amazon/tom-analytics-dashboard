/**
 * Forgot Password Page Script
 * Handles password reset request form submission
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetRequestForm');
    const emailInput = document.getElementById('email');
    const resetBtn = document.getElementById('resetBtn');
    const messageDiv = document.getElementById('message');

    // Initialize auth manager
    authManager.initialize();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Disable button and show loading
        resetBtn.disabled = true;
        const originalText = resetBtn.textContent;
        resetBtn.innerHTML = 'Sending... <span class="loading"></span>';
        messageDiv.classList.remove('show');
        
        // Request password reset
        const result = await authManager.requestPasswordReset(email);
        
        // Show message
        messageDiv.textContent = result.message;
        messageDiv.className = 'message ' + (result.success ? 'success' : 'error') + ' show';
        
        // Re-enable button
        resetBtn.disabled = false;
        resetBtn.textContent = originalText;
        
        // Clear form on success
        if (result.success) {
            emailInput.value = '';
        }
    });
});
