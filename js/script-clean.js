// TOM Analytics Dashboard - Clean Working Version
class TOMDashboard {
    constructor(tableId = 'tableBody', podiumId = 'podium', storageKey = 'tom_analytics_data') {
        this.tableId = tableId;
        this.podiumId = podiumId;
        this.storageKey = storageKey;
        this.data = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadPersistedData();
        this.updatePodium();
    }

    setupEventListeners() {
        if (this.tableId === 'tableBody') {
            const fileInput = document.getElementById('fileInput');
            const uploadArea = document.getElementById('uploadArea');
            if (fileInput && uploadArea) {
                uploadArea.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => this.routeFilesToTables(e.target.files));
            }
        }
    }

    setupDragAndDrop() {
        // Only setup file drag & drop for the first dashboard (main table)
        if (this.tableId === 'tableBody') {
            const uploadArea = document.getElementById('uploadArea');
            if (!uploadArea) return;

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
                console.log('Drop event triggered!', e.dataTransfer.files);
                this.routeFilesToTables(e.dataTransfer.files);
            });
            
            // Prevent default drag/drop behavior on entire document
            document.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            document.addEventListener('drop', (e) => {
                e.preventDefault();
            });
        }

        this.setupTableDragAndDrop();
    }

    setupTableDragAndDrop() {
        const tableBody = document.getElementById(this.tableId);
        if (!tableBody) return;

        let draggedRow = null;

        tableBody.addEventListener('dragstart', (e) => {
            if (e.target.closest('.table-row')) {
                draggedRow = e.target.closest('.table-row');
                draggedRow.style.opacity = '0.5';
            }
        });

        tableBody.addEventListener('dragend', (e) => {
            if (e.target.closest('.table-row')) {
                e.target.closest('.table-row').style.opacity = '';
                draggedRow = null;
            }
        });

        tableBody.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        tableBody.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedRow && e.target.closest('.table-row')) {
                const targetRow = e.target.closest('.table-row');
                if (targetRow !== draggedRow) {
                    const rect = targetRow.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    
                    if (e.clientY < midpoint) {
                        tableBody.insertBefore(draggedRow, targetRow);
                    } else {
                        tableBody.insertBefore(draggedRow, targetRow.nextSibling);
                    }
                    
                    this.updateDataOrder();
                    this.updateRanks();
                    this.persistData();
                    this.showMessage('Rows reordered successfully!', 'success');
                }
            }
        });
    }

    updateDataOrder() {
        const tableBody = document.getElementById(this.tableId);
        if (!tableBody) return;
        
        const rows = Array.from(tableBody.querySelectorAll('.table-row'));
        const newOrder = [];
        
        rows.forEach(row => {
            const name = row.cells[1].textContent;
            const dataItem = this.data.find(item => item.name === name);
            if (dataItem) {
                newOrder.push(dataItem);
            }
        });
        
        this.data = newOrder;
    }

    updateRanks() {
        this.renderTable();
        this.updatePodium();
    }

    routeFilesToTables(files) {
        if (!files || files.length === 0) {
            console.log('No files received');
            return;
        }
        
        console.log('routeFilesToTables called with', files.length, 'files');
        this.showMessage(`Processing ${files.length} file(s) for multiple tables...`, 'success');
        
        Array.from(files).forEach((file) => {
            console.log('Processing file:', file.name, 'Type:', file.type);
            // Accept CSV, Excel, and JSON files
            if (file.type === 'text/csv' || file.name.endsWith('.csv') || 
                file.name.endsWith('.xlsx') || 
                file.type === 'application/json' || file.name.endsWith('.json')) {
                
                // Handle JSON files separately
                if (file.name.endsWith('.json')) {
                    this.handleJSONUpload(file);
                } else {
                    const targetTable = this.determineTargetTable(file.name);
                    
                    if (targetTable && dashboards[targetTable]) {
                        dashboards[targetTable].handleFileUpload([file]);
                    } else {
                        // Default to VTI Compliance table if no specific mapping found
                        dashboards['tableBody'].handleFileUpload([file]);
                    }
                }
            } else {
                this.showMessage(`Unsupported file type: ${file.name}`, 'error');
            }
        });
    }
    
    handleJSONUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Check if it's a complete backup file
                if (jsonData.version && jsonData.tables && jsonData.exportDate) {
                    console.log('📦 Detected complete backup file:', file.name);
                    importCompleteBackup(jsonData, this);
                    return;
                }
                
                // Check if it's a 1:1 conversation file
                if (jsonData.type === 'one_on_one_conversation' && jsonData.conversation) {
                    console.log('💬 Detected 1:1 conversation file:', file.name);
                    if (typeof importIndividualConversation === 'function') {
                        importIndividualConversation(jsonData);
                    } else {
                        this.showMessage('1:1 conversation system not loaded', 'error');
                    }
                    return;
                }
                
                // Check if it's an employee management file
                if (jsonData.type === 'employee_management' && jsonData.data && Array.isArray(jsonData.data)) {
                    console.log('📋 Detected employee management file:', file.name);
                    if (typeof importEmployeesJSON === 'function') {
                        importEmployeesJSON(file);
                    } else {
                        this.showMessage('Employee management system not loaded', 'error');
                    }
                    return;
                }
                
                if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                    let targetDashboard = null;
                    const fileName = file.name.toLowerCase();
                    
                    console.log('Routing JSON file:', file.name);
                    
                    // Get dashboards reference (try window.dashboards first, fallback to global dashboards)
                    const dashboardsRef = window.dashboards || (typeof dashboards !== 'undefined' ? dashboards : null);
                    console.log('Dashboards reference:', dashboardsRef ? 'FOUND' : 'NOT FOUND');
                    if (dashboardsRef) {
                        console.log('Available dashboard keys:', Object.keys(dashboardsRef));
                    }
                    
                    // PRIORITY 1: Check if JSON has tableId field
                    if (jsonData.tableId && dashboardsRef) {
                        const dashboardKeys = ['tableBody', 'tableBody2', 'tableBody3', 'tableBody4', 'tableBody5', 'tableBody6'];
                        const tableNum = parseInt(jsonData.tableId);
                        if (tableNum >= 1 && tableNum <= 6) {
                            const targetKey = dashboardKeys[tableNum - 1];
                            targetDashboard = dashboardsRef[targetKey];
                            console.log(`✅ Found tableId: ${tableNum} -> ${targetKey} (${jsonData.tableName || 'Unknown Table'})`);
                            console.log('Target dashboard lookup result:', targetDashboard ? 'SUCCESS' : 'FAILED');
                        }
                    }
                    
                    // PRIORITY 2: Match by filename pattern (data1.json, data2.json, etc.)
                    if (!targetDashboard && dashboardsRef) {
                        const match = fileName.match(/data(\d+)\.json/);
                        if (match) {
                            const tableNum = parseInt(match[1]);
                            const dashboardKeys = ['tableBody', 'tableBody2', 'tableBody3', 'tableBody4', 'tableBody5', 'tableBody6'];
                            if (tableNum >= 1 && tableNum <= 6) {
                                const targetKey = dashboardKeys[tableNum - 1];
                                targetDashboard = dashboardsRef[targetKey];
                                console.log(`Matched data${tableNum}.json -> ${targetKey}`);
                            }
                        }
                    }
                    
                    // PRIORITY 3: Match by table name in filename
                    if (!targetDashboard && dashboardsRef) {
                        if (fileName.includes('vti') && fileName.includes('dpmo')) {
                            targetDashboard = dashboardsRef['tableBody2'];
                            console.log('Matched VTI DPMO by filename');
                        } else if (fileName.includes('vti')) {
                            targetDashboard = dashboardsRef['tableBody'];
                            console.log('Matched VTI Compliance by filename');
                        } else if (fileName.includes('ta') && fileName.includes('idle')) {
                            targetDashboard = dashboardsRef['tableBody3'];
                            console.log('Matched TA Idle Time by filename');
                        } else if (fileName.includes('seal')) {
                            targetDashboard = dashboardsRef['tableBody4'];
                            console.log('Matched Seal Validation by filename');
                        } else if (fileName.includes('ppo')) {
                            targetDashboard = dashboardsRef['tableBody5'];
                            console.log('Matched PPO Compliance by filename');
                        } else if (fileName.includes('andon')) {
                            targetDashboard = dashboardsRef['tableBody6'];
                            console.log('Matched Andon Response Time by filename');
                        }
                    }
                    
                    // PRIORITY 4: Default to VTI Compliance if no match
                    if (!targetDashboard && dashboardsRef) {
                        targetDashboard = dashboardsRef['tableBody'];
                        console.log('⚠️ No match found, defaulting to VTI Compliance');
                    }
                    
                    console.log('Target dashboard check:', targetDashboard ? 'EXISTS' : 'NULL/UNDEFINED');
                    if (targetDashboard) {
                        console.log('Loading data into dashboard:', targetDashboard.tableId, 'Records:', jsonData.data.length);
                        targetDashboard.data = jsonData.data;
                        console.log('Data assigned, calculating changes...');
                        targetDashboard.calculateChanges();
                        console.log('Rendering table...');
                        targetDashboard.renderTable();
                        console.log('Updating podium...');
                        targetDashboard.updatePodium();
                        console.log('Persisting data...');
                        targetDashboard.persistData();
                        this.showMessage(`${file.name}: ${jsonData.recordCount || jsonData.data.length} records loaded`, 'success');
                        console.log('✅ Successfully loaded and rendered data');
                        console.log(`Successfully loaded ${jsonData.data.length} records into table`);
                    } else {
                        console.error('❌ Target dashboard is null/undefined - cannot load data');
                    }
                } else {
                    this.showMessage(`Invalid JSON format in ${file.name}`, 'error');
                    console.error('Invalid JSON format - missing data array');
                }
            } catch (error) {
                this.showMessage(`Error reading JSON file: ${error.message}`, 'error');
                console.error('JSON upload error:', error);
            }
        };
        reader.readAsText(file);
    }

    determineTargetTable(filename) {
        const name = filename.toLowerCase().replace(/\.(xlsx|csv)$/, '');
        console.log(`Routing file: ${filename} -> cleaned name: ${name}`);
        
        // Exact filename matching for strict file routing
        if (name === 'prior-ta-idle-time' || name === 'current-ta-idle-time' || name === 'ta-idle-time') {
            console.log(`Routing to TA Idle Time table (tableBody3)`);
            return 'tableBody3'; // TA Idle Time
        }
        
        if (name === 'prior-seal-validation' || name === 'current-seal-validation' || name === 'seal-validation') {
            console.log(`Routing to Seal Validation table (tableBody4)`);
            return 'tableBody4'; // Seal Validation Accuracy %
        }
        
        if (name === 'prior-andon-response-time' || name === 'current-andon-response-time' || name === 'andon-response-time') {
            console.log(`Routing to Andon Response Time table (tableBody6)`);
            return 'tableBody6'; // Andon Response Time
        }
        
        if (name === 'prior-ppo-compliance' || name === 'current-ppo-compliance' || name === 'ppo-compliance') {
            console.log(`Routing to PPO Compliance table (tableBody5)`);
            return 'tableBody5'; // PPO Compliance
        }
        
        if (name === 'prior-vti-dpmo' || name === 'current-vti-dpmo' || name === 'vti-dpmo') {
            console.log(`Routing to VTI DPMO table (tableBody2)`);
            return 'tableBody2'; // VTI DPMO
        }
        
        // Default VTI files (prior-vti.xlsx, current-vti.xlsx)
        if (name.includes('vti') && !name.includes('dpmo')) {
            console.log(`Routing to VTI Compliance table (tableBody)`);
            return 'tableBody'; // VTI Compliance
        }
        
        // Default to VTI Compliance if no match
        console.log(`No match found, defaulting to VTI Compliance table (tableBody)`);
        return 'tableBody';
    }

    handleFileUpload(files) {
        if (!files || files.length === 0) return;
        this.showMessage(`Processing ${files.length} file(s) for ${this.getTableName()}...`, 'success');
        Array.from(files).forEach((file) => {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                this.processCSVFile(file);
            } else if (file.name.endsWith('.xlsx')) {
                this.processExcelFile(file);
            } else {
                this.showMessage(`Unsupported file type: ${file.name}`, 'error');
            }
        });
    }

    getTableName() {
        const tableNames = {
            'tableBody': 'VTI Compliance',
            'tableBody2': 'VTI DPMO', 
            'tableBody3': 'TA Idle Time',
            'tableBody4': 'Seal Validation Accuracy',
            'tableBody5': 'PPO Compliance',
            'tableBody6': 'Andon Response Time'
        };
        return tableNames[this.tableId] || 'Unknown Table';
    } 
    processCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            const lines = csv.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                this.showMessage('CSV file appears to be empty', 'error');
                return;
            }
            
            const newData = this.parseFileData(lines, file.name);
            if (newData.length > 0) {
                this.mergeData(newData);
                this.showMessage(`${file.name}: ${newData.length} employees processed`, 'success');
            }
        };
        reader.readAsText(file);
    }

    processExcelFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    this.showMessage('Excel file appears to be empty', 'error');
                    return;
                }
                
                const newData = this.parseFileData(jsonData, file.name);
                if (newData.length > 0) {
                    this.mergeData(newData);
                    this.showMessage(`${file.name}: ${newData.length} employees processed`, 'success');
                }
            } catch (error) {
                this.showMessage(`Error processing Excel file: ${error.message}`, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    parseFileData(data, filename) {
        const name = filename.toLowerCase().replace(/\.(xlsx|csv)$/, '');
        const isPrior = name.includes('prior');
        const isCurrent = name.includes('current');
        const newData = [];

        // Convert CSV lines to array format if needed
        const rows = Array.isArray(data[0]) ? data : data.map(line => line.split(','));
        

        
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            let userName = null;
            let value = null;



            // Determine column mappings based on file type
            if (name.includes('ta-idle-time')) {
                // TA Idle Time: Column B (Driver), Column E (Idle Time)
                userName = this.cleanValue(row[1]); // Column B
                const rawValue = this.cleanValue(row[4]); // Column E
                value = parseFloat(rawValue);
            } else if (name.includes('seal-validation')) {
                // Seal Validation: Search for actual usernames in the row
                userName = null;
                for (let col = 0; col < row.length; col++) {
                    const cellValue = this.cleanValue(row[col]);
                    if (cellValue && /^[a-z]{6,12}$/.test(cellValue) && 
                        (cellValue === 'smleean' || cellValue === 'antoiche' || 
                         cellValue === 'shiechre' || cellValue === 'jahaynev' || 
                         cellValue === 'messiety' || cellValue === 'johnmowe' ||
                         cellValue === 'raymogrl' || cellValue === 'morriyas' ||
                         cellValue === 'jennimfr' || /^[a-z]{6,12}$/.test(cellValue))) {
                        userName = cellValue;
                        break;
                    }
                }
                
                // Get accuracy value from Column AG (Andon Input Inaccuracy %)
                const rawValue = this.cleanValue(row[32]); // Column AG - index 32
                value = parseFloat(rawValue);
                
                // Convert accuracy values: 0 = 100%, 0.9333 = 93.33%
                if (!isNaN(value)) {
                    if (value === 0) {
                        value = 100.00;
                    } else if (value > 0 && value <= 1) {
                        value = value * 100;
                    }
                } else {
                    value = 100.00; // Default if no valid value
                }
                
            } else if (name.includes('andon-response-time')) {
                // Andon Response Time: Column T (executing_user), Column AE (andon_response_time)
                userName = this.cleanValue(row[19]); // Column T (20th column, 0-indexed = 19)
                const rawValue = this.cleanValue(row[30]); // Column AE (31st column, 0-indexed = 30)
                value = parseFloat(rawValue);
            } else if (name.includes('ppo-compliance')) {
                // PPO Compliance: Column A (Associate Name), Column B (Prior/Current Month)
                userName = this.cleanValue(row[0]); // Column A
                const rawValue = this.cleanValue(row[1]); // Column B
                value = parseFloat(rawValue);
                // Store raw violation count (0 = no violations, higher = more violations)
                // If value is between 0 and 1 (like 0.9333), treat it as a decimal count, not percentage
                // Keep as-is: 0 = 0 violations, 1 = 1 violation, 0.5 = 0.5 violations
            } else if (name.includes('vti-dpmo')) {
                // VTI DPMO: Column A (Associate Name), Column B (Prior/Current Month)
                userName = this.cleanValue(row[0]); // Column A
                const rawValue = this.cleanValue(row[1]); // Column B
                value = parseFloat(rawValue);
                // Store raw violation count (0 = no violations, higher = more violations)
                // If value is between 0 and 1 (like 0.9333), treat it as a decimal count, not percentage
                // Keep as-is: 0 = 0 violations, 1 = 1 violation, 0.5 = 0.5 violations
            } else {
                // VTI Compliance table: Prior Month % pulls from file name prior-vti with header name Relay VTI % (100% Capped)
                // VTI Compliance table: Current Month % pulls from file name current-vti with header name Relay VTI % (100% Capped)
                // Both prior-vti and current-vti pull from Column letter I
                userName = this.cleanValue(row[4]); // Column E → user_id → Associate Name column
                const rawValue = this.cleanValue(row[8]); // Column I → Relay VTI % (100% Capped)
                value = parseFloat(rawValue);
                // Convert decimal to percentage if value is between 0 and 1
                if (!isNaN(value) && value > 0 && value <= 1) {
                    value = value * 100; // Convert 0.9333 to 93.33%
                }
            }

            if (userName && userName.trim() !== '' && value !== null && !isNaN(value) && value >= 0) {
                newData.push({
                    name: userName.trim(),
                    priorMonth: isPrior ? value : 0,
                    currentMonth: isCurrent ? value : 0
                });
            }
        }

        // For files that need averaging (VTI Compliance, TA Idle Time, Seal Validation, Andon Response Time)
        if (name.includes('vti') && !name.includes('dpmo') || name.includes('ta-idle-time') || name.includes('seal-validation') || name.includes('andon-response-time')) {
            return this.averageDataByUser(newData, isPrior, isCurrent);
        }

        return newData;
    }

    cleanValue(value) {
        if (value === null || value === undefined) return null;
        return String(value).trim().replace(/"/g, '');
    }

    averageDataByUser(data, isPrior, isCurrent) {
        const userMap = new Map();
        
        data.forEach(item => {
            if (!userMap.has(item.name)) {
                userMap.set(item.name, { values: [], name: item.name });
            }
            
            if (isPrior && item.priorMonth > 0) {
                userMap.get(item.name).values.push(item.priorMonth);
            }
            if (isCurrent && item.currentMonth > 0) {
                userMap.get(item.name).values.push(item.currentMonth);
            }
        });

        const averagedData = [];
        userMap.forEach(userData => {
            if (userData.values.length > 0) {
                const average = userData.values.reduce((sum, val) => sum + val, 0) / userData.values.length;
                averagedData.push({
                    name: userData.name,
                    priorMonth: isPrior ? average : 0,
                    currentMonth: isCurrent ? average : 0
                });
            }
        });

        return averagedData;
    }

    removeDuplicateUsers(data) {
        const userMap = new Map();
        
        data.forEach(item => {
            if (!userMap.has(item.name)) {
                userMap.set(item.name, item);
            } else {
                // If duplicate, keep the one with higher values (more recent/complete data)
                const existing = userMap.get(item.name);
                if (item.priorMonth > 0) existing.priorMonth = item.priorMonth;
                if (item.currentMonth > 0) existing.currentMonth = item.currentMonth;
            }
        });

        return Array.from(userMap.values());
    }

    mergeData(newData) {
        // Filter out excluded employees during import
        const employees = window.simpleEmployees || [];
        
        newData.forEach(item => {
            // Check if this employee is excluded
            const employee = employees.find(emp => 
                emp.badgeId.toLowerCase() === item.name.toLowerCase() ||
                emp.username.toLowerCase() === item.name.toLowerCase() ||
                emp.email.toLowerCase() === item.name.toLowerCase()
            );
            
            // Skip if employee is excluded
            if (employee && employee.excludeFromTables) {
                console.log(`Skipping excluded employee: ${item.name}`);
                return;
            }
            
            const existing = this.data.find(d => d.name === item.name);
            if (existing) {
                if (item.priorMonth > 0) existing.priorMonth = item.priorMonth;
                if (item.currentMonth > 0) existing.currentMonth = item.currentMonth;
            } else {
                this.data.push({
                    name: item.name,
                    priorMonth: item.priorMonth || 0,
                    currentMonth: item.currentMonth || 0,
                    change: 0,
                    status: ''
                });
            }
        });
        this.calculateChanges();
        this.renderTable();
        this.updatePodium();
        this.persistData();
        
        // Refresh unified leaderboard after data changes
        if (typeof refreshUnifiedLeaderboard === 'function') {
            refreshUnifiedLeaderboard();
        }
    }

    calculateFairScore(value, benchmark, direction, change = 0) {
        // Balanced Excellence Algorithm - Rewards both improvement and consistency
        if (direction === 'below') {
            let score = 0;
            
            // Base score calculation - Excellence vs Improvement balance
            if (value <= benchmark) {
                // COMPLIANT EMPLOYEES: Strong base score for meeting standard
                score = 800 + ((benchmark - value) * 200); // Reward excellence
                
                // Improvement component for compliant employees
                if (change < 0) {
                    score += Math.abs(change) * 500; // HUGE bonus for improving while compliant
                } else if (change > 0) {
                    score -= change * 200; // Significant penalty for declining while compliant
                } else {
                    score += 50; // Small consistency bonus for maintaining compliance
                }
                
            } else {
                // NON-COMPLIANT EMPLOYEES: Must show exceptional improvement to compete
                const distanceFromBenchmark = value - benchmark;
                score = 400 - (distanceFromBenchmark * 50); // Reduced penalty for non-compliance
                
                // Improvement component for non-compliant employees
                if (change < 0) {
                    // Exceptional improvement can make them competitive
                    const improvementBonus = Math.abs(change) * 800; // MASSIVE bonus for improvement
                    score += improvementBonus;
                    
                    // Extra bonus if improvement brings them close to compliance
                    if (value <= benchmark * 1.05) {
                        score += 300; // "Almost compliant" bonus
                    }
                } else if (change > 0) {
                    score -= change * 400; // Severe penalty for getting worse while non-compliant
                }
            }
            
            // Excellence multiplier: Reward sustained high performance
            if (value <= benchmark * 0.8) { // Exceptional performance (20% below benchmark)
                score *= 1.2; // 20% bonus multiplier
            }
            
            return Math.max(0, score);
        } else {
            // Higher is better logic (VTI Compliance, Seal Validation)
            let score = 0;
            
            if (value >= benchmark) {
                // COMPLIANT EMPLOYEES: At or above benchmark (100%)
                score = 800 + ((value - benchmark) * 200); // Reward excellence
                
                if (change > 0) {
                    score += change * 500; // HUGE bonus for improving while compliant
                } else if (change < 0) {
                    score -= Math.abs(change) * 200; // Penalty for declining while compliant
                } else {
                    score += 50; // Small consistency bonus for maintaining compliance
                }
                
            } else {
                // NON-COMPLIANT EMPLOYEES: Below benchmark (< 100%)
                const distanceFromBenchmark = benchmark - value;
                score = 400 - (distanceFromBenchmark * 5); // Reduced penalty for non-compliance
                
                if (change > 0) {
                    // Improvement can make them competitive
                    const improvementBonus = change * 800; // MASSIVE bonus for improvement
                    score += improvementBonus;
                    
                    // Extra bonus if improvement brings them close to compliance
                    if (value >= benchmark * 0.95) {
                        score += 300; // "Almost compliant" bonus
                    }
                } else if (change < 0) {
                    score -= Math.abs(change) * 400; // SEVERE penalty for declining while non-compliant
                }
            }
            
            // Excellence multiplier: Reward sustained high performance
            if (value >= benchmark * 1.05) { // Exceptional performance (5% above benchmark)
                score *= 1.2; // 20% bonus multiplier
            }
            
            return Math.max(0, score);
        }
    }

    calculateChanges() {
        // Table configuration for fair scoring
        const tableConfigs = {
            'tableBody': { direction: 'above', defaultBenchmark: 100, metric: 'VTI Compliance', storageKey: 'vti_compliance_benchmark' },
            'tableBody2': { direction: 'below', defaultBenchmark: 0, metric: 'VTI DPMO', storageKey: 'vti_dpmo_benchmark' },
            'tableBody3': { direction: 'below', defaultBenchmark: 5.0, metric: 'TA Idle Time', storageKey: 'ta_idle_benchmark' },
            'tableBody4': { direction: 'above', defaultBenchmark: 100, metric: 'Seal Validation', storageKey: 'seal_validation_benchmark' },
            'tableBody5': { direction: 'below', defaultBenchmark: 0, metric: 'PPO Compliance', storageKey: 'ppo_compliance_benchmark' },
            'tableBody6': { direction: 'below', defaultBenchmark: 3.0, metric: 'Andon Response Time', storageKey: 'andon_response_benchmark' }
        };
        
        const config = tableConfigs[this.tableId];
        const benchmark = parseFloat(localStorage.getItem(config.storageKey) || config.defaultBenchmark);
        
        console.log(`\n📊 ${config.metric} - Calculating Fair Scores (Benchmark: ${benchmark}, Direction: ${config.direction})`);
        
        this.data.forEach((item) => {
            item.change = item.currentMonth - item.priorMonth;
            
            // Calculate fair score for ALL tables
            item.fairScore = this.calculateFairScore(item.currentMonth, benchmark, config.direction, item.change);
            
            console.log(`  ${item.name}: Current=${item.currentMonth}, Change=${item.change.toFixed(2)}, FairScore=${item.fairScore.toFixed(1)}`);
        });

        // Sort ALL tables by improvement first (most improved = best rank)
        this.data.sort((a, b) => {
            // Normalize change based on direction (positive = improvement)
            let normalizedChangeA = a.change;
            let normalizedChangeB = b.change;
            
            if (config.direction === 'below') {
                // For "lower is better", flip the sign
                normalizedChangeA = -normalizedChangeA;
                normalizedChangeB = -normalizedChangeB;
            }
            
            // Primary: Sort by improvement (highest improvement = best)
            const improvementDiff = normalizedChangeB - normalizedChangeA;
            if (Math.abs(improvementDiff) > 0.01) {
                return improvementDiff;
            }
            
            // Tiebreaker: Sort by current performance
            if (config.direction === 'above') {
                return b.currentMonth - a.currentMonth; // Higher is better
            } else {
                return a.currentMonth - b.currentMonth; // Lower is better
            }
        });

        // Assign status based on actual performance direction and compliance
        this.data.forEach((item, index) => {
            const rank = index + 1;
            
            // Determine if compliant based on direction
            let isCompliant = false;
            if (config.direction === 'above') {
                isCompliant = item.currentMonth >= benchmark;
            } else {
                isCompliant = item.currentMonth <= benchmark;
            }
            
            // Determine if improving based on direction
            let isImproving = false;
            if (config.direction === 'above') {
                isImproving = item.change > 0.01; // Positive change is improvement
            } else {
                isImproving = item.change < -0.01; // Negative change is improvement
            }
            
            let isDeclining = false;
            if (config.direction === 'above') {
                isDeclining = item.change < -0.01; // Negative change is decline
            } else {
                isDeclining = item.change > 0.01; // Positive change is decline
            }
            
            // Assign status based on performance
            if (isCompliant && isImproving) {
                item.status = 'Excellent'; // Compliant and improving
            } else if (isCompliant && Math.abs(item.change) <= 0.01) {
                item.status = 'Excellent'; // Compliant and maintaining
            } else if (isImproving) {
                item.status = 'Improved'; // Improving (even if not compliant yet)
            } else if (isDeclining) {
                item.status = 'Decreased'; // Declining
            } else {
                item.status = 'Maintained'; // No significant change
            }
            
            console.log(`  Rank ${rank}: ${item.name} - FairScore=${item.fairScore.toFixed(1)}, Change=${item.change.toFixed(2)}, Status=${item.status}`);
        });
        
        console.log(`✅ ${config.metric} - Fair Score Calculation Complete\n`);
    }

    getFullName(identifier) {
        const employees = window.simpleEmployees || [];
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        return employee ? employee.fullName : identifier;
    }

    getFirstName(identifier) {
        const employees = window.simpleEmployees || [];
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        if (employee && employee.fullName) {
            // Extract first name from full name
            return employee.fullName.split(' ')[0];
        }
        return identifier;
    }

    renderTable() {
        const tableBody = document.getElementById(this.tableId);
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        const isAndonTable = this.tableId === 'tableBody6';
        const isVTIDPMOTable = this.tableId === 'tableBody2';
        const isTAIdleTable = this.tableId === 'tableBody3';
        const isPPOTable = this.tableId === 'tableBody5';
        
        // Filter out excluded employees
        const employees = window.simpleEmployees || [];
        const filteredData = this.data.filter(row => {
            const employee = employees.find(emp => 
                emp.badgeId.toLowerCase() === row.name.toLowerCase() ||
                emp.username.toLowerCase() === row.name.toLowerCase() ||
                emp.email.toLowerCase() === row.name.toLowerCase()
            );
            // Only include if employee doesn't exist OR is not excluded
            return !employee || !employee.excludeFromTables;
        });
        
        filteredData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.className = 'table-row';
            tr.draggable = true;
            
            // Get full name immediately
            const displayName = this.getFullName(row.name);
            
            // Color logic based on metric direction
            let changeClass;
            if (isTAIdleTable || isVTIDPMOTable || isPPOTable || isAndonTable) {
                // Lower is better: negative change = improvement (green), positive = decline (red)
                changeClass = row.change < 0 ? 'positive' : row.change > 0 ? 'negative' : 'neutral';
            } else {
                // Higher is better: positive change = improvement (green), negative = decline (red)
                changeClass = row.change > 0 ? 'positive' : row.change < 0 ? 'negative' : 'neutral';
            }
            
            const statusClass = row.status ? `status-${row.status.toLowerCase()}` : '';
            
            if (isAndonTable) {
                // Andon Response Time: lower is better, so flip display for clarity
                const displayChange = -row.change; // Flip the sign for display
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${displayName}</td>
                    <td>${row.priorMonth.toFixed(2)}</td>
                    <td>${row.currentMonth.toFixed(2)}</td>
                    <td class="${changeClass}">${displayChange > 0 ? '+' : ''}${displayChange.toFixed(2)}</td>
                    <td>${row.status ? `<span class="${statusClass}">${row.status}</span>` : ''}</td>
                    <td><button class="btn-delete" onclick="dashboards['${this.tableId}'].deleteRow(${index})">🗑️</button></td>
                `;
            } else if (isVTIDPMOTable || isPPOTable) {
                // VTI DPMO and PPO: lower is better, so flip display for clarity
                const displayChange = -row.change; // Flip the sign for display
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${displayName}</td>
                    <td>${Math.round(row.priorMonth)}</td>
                    <td>${Math.round(row.currentMonth)}</td>
                    <td class="${changeClass}">${displayChange > 0 ? '+' : ''}${displayChange.toFixed(2)}</td>
                    <td>${row.status ? `<span class="${statusClass}">${row.status}</span>` : ''}</td>
                    <td><button class="btn-delete" onclick="dashboards['${this.tableId}'].deleteRow(${index})">🗑️</button></td>
                `;
            } else if (isTAIdleTable) {
                // TA Idle Time table with status column
                // For TA Idle Time: negative change = improvement, so flip the sign for display
                const displayChange = -row.change; // Flip the sign
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${displayName}</td>
                    <td>${row.priorMonth.toFixed(2)}</td>
                    <td>${row.currentMonth.toFixed(2)}</td>
                    <td class="${changeClass}">${displayChange > 0 ? '+' : ''}${displayChange.toFixed(2)}</td>
                    <td>${row.status ? `<span class="${statusClass}">${row.status}</span>` : ''}</td>
                    <td><button class="btn-delete" onclick="dashboards['${this.tableId}'].deleteRow(${index})">🗑️</button></td>
                `;
            } else {
                // VTI Compliance and Seal Validation tables
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${displayName}</td>
                    <td>${row.priorMonth.toFixed(2)}%</td>
                    <td>${row.currentMonth.toFixed(2)}%</td>
                    <td class="${changeClass}">${row.change > 0 ? '+' : ''}${row.change.toFixed(2)}%</td>
                    <td>${row.status ? `<span class="${statusClass}">${row.status}</span>` : ''}</td>
                    <td><button class="btn-delete" onclick="dashboards['${this.tableId}'].deleteRow(${index})">🗑️</button></td>
                `;
            }
            tableBody.appendChild(tr);
        });
    }

    updatePodium() {
        const podiumContainer = this.podiumId ? document.getElementById(this.podiumId) : document.querySelector('.podium');
        if (!podiumContainer) return;
        
        const positions = ['.first', '.second', '.third'];
        positions.forEach(selector => {
            const element = podiumContainer.querySelector(selector);
            if (element) {
                const nameEl = element.querySelector('.performer-name');
                const scoreEl = element.querySelector('.performer-score');
                const avatarEl = element.querySelector('.avatar-circle');
                
                if (nameEl) nameEl.textContent = '-';
                if (scoreEl) scoreEl.innerHTML = '- <span class="status-badge">-</span>';
                if (avatarEl) {
                    avatarEl.style.backgroundImage = '';
                    avatarEl.textContent = '-';
                    avatarEl.style.color = '';
                    avatarEl.style.fontSize = '';
                }
            }
        });
        
        if (this.data.length === 0) return;
        
        // Filter out excluded employees from podium
        const employees = window.simpleEmployees || [];
        const filteredData = this.data.filter(row => {
            const employee = employees.find(emp => 
                emp.badgeId.toLowerCase() === row.name.toLowerCase() ||
                emp.username.toLowerCase() === row.name.toLowerCase() ||
                emp.email.toLowerCase() === row.name.toLowerCase()
            );
            return !employee || !employee.excludeFromTables;
        });
        
        const top3 = filteredData.slice(0, 3);
        
        positions.forEach((selector, index) => {
            const element = podiumContainer.querySelector(selector);
            if (element && top3[index]) {
                const nameEl = element.querySelector('.performer-name');
                const scoreEl = element.querySelector('.performer-score');
                const avatarEl = element.querySelector('.avatar-circle');
                
                // Get first name only for podium display
                const displayName = this.getFirstName(top3[index].name, employees);
                if (nameEl) nameEl.textContent = displayName;
                
                // Update avatar with photo if available
                if (avatarEl) {
                    const employee = employees.find(emp => 
                        emp.badgeId.toLowerCase() === top3[index].name.toLowerCase() ||
                        emp.username.toLowerCase() === top3[index].name.toLowerCase() ||
                        emp.email.toLowerCase() === top3[index].name.toLowerCase()
                    );
                    
                    if (employee && employee.photo) {
                        avatarEl.style.backgroundImage = `url(${employee.photo})`;
                        avatarEl.style.backgroundSize = 'cover';
                        avatarEl.style.backgroundPosition = 'center';
                        avatarEl.textContent = '';
                        avatarEl.style.color = 'transparent';
                        avatarEl.style.fontSize = '0';
                    } else {
                        avatarEl.style.backgroundImage = '';
                        avatarEl.textContent = displayName.charAt(0).toUpperCase();
                        avatarEl.style.color = '';
                        avatarEl.style.fontSize = '';
                    }
                }
                
                if (scoreEl) {
                    const changeScore = top3[index].change.toFixed(2);
                    const status = top3[index].status || '';
                    const statusClass = status ? `status-${status.toLowerCase()}` : '';
                    const changePrefix = top3[index].change > 0 ? '+' : '';
                    scoreEl.innerHTML = `${changePrefix}${changeScore}% ${status ? `<span class="${statusClass}">${status}</span>` : ''}`;
                }
            }
        });
    }

    deleteRow(index) {
        if (index >= 0 && index < this.data.length) {
            this.data.splice(index, 1);
            this.calculateChanges();
            this.renderTable();
            this.updatePodium();
            this.persistData();
        }
    }

    clearData() {
        this.data = [];
        this.renderTable();
        this.updatePodium();
        this.persistData();
    }

    exportCSV() {
        if (this.data.length === 0) {
            this.showMessage('No data to export!', 'error');
            return;
        }
        
        const isAndonTable = this.tableId === 'tableBody6';
        const isVTIDPMOTable = this.tableId === 'tableBody2';
        
        let headers;
        if (isAndonTable) {
            headers = ['Rank', 'Associate Name', 'Prior Month (min)', 'Current Month (min)', 'Change (min)', 'Status'];
        } else if (isVTIDPMOTable) {
            headers = ['Rank', 'Associate Name', 'Prior Month', 'Current Month', 'Change %', 'Status'];
        } else {
            headers = ['Rank', 'Associate Name', 'Prior Month %', 'Current Month %', 'Change %', 'Status'];
        }
            
        const rows = this.data.map((row, index) => [
            index + 1, row.name, row.priorMonth.toFixed(2), row.currentMonth.toFixed(2), row.change.toFixed(2), row.status
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tom_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showMessage('CSV exported successfully!', 'success');
    }

    exportExcel() {
        if (this.data.length === 0) return;
        
        const isAndonTable = this.tableId === 'tableBody6';
        const isVTIDPMOTable = this.tableId === 'tableBody2';
        
        let headers;
        if (isAndonTable) {
            headers = ['Rank', 'Associate Name', 'Prior Month (min)', 'Current Month (min)', 'Change (min)', 'Status'];
        } else if (isVTIDPMOTable) {
            headers = ['Rank', 'Associate Name', 'Prior Month', 'Current Month', 'Change %', 'Status'];
        } else {
            headers = ['Rank', 'Associate Name', 'Prior Month %', 'Current Month %', 'Change %', 'Status'];
        }
        
        const rows = this.data.map((row, index) => [
            index + 1, row.name, row.priorMonth.toFixed(2), row.currentMonth.toFixed(2), 
            row.change.toFixed(2), row.status
        ]);
        
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, this.getTableName());
        XLSX.writeFile(wb, `${this.getTableName()}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    exportJSON() {
        if (this.data.length === 0) return;
        
        // Determine tableId based on tableId
        const tableIdMap = {
            'tableBody': 1,
            'tableBody2': 2,
            'tableBody3': 3,
            'tableBody4': 4,
            'tableBody5': 5,
            'tableBody6': 6
        };
        
        const exportData = { 
            exportDate: new Date().toISOString(), 
            recordCount: this.data.length, 
            tableId: tableIdMap[this.tableId] || 1,
            tableName: this.getTableName(),
            data: this.data 
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.getTableName().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    loadPersistedData() {
        try {
            const persistedData = localStorage.getItem(this.storageKey);
            if (persistedData) {
                this.data = JSON.parse(persistedData);
                this.renderTable();
                this.updatePodium();
            }
        } catch (error) {
            this.data = [];
        }
    }

    persistData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error persisting data:', error);
        }
    }

    importAll() {
        if (this.tableId === 'tableBody') {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            }
        }
    }



    restoreBackup() {
        if (this.tableId === 'tableBody') {
            const restoreInput = document.getElementById('restoreInput');
            if (restoreInput) {
                restoreInput.click();
            }
        }
    }

    showMessage(text, type = 'success') {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        const container = document.querySelector('.container');
        const uploadSection = document.querySelector('.upload-section');
        if (container && uploadSection) {
            container.insertBefore(message, uploadSection);
            setTimeout(() => message.remove(), 3000);
        }
    }
}

// Initialize dashboards
let dashboard, dashboard2, dashboard3, dashboard4, dashboard5, dashboard6;
let dashboards = {};

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new TOMDashboard('tableBody', 'podium1', 'tom_analytics_data');
    dashboard2 = new TOMDashboard('tableBody2', 'podium2', 'tom_analytics_data_2');
    dashboard3 = new TOMDashboard('tableBody3', 'podium3', 'tom_analytics_data_3');
    dashboard4 = new TOMDashboard('tableBody4', 'podium4', 'tom_analytics_data_4');
    dashboard5 = new TOMDashboard('tableBody5', 'podium5', 'tom_analytics_data_5');
    dashboard6 = new TOMDashboard('tableBody6', 'podium6', 'tom_analytics_data_6');
    
    dashboards = {
        'tableBody': dashboard, 'tableBody2': dashboard2, 'tableBody3': dashboard3,
        'tableBody4': dashboard4, 'tableBody5': dashboard5, 'tableBody6': dashboard6
    };
    
    // Make dashboards globally accessible
    window.dashboards = dashboards;
    
    const restoreInput = document.getElementById('restoreInput');
    if (restoreInput) {
        restoreInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processRestoreFile(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    
    // Auto-load JSON data files if they exist (disabled - use drag and drop instead)
    // autoLoadJSONData();
});

// Global functions for HTML onclick handlers
function importAll() { if (dashboards['tableBody']) dashboards['tableBody'].importAll(); }
function backupAll() {
    const timestamp = new Date().toISOString().split('T')[0];
    let exportedCount = 0;
    
    const tables = [
        { storageKey: 'tom_analytics_data', name: 'VTI_Compliance', headers: ['Rank', 'Associate Name', 'Prior Month', 'Current Month', 'Change', 'Status'] },
        { storageKey: 'tom_analytics_data_2', name: 'VTI_DPMO', headers: ['Rank', 'Associate Name', 'Prior Month', 'Current Month', 'Change', 'Status'] },
        { storageKey: 'tom_analytics_data_3', name: 'TA_Idle_Time', headers: ['Rank', 'Associate Name', 'Prior Month (min)', 'Current Month (min)', 'Change (min)', 'Status'] },
        { storageKey: 'tom_analytics_data_4', name: 'Seal_Validation', headers: ['Rank', 'Associate Name', 'Prior Month', 'Current Month', 'Change', 'Status'] },
        { storageKey: 'tom_analytics_data_5', name: 'PPO_Compliance', headers: ['Rank', 'Associate Name', 'Prior Month', 'Current Month', 'Change', 'Status'] },
        { storageKey: 'tom_analytics_data_6', name: 'Andon_Response_Time', headers: ['Rank', 'Associate Name', 'Prior Month (min)', 'Current Month (min)', 'Change (min)', 'Status'] }
    ];
    
    tables.forEach(table => {
        try {
            const storedData = localStorage.getItem(table.storageKey);
            let rows = [];
            if (storedData) {
                const data = JSON.parse(storedData);
                if (data && data.length > 0) {
                    rows = data.map((row, index) => [
                        index + 1,
                        row.name,
                        Math.round(row.priorMonth),
                        Math.round(row.currentMonth),
                        row.change.toFixed(2),
                        row.status
                    ]);
                }
            }
            const csvContent = [table.headers, ...rows].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${table.name}_${timestamp}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            exportedCount++;
        } catch (e) {
            console.error('Error exporting', table.name, e);
        }
    });
    
    try {
        const leaderboardStorage = localStorage.getItem('tom_leaderboard_data');
        let leaderboardRows = [];
        if (leaderboardStorage) {
            const leaderboardData = JSON.parse(leaderboardStorage);
            if (leaderboardData && leaderboardData.length > 0) {
                leaderboardRows = leaderboardData.map((row, index) => [
                    index + 1,
                    row.name,
                    row.overallScore.toFixed(2),
                    row.improvement,
                    row.recognition
                ]);
            }
        }
        const leaderboardHeaders = ['Rank', 'Associate Name', 'Overall Score', 'Improvement', 'Recognition'];
        const csvContent = [leaderboardHeaders, ...leaderboardRows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TOM_Team_Leaderboard_${timestamp}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        exportedCount++;
    } catch (e) {
        console.error('Error exporting leaderboard', e);
    }
    
    try {
        const employeeStorage = localStorage.getItem('simpleEmployeeData');
        let employeeRows = [];
        if (employeeStorage) {
            const employees = JSON.parse(employeeStorage);
            if (employees && employees.length > 0) {
                employeeRows = employees.map(emp => [
                    emp.badgeId,
                    emp.fullName,
                    emp.username,
                    emp.email,
                    emp.createdAt
                ]);
            }
        }
        const employeeHeaders = ['Badge ID', 'Full Name', 'Username', 'Email', 'Created At'];
        const csvContent = [employeeHeaders, ...employeeRows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Employee_Management_${timestamp}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        exportedCount++;
    } catch (e) {
        console.error('Error exporting employees', e);
    }
    
    alert(`✅ ${exportedCount} CSV files exported successfully!`);
}
function restoreBackup() { if (dashboards['tableBody']) dashboards['tableBody'].restoreBackup(); }
function importCompleteBackup(jsonData, dashboard) {
    if (!confirm('📦 Import Complete Backup?\n\nThis will import all tables and employees.\nDuplicates will be skipped.\n\nContinue?')) {
        return;
    }
    
    let importedTables = 0;
    let importedRecords = 0;
    let skippedRecords = 0;
    const dashboardsRef = window.dashboards || dashboards;
    
    // Import tables
    if (jsonData.tables) {
        const tableMapping = {
            'VTI_Compliance': 'tableBody',
            'VTI_DPMO': 'tableBody2',
            'TA_Idle_Time': 'tableBody3',
            'Seal_Validation': 'tableBody4',
            'PPO_Compliance': 'tableBody5',
            'Andon_Response_Time': 'tableBody6'
        };
        
        Object.keys(jsonData.tables).forEach(tableName => {
            const tableData = jsonData.tables[tableName];
            
            // Skip leaderboard (it's auto-generated)
            if (tableName === 'Leaderboard') {
                console.log('⏭️ Skipping leaderboard (auto-generated)');
                return;
            }
            
            const targetKey = tableMapping[tableName];
            if (targetKey && dashboardsRef[targetKey] && tableData.data) {
                const targetDashboard = dashboardsRef[targetKey];
                const existingData = targetDashboard.data || [];
                
                // Filter out duplicates by name
                const newRecords = tableData.data.filter(newRecord => {
                    const isDuplicate = existingData.some(existing => existing.name === newRecord.name);
                    if (isDuplicate) {
                        skippedRecords++;
                        return false;
                    }
                    return true;
                });
                
                // Merge new records
                targetDashboard.data = [...existingData, ...newRecords];
                targetDashboard.calculateChanges();
                targetDashboard.renderTable();
                targetDashboard.updatePodium();
                targetDashboard.persistData();
                
                importedRecords += newRecords.length;
                importedTables++;
                console.log(`✅ Imported ${newRecords.length} records to ${tableName} (skipped ${tableData.data.length - newRecords.length} duplicates)`);
            }
        });
    }
    
    // Import employees (filter duplicates)
    let importedEmployees = 0;
    let skippedEmployees = 0;
    if (jsonData.employees && jsonData.employees.data) {
        if (typeof window.simpleEmployees !== 'undefined') {
            const existingEmployees = window.simpleEmployees || [];
            
            jsonData.employees.data.forEach(emp => {
                const isDuplicate = existingEmployees.some(existing => 
                    existing.badgeId === emp.badgeId || existing.username === emp.username
                );
                
                if (!isDuplicate) {
                    existingEmployees.push(emp);
                    importedEmployees++;
                } else {
                    skippedEmployees++;
                }
            });
            
            window.simpleEmployees = existingEmployees;
            localStorage.setItem('simpleEmployeeData', JSON.stringify(existingEmployees));
            
            // Update employee list if functions exist
            if (typeof loadSimpleEmployeeList === 'function') loadSimpleEmployeeList();
            if (typeof updateSimpleCount === 'function') updateSimpleCount();
            
            console.log(`✅ Imported ${importedEmployees} employees (skipped ${skippedEmployees} duplicates)`);
        }
    }
    
    // Import 1:1 conversations
    let importedConversations = 0;
    if (jsonData.conversations && jsonData.conversations.data) {
        localStorage.setItem('tom_one_on_one_conversations', JSON.stringify(jsonData.conversations.data));
        importedConversations = Object.keys(jsonData.conversations.data).length;
        console.log(`✅ Imported ${importedConversations} 1:1 conversations`);
    }
    
    // Show summary
    const message = `✅ Import Complete!\n\n` +
                   `Tables Imported: ${importedTables}\n` +
                   `Records Imported: ${importedRecords}\n` +
                   `Records Skipped (duplicates): ${skippedRecords}\n` +
                   `Employees Imported: ${importedEmployees}\n` +
                   `Employees Skipped (duplicates): ${skippedEmployees}\n` +
                   `1:1 Conversations Imported: ${importedConversations}`;
    
    alert(message);
    
    if (dashboard) {
        dashboard.showMessage(`Imported ${importedRecords} records and ${importedEmployees} employees!`, 'success');
    }
    
    // Run name replacement after import
    setTimeout(function() {
        if (typeof replaceAssociateNamesInAllTables === 'function') {
            replaceAssociateNamesInAllTables(true);
        }
    }, 1000);
}

function exportAllData() {
    const timestamp = new Date().toISOString().split('T')[0];
    const allData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        tables: {},
        employees: null
    };
    
    // Export all 6 dashboard tables
    const tableKeys = ['tableBody', 'tableBody2', 'tableBody3', 'tableBody4', 'tableBody5', 'tableBody6'];
    const tableNames = ['VTI_Compliance', 'VTI_DPMO', 'TA_Idle_Time', 'Seal_Validation', 'PPO_Compliance', 'Andon_Response_Time'];
    
    tableKeys.forEach((key, index) => {
        if (dashboards[key] && dashboards[key].data) {
            allData.tables[tableNames[index]] = {
                tableId: index + 1,
                tableName: tableNames[index].replace(/_/g, ' '),
                data: dashboards[key].data
            };
        }
    });
    
    // Export leaderboard
    const leaderboardData = localStorage.getItem('tom_leaderboard_data');
    if (leaderboardData) {
        try {
            allData.tables.Leaderboard = {
                tableId: 7,
                tableName: 'TOM Team Leaderboard',
                data: JSON.parse(leaderboardData)
            };
        } catch (e) {
            console.error('Error parsing leaderboard data:', e);
        }
    }
    
    // Export employee management system
    const employeeData = localStorage.getItem('simpleEmployeeData');
    if (employeeData) {
        try {
            allData.employees = {
                type: 'employee_management',
                recordCount: JSON.parse(employeeData).length,
                data: JSON.parse(employeeData)
            };
        } catch (e) {
            console.error('Error parsing employee data:', e);
        }
    }
    
    // Export 1:1 conversation data
    const conversationData = localStorage.getItem('tom_one_on_one_conversations');
    if (conversationData) {
        try {
            const conversations = JSON.parse(conversationData);
            allData.conversations = {
                type: 'one_on_one_conversations',
                recordCount: Object.keys(conversations).length,
                data: conversations
            };
        } catch (e) {
            console.error('Error parsing conversation data:', e);
        }
    }
    
    // Create and download the file
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TOM_Dashboard_Complete_Backup_${timestamp}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Count records
    let totalRecords = 0;
    Object.values(allData.tables).forEach(table => {
        if (table.data) totalRecords += table.data.length;
    });
    if (allData.employees) totalRecords += allData.employees.recordCount;
    if (allData.conversations) totalRecords += allData.conversations.recordCount;
    
    const conversationCount = allData.conversations ? allData.conversations.recordCount : 0;
    
    if (dashboards['tableBody']) {
        dashboards['tableBody'].showMessage(`✅ Exported complete backup with ${totalRecords} total records!`, 'success');
    }
    
    alert(`✅ Complete Backup Exported!\n\n` +
          `Tables: ${Object.keys(allData.tables).length}\n` +
          `Employees: ${allData.employees ? allData.employees.recordCount : 0}\n` +
          `1:1 Conversations: ${conversationCount}\n` +
          `Total Records: ${totalRecords}\n\n` +
          `File: TOM_Dashboard_Complete_Backup_${timestamp}.json`);
    
    alert(`✅ Complete Backup Exported!\n\n` +
          `Tables: ${Object.keys(allData.tables).length}\n` +
          `Employees: ${allData.employees ? allData.employees.recordCount : 0}\n` +
          `Total Records: ${totalRecords}\n\n` +
          `File: TOM_Dashboard_Complete_Backup_${timestamp}.json`);
}

function clearAllData() { 
    if (confirm('⚠️ WARNING: This will permanently delete ALL data from ALL tables!\n\nThis action cannot be undone. Are you sure?')) {
        Object.values(dashboards).forEach(dashboard => dashboard.clearData());
        if (dashboards['tableBody']) {
            dashboards['tableBody'].showMessage('All data cleared from all tables!', 'success');
        }
    }
}

function clearData() { 
    if (dashboards['tableBody']) {
        dashboards['tableBody'].clearData();
        clearPodium('podium1');
    }
}
function clearData2() { 
    if (dashboards['tableBody2']) {
        dashboards['tableBody2'].clearData();
        clearPodium('podium2');
    }
}
function clearData3() { 
    if (dashboards['tableBody3']) {
        dashboards['tableBody3'].clearData();
        clearPodium('podium3');
    }
}
function clearData4() { 
    if (dashboards['tableBody4']) {
        dashboards['tableBody4'].clearData();
        clearPodium('podium4');
    }
}
function clearData5() { 
    if (dashboards['tableBody5']) {
        dashboards['tableBody5'].clearData();
        clearPodium('podium5');
    }
}
function clearData6() { 
    if (dashboards['tableBody6']) {
        dashboards['tableBody6'].clearData();
        clearPodium('podium6');
    }
}

// Helper function to clear a podium
function clearPodium(podiumId) {
    const podium = document.getElementById(podiumId);
    if (!podium) return;
    
    const positions = ['.first', '.second', '.third'];
    positions.forEach(selector => {
        const element = podium.querySelector(selector);
        if (element) {
            const nameEl = element.querySelector('.performer-name');
            const scoreEl = element.querySelector('.performer-score');
            const avatarCircle = element.querySelector('.avatar-circle');
            
            if (nameEl) nameEl.textContent = '-';
            if (scoreEl) scoreEl.innerHTML = '- <span class="status-badge">-</span>';
            if (avatarCircle) avatarCircle.textContent = '-';
        }
    });
}

function exportCSV() { if (dashboards['tableBody']) dashboards['tableBody'].exportCSV(); }
function exportCSV2() { if (dashboards['tableBody2']) dashboards['tableBody2'].exportCSV(); }
function exportCSV3() { if (dashboards['tableBody3']) dashboards['tableBody3'].exportCSV(); }
function exportCSV4() { if (dashboards['tableBody4']) dashboards['tableBody4'].exportCSV(); }
function exportCSV5() { if (dashboards['tableBody5']) dashboards['tableBody5'].exportCSV(); }
function exportCSV6() { if (dashboards['tableBody6']) dashboards['tableBody6'].exportCSV(); }

function exportExcel() { if (dashboards['tableBody']) dashboards['tableBody'].exportExcel(); }
function exportExcel2() { if (dashboards['tableBody2']) dashboards['tableBody2'].exportExcel(); }
function exportExcel3() { if (dashboards['tableBody3']) dashboards['tableBody3'].exportExcel(); }
function exportExcel4() { if (dashboards['tableBody4']) dashboards['tableBody4'].exportExcel(); }
function exportExcel5() { if (dashboards['tableBody5']) dashboards['tableBody5'].exportExcel(); }
function exportExcel6() { if (dashboards['tableBody6']) dashboards['tableBody6'].exportExcel(); }

function exportJSON() { if (dashboards['tableBody']) dashboards['tableBody'].exportJSON(); }
function exportJSON2() { if (dashboards['tableBody2']) dashboards['tableBody2'].exportJSON(); }
function exportJSON3() { if (dashboards['tableBody3']) dashboards['tableBody3'].exportJSON(); }
function exportJSON4() { if (dashboards['tableBody4']) dashboards['tableBody4'].exportJSON(); }
function exportJSON5() { if (dashboards['tableBody5']) dashboards['tableBody5'].exportJSON(); }
function exportJSON6() { if (dashboards['tableBody6']) dashboards['tableBody6'].exportJSON(); }

function toggleFileNamingLegend() {
    const legend = document.getElementById('fileNamingLegend');
    if (legend) {
        legend.style.display = legend.style.display === 'none' || legend.style.display === '' ? 'block' : 'none';
        if (legend.style.display === 'block') {
            legend.classList.add('show');
        } else {
            legend.classList.remove('show');
        }
    }
}

// Force recalculation of all table rankings
function recalculateAllRankings() {
    Object.values(dashboards).forEach(dashboard => {
        if (dashboard && dashboard.data && dashboard.data.length > 0) {
            dashboard.calculateChanges();
            dashboard.renderTable();
            dashboard.updatePodium();
            dashboard.persistData();
        }
    });
    console.log('All table rankings recalculated with new algorithm');
}

function processRestoreFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.tables) {
                if (dashboards['tableBody']) {
                    dashboards['tableBody'].showMessage('Invalid backup file format!', 'error');
                }
                return;
            }
            
            if (confirm(`Restore backup from ${new Date(data.timestamp).toLocaleString()}? This will overwrite all current data.`)) {
                if (dashboards['tableBody'] && data.tables.vtiCompliance) {
                    dashboards['tableBody'].data = data.tables.vtiCompliance;
                    dashboards['tableBody'].renderTable();
                    dashboards['tableBody'].updatePodium();
                    dashboards['tableBody'].persistData();
                }
                
                if (dashboards['tableBody2'] && data.tables.vtiDPMO) {
                    dashboards['tableBody2'].data = data.tables.vtiDPMO;
                    dashboards['tableBody2'].renderTable();
                    dashboards['tableBody2'].updatePodium();
                    dashboards['tableBody2'].persistData();
                }
                
                if (dashboards['tableBody3'] && data.tables.taIdleTime) {
                    dashboards['tableBody3'].data = data.tables.taIdleTime;
                    dashboards['tableBody3'].calculateChanges();
                    dashboards['tableBody3'].renderTable();
                    dashboards['tableBody3'].updatePodium();
                    dashboards['tableBody3'].persistData();
                }
                
                if (dashboards['tableBody4'] && data.tables.sealValidation) {
                    dashboards['tableBody4'].data = data.tables.sealValidation;
                    dashboards['tableBody4'].renderTable();
                    dashboards['tableBody4'].updatePodium();
                    dashboards['tableBody4'].persistData();
                }
                
                if (dashboards['tableBody5'] && data.tables.ppoCompliance) {
                    dashboards['tableBody5'].data = data.tables.ppoCompliance;
                    dashboards['tableBody5'].renderTable();
                    dashboards['tableBody5'].updatePodium();
                    dashboards['tableBody5'].persistData();
                }
                
                if (dashboards['tableBody6'] && data.tables.andonResponseTime) {
                    dashboards['tableBody6'].data = data.tables.andonResponseTime;
                    dashboards['tableBody6'].renderTable();
                    dashboards['tableBody6'].updatePodium();
                    dashboards['tableBody6'].persistData();
                }
                
                if (dashboards['tableBody']) {
                    dashboards['tableBody'].showMessage('All tables restored successfully!', 'success');
                }
            }
        } catch (error) {
            console.error('Restore failed:', error);
            if (dashboards['tableBody']) {
                dashboards['tableBody'].showMessage('Restore failed: ' + error.message, 'error');
            }
        }
    };
    reader.readAsText(file);
}

// TOM Team Leaderboard Functions
function updateLeaderboard() {
    const allEmployees = new Map();
    const employees = window.simpleEmployees || [];
    
    // Helper function to get full name
    function getFullName(identifier) {
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        return employee ? employee.fullName : identifier;
    }
    
    // Helper function to get first name only
    function getFirstName(identifier) {
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        if (employee && employee.fullName) {
            // Extract first name from full name
            return employee.fullName.split(' ')[0];
        }
        return identifier;
    }
    
    // Helper function to check if employee is excluded
    function isExcluded(identifier) {
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        return employee && employee.excludeFromTables;
    }
    
    // Collect data from all 6 tables using Improvement-First Ranking
    Object.values(dashboards).forEach(dashboard => {
        if (dashboard && dashboard.data) {
            dashboard.data.forEach(employee => {
                // Skip excluded employees
                if (isExcluded(employee.name)) {
                    return;
                }
                
                // Use full name as the key to prevent duplicates
                const fullName = getFullName(employee.name);
                
                if (!allEmployees.has(fullName)) {
                    allEmployees.set(fullName, {
                        name: fullName,
                        totalImprovement: 0,
                        totalCurrent: 0,
                        tableCount: 0,
                        improvements: []
                    });
                }
                
                const emp = allEmployees.get(fullName);
                emp.totalImprovement += employee.change || 0;
                emp.totalCurrent += employee.currentMonth || 0;
                emp.tableCount++;
                emp.improvements.push(employee.change || 0);
            });
        }
    });
    
    // Calculate overall scores and rank by improvement-first logic
    const leaderboardData = Array.from(allEmployees.values()).map(emp => {
        const avgImprovement = emp.totalImprovement / emp.tableCount;
        const avgCurrent = emp.totalCurrent / emp.tableCount;
        const overallScore = (avgCurrent * 0.6) + (avgImprovement * 0.4); // Weight current performance and improvement
        
        return {
            name: emp.name,
            overallScore: overallScore,
            improvement: avgImprovement,
            recognition: '' // Will be set after ranking
        };
    });
    
    // Sort by improvement first, then by overall score
    leaderboardData.sort((a, b) => {
        const improvementDiff = b.improvement - a.improvement;
        if (Math.abs(improvementDiff) > 1) {
            return improvementDiff;
        }
        return b.overallScore - a.overallScore;
    });
    
    // Assign exciting trophy recognitions based on rank
    leaderboardData.forEach((employee, index) => {
        const rank = index + 1;
        if (rank === 1) employee.recognition = '🏆 Champion';
        else if (rank === 2) employee.recognition = '🥈 Runner-Up';
        else if (rank === 3) employee.recognition = '🥉 Third Place';
        else if (rank <= 5) employee.recognition = '🌟 Top Performer';
        else if (rank <= 10) employee.recognition = '⭐ Star Player';
        else if (employee.improvement > 0) employee.recognition = '📈 Rising Star';
        else employee.recognition = '👤 Team Member';
    });
    
    renderLeaderboard(leaderboardData);
    updateLeaderboardPodium(leaderboardData);
}

function renderLeaderboard(data) {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';
    
    data.forEach((employee, index) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row'; // Add class for hover effects
        
        // Create recognition badge class (remove emojis and spaces for CSS class)
        const recognitionText = employee.recognition.replace(/[🏆🥈🥉🌟⭐📈👤]/g, '').trim();
        const recognitionClass = `status-${recognitionText.toLowerCase().replace(/\s+/g, '-')}`;
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${employee.name}</td>
            <td>${employee.overallScore.toFixed(2)}</td>
            <td class="${employee.improvement > 0 ? 'positive-change' : 'negative-change'}">${employee.improvement > 0 ? '+' : ''}${employee.improvement.toFixed(2)}%</td>
            <td><span class="${recognitionClass}">${employee.recognition}</span></td>
            <td><button class="btn-delete" onclick="deleteLeaderboardRow('${employee.name}')">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateLeaderboardPodium(data) {
    const podium = document.getElementById('leaderboardPodium');
    const top3 = data.slice(0, 3);
    
    const positions = ['second', 'first', 'third'];
    positions.forEach((position, index) => {
        const place = podium.querySelector(`.podium-place.${position}`);
        const nameEl = place.querySelector('.performer-name');
        const scoreEl = place.querySelector('.performer-score');
        const avatarEl = place.querySelector('.avatar-circle');
        
        if (top3[index]) {
            const employee = top3[index];
            const recognitionClass = `status-${employee.recognition.toLowerCase().replace(' ', '-')}`;
            
            if (nameEl) nameEl.textContent = employee.name;
            if (avatarEl) avatarEl.textContent = employee.name.charAt(0).toUpperCase();
            if (scoreEl) {
                const improvementPrefix = employee.improvement > 0 ? '+' : '';
                scoreEl.innerHTML = `${improvementPrefix}${employee.improvement.toFixed(2)}% <span class="${recognitionClass}">${employee.recognition}</span>`;
            }
        } else {
            if (nameEl) nameEl.textContent = '-';
            if (avatarEl) avatarEl.textContent = '-';
            if (scoreEl) scoreEl.innerHTML = '- <span class="status-badge">-</span>';
        }
    });
}

function clearLeaderboard() {
    if (confirm('Are you sure you want to clear the TOM Team Leaderboard?')) {
        document.getElementById('leaderboardBody').innerHTML = '';
        updateLeaderboardPodium([]);
    }
}

function exportLeaderboardExcel() {
    const leaderboardData = getLeaderboardData();
    if (leaderboardData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const headers = ['Rank', 'Associate Name', 'Overall Score', 'Improvement', 'Recognition'];
    const rows = leaderboardData.map((row, index) => [
        index + 1, row.name, row.overallScore.toFixed(2), row.improvement.toFixed(2), row.recognition
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TOM Team Leaderboard');
    XLSX.writeFile(wb, 'TOM_Team_Leaderboard.xlsx');
}

function exportLeaderboardCSV() {
    const leaderboardData = getLeaderboardData();
    if (leaderboardData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const headers = ['Rank', 'Associate Name', 'Overall Score', 'Improvement', 'Recognition'];
    const rows = leaderboardData.map((row, index) => [
        index + 1, row.name, row.overallScore.toFixed(2), row.improvement.toFixed(2), row.recognition
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TOM_Team_Leaderboard.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportLeaderboardJSON() {
    const leaderboardData = getLeaderboardData();
    if (leaderboardData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const exportData = leaderboardData.map((row, index) => ({
        rank: index + 1,
        associateName: row.name,
        overallScore: parseFloat(row.overallScore.toFixed(2)),
        improvement: parseFloat(row.improvement.toFixed(2)),
        recognition: row.recognition
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TOM_Team_Leaderboard.json';
    a.click();
    window.URL.revokeObjectURL(url);
}

function getLeaderboardData() {
    const tbody = document.getElementById('leaderboardBody');
    const rows = tbody.querySelectorAll('tr');
    const data = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            data.push({
                name: cells[1].textContent,
                overallScore: parseFloat(cells[2].textContent),
                improvement: parseFloat(cells[3].textContent.replace('%', '').replace('+', '')),
                recognition: cells[4].textContent
            });
        }
    });
    
    return data;
}

function deleteLeaderboardRow(employeeName) {
    if (confirm(`Are you sure you want to remove ${employeeName} from the leaderboard?`)) {
        // Remove the employee from all tables
        Object.values(dashboards).forEach(dashboard => {
            if (dashboard && dashboard.data) {
                dashboard.data = dashboard.data.filter(emp => emp.name !== employeeName);
                dashboard.renderTable();
            }
        });
        
        // Update the leaderboard
        setTimeout(updateLeaderboard, 100);
    }
}

// Update leaderboard whenever any table data changes (with debounce)
let leaderboardUpdateTimeout;
const originalRenderTable = TOMDashboard.prototype.renderTable;
TOMDashboard.prototype.renderTable = function() {
    // Check if this table has a custom renderTable override (for edit functionality)
    if (this.customRenderTable) {
        this.customRenderTable.call(this);
    } else {
        originalRenderTable.call(this);
    }
    
    // Debounce the leaderboard update to prevent multiple rapid calls
    clearTimeout(leaderboardUpdateTimeout);
    leaderboardUpdateTimeout = setTimeout(updateLeaderboard, 500);
};

// Simple Working Navigation Functions
function toggleNav() {
    const panel = document.getElementById('navPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function toggleBenchmarks() {
    const list = document.getElementById('benchmarkList');
    const arrow = document.getElementById('arrow');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        arrow.textContent = '▲';
    } else {
        list.style.display = 'none';
        arrow.textContent = '▼';
    }
}

function goTo(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('navPanel').style.display = 'none';
    }
    return false;
}

function scrollToElement(selector) {
    navigateToSection(selector);
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToBottom() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
}

// Close navigation when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        const nav = document.getElementById('simpleNav');
        const navPanel = document.getElementById('navPanel');
        
        if (nav && navPanel && navPanel.style.display === 'block') {
            // Check if click is outside the navigation
            if (!nav.contains(event.target)) {
                navPanel.style.display = 'none';
            }
        }
    });
});

// Handle navigation link clicks
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-subitem');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetId = this.getAttribute('href');
            scrollToElement(targetId);
        });
    });
});

// Auto-load JSON data files on page load
function autoLoadJSONData() {
    const jsonFiles = [
        { file: 'data1.json', dashboard: 'tableBody', name: 'VTI Compliance' },
        { file: 'data2.json', dashboard: 'tableBody2', name: 'VTI DPMO' },
        { file: 'data3.json', dashboard: 'tableBody3', name: 'TA Idle Time' },
        { file: 'data4.json', dashboard: 'tableBody4', name: 'Seal Validation' },
        { file: 'data5.json', dashboard: 'tableBody5', name: 'PPO Compliance' },
        { file: 'data6.json', dashboard: 'tableBody6', name: 'Andon Response Time' }
    ];
    
    let loadedCount = 0;
    let errorCount = 0;
    
    jsonFiles.forEach(({ file, dashboard, name }) => {
        fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`File not found: ${file}`);
                }
                return response.json();
            })
            .then(jsonData => {
                if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                    const targetDashboard = dashboards[dashboard];
                    if (targetDashboard) {
                        targetDashboard.data = jsonData.data;
                        targetDashboard.calculateChanges();
                        targetDashboard.renderTable();
                        targetDashboard.updatePodium();
                        targetDashboard.persistData();
                        loadedCount++;
                        console.log(`✅ Loaded ${name} from ${file} (${jsonData.recordCount} records)`);
                    }
                } else {
                    console.warn(`⚠️ Invalid JSON format in ${file}`);
                    errorCount++;
                }
            })
            .catch(error => {
                console.log(`ℹ️ ${file} not found (this is normal if you haven't uploaded it yet)`);
                errorCount++;
            });
    });
    
    // Show summary message after all attempts
    setTimeout(() => {
        if (loadedCount > 0 && dashboards['tableBody']) {
            dashboards['tableBody'].showMessage(`Loaded ${loadedCount} table(s) from JSON files`, 'success');
        }
    }, 1000);
}
