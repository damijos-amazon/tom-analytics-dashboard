/**
 * Global Utility Functions
 * Core functions used throughout the application
 */

// Navigation Functions
function toggleNav() {
    const navPanel = document.getElementById('navPanel');
    if (navPanel) {
        navPanel.style.display = navPanel.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleBenchmarks() {
    const benchmarkList = document.getElementById('benchmarkList');
    const arrow = document.getElementById('arrow');
    if (benchmarkList && arrow) {
        const isHidden = benchmarkList.style.display === 'none';
        benchmarkList.style.display = isHidden ? 'block' : 'none';
        arrow.textContent = isHidden ? '▲' : '▼';
    }
}

function goTo(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close nav panel after navigation
        const navPanel = document.getElementById('navPanel');
        if (navPanel) {
            navPanel.style.display = 'none';
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// File Naming Legend
function toggleFileNamingLegend() {
    const legend = document.getElementById('fileNamingLegend');
    if (legend) {
        legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
    }
}

// Data Management Functions
function clearAllData() {
    if (!confirm('⚠️ Are you sure you want to clear ALL data from ALL tables? This cannot be undone!')) {
        return;
    }
    
    try {
        let clearedCount = 0;
        
        // Clear all dashboards
        if (window.dashboards) {
            Object.values(window.dashboards).forEach(dashboard => {
                if (dashboard && typeof dashboard.clearData === 'function') {
                    dashboard.clearData();
                    clearedCount++;
                }
            });
        }
        
        // Clear leaderboard
        if (typeof clearLeaderboard === 'function') {
            clearLeaderboard();
        }
        
        showGlobalMessage(`✅ Cleared data from ${clearedCount} tables`, 'success');
        console.log(`Cleared data from ${clearedCount} tables`);
    } catch (error) {
        console.error('Error clearing all data:', error);
        showGlobalMessage('❌ Error clearing data: ' + error.message, 'error');
    }
}

function exportAllData() {
    try {
        const exportData = {
            version: '3.0.0',
            exportDate: new Date().toISOString(),
            tables: {}
        };
        
        let totalRecords = 0;
        
        // Export all dashboard data
        if (window.dashboards) {
            Object.entries(window.dashboards).forEach(([tableId, dashboard]) => {
                if (dashboard && dashboard.data && Array.isArray(dashboard.data)) {
                    const tableName = dashboard.tableName || dashboard.getTableName?.() || tableId;
                    exportData.tables[tableId] = {
                        tableName: tableName,
                        data: dashboard.data,
                        recordCount: dashboard.data.length
                    };
                    totalRecords += dashboard.data.length;
                }
            });
        }
        
        // Export leaderboard data if available
        if (window.leaderboardData && Array.isArray(window.leaderboardData)) {
            exportData.leaderboard = window.leaderboardData;
        }
        
        // Export employee data if available
        if (window.simpleEmployees && Array.isArray(window.simpleEmployees)) {
            exportData.employees = window.simpleEmployees;
        }
        
        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TOM_Dashboard_Complete_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showGlobalMessage(`✅ Exported ${totalRecords} records from ${Object.keys(exportData.tables).length} tables`, 'success');
        console.log(`Exported complete backup with ${totalRecords} total records`);
    } catch (error) {
        console.error('Error exporting all data:', error);
        showGlobalMessage('❌ Error exporting data: ' + error.message, 'error');
    }
}

// Logout Function
async function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        // Clear auth manager session
        if (window.authManager && typeof window.authManager.signOut === 'function') {
            await window.authManager.signOut();
        }
        
        // Clear local storage (optional - comment out if you want to preserve data)
        // localStorage.clear();
        
        // Redirect to login
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Global Message Display
function showGlobalMessage(message, type = 'info') {
    // Try to use dashboard message system if available
    if (window.dashboards && Object.values(window.dashboards)[0]) {
        const firstDashboard = Object.values(window.dashboards)[0];
        if (typeof firstDashboard.showMessage === 'function') {
            firstDashboard.showMessage(message, type);
            return;
        }
    }
    
    // Fallback to console and alert
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background: #28a745; color: white;' : ''}
        ${type === 'error' ? 'background: #dc3545; color: white;' : ''}
        ${type === 'info' ? 'background: #17a2b8; color: white;' : ''}
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// Add CSS animations
if (!document.getElementById('global-utilities-styles')) {
    const style = document.createElement('style');
    style.id = 'global-utilities-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Global utilities loaded');
