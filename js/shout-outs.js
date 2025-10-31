// TOM SHOUT OUTS - THE UNIVERSE'S MOST POWERFUL SHOUT OUT GENERATOR
// Generates thousands of unique, genuine, heartfelt shout outs for amazing team members

let allShoutOuts = [];
let currentPageIndex = 0;
const SHOUT_OUTS_PER_PAGE = 6; // 2 rows x 3 columns

function openShoutOutModal() {
    document.getElementById('shoutOutModal').style.display = 'block';
    generateShoutOuts(); // Auto-generate on open
}

function closeShoutOutModal() {
    document.getElementById('shoutOutModal').style.display = 'none';
}

function nextPage() {
    const totalPages = Math.ceil(allShoutOuts.length / SHOUT_OUTS_PER_PAGE);
    if (currentPageIndex < totalPages - 1) {
        currentPageIndex++;
        renderCurrentPage();
    }
}

function previousPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        renderCurrentPage();
    }
}

function generateShoutOuts() {
    const container = document.getElementById('shoutOutContainer');
    container.innerHTML = '<div style="text-align: center; padding: 60px 20px;"><div style="font-size: 64px; animation: spin 1s linear infinite;">🎉</div><p style="color: #FFD700; font-size: 20px;">Generating amazing shout outs...</p></div>';
    
    setTimeout(() => {
        allShoutOuts = collectShoutOutData();
        currentPageIndex = 0;
        
        if (allShoutOuts.length === 0) {
            container.innerHTML = '<div style="background: rgba(255,153,0,0.2); padding: 60px; border-radius: 15px; text-align: center; max-width: 600px; margin: 40px auto;">' +
                '<p style="font-size: 48px; margin-bottom: 20px;">📊</p>' +
                '<p style="color: #FFD700; font-size: 24px; margin-bottom: 10px;">No performance data available yet!</p>' +
                '<p style="color: white; font-size: 16px;">Upload your team\'s data to start generating shout outs.</p>' +
                '</div>';
            const statsEl = document.getElementById('shoutOutStats');
            if (statsEl) statsEl.textContent = '📊 No data available';
            return;
        }
        
        // Check if there's an active search
        const searchBox = document.getElementById('shoutOutSearch');
        if (searchBox && searchBox.value.trim()) {
            // Re-apply the search filter after regenerating
            searchShoutOuts();
        } else {
            renderCurrentPage();
        }
    }, 500);
}

function renderCurrentPage() {
    const container = document.getElementById('shoutOutContainer');
    const totalPages = Math.ceil(allShoutOuts.length / SHOUT_OUTS_PER_PAGE);
    const startIndex = currentPageIndex * SHOUT_OUTS_PER_PAGE;
    const endIndex = Math.min(startIndex + SHOUT_OUTS_PER_PAGE, allShoutOuts.length);
    const pageShoutOuts = allShoutOuts.slice(startIndex, endIndex);
    
    // Update pagination controls
    document.getElementById('currentPage').textContent = currentPageIndex + 1;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevBtn').disabled = currentPageIndex === 0;
    document.getElementById('nextBtn').disabled = currentPageIndex === totalPages - 1;
    document.getElementById('prevBtn').style.opacity = currentPageIndex === 0 ? '0.5' : '1';
    document.getElementById('nextBtn').style.opacity = currentPageIndex === totalPages - 1 ? '0.5' : '1';
    document.getElementById('prevBtn').style.cursor = currentPageIndex === 0 ? 'not-allowed' : 'pointer';
    document.getElementById('nextBtn').style.cursor = currentPageIndex === totalPages - 1 ? 'not-allowed' : 'pointer';
    
    // Update stats
    const statsEl = document.getElementById('shoutOutStats');
    if (statsEl) statsEl.textContent = `📊 Showing ${startIndex + 1}-${endIndex} of ${allShoutOuts.length} shout outs`;
    
    // Render grid
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; animation: fadeIn 0.5s;">';
    
    pageShoutOuts.forEach((shoutOut, pageIndex) => {
        const globalIndex = startIndex + pageIndex;
        const colors = [
            { bg: 'rgba(6,125,98,0.15)', border: '#067D62', accent: '#00D9A3' },
            { bg: 'rgba(255,153,0,0.15)', border: '#FF9900', accent: '#FFB84D' },
            { bg: 'rgba(103,58,183,0.15)', border: '#673AB7', accent: '#9575CD' },
            { bg: 'rgba(0,150,136,0.15)', border: '#009688', accent: '#4DB6AC' },
            { bg: 'rgba(255,87,34,0.15)', border: '#FF5722', accent: '#FF8A65' },
            { bg: 'rgba(33,150,243,0.15)', border: '#2196F3', accent: '#64B5F6' }
        ];
        const color = colors[pageIndex % colors.length];
        
        // Build Leadership Principles badges
        let principlesBadges = '';
        if (shoutOut.principles && shoutOut.principles.length > 0) {
            principlesBadges = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">';
            shoutOut.principles.forEach(principle => {
                principlesBadges += `
                    <div style="background: rgba(255,215,0,0.2); border: 1px solid #FFD700; padding: 6px 12px; border-radius: 20px; display: flex; align-items: center; gap: 5px;" title="${principle.definition}">
                        <span style="font-size: 16px;">${principle.icon}</span>
                        <span style="color: #FFD700; font-size: 11px; font-weight: bold;">${principle.name}</span>
                    </div>
                `;
            });
            principlesBadges += '</div>';
        }
        
        html += `
            <div style="background: ${color.bg}; padding: 25px; border-radius: 15px; border: 2px solid ${color.border}; position: relative; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer;" 
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.3)'; this.style.borderColor='${color.accent}'" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'; this.style.borderColor='${color.border}'">
                
                <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 48px; flex-shrink: 0;">${shoutOut.emoji}</div>
                    <div>
                        <div style="font-size: 24px; color: ${color.accent}; font-weight: bold; line-height: 1.2;">${shoutOut.fullName}</div>
                    </div>
                </div>
                
                ${principlesBadges}
                
                <div id="shoutout-${globalIndex}" style="color: white; font-size: 15px; line-height: 1.7; margin-bottom: 15px; min-height: 120px;">${shoutOut.message}</div>
                
                <div style="padding-top: 15px; border-top: 2px solid ${color.border}; font-size: 12px; color: ${color.accent}; margin-bottom: 15px;">
                    ${shoutOut.metrics}
                </div>
                
                <button onclick="copyShoutOut(${globalIndex}, event)" style="background: ${color.border}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; width: 100%; transition: all 0.3s;" onmouseover="this.style.background='${color.accent}'" onmouseout="this.style.background='${color.border}'">📋 Copy Shout Out</button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Scroll to top of container
    container.scrollTop = 0;
}

function collectShoutOutData() {
    const shoutOuts = [];
    const dashboardsRef = window.dashboards || {};
    const employees = window.simpleEmployees || [];
    
    // DEBUG: Check what we have
    console.log('🔍 DEBUG - Collecting Shout Out Data:');
    console.log('  - window.dashboards exists?', !!window.dashboards);
    console.log('  - dashboardsRef keys:', Object.keys(dashboardsRef));
    console.log('  - employees count:', employees.length);
    
    // Collect from all 6 tables
    const tables = [
        { key: 'tableBody', name: 'VTI Compliance', metric: 'VTI %', higherIsBetter: true },
        { key: 'tableBody2', name: 'VTI DPMO', metric: 'DPMO', higherIsBetter: false },
        { key: 'tableBody3', name: 'TA Idle Time', metric: 'minutes', higherIsBetter: false },
        { key: 'tableBody4', name: 'Seal Validation', metric: 'accuracy %', higherIsBetter: true },
        { key: 'tableBody5', name: 'PPO Compliance', metric: 'violations', higherIsBetter: false },
        { key: 'tableBody6', name: 'Andon Response', metric: 'minutes', higherIsBetter: false }
    ];
    
    tables.forEach(table => {
        const dashboard = dashboardsRef[table.key];
        console.log(`  - Checking ${table.name} (${table.key}):`, dashboard ? `${dashboard.data?.length || 0} records` : 'NOT FOUND');
        if (!dashboard || !dashboard.data || dashboard.data.length === 0) return;
        
        // Get top performers and improvers
        const data = [...dashboard.data];
        const topPerformers = data.slice(0, Math.min(5, data.length));
        
        topPerformers.forEach((person, rank) => {
            const employee = employees.find(emp => 
                emp.badgeId.toLowerCase() === person.name.toLowerCase() ||
                emp.username.toLowerCase() === person.name.toLowerCase() ||
                emp.email.toLowerCase() === person.name.toLowerCase()
            );
            
            const fullName = employee ? employee.fullName : person.name;
            const firstName = fullName.split(' ')[0];
            
            // Skip if excluded
            if (employee && employee.excludeFromTables) return;
            
            const shoutOut = generatePersonalizedShoutOut(
                firstName,
                fullName,
                person,
                table,
                rank + 1,
                data.length
            );
            
            if (shoutOut) {
                shoutOuts.push(shoutOut);
            }
        });
    });
    
    // Shuffle for variety
    return shuffleArray(shoutOuts);
}

function generatePersonalizedShoutOut(firstName, fullName, person, table, rank, totalPeople) {
    const status = person.status || '';
    const currentValue = person.currentMonth;
    const change = person.change;
    const priorValue = person.priorMonth;
    
    // Determine achievement type
    let achievementType = '';
    if (status === 'Excellent') achievementType = 'excellent';
    else if (status === 'Improved') achievementType = 'improved';
    else if (rank <= 3) achievementType = 'top3';
    else if (rank <= Math.ceil(totalPeople * 0.25)) achievementType = 'topQuarter';
    else achievementType = 'maintaining';
    
    const message = generateMessage(firstName, achievementType, table, currentValue, change, priorValue);
    const emoji = getRandomEmoji();
    const metrics = formatMetrics(table, currentValue, change, rank, totalPeople);
    
    // Suggest relevant Leadership Principles
    const suggestedPrinciples = suggestPrinciplesForShoutOut(achievementType, message);
    
    return {
        firstName,
        fullName,
        message,
        emoji,
        metrics,
        principles: suggestedPrinciples
    };
}

function suggestPrinciplesForShoutOut(achievementType, message) {
    // First, try to suggest based on message content
    const textSuggestions = suggestPrinciplesFromText(message);
    
    if (textSuggestions.length > 0) {
        return textSuggestions.slice(0, 2);
    }
    
    // Fallback to achievement type mapping
    const principleMap = {
        'excellent': ['highest-standards', 'deliver-results'],
        'improved': ['learn-curious', 'bias-action'],
        'top3': ['deliver-results', 'highest-standards'],
        'topQuarter': ['ownership', 'deliver-results'],
        'maintaining': ['ownership', 'deliver-results']
    };
    
    const principleIds = principleMap[achievementType] || principleMap['maintaining'];
    return principleIds.map(id => getPrincipleById(id)).filter(p => p);
}

function generateMessage(firstName, achievementType, table, currentValue, change, priorValue) {
    const messages = {
        excellent: [
            `${firstName}! I just had to take a moment to recognize your absolutely outstanding performance in ${table.name}. You're not just meeting expectations—you're crushing them! Your dedication to excellence is inspiring the entire team. Keep being the rockstar you are! 🌟`,
            
            `Hey ${firstName}, wow! Your ${table.name} results are phenomenal! I'm genuinely impressed by the consistency and quality you bring every single day. You make it look easy, but I know the hard work behind these numbers. Thank you for setting such a high bar! 💪`,
            
            `${firstName}, I need you to know how much your exceptional work in ${table.name} means to our team. You're the kind of person who makes my job as a leader so rewarding. Your commitment to excellence doesn't go unnoticed—you're making a real difference! 🎯`,
            
            `Shout out to ${firstName}! Your ${table.name} performance is absolutely stellar! I love seeing team members who take pride in their work like you do. You're not just doing a job—you're mastering it. Keep up this incredible momentum! 🚀`,
            
            `${firstName}, I'm blown away by your ${table.name} results! You consistently deliver at such a high level, and it's clear you care deeply about quality. Your work ethic is contagious, and I'm grateful to have you on this team! 🏆`,
            
            `${firstName}, your excellence in ${table.name} is exactly what world-class performance looks like! You're setting the gold standard for the entire team. I'm constantly amazed by your ability to deliver at this level day after day. You're a true champion! 🥇`,
            
            `I'm so proud of you, ${firstName}! Your ${table.name} performance is off the charts! You bring passion, precision, and professionalism to everything you touch. This is the kind of work that defines great teams. Thank you for being exceptional! ⭐`,
            
            `${firstName}, can we just appreciate how incredible your ${table.name} results are?! You're operating at an elite level, and it shows in every metric. Your commitment to quality is unmatched. Keep doing what you're doing—it's working! 💎`,
            
            `Hey ${firstName}! Your ${table.name} performance has me smiling from ear to ear! You're the definition of excellence, and your work speaks volumes about your character and dedication. I'm lucky to have you on this team! 🌟`,
            
            `${firstName}, your outstanding work in ${table.name} deserves major recognition! You're not just good—you're exceptional. Your consistency, quality, and dedication are inspiring everyone around you. This is what greatness looks like! 🏆`
        ],
        
        improved: [
            `${firstName}, I have to tell you—your improvement in ${table.name} is absolutely incredible! Watching you grow and develop has been one of the highlights of my week. This is what dedication looks like, and I'm so proud of your progress! Keep climbing! 📈`,
            
            `Hey ${firstName}! Can we talk about your amazing improvement in ${table.name}? This kind of growth doesn't happen by accident—it's the result of your hard work and determination. You're proving that continuous improvement is real, and I'm here for it! 💯`,
            
            `${firstName}, your trajectory in ${table.name} is exactly what I love to see! You took feedback, put in the work, and the results speak for themselves. This is the kind of growth mindset that leads to long-term success. I'm genuinely excited to see where you go from here! 🌱`,
            
            `Big shout out to ${firstName}! Your improvement in ${table.name} shows real character and commitment. Not everyone has the drive to push themselves like you do. You're not just getting better—you're becoming a role model for the team! 💪`,
            
            `${firstName}, I'm so impressed by your progress in ${table.name}! You've shown that with focus and effort, anything is possible. Your improvement is inspiring others around you, and that's the kind of positive energy we need. Keep it up! 🎯`,
            
            `${firstName}, your growth in ${table.name} is phenomenal! This is what I call a comeback story! You identified areas to improve, rolled up your sleeves, and made it happen. Your determination is contagious! 🚀`,
            
            `Wow, ${firstName}! The improvement you've shown in ${table.name} is exactly what I love to see! You're proof that hard work pays off. Your upward trend is inspiring, and I can't wait to see you continue this momentum! 📊`,
            
            `${firstName}, I'm genuinely excited about your progress in ${table.name}! You've taken ownership of your development, and it shows. This kind of self-driven improvement is what separates good from great. Keep pushing! 💪`,
            
            `Hey ${firstName}! Your improvement journey in ${table.name} is inspiring the whole team! You're showing everyone that growth is always possible with the right mindset. I'm proud to watch you level up! 🌟`,
            
            `${firstName}, the strides you've made in ${table.name} are remarkable! You've turned feedback into action and challenges into opportunities. This is the kind of growth that builds careers. Keep it going! 🎯`
        ],
        
        top3: [
            `${firstName}! Top 3 in ${table.name}—are you kidding me?! That's absolutely phenomenal! You're competing with the best and coming out on top. Your performance is a testament to your skill, dedication, and passion. The whole team is watching and learning from you! 🥇`,
            
            `Hey ${firstName}, top 3 in ${table.name}! I just want you to know how proud I am of this achievement. You're setting the standard for excellence, and your name at the top of that board is well-deserved. Thank you for bringing your A-game every single day! 🏅`,
            
            `${firstName}, landing in the top 3 for ${table.name} is no small feat! You're among the elite performers, and it shows in everything you do. Your consistency and quality are exactly what championship teams are built on. Keep leading by example! 👑`,
            
            `Massive shout out to ${firstName} for ranking in the top 3 for ${table.name}! This is the kind of performance that makes a real impact. You're not just doing well—you're excelling at the highest level. I'm honored to have you on this team! 🌟`,
            
            `${firstName}! Top 3 in ${table.name}—that's what I'm talking about! Your performance is outstanding, and your dedication is crystal clear. You're proving day in and day out that excellence is a habit, not an accident. Keep shining! ✨`
        ],
        
        topQuarter: [
            `${firstName}, being in the top 25% for ${table.name} is a huge accomplishment! You're consistently performing at a high level, and that kind of reliability is invaluable. Thank you for being someone I can always count on to deliver quality work! 🎯`,
            
            `Hey ${firstName}! Your ${table.name} performance puts you in the top quarter of the team—that's fantastic! You're doing the kind of steady, excellent work that keeps everything running smoothly. Your contributions don't go unnoticed! 💼`,
            
            `${firstName}, I want to recognize your strong performance in ${table.name}! Being in the top 25% shows you're bringing your best every day. Your consistency and quality are exactly what we need. Keep up the great work! 🌟`,
            
            `Shout out to ${firstName} for solid performance in ${table.name}! You're in the top quarter, which means you're outperforming the majority of the team. That takes skill and dedication. Thank you for your continued excellence! 💪`,
            
            `${firstName}, your ${table.name} results place you among our top performers! That's something to be proud of. You're doing great work, and I appreciate the effort and care you put into everything you do! 🏆`
        ],
        
        maintaining: [
            `${firstName}, I see you maintaining solid performance in ${table.name}, and I want you to know that consistency matters! You're showing up and doing the work day after day, and that reliability is so important to our team's success. Thank you! 💙`,
            
            `Hey ${firstName}! Your steady performance in ${table.name} is appreciated more than you might realize. Consistency is the foundation of great teams, and you're contributing to that every single day. Keep being the reliable team member you are! 🤝`,
            
            `${firstName}, I want to acknowledge your continued effort in ${table.name}! Showing up consistently and maintaining your performance takes dedication. You're an important part of this team, and your work matters. Thank you for what you do! 🙏`,
            
            `Shout out to ${firstName} for your ongoing commitment to ${table.name}! Consistency might not always be flashy, but it's what keeps teams strong. I appreciate your steady presence and the quality you bring to your work! 💼`,
            
            `${firstName}, your consistent performance in ${table.name} is valued! You're doing good work, and I want you to know it doesn't go unnoticed. Every team member plays a vital role, and you're fulfilling yours with dedication. Keep it up! 🌟`
        ]
    };
    
    const messageArray = messages[achievementType] || messages.maintaining;
    return messageArray[Math.floor(Math.random() * messageArray.length)];
}

function formatMetrics(table, currentValue, change, rank, totalPeople) {
    const changeSymbol = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    const changeText = change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    
    let metricDisplay = '';
    if (table.name === 'VTI Compliance' || table.name === 'Seal Validation') {
        metricDisplay = `${currentValue.toFixed(2)}%`;
    } else if (table.name === 'TA Idle Time' || table.name === 'Andon Response') {
        metricDisplay = `${currentValue.toFixed(2)} min`;
    } else {
        metricDisplay = currentValue.toFixed(2);
    }
    
    return `📊 ${table.name} | Current: ${metricDisplay} | Change: ${changeSymbol} ${changeText} | Rank: #${rank} of ${totalPeople}`;
}

function getRandomEmoji() {
    // Amazon-approved, professional, fun emojis
    const emojis = [
        '🌟', '⭐', '💫', '✨', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉', 
        '👏', '💪', '🚀', '🔥', '💯', '🎯', '👑', '💎', '🌈', '⚡',
        '🎪', '🎭', '🎨', '🎬', '📈', '📊', '💼', '🎓', '🏅', '🌺',
        '🦸', '🦾', '🧠', '💡', '🔆', '🌞', '🎖️', '🏵️', '🎗️', '🥳'
    ];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function copyShoutOut(index, event) {
    event.stopPropagation();
    
    const shoutOutElement = document.getElementById(`shoutout-${index}`);
    if (!shoutOutElement) {
        console.error('Could not find shout out content. Please try again.');
        return;
    }
    
    const parent = shoutOutElement.parentElement;
    
    // Find the name element (font-size: 24px for full name)
    const fullNameElement = parent.querySelector('[style*="font-size: 24px"]');
    const metricsElement = parent.querySelector('[style*="border-top"]');
    
    if (!fullNameElement || !metricsElement) {
        console.error('Could not extract shout out details. Please try again.');
        return;
    }
    
    // Get Leadership Principles badges
    const principleElements = parent.querySelectorAll('[title]');
    let principlesText = '';
    if (principleElements.length > 0) {
        principlesText = '\n🌟 Amazon Leadership Principles: ';
        const principleNames = [];
        principleElements.forEach(el => {
            const text = el.textContent.trim();
            if (text) principleNames.push(text);
        });
        principlesText += principleNames.join(', ') + '\n';
    }
    
    // Build the full text
    let text = `${fullNameElement.textContent}`;
    text += principlesText;
    text += `\n\n${shoutOutElement.textContent}\n\n`;
    text += `${metricsElement.textContent}`;
    
    // Fallback copy method for better browser compatibility
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
            // Visual feedback
            const button = event.target;
            const originalText = button.textContent;
            const originalBg = button.style.background;
            
            button.textContent = '✅ Copied!';
            button.style.background = '#067D62';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = originalBg;
            }, 2000);
        } else {
            console.error('Failed to copy. Please try selecting and copying manually.');
        }
    } catch (err) {
        document.body.removeChild(textarea);
        console.error('Copy failed. Please try selecting the text and copying manually (Ctrl+C).');
    }
}

function copyAllShoutOuts() {
    const container = document.getElementById('shoutOutContainer');
    const shoutOuts = container.querySelectorAll('[id^="shoutout-"]');
    
    if (shoutOuts.length === 0) {
        console.warn('No shout outs to copy! Generate some first.');
        return;
    }
    
    let allText = '🎉 TOM TEAM SHOUT OUTS 🎉\n';
    allText += '=' .repeat(50) + '\n\n';
    
    shoutOuts.forEach((element, index) => {
        const parent = element.parentElement;
        const nameElement = parent.querySelector('[style*="font-size: 24px"]');
        const fullNameElement = parent.querySelector('[style*="font-size: 14px"]');
        const metricsElement = parent.querySelector('[style*="border-top"]');
        
        allText += `${nameElement.textContent}\n`;
        allText += `${fullNameElement.textContent}\n\n`;
        allText += `${element.textContent}\n\n`;
        allText += `${metricsElement.textContent}\n`;
        allText += '\n' + '-'.repeat(50) + '\n\n';
    });
    
    allText += `Generated: ${new Date().toLocaleString()}\n`;
    allText += `Total Shout Outs: ${shoutOuts.length}`;
    
    navigator.clipboard.writeText(allText).then(() => {
        console.log(`✅ Copied ${shoutOuts.length} shout outs to clipboard! Ready to paste and share with your amazing team! 🎉`);
    }).catch(err => {
        console.error('Failed to copy all shout outs. Please try again!');
    });
}

// Search functionality for shout outs
let filteredShoutOuts = [];
let isSearchActive = false;

function searchShoutOuts() {
    const searchTerm = document.getElementById('shoutOutSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        clearShoutOutSearch();
        return;
    }
    
    isSearchActive = true;
    filteredShoutOuts = allShoutOuts.filter(shoutOut => 
        shoutOut.fullName.toLowerCase().includes(searchTerm) ||
        shoutOut.firstName.toLowerCase().includes(searchTerm)
    );
    
    currentPageIndex = 0;
    renderSearchResults();
}

function clearShoutOutSearch() {
    document.getElementById('shoutOutSearch').value = '';
    isSearchActive = false;
    filteredShoutOuts = [];
    currentPageIndex = 0;
    renderCurrentPage();
}

function renderSearchResults() {
    const container = document.getElementById('shoutOutContainer');
    
    if (filteredShoutOuts.length === 0) {
        container.innerHTML = '<div style="background: rgba(255,153,0,0.2); padding: 60px; border-radius: 15px; text-align: center; max-width: 600px; margin: 40px auto;">' +
            '<p style="font-size: 48px; margin-bottom: 20px;">🔍</p>' +
            '<p style="color: #FFD700; font-size: 24px; margin-bottom: 10px;">No matches found!</p>' +
            '<p style="color: white; font-size: 16px;">Try a different search term or click "Show All" to see all shout outs.</p>' +
            '</div>';
        
        document.getElementById('currentPage').textContent = '0';
        document.getElementById('totalPages').textContent = '0';
        document.getElementById('shoutOutStats').textContent = '📊 No matches found';
        return;
    }
    
    // Use filtered results for pagination
    const totalPages = Math.ceil(filteredShoutOuts.length / SHOUT_OUTS_PER_PAGE);
    const startIndex = currentPageIndex * SHOUT_OUTS_PER_PAGE;
    const endIndex = Math.min(startIndex + SHOUT_OUTS_PER_PAGE, filteredShoutOuts.length);
    const pageShoutOuts = filteredShoutOuts.slice(startIndex, endIndex);
    
    // Update pagination controls
    document.getElementById('currentPage').textContent = currentPageIndex + 1;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevBtn').disabled = currentPageIndex === 0;
    document.getElementById('nextBtn').disabled = currentPageIndex === totalPages - 1;
    document.getElementById('prevBtn').style.opacity = currentPageIndex === 0 ? '0.5' : '1';
    document.getElementById('nextBtn').style.opacity = currentPageIndex === totalPages - 1 ? '0.5' : '1';
    
    // Update stats
    document.getElementById('shoutOutStats').textContent = `📊 Showing ${startIndex + 1}-${endIndex} of ${filteredShoutOuts.length} matching shout outs`;
    
    // Render grid (same as renderCurrentPage but with filtered data)
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; animation: fadeIn 0.5s;">';
    
    pageShoutOuts.forEach((shoutOut, pageIndex) => {
        const globalIndex = allShoutOuts.indexOf(shoutOut); // Get original index
        const colors = [
            { bg: 'rgba(6,125,98,0.15)', border: '#067D62', accent: '#00D9A3' },
            { bg: 'rgba(255,153,0,0.15)', border: '#FF9900', accent: '#FFB84D' },
            { bg: 'rgba(103,58,183,0.15)', border: '#673AB7', accent: '#9575CD' },
            { bg: 'rgba(0,150,136,0.15)', border: '#009688', accent: '#4DB6AC' },
            { bg: 'rgba(255,87,34,0.15)', border: '#FF5722', accent: '#FF8A65' },
            { bg: 'rgba(33,150,243,0.15)', border: '#2196F3', accent: '#64B5F6' }
        ];
        const color = colors[pageIndex % colors.length];
        
        // Build Leadership Principles badges
        let principlesBadges = '';
        if (shoutOut.principles && shoutOut.principles.length > 0) {
            principlesBadges = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">';
            shoutOut.principles.forEach(principle => {
                principlesBadges += `
                    <div style="background: rgba(255,215,0,0.2); border: 1px solid #FFD700; padding: 6px 12px; border-radius: 20px; display: flex; align-items: center; gap: 5px;" title="${principle.definition}">
                        <span style="font-size: 16px;">${principle.icon}</span>
                        <span style="color: #FFD700; font-size: 11px; font-weight: bold;">${principle.name}</span>
                    </div>
                `;
            });
            principlesBadges += '</div>';
        }
        
        html += `
            <div style="background: ${color.bg}; padding: 25px; border-radius: 15px; border: 2px solid ${color.border}; position: relative; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer;" 
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.3)'; this.style.borderColor='${color.accent}'" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'; this.style.borderColor='${color.border}'">
                
                <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 48px; flex-shrink: 0;">${shoutOut.emoji}</div>
                    <div>
                        <div style="font-size: 24px; color: ${color.accent}; font-weight: bold; line-height: 1.2;">${shoutOut.fullName}</div>
                    </div>
                </div>
                
                ${principlesBadges}
                
                <div id="shoutout-${globalIndex}" style="color: white; font-size: 15px; line-height: 1.7; margin-bottom: 15px; min-height: 120px;">${shoutOut.message}</div>
                
                <div style="padding-top: 15px; border-top: 2px solid ${color.border}; font-size: 12px; color: ${color.accent}; margin-bottom: 15px;">
                    ${shoutOut.metrics}
                </div>
                
                <button onclick="copyShoutOut(${globalIndex}, event)" style="background: ${color.border}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; width: 100%; transition: all 0.3s;" onmouseover="this.style.background='${color.accent}'" onmouseout="this.style.background='${color.border}'">📋 Copy Shout Out</button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    container.scrollTop = 0;
}

// Override nextPage and previousPage to handle search
const originalNextPage = nextPage;
const originalPreviousPage = previousPage;

function nextPage() {
    if (isSearchActive) {
        const totalPages = Math.ceil(filteredShoutOuts.length / SHOUT_OUTS_PER_PAGE);
        if (currentPageIndex < totalPages - 1) {
            currentPageIndex++;
            renderSearchResults();
        }
    } else {
        originalNextPage();
    }
}

function previousPage() {
    if (isSearchActive) {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderSearchResults();
        }
    } else {
        originalPreviousPage();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    
    #shoutOutContainer::-webkit-scrollbar {
        width: 12px;
    }
    
    #shoutOutContainer::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.3);
        border-radius: 10px;
    }
    
    #shoutOutContainer::-webkit-scrollbar-thumb {
        background: #FF9900;
        border-radius: 10px;
    }
    
    #shoutOutContainer::-webkit-scrollbar-thumb:hover {
        background: #FFB84D;
    }
`;
document.head.appendChild(style);
