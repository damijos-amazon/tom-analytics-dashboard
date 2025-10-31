// Unified Leaderboard - Aggregates fair scores across all 6 tables
class UnifiedLeaderboard {
    constructor() {
        this.aggregatedScores = new Map();
    }
    
    // Aggregate scores from all 6 dashboards
    aggregateScores(dashboards) {
        this.aggregatedScores.clear();
        const employees = window.simpleEmployees || [];
        
        // Get table configurations to check which tables to include
        const tableConfigs = typeof getEnabledTableConfigs === 'function' ? getEnabledTableConfigs() : {};
        
        console.log('\n🏆 UNIFIED LEADERBOARD - Aggregating Fair Scores Across All Tables');
        
        // Table direction mapping (lower is better vs higher is better)
        const lowerIsBetter = ['VTI DPMO', 'TA Idle Time', 'PPO Compliance', 'Andon Response Time'];
        const higherIsBetter = ['VTI Compliance', 'Seal Validation Accuracy'];
        
        // Collect fair scores from each table
        Object.keys(dashboards).forEach(tableKey => {
            const dashboard = dashboards[tableKey];
            const tableName = dashboard.getTableName();
            
            // Check if this table should be included in leaderboard
            const tableConfig = Object.values(tableConfigs).find(cfg => cfg.tableId === tableKey);
            if (tableConfig && tableConfig.includeInLeaderboard === false) {
                console.log(`  ⚠️ Skipping ${tableName} - excluded from leaderboard`);
                return; // Skip this table
            }
            
            dashboard.data.forEach(item => {
                // Find the employee to get canonical identifier
                const employee = employees.find(emp => 
                    emp.badgeId.toLowerCase() === item.name.toLowerCase() ||
                    emp.username.toLowerCase() === item.name.toLowerCase() ||
                    emp.email.toLowerCase() === item.name.toLowerCase()
                );
                
                // Use full name as the key to prevent duplicates
                const canonicalKey = employee ? employee.fullName : item.name;
                
                if (!this.aggregatedScores.has(canonicalKey)) {
                    this.aggregatedScores.set(canonicalKey, {
                        name: canonicalKey,
                        fullName: employee ? employee.fullName : item.name,
                        totalFairScore: 0,
                        tableScores: {},
                        tableCount: 0,
                        totalImprovement: 0,
                        improvements: []
                    });
                }
                
                const entry = this.aggregatedScores.get(canonicalKey);
                
                // Add fair score from this table
                const fairScore = item.fairScore || 0;
                entry.totalFairScore += fairScore;
                entry.tableScores[tableName] = fairScore;
                entry.tableCount++;
                
                // Normalize improvement: positive = good, negative = bad
                let normalizedImprovement = item.change || 0;
                if (lowerIsBetter.includes(tableName)) {
                    // For "lower is better" tables, flip the sign
                    normalizedImprovement = -normalizedImprovement;
                }
                
                entry.totalImprovement += normalizedImprovement;
                entry.improvements.push(normalizedImprovement);
                
                console.log(`  ${canonicalKey} - ${tableName}: FairScore=${fairScore.toFixed(1)}, Change=${item.change.toFixed(2)}, Normalized=${normalizedImprovement.toFixed(2)}`);
            });
        });
        
        // Calculate overall scores based on aggregated fair scores
        const leaderboardData = Array.from(this.aggregatedScores.values()).map(emp => {
            const averageFairScore = emp.totalFairScore / emp.tableCount;
            const averageImprovement = emp.totalImprovement / emp.tableCount;
            
            return {
                name: emp.name,
                fullName: emp.fullName,
                totalFairScore: emp.totalFairScore,
                averageFairScore: averageFairScore,
                averageImprovement: averageImprovement,
                tableCount: emp.tableCount,
                tableScores: emp.tableScores,
                recognition: '' // Will be set after ranking
            };
        });
        
        // Sort by improvement first (most improved wins), then by performance
        leaderboardData.sort((a, b) => {
            // Primary: Sort by improvement (highest improvement = best)
            const improvementDiff = b.averageImprovement - a.averageImprovement;
            if (Math.abs(improvementDiff) > 0.01) {
                return improvementDiff;
            }
            // Tiebreaker: Sort by performance grade
            return b.averageFairScore - a.averageFairScore;
        });
        
        // Filter out excluded employees
        const filteredLeaderboard = leaderboardData.filter(entry => {
            const employee = employees.find(emp => 
                emp.badgeId.toLowerCase() === entry.name.toLowerCase() ||
                emp.username.toLowerCase() === entry.name.toLowerCase() ||
                emp.email.toLowerCase() === entry.name.toLowerCase()
            );
            return !employee || !employee.excludeFromTables;
        });
        
        // Assign status based on percentile ranking
        const totalEmployees = filteredLeaderboard.length;
        const topQuarter = Math.ceil(totalEmployees * 0.25);
        const topHalf = Math.ceil(totalEmployees * 0.50);
        const topThreeQuarters = Math.ceil(totalEmployees * 0.75);
        
        filteredLeaderboard.forEach((employee, index) => {
            const rank = index + 1;
            employee.rank = rank;
            
            // Assign recognition based on rank
            if (rank === 1) employee.recognition = '🏆 Champion';
            else if (rank === 2) employee.recognition = '🥈 Runner-Up';
            else if (rank === 3) employee.recognition = '🥉 Third Place';
            else if (rank <= 5) employee.recognition = '🌟 Top Performer';
            else if (rank <= 10) employee.recognition = '⭐ Star Player';
            else if (rank <= topQuarter) employee.recognition = '📈 Rising Star';
            else employee.recognition = '👤 Team Member';
            
            // Assign status based on percentile
            if (rank <= topQuarter) {
                employee.status = 'Excellent';
            } else if (rank <= topHalf) {
                employee.status = 'Improved';
            } else if (rank <= topThreeQuarters) {
                employee.status = 'Maintained';
            } else {
                employee.status = 'Decreased';
            }
            
            console.log(`  Rank ${rank}: ${employee.fullName} - TotalFairScore: ${employee.totalFairScore.toFixed(1)}, AvgFairScore: ${employee.averageFairScore.toFixed(1)}, Status: ${employee.status}, Recognition: ${employee.recognition}`);
        });
        
        console.log('✅ Unified Leaderboard Aggregation Complete\n');
        
        return filteredLeaderboard;
    }
    
    // Render unified leaderboard table
    renderLeaderboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('⚠️ Leaderboard container not found:', containerId);
            return;
        }
        
        const leaderboard = this.aggregateScores(window.dashboards || {});
        
        if (leaderboard.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #FFD700;">No data available. Upload performance data to see the leaderboard.</td></tr>';
            console.log('ℹ️ No leaderboard data available');
            return;
        }
        
        let html = '';
        
        leaderboard.forEach(entry => {
            const rankBadge = entry.rank <= 3 ? `${entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'} ${entry.rank}` : entry.rank;
            
            // Determine recognition badge based on rank
            let recognitionBadge = '';
            if (entry.rank === 1) {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #232F3E; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">👑 CHAMPION</span>';
            } else if (entry.rank === 2) {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%); color: #232F3E; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">🥈 RUNNER-UP</span>';
            } else if (entry.rank === 3) {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #CD7F32 0%, #B8860B 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">🥉 THIRD PLACE</span>';
            } else if (entry.rank <= 5) {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">⭐ TOP PERFORMER</span>';
            } else if (entry.rank <= 10) {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">⭐ STAR PLAYER</span>';
            } else if (entry.status === 'Excellent') {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #27AE60 0%, #229954 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">📈 RISING STAR</span>';
            } else {
                recognitionBadge = '<span style="background: linear-gradient(135deg, #5D6D7E 0%, #34495E 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block;">👤 TEAM MEMBER</span>';
            }
            
            // Show raw fair score instead of letter grade
            const performanceScore = entry.averageFairScore.toFixed(1);
            
            // Format improvement percentage with sign
            const improvementSign = entry.averageImprovement > 0 ? '+' : '';
            const improvementDisplay = `${improvementSign}${entry.averageImprovement.toFixed(2)}%`;
            const improvementColor = entry.averageImprovement > 0 ? '#4CAF50' : entry.averageImprovement < 0 ? '#F44336' : '#FFA500';
            
            // Get first name only (handles full names, emails, usernames)
            const employees = window.simpleEmployees || [];
            const firstName = this.getFirstName(entry.name, employees);
            
            html += `
                <tr class="table-row">
                    <td>${rankBadge}</td>
                    <td>${firstName}</td>
                    <td style="text-align: center; font-weight: bold; color: #FF9900;">${performanceScore}</td>
                    <td style="text-align: center; color: ${improvementColor}; font-weight: bold;">${improvementDisplay}</td>
                    <td>${recognitionBadge}</td>
                </tr>
            `;
        });
        
        container.innerHTML = html;
        console.log(`✅ Leaderboard rendered with ${leaderboard.length} entries`);
    }
    
    // Update main podium with top 3 overall
    updateMainPodium(podiumId) {
        const podiumContainer = document.getElementById(podiumId);
        if (!podiumContainer) return;
        
        const leaderboard = this.aggregateScores(window.dashboards || {});
        const top3 = leaderboard.slice(0, 3);
        const employees = window.simpleEmployees || [];
        
        const positions = ['.first', '.second', '.third'];
        
        positions.forEach((selector, index) => {
            const element = podiumContainer.querySelector(selector);
            if (element && top3[index]) {
                const nameEl = element.querySelector('.performer-name');
                const scoreEl = element.querySelector('.performer-score');
                const avatarEl = element.querySelector('.avatar-circle');
                
                const firstName = this.getFirstName(top3[index].name, employees);
                if (nameEl) nameEl.textContent = firstName;
                
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
                        avatarEl.textContent = firstName.charAt(0).toUpperCase();
                        avatarEl.style.color = '';
                        avatarEl.style.fontSize = '';
                    }
                }
                
                if (scoreEl) {
                    const improvementDisplay = `${Math.abs(top3[index].averageImprovement).toFixed(2)}%`;
                    const improvementColor = top3[index].averageImprovement > 0 ? '#4CAF50' : top3[index].averageImprovement < 0 ? '#F44336' : '#FFA500';
                    scoreEl.innerHTML = `<span style="color: ${improvementColor}; font-weight: bold;">${improvementDisplay}</span>`;
                }
            }
        });
    }
    
    getFullName(identifier, employees) {
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        return employee ? employee.fullName : identifier;
    }
    
    getFirstName(identifier, employees) {
        const employee = employees.find(emp => 
            emp.badgeId.toLowerCase() === identifier.toLowerCase() ||
            emp.username.toLowerCase() === identifier.toLowerCase() ||
            emp.email.toLowerCase() === identifier.toLowerCase()
        );
        if (employee && employee.fullName) {
            return employee.fullName.split(' ')[0];
        }
        return identifier;
    }
}

// Initialize unified leaderboard
let unifiedLeaderboard = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        unifiedLeaderboard = new UnifiedLeaderboard();
        
        // Render leaderboard if container exists (tbody ID is 'leaderboardBody')
        if (document.getElementById('leaderboardBody')) {
            unifiedLeaderboard.renderLeaderboard('leaderboardBody');
        }
        
        // Update main podium if it exists
        if (document.getElementById('leaderboardPodium')) {
            unifiedLeaderboard.updateMainPodium('leaderboardPodium');
        }
        
        console.log('✅ Unified Leaderboard initialized');
    }, 2000); // Increased delay to ensure dashboards are loaded
});

// Global function to refresh unified leaderboard
function refreshUnifiedLeaderboard() {
    if (unifiedLeaderboard) {
        if (document.getElementById('leaderboardBody')) {
            unifiedLeaderboard.renderLeaderboard('leaderboardBody');
        }
        if (document.getElementById('leaderboardPodium')) {
            unifiedLeaderboard.updateMainPodium('leaderboardPodium');
        }
        console.log('🔄 Unified Leaderboard refreshed');
    }
}

// Manual refresh function for the leaderboard refresh button
function manualRefreshLeaderboard() {
    console.log('🔄 Manual leaderboard refresh triggered');
    refreshUnifiedLeaderboard();
}
