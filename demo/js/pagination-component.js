/**
 * PaginationComponent
 * Reusable pagination UI component with infinite scroll and page navigation support
 */
class PaginationComponent {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for pagination controls
     * @param {Function} options.onPageChange - Callback when page changes (receives page number)
     * @param {string} options.mode - 'buttons' or 'infinite' (default: 'buttons')
     */
    constructor(options) {
        this.container = options.container;
        this.onPageChange = options.onPageChange;
        this.mode = options.mode || 'buttons';
        this.currentPage = 0;
        this.totalPages = 0;
        this.pageSize = 100;
        this.isLoading = false;
        
        if (this.mode === 'infinite') {
            this.setupInfiniteScroll(options.scrollContainer);
        }
    }

    /**
     * Update pagination state and render controls
     * @param {Object} pagination - Pagination metadata from API
     */
    update(pagination) {
        this.currentPage = pagination.page;
        this.totalPages = pagination.totalPages;
        this.pageSize = pagination.pageSize;
        this.hasNextPage = pagination.hasNextPage;
        this.hasPreviousPage = pagination.hasPreviousPage;
        this.totalRecords = pagination.totalRecords;
        
        if (this.mode === 'buttons') {
            this.renderButtons();
        }
    }

    /**
     * Render pagination buttons
     */
    renderButtons() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination-controls';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = !this.hasPreviousPage || this.isLoading;
        prevButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        paginationDiv.appendChild(prevButton);
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        const startRecord = this.currentPage * this.pageSize + 1;
        const endRecord = Math.min((this.currentPage + 1) * this.pageSize, this.totalRecords);
        pageInfo.textContent = `${startRecord}-${endRecord} of ${this.totalRecords}`;
        paginationDiv.appendChild(pageInfo);
        
        // Page number input
        const pageInput = document.createElement('input');
        pageInput.type = 'number';
        pageInput.min = 1;
        pageInput.max = this.totalPages;
        pageInput.value = this.currentPage + 1;
        pageInput.className = 'pagination-page-input';
        pageInput.addEventListener('change', (e) => {
            const page = parseInt(e.target.value) - 1;
            if (page >= 0 && page < this.totalPages) {
                this.goToPage(page);
            }
        });
        paginationDiv.appendChild(pageInput);
        
        const pageLabel = document.createElement('span');
        pageLabel.className = 'pagination-info';
        pageLabel.textContent = `of ${this.totalPages}`;
        paginationDiv.appendChild(pageLabel);
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next →';
        nextButton.className = 'pagination-btn';
        nextButton.disabled = !this.hasNextPage || this.isLoading;
        nextButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        paginationDiv.appendChild(nextButton);
        
        this.container.appendChild(paginationDiv);
    }

    /**
     * Navigate to specific page
     * @param {number} page - Page number (0-indexed)
     */
    async goToPage(page) {
        if (this.isLoading || page < 0 || page >= this.totalPages) return;
        
        this.isLoading = true;
        this.renderButtons(); // Update UI to show loading state
        
        try {
            await this.onPageChange(page);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Setup infinite scroll
     * @param {HTMLElement} scrollContainer - Container to monitor for scroll events
     */
    setupInfiniteScroll(scrollContainer) {
        if (!scrollContainer) {
            console.warn('Infinite scroll requires a scroll container');
            return;
        }
        
        this.scrollContainer = scrollContainer;
        this.scrollContainer.addEventListener('scroll', () => this.handleScroll());
    }

    /**
     * Handle scroll event for infinite scroll
     */
    handleScroll() {
        if (this.isLoading || !this.hasNextPage) return;
        
        const scrollTop = this.scrollContainer.scrollTop;
        const scrollHeight = this.scrollContainer.scrollHeight;
        const clientHeight = this.scrollContainer.clientHeight;
        
        // Load more when user scrolls to within 200px of bottom
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            this.loadNextPage();
        }
    }

    /**
     * Load next page for infinite scroll
     */
    async loadNextPage() {
        if (this.isLoading || !this.hasNextPage) return;
        
        this.isLoading = true;
        this.showLoadingIndicator();
        
        try {
            await this.onPageChange(this.currentPage + 1);
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
        }
    }

    /**
     * Show loading indicator for infinite scroll
     */
    showLoadingIndicator() {
        if (!this.container) return;
        
        let indicator = this.container.querySelector('.infinite-scroll-loader');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'infinite-scroll-loader';
            indicator.innerHTML = '<div class="spinner"></div><span>Loading more...</span>';
            this.container.appendChild(indicator);
        }
        indicator.style.display = 'flex';
    }

    /**
     * Hide loading indicator for infinite scroll
     */
    hideLoadingIndicator() {
        if (!this.container) return;
        
        const indicator = this.container.querySelector('.infinite-scroll-loader');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Reset pagination to first page
     */
    reset() {
        this.currentPage = 0;
        this.totalPages = 0;
        this.hasNextPage = false;
        this.hasPreviousPage = false;
        this.totalRecords = 0;
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationComponent;
}
