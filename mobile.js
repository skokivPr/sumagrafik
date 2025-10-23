// Mobile mode - ULTRA SIMPLIFIED VERSION
// Działa ZAWSZE, niezależnie od urządzenia

console.log('=== MOBILE.JS LOADED ===');
console.log('Window width at load:', window.innerWidth);

// Wait for everything to load
window.addEventListener('DOMContentLoaded', function () {
    console.log('=== DOM READY ===');
    console.log('Current window width:', window.innerWidth);
    console.log('Is mobile layout?', window.innerWidth <= 768);

    initializeMobileMode();

    // Re-check on window resize
    window.addEventListener('resize', function () {
        console.log('Window resized:', window.innerWidth);
        checkAndApplyMobileLayout();

        // Update chart/numbers display on resize
        if (typeof updateDailyChart === 'function') {
            updateDailyChart();
        }

        // Handle employee names on resize
        if (window.innerWidth <= 768) {
            shortenEmployeeNames();
        } else {
            restoreEmployeeNames();
        }
    });
});

function initializeMobileMode() {
    console.log('Initializing mobile mode...');
    console.log('Window width:', window.innerWidth);
    console.log('Document width:', document.documentElement.clientWidth);
    console.log('Body width:', document.body.clientWidth);

    // Update body data attribute for CSS
    document.body.setAttribute('data-width', window.innerWidth + 'px');

    const tabs = document.querySelectorAll('.mobile-tab');
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');

    console.log('Found tabs:', tabs.length);
    console.log('Left column:', leftColumn ? 'YES' : 'NO');
    console.log('Right column:', rightColumn ? 'YES' : 'NO');

    if (!tabs.length || !leftColumn || !rightColumn) {
        console.error('Missing elements!');
        return;
    }

    // Set up tab switching
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            console.log('Tab clicked:', this.dataset.tab);

            // Remove active from all tabs
            tabs.forEach(function (t) {
                t.classList.remove('active');
            });

            // Add active to clicked tab
            this.classList.add('active');

            // Show/hide columns
            if (this.dataset.tab === 'summary') {
                leftColumn.classList.add('mobile-active');
                rightColumn.classList.remove('mobile-active');
                console.log('Showing summary');
            } else if (this.dataset.tab === 'table') {
                leftColumn.classList.remove('mobile-active');
                rightColumn.classList.add('mobile-active');
                console.log('Showing table');
            }
        });
    });

    // Apply initial layout
    checkAndApplyMobileLayout();

    // Set up mobile search toggle
    setupMobileSearch();

    // Set up mobile day selector
    setupMobileDaySelector();

    // Shorten employee names for mobile
    shortenEmployeeNames();

    // Set up observer to shorten names when DOM changes
    setupNameObserver();

    console.log('Mobile mode initialized!');
}

function setupNameObserver() {
    if (window.innerWidth > 768) return;

    // Create an observer to watch for changes in the table and daily details
    const observer = new MutationObserver(function (mutations) {
        if (window.innerWidth <= 768) {
            // Use setTimeout to debounce rapid changes
            clearTimeout(window.nameUpdateTimeout);
            window.nameUpdateTimeout = setTimeout(function () {
                shortenEmployeeNames();
            }, 100);
        }
    });

    // Observe changes in table body and daily details
    const tableBody = document.getElementById('table-body');
    const dailyDetails = document.getElementById('daily-details');
    const compareContent = document.getElementById('compare-content');
    const individualContent = document.getElementById('individual-content');

    if (tableBody) {
        observer.observe(tableBody, { childList: true, subtree: true });
    }

    if (dailyDetails) {
        observer.observe(dailyDetails, { childList: true, subtree: true });
    }

    if (compareContent) {
        observer.observe(compareContent, { childList: true, subtree: true });
    }

    if (individualContent) {
        observer.observe(individualContent, { childList: true, subtree: true });
    }

    console.log('Name observer set up');
}

function setupMobileSearch() {
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.getElementById('search-box');
    const searchWrapper = document.querySelector('.search-wrapper');

    if (!searchIcon || !searchInput || !searchWrapper) {
        console.log('Search elements not found');
        return;
    }

    // Only activate on mobile
    if (window.innerWidth <= 768) {
        console.log('Setting up mobile search toggle');

        searchIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Search icon clicked');

            searchInput.classList.toggle('mobile-search-active');
            searchWrapper.classList.toggle('mobile-search-open');

            if (searchInput.classList.contains('mobile-search-active')) {
                searchInput.focus();
                console.log('Search input opened');
            } else {
                console.log('Search input closed');
            }
        });

        // Close search when clicking outside
        document.addEventListener('click', function (e) {
            if (!searchWrapper.contains(e.target)) {
                searchInput.classList.remove('mobile-search-active');
                searchWrapper.classList.remove('mobile-search-open');
            }
        });
    }
}

function checkAndApplyMobileLayout() {
    const isMobile = window.innerWidth <= 768;
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');

    // Update body data attribute
    document.body.setAttribute('data-width', window.innerWidth + 'px');

    console.log('Is mobile layout?', isMobile);
    console.log('Window width:', window.innerWidth);

    if (!leftColumn || !rightColumn) return;

    if (isMobile) {
        // Mobile mode - show only one column
        if (!leftColumn.classList.contains('mobile-active') && !rightColumn.classList.contains('mobile-active')) {
            // Default to summary
            leftColumn.classList.add('mobile-active');
            console.log('Applied default mobile view: summary');
        }
        // Set up mobile day selector if not already done
        setupMobileDaySelector();

        // Shorten names for mobile
        shortenEmployeeNames();
    } else {
        // Desktop mode - show both
        leftColumn.classList.remove('mobile-active');
        rightColumn.classList.remove('mobile-active');

        // Remove mobile day controls if they exist
        const mobileControls = document.querySelector('.mobile-day-controls');
        if (mobileControls) {
            mobileControls.remove();
        }

        // Restore full names for desktop
        restoreEmployeeNames();

        console.log('Applied desktop view');
    }
}

function shortenEmployeeNames() {
    if (window.innerWidth > 768) return;

    // Shorten names ONLY in employee titles (individual and compare views)
    const titleElements = document.querySelectorAll('.employee-title, .compare-title');
    titleElements.forEach(function (element) {
        const fullName = element.textContent.trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length > 1) {
            if (!element.dataset.fullName) {
                element.dataset.fullName = fullName;
            }
            element.textContent = nameParts[0];
        }
    });

    console.log('Employee title names shortened for mobile');
}

function restoreEmployeeNames() {
    if (window.innerWidth <= 768) return;

    // Restore names ONLY in employee titles
    const titleElements = document.querySelectorAll('.employee-title, .compare-title');
    titleElements.forEach(function (element) {
        if (element.dataset.fullName) {
            element.textContent = element.dataset.fullName;
            delete element.dataset.fullName;
        }
    });

    console.log('Employee title names restored for desktop');
}

function setupMobileDaySelector() {
    if (window.innerWidth > 768) return;

    const daySelector = document.getElementById('day-selector');
    const dayValue = document.getElementById('day-value');
    const daySelectorWrapper = document.querySelector('.day-selector-wrapper');

    if (!daySelector || !dayValue || !daySelectorWrapper) {
        console.log('Day selector elements not found');
        return;
    }

    // Check if controls already exist
    if (daySelectorWrapper.querySelector('.mobile-day-controls')) {
        console.log('Mobile day controls already exist');
        return;
    }

    // Create mobile controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'mobile-day-controls';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'mobile-day-btn';
    prevBtn.innerHTML = '−';
    prevBtn.type = 'button';

    const displayDiv = document.createElement('div');
    displayDiv.className = 'mobile-day-display';

    const numberSpan = document.createElement('div');
    numberSpan.className = 'mobile-day-number';
    numberSpan.textContent = daySelector.value;

    const dateSpan = document.createElement('div');
    dateSpan.className = 'mobile-day-date';
    dateSpan.textContent = 'Październik 2024';

    displayDiv.appendChild(numberSpan);
    displayDiv.appendChild(dateSpan);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'mobile-day-btn';
    nextBtn.innerHTML = '+';
    nextBtn.type = 'button';

    controlsDiv.appendChild(prevBtn);
    controlsDiv.appendChild(displayDiv);
    controlsDiv.appendChild(nextBtn);

    // Insert before the range input
    daySelectorWrapper.insertBefore(controlsDiv, daySelector);

    // Event listeners
    prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const currentValue = parseInt(daySelector.value);
        if (currentValue > parseInt(daySelector.min)) {
            daySelector.value = currentValue - 1;
            daySelector.dispatchEvent(new Event('input', { bubbles: true }));
            updateMobileDayDisplay();
        }
    });

    nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const currentValue = parseInt(daySelector.value);
        if (currentValue < parseInt(daySelector.max)) {
            daySelector.value = currentValue + 1;
            daySelector.dispatchEvent(new Event('input', { bubbles: true }));
            updateMobileDayDisplay();
        }
    });

    // Update display when slider changes
    daySelector.addEventListener('input', updateMobileDayDisplay);

    function updateMobileDayDisplay() {
        numberSpan.textContent = daySelector.value;
        updateSliderProgress();
    }

    function updateSliderProgress() {
        const min = parseInt(daySelector.min);
        const max = parseInt(daySelector.max);
        const value = parseInt(daySelector.value);
        const progress = ((value - min) / (max - min)) * 100;
        daySelector.style.setProperty('--range-progress', progress + '%');
    }

    // Initial progress update
    updateSliderProgress();

    console.log('Mobile day selector controls added');
}

console.log('=== MOBILE.JS FILE END ===');
