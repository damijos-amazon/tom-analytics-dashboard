// Universal Benchmark Modal for All Tables
var currentBenchmarkTable = null;

var benchmarkConfig = {
    'vti-compliance': {
        title: 'VTI Compliance Benchmark',
        storageKey: 'vti_compliance_benchmark',
        defaultValue: '100',
        unit: '%',
        direction: 'above'
    },
    'vti-dpmo': {
        title: 'VTI DPMO Benchmark',
        storageKey: 'vti_dpmo_benchmark',
        defaultValue: '0',
        unit: 'defects',
        direction: 'below'
    },
    'ta-idle-time': {
        title: 'TA Idle Time Benchmark',
        storageKey: 'ta_idle_benchmark',
        defaultValue: '5.0',
        unit: 'minutes',
        direction: 'below'
    },
    'seal-validation': {
        title: 'Seal Validation Accuracy Benchmark',
        storageKey: 'seal_validation_benchmark',
        defaultValue: '100',
        unit: '%',
        direction: 'above'
    },
    'ppo-compliance': {
        title: 'PPO Compliance Benchmark',
        storageKey: 'ppo_compliance_benchmark',
        defaultValue: '0',
        unit: 'violations',
        direction: 'below'
    },
    'andon-response': {
        title: 'Andon Response Time Benchmark',
        storageKey: 'andon_response_benchmark',
        defaultValue: '3.0',
        unit: 'minutes',
        direction: 'below'
    }
};

function openBenchmarkModal(tableId) {
    currentBenchmarkTable = tableId;
    var config = benchmarkConfig[tableId];
    
    if (!config) {
        console.warn('Benchmark configuration not found for this table');
        return;
    }
    
    var modal = document.getElementById('universalBenchmarkModal');
    if (!modal) {
        createUniversalBenchmarkModal();
        modal = document.getElementById('universalBenchmarkModal');
    }
    
    // Update modal title
    document.getElementById('benchmarkModalTitle').textContent = config.title;
    
    // Load existing value
    var savedValue = localStorage.getItem(config.storageKey) || config.defaultValue;
    document.getElementById('universalBenchmarkValue').value = savedValue;
    document.getElementById('benchmarkUnit').textContent = config.unit;
    
    // Load existing direction or use default
    var savedDirection = localStorage.getItem(config.storageKey + '_direction') || config.direction;
    document.getElementById('benchmarkDirection').value = savedDirection;
    
    modal.style.display = 'block';
}

function createUniversalBenchmarkModal() {
    var modalHTML = `
        <div id="universalBenchmarkModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="benchmarkModalTitle">Edit Benchmark</h3>
                    <span class="close" onclick="closeUniversalBenchmarkModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <label for="universalBenchmarkValue">Benchmark Value (<span id="benchmarkUnit"></span>):</label>
                    <input type="number" id="universalBenchmarkValue" placeholder="Set to 0.0 to disable benchmark calculations" min="0" step="0.1">
                    <p style="color: #FF9900; font-size: 13px; margin-top: 5px;">💡 Set to 0.0 to disable benchmark calculations for this table</p>
                    
                    <label for="benchmarkDirection" style="margin-top: 15px;">Improvement Direction:</label>
                    <select id="benchmarkDirection">
                        <option value="below">Below benchmark is better (lower values)</option>
                        <option value="above">Above benchmark is better (higher values)</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeUniversalBenchmarkModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveUniversalBenchmark()">Save Benchmark</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeUniversalBenchmarkModal() {
    var modal = document.getElementById('universalBenchmarkModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentBenchmarkTable = null;
}

function saveUniversalBenchmark() {
    if (!currentBenchmarkTable) {
        console.warn('No table selected');
        return;
    }
    
    var config = benchmarkConfig[currentBenchmarkTable];
    var value = parseFloat(document.getElementById('universalBenchmarkValue').value);
    var direction = document.getElementById('benchmarkDirection').value;
    
    if (isNaN(value) || value < 0) {
        console.warn('Please enter a valid benchmark value (0 or greater)');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem(config.storageKey, value.toString());
    localStorage.setItem(config.storageKey + '_direction', direction);
    
    closeUniversalBenchmarkModal();
    
    if (value === 0) {
        console.log(`✅ ${config.title} disabled. Benchmark calculations will not be applied to this table.`);
    } else {
        console.log(`✅ ${config.title} saved: ${value} ${config.unit}. ${direction === 'below' ? 'Lower values are better' : 'Higher values are better'}`);
    }
    
    // Trigger table recalculation if needed
    if (typeof window.dashboards !== 'undefined') {
        Object.values(window.dashboards).forEach(function(dashboard) {
            if (dashboard && dashboard.calculateChanges) {
                dashboard.calculateChanges();
                dashboard.renderTable();
                dashboard.updatePodium();
            }
        });
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    var modal = document.getElementById('universalBenchmarkModal');
    if (event.target === modal) {
        closeUniversalBenchmarkModal();
    }
});
