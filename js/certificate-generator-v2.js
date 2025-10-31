// Achievement Certificate Generator V2 - Self-Contained
// No external dependencies, everything embedded

// Amazon's 16 Leadership Principles
const LEADERSHIP_PRINCIPLES_V2 = [
    'Customer Obsession',
    'Ownership',
    'Invent and Simplify',
    'Are Right, A Lot',
    'Learn and Be Curious',
    'Hire and Develop the Best',
    'Insist on the Highest Standards',
    'Think Big',
    'Bias for Action',
    'Frugality',
    'Earn Trust',
    'Dive Deep',
    'Have Backbone; Disagree and Commit',
    'Deliver Results',
    'Strive to be Earth\'s Best Employer',
    'Success and Scale Bring Broad Responsibility'
];

// Inject modal HTML on page load
(function() {
    if (document.getElementById('certificateModalV2')) return;
    
    const modalHTML = `
<div id="certificateModalV2" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 99999; overflow-y: auto;">
    <div style="position: relative; max-width: 1200px; margin: 30px auto; background: linear-gradient(135deg, #232F3E 0%, #37475A 100%); color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 50px rgba(255,215,0,0.5); border: 3px solid #FFD700;">
        
        <div style="margin-bottom: 30px; border-bottom: 3px solid #FFD700; padding-bottom: 20px;">
            <h2 style="color: #FFD700; margin: 0; font-size: 36px;">🏆 Achievement Certificate Generator</h2>
            <p style="color: #FF9900; margin: 5px 0 0 0; font-size: 14px;">Create professional, printable certificates with Amazon Leadership Principles</p>
        </div>
        
        <div style="background: rgba(255,215,0,0.1); padding: 30px; border-radius: 15px; border-left: 5px solid #FFD700; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
                <div>
                    <label style="display: block; color: #FFD700; font-size: 18px; font-weight: bold; margin-bottom: 15px;">👤 Select Employee:</label>
                    <select id="certificateEmployeeSelectV2" style="width: 100%; padding: 15px; border: 2px solid #FFD700; border-radius: 10px; background: white; color: #232F3E; font-size: 16px; font-weight: bold; cursor: pointer;">
                        <option value="">-- Select Employee --</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; color: #FFD700; font-size: 18px; font-weight: bold; margin-bottom: 15px;">🏅 Award Type:</label>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <label style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s;" onmouseover="this.style.borderColor='#FFD700'" onmouseout="this.style.borderColor='transparent'">
                            <input type="radio" name="awardTypeV2" value="employee" style="width: 20px; height: 20px; margin-right: 15px; cursor: pointer;">
                            <span style="font-size: 16px; font-weight: bold;">⭐ Employee of the Month</span>
                        </label>
                        <label style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s;" onmouseover="this.style.borderColor='#FFD700'" onmouseout="this.style.borderColor='transparent'">
                            <input type="radio" name="awardTypeV2" value="driverstar" style="width: 20px; height: 20px; margin-right: 15px; cursor: pointer;">
                            <span style="font-size: 16px; font-weight: bold;">🌟 Driver Star</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <button onclick="generateCertificateV2()" style="width: 100%; background: linear-gradient(135deg, #FF9900 0%, #FF6B00 100%); color: white; border: none; padding: 18px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255,153,0,0.4); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255,153,0,0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255,153,0,0.4)'">
                ✨ Generate Certificate
            </button>
        </div>
        
        <div id="certificateDisplayV2" style="background: white; padding: 40px; border-radius: 15px; min-height: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
            <div style="text-align: center; padding: 100px 20px; color: #999;">
                <div style="font-size: 80px; margin-bottom: 20px;">🏆</div>
                <h3 style="color: #FFD700; margin-bottom: 10px;">Ready to Create a Certificate</h3>
                <p style="color: #666;">Select an employee and award type above, then click Generate Certificate</p>
            </div>
        </div>
        
        <div id="certificateActionsV2" style="display: none; margin-top: 30px; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button onclick="printCertificateV2()" style="background: #067D62; color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(6,125,98,0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🖨️ Print Certificate
            </button>
            <button onclick="resetCertificateV2()" style="background: #37475A; color: white; border: 2px solid #FFD700; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; transition: all 0.3s;" onmouseover="this.style.background='#232F3E'" onmouseout="this.style.background='#37475A'">
                🔄 Generate Another
            </button>
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 2px solid rgba(255,215,0,0.3);">
            <button onclick="closeCertificateModalV2()" style="background: #D13212; color: white; border: none; padding: 15px 50px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(209,50,18,0.4); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(209,50,18,0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(209,50,18,0.4)'">
                ✖️ Close
            </button>
        </div>
        
    </div>
</div>

<style>
    @media print {
        @page {
            size: 11in 8.5in landscape;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
        }
        
        body * {
            visibility: hidden !important;
        }
        
        #certificateContentV2,
        #certificateContentV2 * {
            visibility: visible !important;
        }
        
        #certificateContentV2 {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 11in !important;
            height: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
        }
        
        .certificate-container-v2 {
            width: 11in !important;
            height: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
        }
        
        #certificateModalV2 {
            background: white !important;
        }
    }
    
    .certificate-container-v2 {
        width: 11in;
        height: 8.5in;
        margin: 0 auto;
        background: white;
        position: relative;
        box-sizing: border-box;
    }
    
    .certificate-border-v2 {
        background: linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%);
        border: 20px solid #232F3E;
        border-image: linear-gradient(135deg, #232F3E 0%, #37475A 50%, #232F3E 100%) 1;
        padding: 35px;
        height: 100%;
        box-sizing: border-box;
        position: relative;
        box-shadow: inset 0 0 30px rgba(255,153,0,0.1);
    }
    
    .certificate-border-v2::before {
        content: '';
        position: absolute;
        top: 15px;
        left: 15px;
        right: 15px;
        bottom: 15px;
        border: 3px solid #FF9900;
        pointer-events: none;
        border-radius: 4px;
    }
    
    .certificate-border-v2::after {
        content: '';
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        border: 1px solid #FFD700;
        pointer-events: none;
        border-radius: 2px;
    }
</style>
`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Certificate Generator V2 loaded');
})();

// Open Modal
function openCertificateModalV2() {
    const modal = document.getElementById('certificateModalV2');
    if (modal) {
        modal.style.display = 'block';
        populateEmployeeDropdownV2();
    }
}

// Close Modal
function closeCertificateModalV2() {
    document.getElementById('certificateModalV2').style.display = 'none';
}

// Populate Employee Dropdown
function populateEmployeeDropdownV2() {
    const dropdown = document.getElementById('certificateEmployeeSelectV2');
    dropdown.innerHTML = '<option value="">-- Select Employee --</option>';
    
    const employeeNames = new Set();
    
    // Get from Employee Management
    const employeesData = localStorage.getItem('employees');
    if (employeesData) {
        try {
            const employees = JSON.parse(employeesData);
            employees.forEach(emp => {
                if (!emp.excludeFromTables && emp.fullName) {
                    employeeNames.add(emp.fullName);
                }
            });
        } catch (e) {
            console.error('Error parsing employees:', e);
        }
    }
    
    // Get from leaderboard
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (leaderboardBody) {
        const rows = leaderboardBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const name = cells[1]?.textContent.trim();
                if (name && name !== '-') {
                    employeeNames.add(name);
                }
            }
        });
    }
    
    // Get from all tables
    for (let i = 1; i <= 6; i++) {
        const tableBody = document.getElementById(`tableBody${i === 1 ? '' : i}`);
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const name = cells[1]?.textContent.trim();
                    if (name && name !== '-') {
                        employeeNames.add(name);
                    }
                }
            });
        }
    }
    
    // Sort and add to dropdown
    const sortedNames = Array.from(employeeNames).sort();
    sortedNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
    });
    
    console.log(`Found ${sortedNames.length} employees`);
}

// Get Employee Performance Data
function getEmployeePerformanceData(employeeName, awardType) {
    const performanceData = {
        metrics: [],
        improvements: [],
        topAreas: []
    };
    
    // For driver awards (driver and driverstar), only use TOM metrics, not driver-specific metrics
    // For employee awards, use all 6 TOM operational metrics
    const metricNames = (awardType === 'driver' || awardType === 'driverstar') ? 
        [] : // Driver awards don't pull from TOM tables
        [
            { id: '', name: 'VTI Compliance', unit: '%', higherIsBetter: true },
            { id: '2', name: 'VTI DPMO', unit: '', higherIsBetter: false },
            { id: '3', name: 'TA Idle Time', unit: ' min', higherIsBetter: false },
            { id: '4', name: 'Seal Validation', unit: '%', higherIsBetter: true },
            { id: '5', name: 'PPO Compliance', unit: '', higherIsBetter: true },
            { id: '6', name: 'Andon Response Time', unit: ' min', higherIsBetter: false }
        ];
    
    metricNames.forEach(metric => {
        const tableBody = document.getElementById(`tableBody${metric.id}`);
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const name = cells[1]?.textContent.trim();
                    if (name === employeeName) {
                        const prior = parseFloat(cells[2]?.textContent.replace(/[^0-9.-]/g, '')) || 0;
                        const current = parseFloat(cells[3]?.textContent.replace(/[^0-9.-]/g, '')) || 0;
                        const change = parseFloat(cells[4]?.textContent.replace(/[^0-9.-]/g, '')) || 0;
                        
                        performanceData.metrics.push({
                            name: metric.name,
                            prior: prior,
                            current: current,
                            change: change,
                            unit: metric.unit,
                            higherIsBetter: metric.higherIsBetter
                        });
                        
                        // Check if this is an improvement
                        const isImprovement = metric.higherIsBetter ? change > 0 : change < 0;
                        if (isImprovement && Math.abs(change) > 2) {
                            performanceData.improvements.push({
                                name: metric.name,
                                change: Math.abs(change),
                                unit: metric.unit
                            });
                        }
                    }
                }
            });
        }
    });
    
    // Sort improvements by magnitude
    performanceData.improvements.sort((a, b) => b.change - a.change);
    
    return performanceData;
}

// Generate Certificate
function generateCertificateV2() {
    const employeeName = document.getElementById('certificateEmployeeSelectV2').value;
    const awardType = document.querySelector('input[name="awardTypeV2"]:checked')?.value;
    
    if (!employeeName) {
        console.warn('Please select an employee');
        return;
    }
    
    if (!awardType) {
        console.warn('Please select an award type');
        return;
    }
    
    const performanceData = getEmployeePerformanceData(employeeName, awardType);
    const verbiage = generateVerbiageV2(employeeName, awardType, performanceData);
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const awardTitle = awardType === 'driverstar' ? '🌟 Driver Star' : 
                       '⭐ Employee of the Month';
    
    // Get award-specific logo
    const logoPath = AWARD_LOGOS[awardType] || 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';
    
    const certificateHTML = `
        <div class="certificate-container-v2" id="certificateContentV2">
            <div class="certificate-border-v2">
                <!-- Compact Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #FF9900;">
                    <div style="flex: 1;">
                        <img src="${logoPath}" alt="${awardTitle}" style="height: 70px; max-width: 150px; object-fit: contain;" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'">
                    </div>
                    <div style="flex: 2; text-align: center;">
                        <h1 style="color: #FF9900; font-size: 32px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                            Certificate of Excellence
                        </h1>
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" style="height: 35px; opacity: 0.9;">
                    </div>
                </div>
                
                <!-- Award Badge -->
                <div style="text-align: center; margin: 20px 0;">
                    <div style="background: linear-gradient(135deg, #FF9900 0%, #FF6B00 100%); color: white; font-size: 22px; font-weight: bold; padding: 10px 35px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(255,153,0,0.4); border: 2px solid #FFD700;">
                        ${awardTitle}
                    </div>
                </div>
                
                <!-- Recipient Section -->
                <div style="text-align: center; padding: 12px; margin: 8px 0;">
                    <div style="font-size: 16px; color: #232F3E; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        Proudly Presented To
                    </div>
                    
                    <div style="font-size: 44px; color: #232F3E; margin: 8px 0; font-weight: bold; font-family: 'Georgia', serif; border-bottom: 3px solid #FF9900; padding-bottom: 8px; display: inline-block; min-width: 350px;">
                        ${employeeName}
                    </div>
                </div>
                
                <!-- Recognition Text -->
                <div style="padding: 15px 40px; border-left: 4px solid #FF9900; border-right: 4px solid #FF9900; margin: 10px 15px;">
                    <div style="font-size: 14px; color: #232F3E; line-height: 1.6; text-align: justify; font-family: 'Georgia', serif;">
                        ${verbiage}
                    </div>
                </div>
                
                <!-- Month/Year Display -->
                <div style="text-align: center; margin: 15px 0 10px 0;">
                    <div style="background: #232F3E; color: #FF9900; font-size: 18px; font-weight: bold; padding: 8px 25px; border-radius: 6px; display: inline-block;">
                        ${monthYear}
                    </div>
                </div>
                
                <!-- Signature Section -->
                <div style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-around; padding: 0 80px; margin-bottom: 15px;">
                        <div style="text-align: center; flex: 1;">
                            <div style="min-height: 40px; margin-bottom: 8px;"></div>
                            <div style="border-top: 3px solid #232F3E; padding-top: 8px; margin: 0 20px;">
                                <div style="font-size: 14px; color: #232F3E; font-weight: bold;">Manager Signature</div>
                            </div>
                        </div>
                        <div style="text-align: center; flex: 1;">
                            <div style="min-height: 40px; margin-bottom: 8px;"></div>
                            <div style="border-top: 3px solid #232F3E; padding-top: 8px; margin: 0 20px;">
                                <div style="font-size: 14px; color: #232F3E; font-weight: bold;">Date</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; font-size: 11px; color: #666; margin-top: 25px; padding-top: 10px;">
                    <strong style="color: #232F3E;">Amazon Transportation Operations Management</strong> • Excellence in Performance Recognition
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('certificateDisplayV2').innerHTML = certificateHTML;
    document.getElementById('certificateActionsV2').style.display = 'flex';
}

// DOTM Metrics Configuration
const DOTM_METRICS = {
    smartDriveSafety: { weight: 50, name: 'SmartDrive Safety Score', phrases: ['exceptional safety record', 'unwavering commitment to safe driving', 'exemplary safety performance'] },
    onTimePerformance: { weight: 20, name: 'On-time Performance', phrases: ['punctuality excellence', 'reliable delivery timing', 'consistent on-time arrivals'] },
    acceptanceRate: { weight: 20, name: 'Acceptance Rate', phrases: ['outstanding trip acceptance', 'commitment to completing every assignment', 'reliability in accepting routes'] },
    appUsage: { weight: 5, name: 'Relay Mobile App Usage', phrases: ['exemplary technology adoption', 'consistent app engagement', 'digital excellence'] },
    disruptions: { weight: 5, name: 'Rate of Disruptions', phrases: ['smooth operations', 'minimal service interruptions', 'operational consistency'] }
};

// EOTM Metrics Configuration (6 TOM Categories)
const EOTM_METRICS = {
    vtiCompliance: { name: 'VTI Compliance', phrases: ['exceptional compliance standards', 'unwavering adherence to VTI protocols', 'outstanding VTI performance'] },
    vtiDPMO: { name: 'VTI DPMO', phrases: ['remarkable defect reduction', 'exceptional quality control', 'outstanding defects per million opportunities management'] },
    taIdleTime: { name: 'TA Idle Time', phrases: ['exceptional time management', 'outstanding efficiency in minimizing idle time', 'remarkable productivity optimization'] },
    sealValidation: { name: 'Seal Validation', phrases: ['meticulous seal validation accuracy', 'exceptional attention to security protocols', 'outstanding seal verification performance'] },
    ppoCompliance: { name: 'PPO Compliance', phrases: ['exemplary PPO adherence', 'outstanding process compliance', 'exceptional operational standards'] },
    andonResponse: { name: 'Andon Response Time', phrases: ['lightning-fast response times', 'exceptional problem-solving agility', 'outstanding responsiveness to operational needs'] }
};

// Award Logo Configuration
const AWARD_LOGOS = {
    employee: 'demo/logos/TOM NA.png',
    driverstar: 'demo/logos/TOM NA.png'
};

// Generate Verbiage with Performance Data
function generateVerbiageV2(name, awardType, performanceData) {
    const shuffled = [...LEADERSHIP_PRINCIPLES_V2].sort(() => 0.5 - Math.random());
    const principles = shuffled.slice(0, 4);
    
    // Build performance highlights
    let performanceHighlights = '';
    if (performanceData.improvements.length > 0) {
        const topImprovements = performanceData.improvements.slice(0, 2);
        const improvementText = topImprovements.map(imp => imp.name).join(' and ');
        performanceHighlights = ` Your remarkable improvements in ${improvementText} by demonstrating your commitment to excellence.`;
    }
    
    const templates = {
        driver: [
            // DOTM-specific verbiage with all 5 metrics - Multiple variations
            `${name} has earned Driver of the Month through outstanding performance across all five critical metrics. Your <strong>exceptional SmartDrive Safety Score</strong> (50% weighting) demonstrates your commitment to protecting yourself and others on every route. Your <strong>excellent on-time performance</strong> and <strong>outstanding acceptance rate</strong> (20% each) showcase reliability that our customers depend on. Your <strong>consistent Relay app usage</strong> and <strong>minimal disruptions</strong> reflect operational excellence.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you exemplify world-class driver performance. Thank you for setting the standard!`,
            
            `Congratulations ${name} on Driver of the Month! Your achievement is built on five pillars of excellence. <strong>Safety first</strong>—your SmartDrive score (50%) proves your dedication to safe driving practices. <strong>Reliability matters</strong>—your on-time performance and trip acceptance (20% each) show unwavering dependability. <strong>Technology adoption</strong>—your Relay app engagement keeps operations smooth. <strong>Consistency counts</strong>—your minimal disruptions demonstrate professional excellence.${performanceHighlights} By living <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you've earned this recognition. Outstanding work!`,
            
            `${name}, your Driver of the Month recognition celebrates comprehensive excellence! Your <strong>SmartDrive Safety performance</strong>—weighted at 50%—shows you prioritize safety above all. Combined with your <strong>punctual arrivals and departures</strong>, <strong>commitment to accepting every assignment</strong>, <strong>effective app utilization</strong>, and <strong>disruption-free operations</strong>, you've demonstrated the complete package.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you embody what makes Amazon drivers exceptional!`,
            
            `Well done, ${name}! Your Driver of the Month award reflects mastery across all five performance dimensions. Your <strong>outstanding safety record on SmartDrive</strong> (our most heavily weighted metric at 50%) sets you apart as a safety leader. Your <strong>on-time reliability</strong> and <strong>trip acceptance excellence</strong> (each 20%) prove your dedication to service. Your <strong>Relay app proficiency</strong> and <strong>smooth operational execution</strong> complete an impressive performance profile.${performanceHighlights} You exemplify <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>. Keep up the amazing work!`,
            
            `${name} has achieved Driver of the Month by excelling in every metric that matters. <strong>Safety excellence</strong>—your SmartDrive score (50%) demonstrates unwavering commitment. <strong>Timeliness</strong>—your on-time performance (20%) shows respect for schedules. <strong>Dependability</strong>—your acceptance rate (20%) proves reliability. <strong>Tech-savvy operations</strong>—your Relay app usage keeps you connected. <strong>Operational smoothness</strong>—your minimal disruptions showcase professionalism.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you're making a difference every day!`
        ],
        employee: [
            // EOTM-specific verbiage with all 6 TOM metrics - Multiple variations
            `${name} has earned Employee of the Month through exceptional performance across all six TOM operational categories. Your excellence in <strong>VTI Compliance</strong> and <strong>VTI DPMO</strong> demonstrates unwavering commitment to quality. Your outstanding <strong>TA Idle Time management</strong> reflects dedication to efficiency. Your meticulous <strong>Seal Validation</strong> shows attention to security. Your exemplary <strong>PPO Compliance</strong> and impressive <strong>Andon Response Time</strong> complete your comprehensive achievement.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you've set yourself apart as a true leader. You are exactly the kind of associate that makes Amazon great!`,
            
            `Congratulations ${name} on Employee of the Month! Your ability to excel in all six critical metrics—<strong>VTI Compliance, VTI DPMO, TA Idle Time, Seal Validation, PPO Compliance, and Andon Response Time</strong>—demonstrates comprehensive excellence. Your <strong>exceptional VTI performance</strong> showcases quality commitment. Your <strong>outstanding time management</strong> reflects productivity dedication. Your <strong>meticulous seal validation</strong> and <strong>exemplary PPO compliance</strong> show attention to detail and standards. Your <strong>impressive response times</strong> highlight problem-solving agility.${performanceHighlights} By embodying <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you've proven yourself invaluable. We're incredibly proud of your achievements!`,
            
            `${name}, your Employee of the Month achievement represents operational excellence across every dimension! Your comprehensive performance in all six TOM categories—<strong>VTI Compliance, VTI DPMO, TA Idle Time, Seal Validation, PPO Compliance, and Andon Response Time</strong>—demonstrates quality consciousness, efficiency, attention to detail, and responsiveness. Your <strong>outstanding VTI metrics</strong> reflect quality standards. Your <strong>exceptional productivity</strong> showcases efficiency. Your <strong>meticulous validation</strong> and <strong>exemplary compliance</strong> demonstrate dedication to best practices.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you embody Amazon excellence and set the gold standard for our team!`,
            
            `Outstanding work, ${name}! Your Employee of the Month recognition celebrates excellence across all six operational pillars. Your <strong>VTI Compliance and DPMO achievements</strong> showcase quality mastery. Your <strong>TA Idle Time optimization</strong> demonstrates efficiency focus. Your <strong>Seal Validation precision</strong> reflects security consciousness. Your <strong>PPO Compliance consistency</strong> and <strong>rapid Andon Response</strong> complete a remarkable performance profile.${performanceHighlights} You exemplify <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>. Thank you for your dedication!`,
            
            `${name} has achieved Employee of the Month by mastering every aspect of TOM operations. <strong>Quality leadership</strong>—your VTI metrics set the standard. <strong>Efficiency champion</strong>—your idle time management maximizes productivity. <strong>Security focused</strong>—your seal validation is meticulous. <strong>Process excellence</strong>—your PPO compliance is exemplary. <strong>Responsive problem-solver</strong>—your Andon response time is impressive.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you make our operation stronger every day!`
        ],
        driverstar: [
            // Driver Star with all 5 DOTM metrics - Multiple variations
            `${name} has earned Driver Star through exceptional performance across all five key metrics. Your <strong>outstanding SmartDrive Safety Score</strong>—our most critical metric at 50% weighting—demonstrates unwavering commitment to safe driving. Combined with your <strong>excellent on-time performance</strong> and <strong>exceptional acceptance rate</strong> (each 20%), you've set the gold standard for reliability. Your <strong>consistent Relay app usage</strong> and <strong>minimal disruptions</strong> complete your comprehensive excellence.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you exemplify what it means to be a world-class Amazon driver. Thank you for your outstanding dedication to safety, reliability, and operational excellence!`,
            
            `Congratulations ${name} on achieving Driver Star! Your <strong>exemplary SmartDrive Safety Score</strong> (50% of your achievement) reflects exceptional safety leadership. Your <strong>punctuality excellence</strong> and <strong>outstanding trip acceptance</strong> (20% each) demonstrate unwavering reliability. Your <strong>Relay app engagement</strong> and <strong>smooth operations</strong> round out a truly impressive performance profile.${performanceHighlights} By embodying <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you've proven yourself invaluable to our team. Your excellence across safety, timeliness, acceptance, technology, and consistency makes you a true champion!`,
            
            `${name}, your Driver Star achievement represents excellence across every dimension! Your <strong>exceptional SmartDrive safety performance</strong>—our most critical metric—shows your dedication to protecting everyone on the road. Combined with your <strong>reliable on-time performance</strong>, <strong>commitment to accepting every trip</strong>, <strong>consistent app engagement</strong>, and <strong>minimal disruptions</strong>, you've earned this well-deserved recognition.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you embody Amazon excellence. Your performance across all five Driver Star metrics sets the standard for our team!`,
            
            `Exceptional work, ${name}! Your Driver Star status is earned through comprehensive excellence. <strong>Safety mastery</strong>—your SmartDrive score (50%) proves you're a safety champion. <strong>Reliability personified</strong>—your on-time and acceptance rates (20% each) show unwavering dependability. <strong>Technology proficient</strong>—your Relay app usage keeps operations flowing. <strong>Operationally sound</strong>—your minimal disruptions demonstrate true professionalism.${performanceHighlights} You live <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong> every day. You're a star!`,
            
            `${name} has achieved Driver Star by excelling in all five critical performance areas. Your <strong>SmartDrive Safety excellence</strong> (weighted at 50%) makes you a role model for safe driving. Your <strong>on-time consistency</strong> and <strong>trip acceptance commitment</strong> (each 20%) prove your reliability. Your <strong>Relay app proficiency</strong> and <strong>disruption-free operations</strong> showcase operational maturity.${performanceHighlights} Through <strong>${principles[0]}</strong>, <strong>${principles[1]}</strong>, <strong>${principles[2]}</strong>, and <strong>${principles[3]}</strong>, you shine bright as a true Driver Star!`
        ]
    };
    
    // Randomly select one of the templates for driver awards
    const templateArray = templates[awardType];
    const selectedTemplate = templateArray[Math.floor(Math.random() * templateArray.length)];
    
    return selectedTemplate;
}

// Print Certificate
function printCertificateV2() {
    // Get the certificate content
    const certificateContent = document.getElementById('certificateContentV2');
    if (!certificateContent) {
        console.error('Certificate content not found');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    
    // Write the certificate HTML with proper styling
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Certificate</title>
            <style>
                @page {
                    size: 11in 8.5in landscape;
                    margin: 0;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    width: 11in;
                    height: 8.5in;
                }
                
                .certificate-container-v2 {
                    width: 11in;
                    height: 8.5in;
                    background: white;
                    position: relative;
                    box-sizing: border-box;
                }
                
                .certificate-border-v2 {
                    background: linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%);
                    border: 20px solid #232F3E;
                    border-image: linear-gradient(135deg, #232F3E 0%, #37475A 50%, #232F3E 100%) 1;
                    padding: 35px;
                    height: 100%;
                    box-sizing: border-box;
                    position: relative;
                    box-shadow: inset 0 0 30px rgba(255,153,0,0.1);
                }
                
                .certificate-border-v2::before {
                    content: '';
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    right: 15px;
                    bottom: 15px;
                    border: 3px solid #FF9900;
                    pointer-events: none;
                    border-radius: 4px;
                }
                
                .certificate-border-v2::after {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    border: 1px solid #FFD700;
                    pointer-events: none;
                    border-radius: 4px;
                }
                
                @media print {
                    body {
                        width: 11in;
                        height: 8.5in;
                    }
                }
            </style>
        </head>
        <body>
            ${certificateContent.outerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };
}

// Reset Certificate
function resetCertificateV2() {
    document.getElementById('certificateEmployeeSelectV2').value = '';
    document.querySelectorAll('input[name="awardTypeV2"]').forEach(radio => radio.checked = false);
    document.getElementById('certificateDisplayV2').innerHTML = `
        <div style="text-align: center; padding: 100px 20px; color: #999;">
            <div style="font-size: 80px; margin-bottom: 20px;">🏆</div>
            <h3 style="color: #FFD700; margin-bottom: 10px;">Ready to Create a Certificate</h3>
            <p style="color: #666;">Select an employee and award type above, then click Generate Certificate</p>
        </div>
    `;
    document.getElementById('certificateActionsV2').style.display = 'none';
}
