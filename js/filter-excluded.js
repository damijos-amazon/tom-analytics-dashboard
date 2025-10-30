// FILTER EXCLUDED EMPLOYEES FROM EXISTING DATA
// This removes excluded employees from all tables immediately

function filterExcludedEmployeesFromAllTables() {
    const dashboardsRef = window.dashboards || {};
    const employees = window.simpleEmployees || [];
    
    if (employees.length === 0) {
        console.warn('No employees in Employee Management System to check against.');
        return;
    }
    
    let totalRemoved = 0;
    
    Object.keys(dashboardsRef).forEach(tableKey => {
        const dashboard = dashboardsRef[tableKey];
        if (!dashboard || !dashboard.data) return;
        
        const originalLength = dashboard.data.length;
        
        // Filter out excluded employees
        dashboard.data = dashboard.data.filter(row => {
            const employee = employees.find(emp => 
                emp.badgeId.toLowerCase() === row.name.toLowerCase() ||
                (emp.username && emp.username.toLowerCase() === row.name.toLowerCase()) ||
                (emp.email && emp.email.toLowerCase() === row.name.toLowerCase())
            );
            
            // Keep if employee doesn't exist OR is not excluded
            const shouldKeep = !employee || !employee.excludeFromTables;
            
            if (!shouldKeep) {
                console.log(`Removing excluded employee from ${tableKey}: ${row.name}`);
            }
            
            return shouldKeep;
        });
        
        const removed = originalLength - dashboard.data.length;
        totalRemoved += removed;
        
        if (removed > 0) {
            // Recalculate and re-render
            dashboard.calculateChanges();
            dashboard.renderTable();
            dashboard.updatePodium();
            dashboard.persistData();
        }
    });
    
    // Also update leaderboard
    if (typeof updateLeaderboard === 'function') {
        updateLeaderboard();
    }
    
    if (totalRemoved > 0) {
        console.log(`✅ Removed ${totalRemoved} excluded employee record(s) from all tables!`);
    } else {
        console.log('ℹ️ No excluded employees found in tables.');
    }
}

// Add button to navigation or run automatically when employees are updated
document.addEventListener('DOMContentLoaded', function() {
    // Auto-filter when employee management modal closes
    const originalSaveEmployee = window.saveSimpleEmployee;
    if (originalSaveEmployee) {
        window.saveSimpleEmployee = function() {
            originalSaveEmployee();
            // Filter after save
            setTimeout(filterExcludedEmployeesFromAllTables, 500);
        };
    }
});
