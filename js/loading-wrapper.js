/**
 * LoadingWrapper
 * Utility to wrap async operations with loading indicators
 */
class LoadingWrapper {
    constructor(loadingIndicator) {
        this.loadingIndicator = loadingIndicator;
    }

    /**
     * Wrap an async operation with a spinner
     * @param {Function} operation - Async function to execute
     * @param {HTMLElement|string} target - Target element for spinner
     * @param {Object} options - Spinner options
     * @returns {Promise} Result of the operation
     */
    async withSpinner(operation, target, options = {}) {
        const id = this.loadingIndicator.showSpinner(target, options);
        try {
            return await operation();
        } finally {
            if (id) {
                this.loadingIndicator.hideSpinner(id);
            }
        }
    }

    /**
     * Wrap an async operation with a progress bar
     * @param {Function} operation - Async function that accepts progress callback
     * @param {HTMLElement|string} target - Target element for progress bar
     * @param {Object} options - Progress bar options
     * @returns {Promise} Result of the operation
     */
    async withProgressBar(operation, target, options = {}) {
        const progressBar = this.loadingIndicator.showProgressBar(target, options);
        if (!progressBar) {
            return await operation(() => {});
        }

        try {
            return await operation((progress, message) => {
                progressBar.update(progress, message);
            });
        } finally {
            progressBar.hide();
        }
    }

    /**
     * Wrap an async operation with a skeleton screen
     * @param {Function} operation - Async function to execute
     * @param {HTMLElement|string} target - Target element for skeleton
     * @param {Object} options - Skeleton options
     * @returns {Promise} Result of the operation
     */
    async withSkeleton(operation, target, options = {}) {
        const id = this.loadingIndicator.showSkeleton(target, options);
        try {
            return await operation();
        } finally {
            if (id) {
                this.loadingIndicator.hideSpinner(id);
            }
        }
    }

    /**
     * Wrap an async operation with an inline spinner (for buttons)
     * @param {Function} operation - Async function to execute
     * @param {HTMLElement|string} target - Target button element
     * @returns {Promise} Result of the operation
     */
    async withInlineSpinner(operation, target) {
        const id = this.loadingIndicator.showInlineSpinner(target);
        try {
            return await operation();
        } finally {
            if (id) {
                this.loadingIndicator.hideInlineSpinner(id);
            }
        }
    }

    /**
     * Wrap an async operation with a global loader
     * @param {Function} operation - Async function to execute
     * @param {string} message - Loading message
     * @returns {Promise} Result of the operation
     */
    async withGlobalLoader(operation, message = 'Loading...') {
        const id = this.loadingIndicator.showGlobalLoader(message);
        try {
            return await operation();
        } finally {
            if (id) {
                this.loadingIndicator.hideSpinner(id);
            }
        }
    }

    /**
     * Wrap multiple async operations with a combined progress bar
     * @param {Array<Function>} operations - Array of async functions
     * @param {HTMLElement|string} target - Target element for progress bar
     * @param {Object} options - Progress bar options
     * @returns {Promise<Array>} Results of all operations
     */
    async withCombinedProgress(operations, target, options = {}) {
        const progressBar = this.loadingIndicator.showProgressBar(target, {
            ...options,
            progress: 0
        });

        if (!progressBar) {
            return await Promise.all(operations.map(op => op()));
        }

        try {
            const results = [];
            const total = operations.length;

            for (let i = 0; i < operations.length; i++) {
                const result = await operations[i]();
                results.push(result);
                
                const progress = ((i + 1) / total) * 100;
                progressBar.update(progress, `Processing ${i + 1} of ${total}...`);
            }

            return results;
        } finally {
            progressBar.hide();
        }
    }

    /**
     * Wrap a file upload operation with progress tracking
     * @param {File} file - File to upload
     * @param {Function} uploadFunction - Upload function that accepts file and progress callback
     * @param {HTMLElement|string} target - Target element for progress bar
     * @returns {Promise} Upload result
     */
    async withFileUploadProgress(file, uploadFunction, target) {
        const progressBar = this.loadingIndicator.showProgressBar(target, {
            progress: 0,
            message: `Uploading ${file.name}...`
        });

        if (!progressBar) {
            return await uploadFunction(file, () => {});
        }

        try {
            return await uploadFunction(file, (progress) => {
                progressBar.update(progress, `Uploading ${file.name}... ${Math.round(progress)}%`);
            });
        } finally {
            progressBar.hide();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingWrapper;
}
