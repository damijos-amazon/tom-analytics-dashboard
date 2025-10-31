// TA Idle Time Benchmark Modal Functions
function openTAIdleBenchmarkModal() {
    console.log('Opening TA Idle Time benchmark modal');
    const modal = document.getElementById('benchmarkModal');
    const benchmarkValue = document.getElementById('benchmarkValue');
    const benchmarkDirection = document.getElementById('benchmarkDirection');
    
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    // Load existing values
    const savedBenchmark = localStorage.getItem('ta_idle_benchmark') || '5.0';
    const savedDirection = localStorage.getItem('ta_idle_benchmark_direction') || 'below';
    
    if (benchmarkValue) benchmarkValue.value = savedBenchmark;
    if (benchmarkDirection) benchmarkDirection.value = savedDirection;
    
    modal.style.display = 'block';
}

function closeTAIdleBenchmarkModal() {
    const modal = document.getElementById('benchmarkModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveTAIdleBenchmark() {
    const benchmarkValue = document.getElementById('benchmarkValue').value;
    const benchmarkDirection = document.getElementById('benchmarkDirection').value;
    
    if (!benchmarkValue || benchmarkValue <= 0) {
        console.warn('Please enter a valid benchmark value greater than 0');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('ta_idle_benchmark', benchmarkValue);
    localStorage.setItem('ta_idle_benchmark_direction', benchmarkDirection);
    
    // Update dashboard3 if it exists
    if (typeof dashboard3 !== 'undefined' && dashboard3) {
        dashboard3.benchmark = parseFloat(benchmarkValue);
        dashboard3.benchmarkDirection = benchmarkDirection;
        if (dashboard3.showMessage) {
            dashboard3.showMessage(`Benchmark set: ${benchmarkValue} min (${benchmarkDirection} is better)`, 'success');
        }
    }
    
    closeTAIdleBenchmarkModal();
    console.log(`TA Idle Time benchmark saved: ${benchmarkValue} minutes (${benchmarkDirection} is better)`);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('benchmarkModal');
    if (event.target === modal) {
        closeTAIdleBenchmarkModal();
    }
});