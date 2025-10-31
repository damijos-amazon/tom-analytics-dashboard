// PPO Compliance Edit Functions
function editPPOValue(rowIndex, field) {
    if (!dashboard5 || !dashboard5.data[rowIndex]) {
        console.error('Data not found');
        return;
    }
    
    const currentValue = dashboard5.data[rowIndex][field];
    const displayValue = currentValue === 0 ? '0 (100% compliance)' : currentValue.toString();
    
    const newValue = prompt(`Edit ${field} for ${dashboard5.data[rowIndex].name}:\n\nCurrent: ${displayValue}\n\nNote: 0 = 100% compliance, higher numbers = lower compliance`, Math.round(currentValue));
    
    if (newValue === null) return; // User cancelled
    
    const numValue = parseFloat(newValue);
    if (isNaN(numValue) || numValue < 0) {
        console.warn('Please enter a valid number (0 or greater)');
        return;
    }
    
    // Update the value
    dashboard5.data[rowIndex][field] = numValue;
    
    // Recalculate status using the main logic
    dashboard5.calculateChanges();
    
    // Re-render table using custom render to keep edit buttons
    if (dashboard5.customRenderTable) {
        dashboard5.customRenderTable();
    } else {
        dashboard5.renderTable();
    }
    dashboard5.updatePodium();
    dashboard5.persistData();
    
    console.log(`Updated ${field} for ${dashboard5.data[rowIndex].name}`);}




// Initialize when dashboard5 is ready - OVERRIDE renderTable method
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (typeof dashboard5 !== 'undefined') {
            console.log('PPO Edit: Overriding renderTable for dashboard5');
            
            // Store original renderTable
            const originalRenderTable = dashboard5.renderTable;
            
            // Set customRenderTable so the wrapper uses it
            dashboard5.customRenderTable = function() {
                if (this.tableId !== 'tableBody5') {
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
                            <button class="btn-edit" onclick="editPPOValue(${index}, 'priorMonth')" title="Edit Prior Month">✏️</button>
                        </td>
                        <td>
                            ${Math.round(row.currentMonth)} 
                            <button class="btn-edit" onclick="editPPOValue(${index}, 'currentMonth')" title="Edit Current Month">✏️</button>
                        </td>
                        <td class="${changeClass}">${actualChange < 0 ? '-' : actualChange > 0 ? '+' : ''}${currentCompliance.toFixed(2)}%</td>
                        <td>${row.status ? `<span class="${statusClass}">${row.status}</span>` : ''}</td>
                        <td><button class="btn-delete" onclick="dashboards['${this.tableId}'].deleteRow(${index})">🗑️</button></td>
                    `;
                    
                    tableBody.appendChild(tr);
                });
            };
            
            // Trigger initial render with edit buttons
            dashboard5.renderTable();
        }
    }, 500);
});