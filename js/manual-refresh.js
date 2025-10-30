// Manual Refresh Function for Tables and Podiums
function manualRefreshTable(tableBodyId, podiumId) {
    // Prevent any default behavior and stop event propagation
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const button = event ? event.currentTarget : null;
    
    // Add spinning animation
    if (button) {
        button.classList.add('refreshing');
        // Prevent button from getting focus (which can cause scroll)
        button.blur();
    }
    
    // Get the dashboard instance
    const dashboardsRef = window.dashboards || (typeof dashboards !== 'undefined' ? dashboards : null);
    
    if (!dashboardsRef) {
        console.error('Dashboards not found');
        button.classList.remove('refreshing');
        return;
    }
    
    // Handle leaderboard separately
    if (tableBodyId === 'leaderboardBody') {
        setTimeout(() => {
            try {
                if (typeof updateLeaderboard === 'function') {
                    updateLeaderboard();
                }
                showRefreshFeedback(button, true);
            } catch (error) {
                console.error('Error refreshing leaderboard:', error);
                showRefreshFeedback(button, false);
            }
            button.classList.remove('refreshing');
        }, 600);
        return;
    }
    
    // Get the dashboard for this table
    const dashboard = dashboardsRef[tableBodyId];
    
    if (!dashboard) {
        console.error('Dashboard not found for:', tableBodyId);
        button.classList.remove('refreshing');
        return;
    }
    
    // Simulate refresh with a slight delay for visual feedback
    setTimeout(() => {
        try {
            // Re-calculate changes and re-render
            dashboard.calculateChanges();
            dashboard.renderTable();
            dashboard.updatePodium();
            
            // Show success feedback
            showRefreshFeedback(button, true);
        } catch (error) {
            console.error('Error refreshing table:', error);
            showRefreshFeedback(button, false);
        }
        
        // Remove spinning animation
        button.classList.remove('refreshing');
    }, 600);
}

// Show visual feedback after refresh
function showRefreshFeedback(button, success) {
    const originalColor = button.style.background;
    
    if (success) {
        button.style.background = 'linear-gradient(145deg, #2ecc71, #27ae60)';
    } else {
        button.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
    }
    
    setTimeout(() => {
        button.style.background = '';
    }, 800);
}
