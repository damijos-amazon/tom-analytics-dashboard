// SIMPLE Employee Management - NO BULLSHIT VERSION
var simpleEmployees = [];
window.simpleEmployees = simpleEmployees; // Ensure global access
var editingEmployeeId = null;

// DATA VERSION SYSTEM - Handles structure changes automatically
const EMPLOYEE_DATA_VERSION = 2; // Increment this when adding new fields

function getStorageKey() {
    return 'simpleEmployeeData_v' + EMPLOYEE_DATA_VERSION;
}

function migrateEmployeeData() {
    console.log('🔄 Checking for employee data migration...');
    
    // Check for old version data
    const oldData = localStorage.getItem('simpleEmployeeData');
    const currentData = localStorage.getItem(getStorageKey());
    
    if (oldData && !currentData) {
        console.log('📦 Found old employee data, migrating to version', EMPLOYEE_DATA_VERSION);
        
        try {
            const employees = JSON.parse(oldData);
            
            // Migrate each employee to new structure
            const migratedEmployees = employees.map(function(emp) {
                return {
                    id: emp.id || Date.now(),
                    site: emp.site || '',
                    badgeId: emp.badgeId || '',
                    fullName: emp.fullName || '',
                    username: emp.username || '',
                    email: emp.email || '',
                    managerName: emp.managerName || '',
                    managerUsername: emp.managerUsername || '',
                    managerEmail: emp.managerEmail || '',
                    excludeFromTables: emp.excludeFromTables || false,
                    photo: emp.photo || null,
                    createdAt: emp.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });
            
            // Save to new version
            localStorage.setItem(getStorageKey(), JSON.stringify(migratedEmployees));
            
            // Remove old version
            localStorage.removeItem('simpleEmployeeData');
            
            console.log('✅ Employee data updated successfully! ' + migratedEmployees.length + ' employees migrated to new format with Site and Manager fields.');
            
            return migratedEmployees;
        } catch (e) {
            console.error('❌ Migration failed:', e);
            console.error('⚠️ Error migrating data. Please export your data first, then clear and re-import.');
            return [];
        }
    }
    
    return null;
}

// Manual migration trigger
function manualMigration() {
    const result = migrateEmployeeData();
    if (result) {
        simpleEmployees = result;
        window.simpleEmployees = simpleEmployees; // Keep window reference in sync
        loadSimpleEmployeeList();
        updateSimpleCount();
    } else {
        console.log('ℹ️ No old data found to migrate. Your employee data is already up to date!');
    }
}

function saveSimpleEmployee() {
    var site = document.getElementById('simpleSite').value.trim();
    var badgeId = document.getElementById('simpleBadgeId').value.trim();
    var fullName = document.getElementById('simpleFullName').value.trim();
    var username = document.getElementById('simpleUsername').value.trim();
    var email = document.getElementById('simpleEmail').value.trim();
    var managerName = document.getElementById('simpleManagerName').value.trim();
    var managerUsername = document.getElementById('simpleManagerUsername').value.trim();
    var managerEmail = document.getElementById('simpleManagerEmail').value.trim();
    var excludeFromTables = document.getElementById('simpleExcludeFromTables').checked;
    var photoInput = document.getElementById('simplePhoto');
    
    // Site, Badge ID and Full Name are ALWAYS required
    if (!site || !badgeId || !fullName) {
        console.warn('Site, Badge ID and Full Name are required!');
        return;
    }
    
    // If not excluded, username and email are also required
    if (!excludeFromTables && (!username || !email)) {
        console.warn('Username and Email are required unless employee is excluded from tables!');
        return;
    }
    
    // Check for duplicates (skip if editing the same employee)
    if (simpleEmployees.some(emp => emp.badgeId === badgeId && emp.id !== editingEmployeeId)) {
        console.warn('Badge ID already exists!');
        return;
    }
    
    if (username && simpleEmployees.some(emp => emp.username === username && emp.id !== editingEmployeeId)) {
        console.warn('Username already exists!');
        return;
    }
    
    // Handle photo upload
    if (photoInput.files && photoInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            saveEmployeeWithPhoto(site, badgeId, fullName, username, email, managerName, managerUsername, managerEmail, excludeFromTables, e.target.result);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveEmployeeWithPhoto(site, badgeId, fullName, username, email, managerName, managerUsername, managerEmail, excludeFromTables, null);
    }
}

function saveEmployeeWithPhoto(site, badgeId, fullName, username, email, managerName, managerUsername, managerEmail, excludeFromTables, photoData) {
    var wasExcluded = false;
    
    if (editingEmployeeId) {
        // Update existing employee
        var employee = simpleEmployees.find(emp => emp.id === editingEmployeeId);
        if (employee) {
            wasExcluded = employee.excludeFromTables;
            employee.site = site;
            employee.badgeId = badgeId;
            employee.fullName = fullName;
            employee.username = username || '';
            employee.email = email || '';
            employee.managerName = managerName || '';
            employee.managerUsername = managerUsername || '';
            employee.managerEmail = managerEmail || '';
            employee.excludeFromTables = excludeFromTables;
            employee.updatedAt = new Date().toISOString();
            if (photoData) {
                employee.photo = photoData;
            }
        }
        editingEmployeeId = null;
        document.getElementById('simpleFormTitle').textContent = '➕ ADD NEW EMPLOYEE';
        document.getElementById('simpleSaveBtn').textContent = '💾 Save Employee';
    } else {
        // Add new employee
        var employee = {
            id: Date.now(),
            site: site,
            badgeId: badgeId,
            fullName: fullName,
            username: username || '',
            email: email || '',
            managerName: managerName || '',
            managerUsername: managerUsername || '',
            managerEmail: managerEmail || '',
            excludeFromTables: excludeFromTables || false,
            photo: photoData || null,
            createdAt: new Date().toISOString()
        };
        simpleEmployees.push(employee);
    }
    
    localStorage.setItem(getStorageKey(), JSON.stringify(simpleEmployees));
    window.simpleEmployees = simpleEmployees; // Keep window reference in sync
    clearSimpleForm();
    loadSimpleEmployeeList();
    updateSimpleCount();
    
    // CRITICAL: If employee is marked as excluded, remove them from ALL tables immediately
    if (excludeFromTables || wasExcluded) {
        console.log('🚫 Employee marked as excluded - cleaning all tables...');
        setTimeout(function() {
            if (typeof removeExcludedEmployeesFromAllTables === 'function') {
                removeExcludedEmployeesFromAllTables();
            }
        }, 300);
    }
    
    // Run name replacement after save
    setTimeout(function() {
        replaceAssociateNamesInAllTables(true);
    }, 500);
    
    // Update podium avatars with photos
    setTimeout(updatePodiumAvatars, 1000);
}

function clearSimpleForm() {
    document.getElementById('simpleEmployeeForm').reset();
    editingEmployeeId = null;
    document.getElementById('simpleFormTitle').textContent = '➕ ADD NEW EMPLOYEE';
    document.getElementById('simpleSaveBtn').textContent = '💾 Save Employee';
    document.getElementById('simpleExcludeFromTables').checked = false;
    toggleRequiredFields();
}

function editSimpleEmployee(id) {
    var employee = simpleEmployees.find(emp => emp.id === id);
    if (!employee) return;
    
    editingEmployeeId = id;
    document.getElementById('simpleSite').value = employee.site || '';
    document.getElementById('simpleBadgeId').value = employee.badgeId;
    document.getElementById('simpleFullName').value = employee.fullName;
    document.getElementById('simpleUsername').value = employee.username || '';
    document.getElementById('simpleEmail').value = employee.email || '';
    document.getElementById('simpleManagerName').value = employee.managerName || '';
    document.getElementById('simpleManagerUsername').value = employee.managerUsername || '';
    document.getElementById('simpleManagerEmail').value = employee.managerEmail || '';
    document.getElementById('simpleExcludeFromTables').checked = employee.excludeFromTables || false;
    
    document.getElementById('simpleFormTitle').textContent = '✏️ EDIT EMPLOYEE';
    document.getElementById('simpleSaveBtn').textContent = '💾 Update Employee';
    
    toggleRequiredFields();
    
    // Scroll to top of modal
    document.getElementById('simpleEmployeeModal').scrollTop = 0;
}

function toggleRequiredFields() {
    var excludeCheckbox = document.getElementById('simpleExcludeFromTables');
    var usernameInput = document.getElementById('simpleUsername');
    var emailInput = document.getElementById('simpleEmail');
    var usernameRequired = document.getElementById('usernameRequired');
    var emailRequired = document.getElementById('emailRequired');
    
    // Badge ID and Full Name are ALWAYS required, so we don't touch them
    
    if (excludeCheckbox && excludeCheckbox.checked) {
        // Make username and email optional when excluded
        if (usernameInput) {
            usernameInput.removeAttribute('required');
            usernameInput.style.border = '2px solid #ccc';
        }
        if (emailInput) {
            emailInput.removeAttribute('required');
            emailInput.style.border = '2px solid #ccc';
        }
        if (usernameRequired) usernameRequired.style.display = 'none';
        if (emailRequired) emailRequired.style.display = 'none';
    } else {
        // Make username and email required when not excluded
        if (usernameInput) {
            usernameInput.setAttribute('required', 'required');
            usernameInput.style.border = '2px solid #FF9900';
        }
        if (emailInput) {
            emailInput.setAttribute('required', 'required');
            emailInput.style.border = '2px solid #FF9900';
        }
        if (usernameRequired) usernameRequired.style.display = 'inline';
        if (emailRequired) emailRequired.style.display = 'inline';
    }
}

function loadSimpleEmployeeList() {
    var container = document.getElementById('simpleEmployeeList');
    
    if (simpleEmployees.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #FF9900; padding: 20px;">No employees added yet!</p>';
        return;
    }
    
    var html = simpleEmployees.map(function(emp) {
        var excludeBadge = emp.excludeFromTables ? '<span style="background: #D13212; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 10px;">EXCLUDED</span>' : '';
        var photoHtml = emp.photo ? '<img src="' + emp.photo + '" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #FF9900; margin-right: 10px;">' : '<div style="width: 50px; height: 50px; border-radius: 50%; background: #FF9900; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin-right: 10px;">' + emp.fullName.charAt(0).toUpperCase() + '</div>';
        
        return '<div style="background: rgba(255,255,255,0.1); margin-bottom: 10px; padding: 15px; border-radius: 8px; border-left: 4px solid ' + (emp.excludeFromTables ? '#D13212' : '#FF9900') + ';">' +
            '<div style="display: flex; align-items: center; margin-bottom: 8px;">' +
            photoHtml +
            '<div style="flex: 1;">' +
            '<div style="font-weight: bold; color: #FF9900; margin-bottom: 3px;">' + emp.fullName + excludeBadge + '</div>' +
            '<div style="font-size: 12px; color: #FFD700;">Site: ' + (emp.site || 'N/A') + '</div>' +
            '</div>' +
            '</div>' +
            '<div style="font-size: 14px; color: white;">Badge: ' + emp.badgeId + (emp.username ? ' | Username: ' + emp.username : '') + '</div>' +
            (emp.email ? '<div style="font-size: 14px; color: white;">Email: ' + emp.email + '</div>' : '') +
            (emp.managerName ? '<div style="font-size: 13px; color: #ccc; margin-top: 5px;">Manager: ' + emp.managerName + '</div>' : '') +
            '<div style="margin-top: 8px;">' +
            '<button onclick="editSimpleEmployee(' + emp.id + ')" style="background: #067D62; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 12px;">✏️ Edit</button>' +
            '<button onclick="deleteSimpleEmployee(' + emp.id + ')" style="background: #D13212; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>' +
            '</div>' +
            '</div>';
    }).join('');
    
    container.innerHTML = html;
}

function deleteSimpleEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        simpleEmployees = simpleEmployees.filter(emp => emp.id !== id);
        window.simpleEmployees = simpleEmployees; // Keep window reference in sync
        localStorage.setItem(getStorageKey(), JSON.stringify(simpleEmployees));
        loadSimpleEmployeeList();
        updateSimpleCount();
        console.log('Employee deleted!');
    }
}

function updateSimpleCount() {
    document.getElementById('simpleEmployeeCount').textContent = 'Total: ' + simpleEmployees.length;
}

function searchEmployees() {
    var searchTerm = document.getElementById('employeeSearchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadSimpleEmployeeList();
        return;
    }
    
    var filteredEmployees = simpleEmployees.filter(function(emp) {
        return emp.fullName.toLowerCase().includes(searchTerm) ||
               emp.badgeId.toLowerCase().includes(searchTerm) ||
               (emp.username && emp.username.toLowerCase().includes(searchTerm)) ||
               (emp.email && emp.email.toLowerCase().includes(searchTerm));
    });
    
    var container = document.getElementById('simpleEmployeeList');
    
    if (filteredEmployees.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #FF9900; padding: 20px;">No employees match your search.</p>';
        return;
    }
    
    var html = filteredEmployees.map(function(emp) {
        var excludeBadge = emp.excludeFromTables ? '<span style="background: #D13212; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 10px;">EXCLUDED</span>' : '';
        var photoHtml = emp.photo ? '<img src="' + emp.photo + '" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #FF9900; margin-right: 10px;">' : '<div style="width: 50px; height: 50px; border-radius: 50%; background: #FF9900; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin-right: 10px;">' + emp.fullName.charAt(0).toUpperCase() + '</div>';
        
        return '<div style="background: rgba(255,255,255,0.1); margin-bottom: 10px; padding: 15px; border-radius: 8px; border-left: 4px solid ' + (emp.excludeFromTables ? '#D13212' : '#FF9900') + ';">' +
            '<div style="display: flex; align-items: center; margin-bottom: 8px;">' +
            photoHtml +
            '<div style="flex: 1;">' +
            '<div style="font-weight: bold; color: #FF9900; margin-bottom: 3px;">' + emp.fullName + excludeBadge + '</div>' +
            '<div style="font-size: 12px; color: #FFD700;">Site: ' + (emp.site || 'N/A') + '</div>' +
            '</div>' +
            '</div>' +
            '<div style="font-size: 14px; color: white;">Badge: ' + emp.badgeId + (emp.username ? ' | Username: ' + emp.username : '') + '</div>' +
            (emp.email ? '<div style="font-size: 14px; color: white;">Email: ' + emp.email + '</div>' : '') +
            (emp.managerName ? '<div style="font-size: 13px; color: #ccc; margin-top: 5px;">Manager: ' + emp.managerName + '</div>' : '') +
            '<div style="margin-top: 8px;">' +
            '<button onclick="editSimpleEmployee(' + emp.id + ')" style="background: #067D62; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 12px;">✏️ Edit</button>' +
            '<button onclick="deleteSimpleEmployee(' + emp.id + ')" style="background: #D13212; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>' +
            '</div>' +
            '</div>';
    }).join('');
    
    container.innerHTML = html;
}

// Export employees to JSON
function exportEmployeesJSON() {
    if (simpleEmployees.length === 0) {
        console.warn('No employees to export!');
        return;
    }
    
    var exportData = {
        version: EMPLOYEE_DATA_VERSION,
        exportDate: new Date().toISOString(),
        recordCount: simpleEmployees.length,
        type: 'employee_management',
        data: simpleEmployees
    };
    
    var json = JSON.stringify(exportData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'employees_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Exported ' + simpleEmployees.length + ' employees to JSON! Includes: Site, Badge ID, Full Name, Username, Email, Manager Info, Photos');
}

// Import employees from JSON
function importEmployeesJSON(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var jsonData = JSON.parse(e.target.result);
            
            // Validate JSON structure
            if (!jsonData.data || !Array.isArray(jsonData.data)) {
                console.error('❌ Invalid employee JSON format!');
                return;
            }
            
            // Check if it's an employee management file
            if (jsonData.type !== 'employee_management') {
                console.error('❌ This is not an employee management file!');
                return;
            }
            
            var importedCount = 0;
            var skippedCount = 0;
            var duplicates = [];
            
            jsonData.data.forEach(function(emp) {
                // Ensure all new fields exist (migration for old exports)
                var migratedEmp = {
                    id: emp.id || Date.now() + Math.random(),
                    site: emp.site || '',
                    badgeId: emp.badgeId || '',
                    fullName: emp.fullName || '',
                    username: emp.username || '',
                    email: emp.email || '',
                    managerName: emp.managerName || '',
                    managerUsername: emp.managerUsername || '',
                    managerEmail: emp.managerEmail || '',
                    excludeFromTables: emp.excludeFromTables || false,
                    photo: emp.photo || null,
                    createdAt: emp.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Check for duplicate badge ID or username
                var existingBadge = simpleEmployees.find(e => e.badgeId === migratedEmp.badgeId);
                var existingUsername = migratedEmp.username && simpleEmployees.find(e => e.username === migratedEmp.username);
                
                if (existingBadge || existingUsername) {
                    skippedCount++;
                    duplicates.push(migratedEmp.fullName + ' (' + migratedEmp.badgeId + ')');
                } else {
                    simpleEmployees.push(migratedEmp);
                    importedCount++;
                }
            });
            
            localStorage.setItem(getStorageKey(), JSON.stringify(simpleEmployees));
            window.simpleEmployees = simpleEmployees; // Keep window reference in sync
            loadSimpleEmployeeList();
            updateSimpleCount();
            
            var message = '✅ Import Complete!\n\n';
            message += 'Imported: ' + importedCount + ' employees\n';
            message += 'All fields included: Site, Manager Info, Photos\n';
            if (skippedCount > 0) {
                message += '\nSkipped (duplicates): ' + skippedCount + '\n\n';
                message += 'Duplicates:\n' + duplicates.slice(0, 5).join('\n');
                if (duplicates.length > 5) {
                    message += '\n... and ' + (duplicates.length - 5) + ' more';
                }
            }
            
            console.log(message);
            
            // Run name replacement after import
            setTimeout(function() {
                replaceAssociateNamesInAllTables(true);
            }, 500);
            
        } catch (error) {
            console.error('❌ Error importing employees: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    // Try to migrate old data first
    var migrated = migrateEmployeeData();
    
    if (migrated) {
        simpleEmployees = migrated;
    } else {
        // Load current version data
        var stored = localStorage.getItem(getStorageKey());
        if (stored) {
            try {
                simpleEmployees = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading employee data:', e);
                simpleEmployees = [];
            }
        }
    }
    
    // Ensure window reference is always in sync
    window.simpleEmployees = simpleEmployees;
    
    loadSimpleEmployeeList();
    updateSimpleCount();
    
    // Initialize required fields state
    setTimeout(function() {
        toggleRequiredFields();
    }, 100);
    
    console.log('📊 Loaded', simpleEmployees.length, 'employees (Data Version:', EMPLOYEE_DATA_VERSION + ')');
});

// Function to get employee photo by name (matches Full Name, Badge ID, Username, or Email)
function getEmployeePhotoByName(name) {
    if (!name) return null;
    
    var cleanName = name.toLowerCase().trim();
    
    var employee = simpleEmployees.find(function(emp) {
        // CRITICAL: Skip excluded employees from ALL displays
        if (emp.excludeFromTables) return false;
        
        return emp.fullName.toLowerCase() === cleanName ||
               emp.badgeId.toLowerCase() === cleanName ||
               (emp.username && emp.username.toLowerCase() === cleanName) ||
               (emp.email && emp.email.toLowerCase() === cleanName);
    });
    
    return employee ? employee.photo : null;
}

// Function to update podium avatars with employee photos
function updatePodiumAvatars() {
    // Get all podiums
    var podiums = document.querySelectorAll('.podium');
    
    podiums.forEach(function(podium) {
        var positions = ['.first', '.second', '.third'];
        
        positions.forEach(function(selector) {
            var element = podium.querySelector(selector);
            if (element) {
                var nameEl = element.querySelector('.performer-name');
                var avatarCircle = element.querySelector('.avatar-circle');
                
                if (nameEl && avatarCircle && nameEl.textContent !== '-') {
                    var employeeName = nameEl.textContent.trim();
                    var photo = getEmployeePhotoByName(employeeName);
                    
                    if (photo) {
                        // Replace avatar with employee photo
                        avatarCircle.innerHTML = '<img src="' + photo + '" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">';
                    } else {
                        // Show first letter of name if no photo
                        avatarCircle.textContent = employeeName.charAt(0).toUpperCase();
                    }
                }
            }
        });
    });
}

// Override the original updatePodium functions to include photo updates
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the dashboard to load, then hook into podium updates
    setTimeout(function() {
        // Store original updatePodium functions
        if (window.dashboards) {
            Object.keys(window.dashboards).forEach(function(key) {
                var dashboard = window.dashboards[key];
                if (dashboard && dashboard.updatePodium) {
                    var originalUpdatePodium = dashboard.updatePodium;
                    dashboard.updatePodium = function() {
                        originalUpdatePodium.call(this);
                        // Add photos after podium is updated
                        setTimeout(updatePodiumAvatars, 100);
                    };
                }
            });
        }
        
        // Also update avatars when employees are saved/deleted
        var originalSave = window.saveSimpleEmployee;
        window.saveSimpleEmployee = function() {
            originalSave();
            setTimeout(updatePodiumAvatars, 200);
        };
        
        var originalDelete = window.deleteSimpleEmployee;
        window.deleteSimpleEmployee = function(id) {
            originalDelete(id);
            setTimeout(updatePodiumAvatars, 200);
        };
        
        // Initial avatar update
        updatePodiumAvatars();
    }, 2000);
});

// POWERFUL NAME REPLACEMENT ALGORITHM
// Tables show USERNAMES/EMAILS → Replace with FULL NAMES using Employee Management System (Badge ID is unique identifier)
function replaceAssociateNamesInAllTables(silentMode) {
    if (!silentMode) {
        console.log('🔄 Running Associate Name Replacement Algorithm...');
        console.log('📋 Employee Database has', simpleEmployees.length, 'employees loaded');
    }
    
    // Get all table bodies on the page
    var tableBodies = [
        'tableBody',    // VTI Compliance
        'tableBody2',   // VTI DPMO
        'tableBody3',   // TA Idle Time
        'tableBody4',   // Seal Validation
        'tableBody5',   // PPO Compliance
        'tableBody6',   // Andon Response
        'leaderboardBody' // Leaderboard
    ];
    
    var replacementCount = 0;
    var detailsLog = [];
    
    tableBodies.forEach(function(tableBodyId) {
        var tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;
        
        var rows = tableBody.querySelectorAll('tr');
        console.log('🔍 Checking table:', tableBodyId, '- Found', rows.length, 'rows');
        
        rows.forEach(function(row) {
            // Find the Associate Name cell (usually 2nd column, index 1)
            var nameCell = row.cells[1];
            if (!nameCell) return;
            
            var currentText = nameCell.textContent.trim();
            if (!currentText || currentText === '-') return;
            
            // Skip if already converted to Full Name (avoid re-processing)
            if (nameCell.getAttribute('data-converted') === 'true') return;
            
            // Find employee by USERNAME or EMAIL from table (Badge ID is stored in Employee Management System)
            var matchedEmployee = findEmployeeByAnyIdentifier(currentText);
            
            if (matchedEmployee) {
                // Replace USERNAME/EMAIL with FULL NAME
                nameCell.textContent = matchedEmployee.fullName;
                nameCell.style.color = '#FF9900'; // Highlight replaced names
                nameCell.style.fontWeight = 'bold';
                nameCell.title = 'Employee: ' + matchedEmployee.fullName + '\nBadge ID: ' + matchedEmployee.badgeId + '\nOriginal: ' + currentText;
                nameCell.setAttribute('data-converted', 'true'); // Mark as converted
                nameCell.setAttribute('data-original', currentText); // Store original
                nameCell.setAttribute('data-badge-id', matchedEmployee.badgeId); // Store Badge ID
                replacementCount++;
                
                var logEntry = '✅ ' + tableBodyId + ': "' + currentText + '" → "' + matchedEmployee.fullName + '" (Badge: ' + matchedEmployee.badgeId + ')';
                if (!silentMode) console.log(logEntry);
                detailsLog.push(logEntry);
            }
        });
    });
    
    if (!silentMode) {
        if (replacementCount > 0) {
            console.log('🎯 NAME REPLACEMENT COMPLETE! ' + replacementCount + ' identifiers replaced with Full Names');
        } else {
            console.log('ℹ️ No matching employees found. Current Employee Database: ' + simpleEmployees.length + ' employees. Make sure employees are added to Employee Management System first.');
        }
    } else if (replacementCount > 0) {
        console.log('🔄 Auto-replaced', replacementCount, 'names with Full Names');
    }
    
    // Update podiums after name replacement
    setTimeout(updatePodiumAvatars, 500);
}

// EMPLOYEE FINDER - Tables show Badge ID, USERNAME, or EMAIL - find employee by these identifiers
function findEmployeeByAnyIdentifier(identifier) {
    if (!identifier) return null;
    
    var cleanIdentifier = identifier.toLowerCase().trim();
    
    // Search employees by Badge ID (primary), USERNAME, or EMAIL
    // ALWAYS skip excluded employees in ALL contexts
    var employee = simpleEmployees.find(function(emp) {
        // CRITICAL: Skip excluded employees from ALL tables and modals
        if (emp.excludeFromTables) return false;
        
        return emp.badgeId.toLowerCase() === cleanIdentifier ||     // Match Badge ID from table (PRIMARY)
               emp.username.toLowerCase() === cleanIdentifier ||    // Match Username from table
               emp.email.toLowerCase() === cleanIdentifier;         // Match Email from table
    });
    
    if (employee) {
        var matchType = '';
        if (employee.badgeId.toLowerCase() === cleanIdentifier) matchType = 'Badge ID';
        else if (employee.username.toLowerCase() === cleanIdentifier) matchType = 'Username';
        else if (employee.email.toLowerCase() === cleanIdentifier) matchType = 'Email';
        
        console.log('🎯 Found employee by', matchType + ':', cleanIdentifier, '→', employee.fullName, '(Badge ID:', employee.badgeId + ')');
        return employee;
    }
    
    console.log('❌ No employee found for identifier:', cleanIdentifier);
    return null;
}

// AUTOMATIC NAME REPLACEMENT - Hooks into all table updates
function enableAutomaticNameReplacement() {
    console.log('🔄 Enabling AUTOMATIC Full Name replacement...');
    
    // Hook into dashboard render functions
    if (window.dashboards) {
        Object.keys(window.dashboards).forEach(function(key) {
            var dashboard = window.dashboards[key];
            if (dashboard && dashboard.renderTable) {
                var originalRenderTable = dashboard.renderTable;
                dashboard.renderTable = function() {
                    originalRenderTable.call(this);
                    // AUTOMATICALLY replace names after table renders
                    setTimeout(function() {
                        replaceAssociateNamesInAllTables(true); // Silent mode
                    }, 200);
                };
                console.log('✅ Hooked into', key, 'renderTable function');
            }
        });
    }
    
    // Also hook into data loading functions
    setTimeout(function() {
        // Hook into file processing
        if (window.TOMDashboard && window.TOMDashboard.prototype.processData) {
            var originalProcessData = window.TOMDashboard.prototype.processData;
            window.TOMDashboard.prototype.processData = function(data) {
                var result = originalProcessData.call(this, data);
                setTimeout(function() {
                    replaceAssociateNamesInAllTables(true);
                }, 300);
                return result;
            };
        }
    }, 1000);
}

// Manual trigger button - add to Employee Management modal
function addNameReplacementButton() {
    var modal = document.getElementById('simpleEmployeeModal');
    if (!modal) return;
    
    var buttonContainer = modal.querySelector('div[style*="margin-top: 15px"]');
    if (buttonContainer) {
        var replaceButton = document.createElement('button');
        replaceButton.innerHTML = '🔄 Replace Names in All Tables';
        replaceButton.style.cssText = 'background: #067D62; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-left: 10px;';
        replaceButton.onclick = replaceAssociateNamesInAllTables;
        buttonContainer.appendChild(replaceButton);
    }
}

// Initialize AUTOMATIC name replacement system
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        addNameReplacementButton();
        enableAutomaticNameReplacement(); // ENABLE AUTOMATIC DETECTION AND REPLACEMENT
        console.log('🎯 AUTOMATIC Name Replacement System ACTIVE!');
        
        // Run initial replacement after page loads
        setTimeout(function() {
            replaceAssociateNamesInAllTables(true);
        }, 2000);
    }, 3000);
});