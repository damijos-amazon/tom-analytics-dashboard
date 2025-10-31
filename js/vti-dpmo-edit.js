// VTI DPMO Edit Functions
function editDPMOValue(rowIndex, field) {
    if (!dashboard2 || !dashboard2.data[rowIndex]) {
        console.error('Data not found');
        return;
    }
    
    const currentValue = dashboard2.data[rowIndex][field];
    const displayValue = currentValue === 0 ? '0 (100% compliance)' : currentValue.toString();
    
    const newValue = prompt(`Edit ${field} for ${dashboard2.data[rowIndex].name}:\n\nCurrent: ${displayValue}\n\nNote: 0 = 100% compliance, higher numbers = lower compliance`, Math.round(currentValue));
    
    if (newValue === null) return; // User cancelled
    
    const numValue = parseFloat(newValue);
    if (isNaN(numValue) || numValue < 0) {
        console.warn('Please enter a valid number (0 or greater)');
        return;
    }
    
    // Update the value
    dashboard2.data[rowIndex][field] = numValue;
    
    // Recalculate status using the main logic
    dashboard2.calculateChanges();
    
    // Re-render table using custom render to keep edit buttons
    if (dashboard2.customRenderTable) {
        dashboard2.customRenderTable();
    } else {
        dashboard2.renderTable();
    }
    dashboard2.updatePodium();
    dashboard2.persistData();
    
    console.log(`Updated ${field} for ${dashboard2.data[rowIndex].name}`);
}



// Initialize when dashboard2 is ready - OVERRIDE renderTable method
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (typeof dashboard2 !== 'undefined') {
            console.log('VTI DPMO Edit: Overriding renderTable for dashboard2');
            
            // Store original renderTable
            const originalRenderTable = dashboard2.renderTable;
            
            // Set customRenderTable so the wrapper uses it
            dashboard2.customRenderTable = function() {
                if (this.tableId !== 'tableBody2') {
                    originalRenderTable.call(this);
                    return;
                }
                
                const tableBody = document.getElementById(this.tableId);
                if (!tableBody) return;

                tableBody.innerHTML = '';

                // Filter out excluded employees
                const employees = window.simpleEmployees || [];
                const filteredData = this.data.filter(row => {
                    const employee = employees.find(emp => 
                        emp.badgeId.toLowerCase() === row.name.toLowerCase() ||
                        emp.username.toLowerCase() === row.name.toLowerCase() ||
                        emp.email.toLowerCase() === row.name.toLowerCase()
                    );
                    return !employee || !employee.excludeFromTables;
                });

                filteredData.forEach((row, index) => {
                    const tr = document.createElement('tr');
                    tr.className = 'table-row';
                    
                    // Get full name immediately
                    const employee = employees.find(emp => 
                        emp.badgeId.toLowerCase() === row.name.toLowerCase() ||
                        emp.username.toLowerCase() === row.name.toLowerCase() ||
                        emp.email.toLowerCase() === row.name.toLowerCase()
                    );
                    const displayName = employee ? employee.fullName : row.name;
                    
                    // Raw data is VIOLATION COUNT: 0 violations = 100%, 1 violation = 99%
                    // Change % shows CURRENT compliance percentage
                    const priorCompliance = 100 - row.priorMonth;
                    const currentCompliance = 100 - row.currentMonth;
                    const changePercent = currentCompliance;
                    const actualChange = currentCompliance - priorCompliance;
                    
                    // Red if decreased, green if increased or stayed same
                    const changeClass = actualChange < 0 ? 'negative' : actualChange > 0 ? 'positive' : 'neutral';
                    const statusClass = row.status ? `status-${row.status.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` : '';
                    
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${displayName}</td>
                        <td>
                            ${Math.round(row.priorMonth)} 
                            <button class="btn-edit" onclick="editDPMOValue(${index}, 'priorMonth')" title="Edit Prior Month">✏️</button>
                        </td>
                        <td>
                            ${Math.round(row.currentMonth)} 
                            <button class="btn-edit" onclick="editDPMOValue(${index}, 'currentMonth')" title="Edit Current Month">✏️</button>
                        </td>
                        <td class="${changeClass}">${actualChange < 0 ? '-' : actualChange > 0 ? '+' : ''}${currentCompliance.toFixed(2)}%</td>
                        <td>${row.status ? `<span class="${statusClass}">${row.status}</span>` : ''}</td>
                        <td><button class="btn-delete" onclick="dashboards['${this.tableId}'].deleteRow(${index})">🗑️</button></td>
                    `;
                    
                    tableBody.appendChild(tr);
                });
            };
            
            // Trigger initial render with edit buttons
            dashboard2.renderTable();
        }
    }, 500);
});