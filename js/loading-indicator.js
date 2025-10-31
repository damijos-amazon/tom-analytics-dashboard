/**
 * LoadingIndicator
 * Provides various loading indicators for different UI contexts
 */
class LoadingIndicator {
    constructor() {
        this.activeIndicators = new Map();
    }

    /**
     * Show a spinner overlay on a specific element
     * @param {HTMLElement|string} target - Target element or selector
     * @param {Object} options - Configuration options
     * @param {string} options.message - Optional loading message
     * @param {string} options.size - 'small', 'medium', 'large' (default: 'medium')
     * @returns {string} Indicator ID for later removal
     */
    showSpinner(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) {
            console.warn('Target element not found for spinner');
            return null;
        }

        const id = this.generateId();
        const { message = '', size = 'medium' } = options;

        // Create spinner overlay
        const overlay = document.createElement('div');
        overlay.className = `loading-overlay loading-overlay-${size}`;
        overlay.dataset.loadingId = id;

        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'loading-spinner-container';

        const spinner = document.createElement('div');
        spinner.className = `loading-spinner loading-spinner-${size}`;
        spinnerContainer.appendChild(spinner);

        if (message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            messageEl.textContent = message;
            spinnerContainer.appendChild(messageEl);
        }

        overlay.appendChild(spinnerContainer);
        
        // Position relative if not already positioned
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
        this.activeIndicators.set(id, { element, overlay });

        return id;
    }

    /**
     * Hide a specific spinner by ID
     * @param {string} id - Indicator ID returned from showSpinner
     */
    hideSpinner(id) {
        const indicator = this.activeIndicators.get(id);
        if (indicator) {
            indicator.overlay.remove();
            this.activeIndicators.delete(id);
        }
    }

    /**
     * Show a progress bar
     * @param {HTMLElement|string} target - Target element or selector
     * @param {Object} options - Configuration options
     * @param {number} options.progress - Initial progress (0-100)
     * @param {string} options.message - Optional message
     * @returns {Object} Progress bar controller with update and hide methods
     */
    showProgressBar(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) {
            console.warn('Target element not found for progress bar');
            return null;
        }

        const id = this.generateId();
        const { progress = 0, message = '' } = options;

        // Create progress bar container
        const container = document.createElement('div');
        container.className = 'loading-progress-container';
        container.dataset.loadingId = id;

        if (message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-progress-message';
            messageEl.textContent = message;
            container.appendChild(messageEl);
        }

        const progressBarWrapper = document.createElement('div');
        progressBarWrapper.className = 'loading-progress-wrapper';

        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress-bar';
        progressBar.style.width = `${progress}%`;

        const progressText = document.createElement('div');
        progressText.className = 'loading-progress-text';
        progressText.textContent = `${Math.round(progress)}%`;

        progressBarWrapper.appendChild(progressBar);
        container.appendChild(progressBarWrapper);
        container.appendChild(progressText);

        element.appendChild(container);
        this.activeIndicators.set(id, { element, overlay: container });

        // Return controller
        return {
            update: (newProgress, newMessage) => {
                progressBar.style.width = `${newProgress}%`;
                progressText.textContent = `${Math.round(newProgress)}%`;
                if (newMessage && message) {
                    const msgEl = container.querySelector('.loading-progress-message');
                    if (msgEl) msgEl.textContent = newMessage;
                }
            },
            hide: () => this.hideSpinner(id)
        };
    }

    /**
     * Show skeleton screen for initial load
     * @param {HTMLElement|string} target - Target element or selector
     * @param {Object} options - Configuration options
     * @param {number} options.rows - Number of skeleton rows (default: 5)
     * @param {string} options.type - 'table', 'card', 'list' (default: 'list')
     * @returns {string} Indicator ID for later removal
     */
    showSkeleton(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) {
            console.warn('Target element not found for skeleton');
            return null;
        }

        const id = this.generateId();
        const { rows = 5, type = 'list' } = options;

        const skeleton = document.createElement('div');
        skeleton.className = `loading-skeleton loading-skeleton-${type}`;
        skeleton.dataset.loadingId = id;

        for (let i = 0; i < rows; i++) {
            const row = document.createElement('div');
            row.className = 'loading-skeleton-row';

            if (type === 'table') {
                for (let j = 0; j < 4; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'loading-skeleton-cell';
                    row.appendChild(cell);
                }
            } else if (type === 'card') {
                const header = document.createElement('div');
                header.className = 'loading-skeleton-header';
                row.appendChild(header);

                const content = document.createElement('div');
                content.className = 'loading-skeleton-content';
                row.appendChild(content);
            } else {
                const line = document.createElement('div');
                line.className = 'loading-skeleton-line';
                row.appendChild(line);
            }

            skeleton.appendChild(row);
        }

        element.appendChild(skeleton);
        this.activeIndicators.set(id, { element, overlay: skeleton });

        return id;
    }

    /**
     * Show inline spinner (small spinner for buttons, etc.)
     * @param {HTMLElement|string} target - Target element or selector
     * @returns {string} Indicator ID for later removal
     */
    showInlineSpinner(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) {
            console.warn('Target element not found for inline spinner');
            return null;
        }

        const id = this.generateId();
        const originalContent = element.innerHTML;

        const spinner = document.createElement('span');
        spinner.className = 'loading-inline-spinner';
        spinner.dataset.loadingId = id;
        spinner.dataset.originalContent = originalContent;

        element.innerHTML = '';
        element.appendChild(spinner);
        element.disabled = true;

        this.activeIndicators.set(id, { element, overlay: spinner, originalContent });

        return id;
    }

    /**
     * Hide inline spinner and restore original content
     * @param {string} id - Indicator ID
     */
    hideInlineSpinner(id) {
        const indicator = this.activeIndicators.get(id);
        if (indicator) {
            indicator.element.innerHTML = indicator.originalContent;
            indicator.element.disabled = false;
            this.activeIndicators.delete(id);
        }
    }

    /**
     * Show global loading overlay (full screen)
     * @param {string} message - Loading message
     * @returns {string} Indicator ID for later removal
     */
    showGlobalLoader(message = 'Loading...') {
        const id = this.generateId();

        const overlay = document.createElement('div');
        overlay.className = 'loading-global-overlay';
        overlay.dataset.loadingId = id;

        const container = document.createElement('div');
        container.className = 'loading-global-container';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner loading-spinner-large';
        container.appendChild(spinner);

        const messageEl = document.createElement('div');
        messageEl.className = 'loading-global-message';
        messageEl.textContent = message;
        container.appendChild(messageEl);

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        this.activeIndicators.set(id, { element: document.body, overlay });

        return id;
    }

    /**
     * Hide all loading indicators
     */
    hideAll() {
        this.activeIndicators.forEach((indicator, id) => {
            indicator.overlay.remove();
        });
        this.activeIndicators.clear();
    }

    /**
     * Generate unique ID for indicator
     * @returns {string} Unique ID
     */
    generateId() {
        return `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const loadingIndicator = new LoadingIndicator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingIndicator, loadingIndicator };
}
