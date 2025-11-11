let scheduleData = [];// State management
// Ustawienie domyślnego stanu na bieżący miesiąc i rok
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // JS month is 0-indexed
const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();

const state = {
    selectedDay: 1, // Zostanie nadpisane w DOMContentLoaded
    selectedEmployee: null,
    selectedEmployees: new Set(),
    selectedYear: currentYear,
    selectedMonth: currentMonth, // Domyślnie bieżący miesiąc
    daysInMonth: new Date(currentYear, currentMonth, 0).getDate(),
    firstDayOfMonth: (firstDay === 0) ? 6 : (firstDay - 1) // 0=Mon, ... 6=Sun
};

// Function to get current work day (shifts from 6:00 to 6:00)
// This is used to set the *initial* day *if* the loaded schedule is for the current month
const getInitialWorkDay = () => {
    const now = new Date();
    const hour = now.getHours();

    // If before 6:00 AM, use previous day
    if (hour < 6) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const day = yesterday.getDate();
        // Make sure day is valid (1-31)
        return day > 0 ? day : 1;
    }

    return now.getDate();
};


// LocalStorage keys
const STORAGE_KEY = 'schedule_data';
const THEME_KEY = 'schedule_theme';
const MONTH_KEY = 'schedule_month';
const YEAR_KEY = 'schedule_year';
const GROUP_COLORS_KEY = 'schedule_group_colors';
const GROUP_RANGES_KEY = 'schedule_group_ranges';

// Legacy constants (kept for backwards compatibility)
const YARD_ROWS_COUNT = 22;
const PRIORITY_ROWS_COUNT = 5;
const SA_ROWS_COUNT = 5;
const LIGHT_BLUE_ROWS_COUNT = 2;
const K_ROWS_COUNT = 14;
const M_ROWS_COUNT = 12;

// Default group ranges (from-to row indexes, 1-based)
const defaultGroupRanges = {
    D: { from: 1, to: 5, name: 'Priority Workers' },
    S: { from: 6, to: 10, name: 'SA Workers' },
    L: { from: 11, to: 12, name: 'Light Blue Workers' },
    K: { from: 13, to: 26, name: 'K Workers' },
    M: { type: 'before_last', count: 12, lastGroup: 'Y', name: 'M Workers' }, // Dynamic: before Y group
    Y: { type: 'last', count: 22, name: 'Yard Workers' } // Dynamic: last N rows
};

// Current group ranges (will be loaded from localStorage or use defaults)
let groupRanges = JSON.parse(JSON.stringify(defaultGroupRanges));

// Default group colors
const defaultGroupColors = {
    Y: { light: '#d2fde5', dark: '#1d5732', text: '#166534', darkText: '#86efac' }, // Yard - Green
    M: { light: '#fff7d1', dark: '#53482e', text: '#854d0e', darkText: '#fde047' }, // M - Yellow
    K: { light: '#ffedda', dark: '#69554a', text: '#9a3412', darkText: '#fed7aa' }, // K - Light Orange
    L: { light: '#bbdcff', dark: '#1f376b', text: '#0c4a6e', darkText: '#7dd3fc' }, // L - Light Blue
    S: { light: '#ccdfff', dark: '#3e4e69', text: '#1e40af', darkText: '#93c5fd' }, // S - Blue
    D: { light: '#ffe1b9', dark: '#4e3d2c', text: '#c2410c', darkText: '#fdba74' }  // D - Orange
};

// Current group colors (will be loaded from localStorage or use defaults)
let groupColors = { ...defaultGroupColors };

// Load data from localStorage on startup
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            scheduleData = JSON.parse(savedData);
            console.log(`Załadowano ${scheduleData.length} pracowników z pamięci`);

            // Load saved month/year or default
            const savedMonth = localStorage.getItem(MONTH_KEY) || (new Date().getMonth() + 1);
            const savedYear = localStorage.getItem(YEAR_KEY) || new Date().getFullYear();
            updateMonthData(parseInt(savedMonth, 10), parseInt(savedYear, 10));

            return true;
        }
    } catch (error) {
        console.error('Błąd wczytywania danych z localStorage:', error);
    }
    return false;
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleData));
        console.log('Dane zapisane w pamięci');
    } catch (error) {
        console.error('Błąd zapisywania danych do localStorage:', error);
    }
}

// Clear data from localStorage
function clearLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(MONTH_KEY);
        localStorage.removeItem(YEAR_KEY);
        scheduleData = [];
        console.log('Dane usunięte z pamięci');
    } catch (error) {
        console.error('Błąd usuwania danych z localStorage:', error);
    }
}

// Load group colors from localStorage
function loadGroupColors() {
    try {
        const saved = localStorage.getItem(GROUP_COLORS_KEY);
        if (saved) {
            groupColors = JSON.parse(saved);
            console.log('✅ Kolory grup załadowane z localStorage:', groupColors);
        } else {
            console.log('ℹ️ Używam domyślnych kolorów grup');
        }
    } catch (error) {
        console.error('❌ Błąd wczytywania kolorów grup:', error);
        groupColors = { ...defaultGroupColors };
    }
}

// Save group colors to localStorage
function saveGroupColors() {
    try {
        localStorage.setItem(GROUP_COLORS_KEY, JSON.stringify(groupColors));
        console.log('Kolory grup zapisane');
    } catch (error) {
        console.error('Błąd zapisywania kolorów grup:', error);
    }
}

// Load group ranges from localStorage
function loadGroupRanges() {
    try {
        const saved = localStorage.getItem(GROUP_RANGES_KEY);
        if (saved) {
            groupRanges = JSON.parse(saved);
            console.log('✅ Zakresy grup załadowane z localStorage:', groupRanges);
        } else {
            console.log('ℹ️ Używam domyślnych zakresów grup:', defaultGroupRanges);
        }
    } catch (error) {
        console.error('❌ Błąd wczytywania zakresów grup:', error);
        groupRanges = JSON.parse(JSON.stringify(defaultGroupRanges));
    }
}

// Save group ranges to localStorage
function saveGroupRanges() {
    try {
        localStorage.setItem(GROUP_RANGES_KEY, JSON.stringify(groupRanges));
        console.log('💾 Zakresy grup zapisane w localStorage:', groupRanges);
    } catch (error) {
        console.error('❌ Błąd zapisywania zakresów grup:', error);
    }
}

// Get group for employee by index (0-based)
function getEmployeeGroupByIndex(index, totalRows) {
    // Check each group
    for (const [groupCode, range] of Object.entries(groupRanges)) {
        if (range.type === 'last') {
            // Last N rows
            if (index >= totalRows - range.count) {
                return groupCode;
            }
        } else if (range.type === 'before_last') {
            // N rows before another group
            const lastGroupRange = groupRanges[range.lastGroup];
            if (lastGroupRange && lastGroupRange.type === 'last') {
                const beforeLastStart = totalRows - lastGroupRange.count - range.count;
                const beforeLastEnd = totalRows - lastGroupRange.count - 1;
                if (index >= beforeLastStart && index <= beforeLastEnd) {
                    return groupCode;
                }
            }
        } else {
            // Fixed range (from-to, 1-based)
            const from = range.from - 1; // Convert to 0-based
            const to = range.to - 1;
            if (index >= from && index <= to) {
                return groupCode;
            }
        }
    }
    return null;
}

// Helper function to convert hex to rgb format
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
        : hex;
}

// Get group info by group code
function getGroupInfo(groupCode) {
    const range = groupRanges[groupCode];
    let description = '';

    if (range) {
        if (range.type === 'last') {
            description = `Ostatnich ${range.count} pracowników`;
        } else if (range.type === 'before_last') {
            description = `${range.count} pracowników (przed grupą ${range.lastGroup})`;
        } else if (range.from && range.to) {
            description = `Wiersze ${range.from}-${range.to}`;
        }
    }

    const groupNames = {
        'Y': { name: 'Yard Workers', color: 'yard-badge' },
        'M': { name: 'M Workers', color: 'm-badge' },
        'K': { name: 'K Workers', color: 'k-badge' },
        'L': { name: 'Light Blue Workers', color: 'light-blue-badge' },
        'S': { name: 'SA Workers', color: 'sa-badge' },
        'D': { name: 'Priority Workers', color: 'priority-badge' }
    };

    const info = groupNames[groupCode];
    return info ? { ...info, description } : { name: 'Unknown', description: '', color: '' };
}

// Apply group colors to CSS variables
function applyGroupColors() {
    const root = document.documentElement;
    const isDark = root.getAttribute('theme') === 'dark';

    // Map groups to badge numbers
    // Y (Yard) -> badge-1, M -> badge-2, K -> badge-3, L -> badge-4, S -> badge-5, D -> badge-6
    const groupToBadge = {
        'Y': 1,
        'M': 2,
        'K': 3,
        'L': 4,
        'S': 5,
        'D': 6
    };

    // Apply colors to CSS custom properties
    Object.keys(groupColors).forEach(group => {
        const colors = groupColors[group];
        const badgeIndex = groupToBadge[group];

        if (badgeIndex) {
            const color = isDark ? colors.dark : colors.light;
            const rgbColor = hexToRgb(color);
            root.style.setProperty(`--table-row-bg-badge-${badgeIndex}`, rgbColor);
        }
    });
}

let dailyChartInstance;
let individualChartInstance;

// Debounce utility for performance
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const shiftColors = {
    '1': 'rgba(59, 130, 246, 0.7)',
    '2': 'rgba(34, 197, 94, 0.7)',
    'N1': 'rgba(251, 191, 36, 0.7)',    // Nadgodziny dzienne - żółte/złote
    'N2': 'rgba(99, 102, 241, 0.7)',    // Nadgodziny nocne - indigo
    'P': 'rgba(245, 158, 11, 0.7)',
    'Off': 'rgba(107, 114, 128, 0.7)',
    'Other': 'rgba(147, 51, 234, 0.7)',
};

const getShiftCategory = (shift) => {
    if (!shift || shift.trim() === '') return 'Empty';

    // Normalize shift - trim whitespace
    shift = shift.trim();

    // Check PWRO5 shifts first (including NP1, NP2 overtime)
    if (shift.startsWith('P') || shift.startsWith('NP')) {
        // Exact matches first
        if (shift === 'NP1' || shift === 'P1') return 'P1';
        if (shift === 'NP2' || shift === 'P2') return 'P2';

        // Check if contains 1 or 2
        if (shift.includes('1')) return 'P1';
        if (shift.includes('2')) return 'P2';

        // Handle edge case: "NP" or "P" without number - INVALID DATA
        if (shift === 'NP' || shift === 'P') return 'Other';

        return 'Other'; // Invalid format
    }

    // Check regular shifts
    if (shift.includes('1') && !shift.includes('P') && !shift.includes('N')) return '1';
    if (shift.includes('2') && !shift.includes('P') && !shift.includes('N')) return '2';

    // Check N shifts (but not NP which are handled above)
    if (shift.startsWith('N') && !shift.startsWith('NP')) {
        if (shift === 'N1') return 'N1'; // N1 = Nadgodziny dzienne
        if (shift === 'N2') return 'N2'; // N2 = Nadgodziny nocne
        if (shift === 'N') return 'Off'; // N = Nieobecny
    }

    if (['X', 'u', 'ZW'].includes(shift)) return 'Off';
    return 'Other';
};

// Calculate work hours and days for an employee
const calculateWorkStats = (schedule) => {
    let totalHours = 0;
    let workDays = 0;

    // Only iterate over the days in the *current* month
    schedule.slice(0, state.daysInMonth).forEach(shift => {
        if (!shift || shift.trim() === '') return;

        const trimmedShift = shift.trim();

        // Skip days off (no work, no hours)
        // N = Nieobecny (absent), X = wolne, u = urlop off, ZW = zwolnienie
        if (['X', 'x', 'ZW', 'zw', 'N'].includes(trimmedShift)) return;

        // Count as work day
        workDays++;

        // Count hours based on shift type (12h system)
        // All work shifts count as 12h
        if (trimmedShift === '1' || trimmedShift === '2') {
            totalHours += 12;
        } else if (trimmedShift === 'N1' || trimmedShift === 'N2') {
            // N1, N2 - overtime shifts also count as 12h
            totalHours += 12;
        } else if (trimmedShift === 'P1' || trimmedShift === 'P2') {
            totalHours += 12;
        } else if (trimmedShift === 'NP1' || trimmedShift === 'NP2') {
            // PWRO5 Overtime also counts as 12h
            totalHours += 12;
        } else if (trimmedShift === 'U' || trimmedShift === 'u') {
            // U (urlop) - vacation day but no work hours
            // Already counted as workDay
        } else if (trimmedShift === 'S' || trimmedShift === 's') {
            // S (sick leave) - day off but counted, no work hours
            // Already counted as workDay
        } else {
            // Other shifts - default 12h
            totalHours += 12;
        }
    });

    return { totalHours, workDays };
};

// Monthly work norms for 2025 (12h system)
// TODO: This could be expanded for other years if needed
const monthlyNorms = {
    1: { name: 'Styczeń', hours: 168 },       // 14 dni robocze × 12h = 168h
    2: { name: 'Luty', hours: 160 },         // 14 dni roboczych × 12h = 160h
    3: { name: 'Marzec', hours: 168 },       // 14 dni roboczych × 12h = 168h
    4: { name: 'Kwiecień', hours: 176 },     // 15 dni robocze × 12h = 176h
    5: { name: 'Maj', hours: 160 },          // 14 dni roboczych × 12h = 160h
    6: { name: 'Czerwiec', hours: 168 },     // 14 dni roboczych × 12h = 168h
    7: { name: 'Lipiec', hours: 184 },       // 16 dni robocze × 12h = 184h
    8: { name: 'Sierpień', hours: 168 },     // 14 dni roboczych × 12h = 168h
    9: { name: 'Wrzesień', hours: 176 },     // 15 dni robocze × 12h = 176h
    10: { name: 'Październik', hours: 184 }, // 16 dni robocze × 12h = 184h
    11: { name: 'Listopad', hours: 144 },    // 14 dni roboczych × 12h = 144h
    12: { name: 'Grudzień', hours: 176 }     // 15 dni robocze × 12h = 176h
};

// Update month data (days, start day)
const updateMonthData = (month, year) => {
    state.selectedMonth = month;
    state.selectedYear = year;

    // Get days in month
    state.daysInMonth = new Date(year, month, 0).getDate();

    // Get first day of week (0=Sun, 1=Mon, ..., 6=Sat)
    const firstDay = new Date(year, month - 1, 1).getDay();
    // Convert to 0=Mon, 1=Tue, ..., 6=Sun
    state.firstDayOfMonth = (firstDay === 0) ? 6 : (firstDay - 1);

    // Update slider max
    const daySelector = document.getElementById('day-selector');
    if (daySelector) {
        daySelector.max = state.daysInMonth;

        // Clamp selectedDay if it's out of bounds for the new month
        if (state.selectedDay > state.daysInMonth) {
            state.selectedDay = state.daysInMonth;
            daySelector.value = state.selectedDay;

            const dayValue = document.getElementById('day-value');
            if (dayValue) {
                dayValue.textContent = state.selectedDay;
            }
        }
    }

    // Save to localStorage
    localStorage.setItem(MONTH_KEY, month);
    localStorage.setItem(YEAR_KEY, year);

    // Update UI
    updateSubtitle();
    console.log(`Zaktualizowano miesiąc: ${month}/${year}, Dni: ${state.daysInMonth}, Dzień startowy: ${state.firstDayOfMonth}`);
};

// Update subtitle with month and work norm
const updateSubtitle = () => {
    const subtitleElement = document.getElementById('subtitle');
    if (!subtitleElement) return;

    // Get month data
    const monthData = monthlyNorms[state.selectedMonth];
    if (!monthData) {
        subtitleElement.textContent = `Brak danych o normie dla ${state.selectedMonth}/${state.selectedYear}`;
        return;
    }

    const daysIn12hSystem = Math.ceil(monthData.hours / 12);

    subtitleElement.textContent = `${monthData.name} ${state.selectedYear} • Norma: ${monthData.hours}h (${daysIn12hSystem} dni po 12h)`;
};

const renderFullTable = (filter = '') => {
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    let headerHtml = '<tr><th class="th-checkbox"><input type="checkbox" id="select-all" title="Zaznacz wszystkie"></th><th class="th-name">Imię i Nazwisko</th>';

    const firstDayOfMonth = state.firstDayOfMonth; // 0=Mon ... 6=Sun
    for (let i = 1; i <= state.daysInMonth; i++) {
        const dayOfWeek = (firstDayOfMonth + i - 1) % 7;
        const isSaturday = dayOfWeek === 5;
        const isSunday = dayOfWeek === 6;
        const weekendClass = isSaturday ? ' weekend-saturday' : (isSunday ? ' weekend-sunday' : '');
        headerHtml += `<th class="th-day${weekendClass}">${i}</th>`;
    }
    headerHtml += '</tr>';
    tableHead.innerHTML = headerHtml;

    let bodyHtml = '';
    const colspan = state.daysInMonth + 2;

    if (scheduleData.length === 0) {
        bodyHtml = `<tr><td colspan="${colspan}" class="empty-message">Brak danych. Użyj przycisku "Importuj CSV" aby załadować harmonogram.</td></tr>`;
        tableBody.innerHTML = bodyHtml;
        return;
    }

    const filteredData = scheduleData.filter(emp => emp.name.toLowerCase().includes(filter.toLowerCase()));

    if (filteredData.length === 0) {
        bodyHtml = `<tr><td colspan="${colspan}" class="empty-message">Nie znaleziono pracownika o podanej nazwie.</td></tr>`;
        tableBody.innerHTML = bodyHtml;
        return;
    }

    // Use array for better performance than string concatenation
    const rows = filteredData.map((employee, index) => {
        const isSelected = state.selectedEmployees.has(employee.name);
        const totalRows = filteredData.length;

        // Get group using new dynamic system
        const group = getEmployeeGroupByIndex(index, totalRows);

        let rowClass = 'table-row';
        let badge = '';

        // Set class and badge based on group
        if (group === 'Y') {
            rowClass = 'table-row yard-worker';
            badge = ' <span class="yard-badge">Y</span>';
        } else if (group === 'M') {
            rowClass = 'table-row m-worker';
            badge = ' <span class="m-badge">M</span>';
        } else if (group === 'D') {
            rowClass = 'table-row priority-worker';
            badge = ' <span class="priority-badge">D</span>';
        } else if (group === 'S') {
            rowClass = 'table-row sa-worker';
            badge = ' <span class="sa-badge">S</span>';
        } else if (group === 'L') {
            rowClass = 'table-row light-blue-worker';
            badge = ' <span class="light-blue-badge">L</span>';
        } else if (group === 'K') {
            rowClass = 'table-row k-worker';
            badge = ' <span class="k-badge">K</span>';
        }

        // Calculate work statistics
        const stats = calculateWorkStats(employee.schedule);

        // Build shift cells using map for better performance
        // Only show cells for the current month
        const shiftCells = employee.schedule.slice(0, state.daysInMonth).map(shift => {
            const category = getShiftCategory(shift);
            let bgColor = '';
            if (category === '1') bgColor = 'shift-1';
            else if (category === '2') bgColor = 'shift-2';
            else if (category === 'N1') bgColor = 'shift-n1';
            else if (category === 'N2') bgColor = 'shift-n2';
            else if (category === 'P1' || category === 'P2') bgColor = 'shift-p';
            else if (category === 'Off') bgColor = 'shift-off';
            else if (category === 'Other') bgColor = 'shift-other';

            return `<td class="td-shift ${bgColor}">${shift || ''}</td>`;
        }).join('');

        return `<tr class="${rowClass}" data-employee="${employee.name}">
            <td class="td-checkbox"><input type="checkbox" class="employee-checkbox" data-employee="${employee.name}" ${isSelected ? 'checked' : ''}></td>
            <td class="td-name">
                <div class="employee-name-section">
                    <span class="employee-name-text">${badge}${employee.name}</span>
                    <span class="employee-stats">${stats.workDays}dni • ${stats.totalHours}h</span>
                </div>
            </td>${shiftCells}</tr>`;
    });

    tableBody.innerHTML = rows.join('');
};

// Event delegation for table - set up ONCE instead of on every render
let tableBodyListenersInitialized = false;
const initializeTableEventDelegation = () => {
    if (tableBodyListenersInitialized) return;

    const tableBody = document.getElementById('table-body');
    const tableHead = document.getElementById('table-head');
    if (!tableBody) return;

    // Single delegated handler for all checkboxes
    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('employee-checkbox')) {
            e.stopPropagation();
            const employeeName = e.target.dataset.employee;
            if (e.target.checked) {
                state.selectedEmployees.add(employeeName);
            } else {
                state.selectedEmployees.delete(employeeName);
            }
            updateCompareButton();
        }
    });

    // Single delegated handler for checkbox cell clicks
    tableBody.addEventListener('click', (e) => {
        // If clicked on checkbox itself, let the change event handle it
        if (e.target.type === 'checkbox') return;

        // Check if clicked on checkbox cell
        const checkboxCell = e.target.closest('.td-checkbox');
        if (checkboxCell) {
            e.stopPropagation();
            const checkbox = checkboxCell.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                // Trigger change event
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
        }

        // Handle row click for individual view
        const row = e.target.closest('tr');
        if (row && row.dataset.employee) {
            state.selectedEmployee = row.dataset.employee;
            showIndividualView();
        }
    });

    // Handler for header checkbox cell click
    if (tableHead) {
        tableHead.addEventListener('click', (e) => {
            // If clicked on checkbox itself, let it work normally
            if (e.target.type === 'checkbox') return;

            // Check if clicked on checkbox header cell
            const checkboxCell = e.target.closest('.th-checkbox');
            if (checkboxCell) {
                e.stopPropagation();
                const checkbox = checkboxCell.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    // Trigger change event
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });

        // Handler for select-all checkbox change
        tableHead.addEventListener('change', (e) => {
            if (e.target.id === 'select-all') {
                const checkboxes = document.querySelectorAll('.employee-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    if (e.target.checked) {
                        state.selectedEmployees.add(cb.dataset.employee);
                    } else {
                        state.selectedEmployees.clear();
                    }
                });
                updateCompareButton();
            }
        });
    }

    tableBodyListenersInitialized = true;
};

// Render day markers for the slider
const renderDayMarkers = () => {
    const container = document.getElementById('day-markers');
    if (!container) return;

    // Get the number of days in the month
    const daysInMonth = state.daysInMonth;

    // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    const firstDayOfWeek = state.firstDayOfMonth;

    // Build HTML using template literals for better performance
    const markersHtml = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const isActive = day === state.selectedDay;

        return `<div class="day-marker${isWeekend ? ' weekend' : ''}${isActive ? ' active' : ''}" data-day="${day}">
            <div class="day-marker-tick"></div>
            <div class="day-marker-label">${day}</div>
        </div>`;
    }).join('');

    container.innerHTML = markersHtml;
};

// Hover effect for rows and columns
let tableHoverInitialized = false;
const initializeTableHover = () => {
    if (tableHoverInitialized) return;

    const tableBody = document.getElementById('table-body');
    const tableHead = document.querySelector('.sticky-header');
    if (!tableBody || !tableHead) return;

    tableBody.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('.td-shift');
        if (!cell) return;

        const row = cell.closest('tr');
        if (!row) return;

        // Highlight row
        row.classList.add('row-hover');

        // Get column index (accounting for checkbox and name columns)
        const cellIndex = Array.from(row.children).indexOf(cell);

        // Highlight all cells in the same column (body)
        const allRows = tableBody.querySelectorAll('tr');
        allRows.forEach(r => {
            const targetCell = r.children[cellIndex];
            if (targetCell && targetCell.classList.contains('td-shift')) {
                targetCell.classList.add('column-hover');
            }
        });

        // Highlight header cell
        const headerRow = tableHead.querySelector('tr');
        if (headerRow) {
            const headerCell = headerRow.children[cellIndex];
            if (headerCell && headerCell.classList.contains('th-day')) {
                headerCell.classList.add('column-hover');
            }
        }
    });

    tableBody.addEventListener('mouseout', (e) => {
        const cell = e.target.closest('.td-shift');
        if (!cell) return;

        const row = cell.closest('tr');
        if (row) {
            row.classList.remove('row-hover');
        }

        // Remove column highlight from body
        const allCells = tableBody.querySelectorAll('.td-shift');
        allCells.forEach(c => c.classList.remove('column-hover'));

        // Remove column highlight from header
        const headerCells = tableHead.querySelectorAll('.th-day');
        headerCells.forEach(c => c.classList.remove('column-hover'));
    });

    tableHoverInitialized = true;
};

// Event delegation for day markers - set up ONCE
let dayMarkersListenerInitialized = false;
const initializeDayMarkersEventDelegation = () => {
    if (dayMarkersListenerInitialized) return;

    const container = document.getElementById('day-markers');
    if (!container) return;

    // Single delegated handler for all day markers
    container.addEventListener('click', (e) => {
        const marker = e.target.closest('.day-marker');
        if (marker) {
            const day = parseInt(marker.dataset.day, 10);
            if (day) {
                state.selectedDay = day;
                document.getElementById('day-selector').value = day;
                document.getElementById('day-value').textContent = day;
                renderDayMarkers();
                renderDailySummary();
            }
        }
    });

    dayMarkersListenerInitialized = true;
};

const renderDailySummary = () => {
    const day = state.selectedDay;

    // Get current month name
    const monthName = monthlyNorms[state.selectedMonth] ? monthlyNorms[state.selectedMonth].name : 'Miesiąca';

    document.getElementById('daily-summary-title').innerText = `Podsumowanie dzienne: ${day} ${monthName}`;
    const dailyDetailsContainer = document.getElementById('daily-details');

    if (scheduleData.length === 0) {
        dailyDetailsContainer.innerHTML = '<p class="no-data">Brak danych. Załaduj plik CSV aby zobaczyć podsumowanie.</p>';
        updateDailyChart();
        return;
    }

    const shifts = { '1': [], '2': [], 'N1': [], 'N2': [], 'P1': [], 'P2': [], 'Off': [], 'Other': [], 'Empty': [] };

    scheduleData.forEach((emp, index) => {
        const shift = emp.schedule[day - 1]; // day is 1-based, index is 0-based
        const category = getShiftCategory(shift);
        // We check category, not shift, to include "Empty"
        shifts[category].push({ name: emp.name, shift: shift || '', index: index });
    });

    let detailsHtml = '';
    const categoryLabels = {
        '1': '<img src="https://api.iconify.design/flat-color-icons:portrait-mode.svg" class="shift-icon" alt="Dniówka"> 1 - Dniówka',
        '2': '<img src="https://api.iconify.design/flat-color-icons:night-portrait.svg" class="shift-icon" alt="Nocka"> 2 - Nocka',
        'N1': '<img src="https://api.iconify.design/noto-v1:sun.svg" class="shift-icon" alt="N1"> N1 - Nadgodziny Dzienne',
        'N2': '<img src="https://api.iconify.design/noto-v1:crescent-moon.svg" class="shift-icon" alt="N2"> N2 - Nadgodziny Nocne',
        'P1': '<img src="https://api.iconify.design/flat-color-icons:factory.svg" class="shift-icon" alt="PWRO5 Dzień"> P1 - PWRO5 Dzień (+ NP1 - Nadgodziny)',
        'P2': '<img src="https://api.iconify.design/flat-color-icons:factory-breakdown.svg" class="shift-icon" alt="PWRO5 Nocka"> P2 - PWRO5 Nocka (+ NP2 - Nadgodziny)',
        'Off': '<i class="fas fa-umbrella-beach"></i> Wolne / Nieobecni (N, X, u, ZW)',
        'Other': '<i class="fas fa-question-circle"></i> Inne (S, U, etc.)'
    };

    // Helper function to get employee worker class
    const getEmployeeWorkerClass = (index) => {
        const totalRows = scheduleData.length;
        const group = getEmployeeGroupByIndex(index, totalRows);

        const groupToClass = {
            'Y': 'yard-worker',
            'M': 'm-worker',
            'D': 'priority-worker',
            'S': 'sa-worker',
            'L': 'light-blue-worker',
            'K': 'k-worker'
        };

        return groupToClass[group] || '';
    };

    // Build HTML using array methods for better performance
    const shiftGroups = Object.entries(categoryLabels).map(([category, label]) => {
        if (shifts[category].length === 0) return '';

        const tags = shifts[category].map(emp => {
            const workerClass = getEmployeeWorkerClass(emp.index);
            return `<span class="employee-tag ${workerClass}">${emp.name} <span class="shift-code">${emp.shift}</span></span>`;
        }).join('');

        return `<div class="shift-group shift-category-${category.toLowerCase()}">
                    <h4>${label} (${shifts[category].length})</h4>
                    <div class="employee-tags">${tags}</div>
                </div>`;
    }).filter(html => html !== '').join('');

    dailyDetailsContainer.innerHTML = shiftGroups || '<p class="no-data">Brak danych dla tego dnia.</p>';

    updateDailyChart();
};

const updateDailyChart = () => {
    const day = state.selectedDay;
    const counts = { '1': 0, '2': 0, 'N1': 0, 'N2': 0, 'P1': 0, 'P2': 0, 'Off': 0, 'Other': 0 };

    if (scheduleData.length > 0) {
        scheduleData.forEach(emp => {
            const shift = emp.schedule[day - 1];
            if (shift && shift.trim() !== '') {
                const category = getShiftCategory(shift);
                counts[category]++;
            }
        });
    }

    // Check if mobile mode
    const isMobile = window.innerWidth <= 768;
    const chartContainer = document.querySelector('.chart-container');
    const canvas = document.getElementById('daily-chart');

    // MOBILE MODE - Display numbers instead of chart
    if (isMobile) {
        // Hide canvas, show numbers
        canvas.style.display = 'none';

        // Destroy chart instance if exists
        if (dailyChartInstance) {
            dailyChartInstance.destroy();
            dailyChartInstance = null;
        }

        // Create or update numbers display
        let numbersDisplay = chartContainer.querySelector('.mobile-chart-numbers');
        if (!numbersDisplay) {
            numbersDisplay = document.createElement('div');
            numbersDisplay.className = 'mobile-chart-numbers';
            chartContainer.appendChild(numbersDisplay);
        }

        // Generate numbers HTML
        const shiftLabels = [
            { key: '1', label: '1 - Dniówka', icon: '🏙️' },
            { key: '2', label: '2 - Nocka', icon: '🌃' },
            { key: 'N1', label: 'N1 - Nadg. Dzienne', icon: '☀️' },
            { key: 'N2', label: 'N2 - Nadg. Nocne', icon: '🌙' },
            { key: 'P1', label: 'P1 - PWRO5 Dzień', icon: '🏭' },
            { key: 'P2', label: 'P2 - PWRO5 Nocka', icon: '🏭' },
            { key: 'Off', label: 'Wolne', icon: '🏖️' },
            { key: 'Other', label: 'Inne', icon: '❓' }
        ];

        let numbersHtml = '<div class="mobile-chart-title">Rozkład zmian</div>';
        numbersHtml += '<div class="mobile-chart-grid">';

        shiftLabels.forEach(shift => {
            const count = counts[shift.key];
            if (count > 0) {
                numbersHtml += `
                    <div class="mobile-chart-item" data-shift="${shift.key}">
                        <div class="mobile-chart-label">${shift.icon} ${shift.label}</div>
                        <div class="mobile-chart-count">${count}</div>
                    </div>
                `;
            }
        });

        numbersHtml += '</div>';
        numbersDisplay.innerHTML = numbersHtml;

        return;
    }

    // DESKTOP MODE - Display chart
    canvas.style.display = 'block';

    // Remove numbers display if exists
    const existingNumbers = chartContainer.querySelector('.mobile-chart-numbers');
    if (existingNumbers) {
        existingNumbers.remove();
    }

    // Get current theme
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const textColor = isDark ? '#e9ecef' : '#212529';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const chartData = {
        labels: ['1 - Dniówka', '2 - Nocka', 'N1 - Nadg. Dzienne', 'N2 - Nadg. Nocne', 'P1 - PWRO5 Dzień', 'P2 - PWRO5 Nocka', 'Wolne', 'Inne'],
        datasets: [{
            label: 'Liczba pracowników',
            data: [counts['1'], counts['2'], counts['N1'], counts['N2'], counts['P1'], counts['P2'], counts['Off'], counts['Other']],
            backgroundColor: [shiftColors['1'], shiftColors['2'], shiftColors['N1'], shiftColors['N2'], shiftColors['P'], shiftColors['P'], shiftColors['Off'], shiftColors['Other']],
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderWidth: 2
        }]
    };

    const ctx = canvas.getContext('2d');

    // Update existing chart instead of destroying and recreating
    if (dailyChartInstance) {
        // Update data
        dailyChartInstance.data.datasets[0].data = [counts['1'], counts['2'], counts['N1'], counts['N2'], counts['P1'], counts['P2'], counts['Off'], counts['Other']];
        dailyChartInstance.data.datasets[0].borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        // Update colors
        dailyChartInstance.options.plugins.title.color = textColor;
        dailyChartInstance.options.scales.x.ticks.color = textColor;
        dailyChartInstance.options.scales.y.ticks.color = textColor;
        dailyChartInstance.options.scales.x.grid.color = gridColor;
        dailyChartInstance.options.scales.y.grid.color = gridColor;
        // Update without animation for instant feedback
        dailyChartInstance.update('none');
    } else {
        // Create chart only once
        dailyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300 // Reduced from default 1000ms
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Rozkład zmian w ciągu dnia',
                        font: { size: 16 },
                        color: textColor
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    }
};

// Update compare button
function updateCompareButton() {
    const compareBtn = document.getElementById('compare-btn');
    const compareCount = document.getElementById('compare-count');
    const resetBtn = document.getElementById('reset-selection-btn');
    const count = state.selectedEmployees.size;

    compareCount.textContent = count;
    compareBtn.disabled = count < 2;
    resetBtn.disabled = count === 0;

    if (count >= 2) {
        compareBtn.title = `Porównaj ${count} pracowników`;
    } else {
        compareBtn.title = 'Wybierz co najmniej 2 pracowników';
    }
}

const showIndividualView = () => {
    document.getElementById('full-schedule-view').classList.add('hidden');
    document.getElementById('legend').classList.add('hidden');
    document.getElementById('compare-view').classList.add('hidden');
    const individualView = document.getElementById('individual-view');
    individualView.classList.remove('hidden');

    const employee = scheduleData.find(emp => emp.name === state.selectedEmployee);
    if (!employee) return;

    const contentContainer = document.getElementById('individual-content');

    const counts = { '1': 0, '2': 0, 'N1': 0, 'N2': 0, 'P1': 0, 'P2': 0, 'Off': 0, 'Other': 0 };
    let np1Count = 0;
    let np2Count = 0;

    employee.schedule.slice(0, state.daysInMonth).forEach(shift => {
        if (shift && shift.trim() !== '') {
            const trimmedShift = shift.trim();
            // Count NP1 and NP2 separately, not as P1/P2
            if (trimmedShift === 'NP1') {
                np1Count++;
            } else if (trimmedShift === 'NP2') {
                np2Count++;
            } else {
                counts[getShiftCategory(shift)]++;
            }
        }
    });

    // Calculate work statistics
    const stats = calculateWorkStats(employee.schedule);

    // Calculate detailed shift hours (all shifts count as 12h)
    let shift1Hours = counts['1'] * 12;
    let shift2Hours = counts['2'] * 12;
    let shiftN1Hours = counts['N1'] * 12; // Nadgodziny dzienne
    let shiftN2Hours = counts['N2'] * 12; // Nadgodziny nocne
    let shiftP1Hours = counts['P1'] * 12;
    let shiftP2Hours = counts['P2'] * 12;
    let np1Hours = np1Count * 12;
    let np2Hours = np2Count * 12;

    let calendarHtml = `<div class="calendar-grid">`;
    const daysOfWeek = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
    daysOfWeek.forEach(day => calendarHtml += `<div class="calendar-day-name">${day}</div>`);

    const firstDayOfMonth = state.firstDayOfMonth; // 0=Mon
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarHtml += `<div></div>`; // Empty cells for offset
    }

    employee.schedule.slice(0, state.daysInMonth).forEach((shift, index) => {
        const category = getShiftCategory(shift);
        let bgColor = 'cal-empty';
        if (category === '1') bgColor = 'cal-shift-1';
        if (category === '2') bgColor = 'cal-shift-2';
        if (category === 'N1') bgColor = 'cal-shift-n1';
        if (category === 'N2') bgColor = 'cal-shift-n2';
        if (category === 'P1') bgColor = 'cal-shift-p1';
        if (category === 'P2') bgColor = 'cal-shift-p2';
        if (category === 'Off') bgColor = 'cal-shift-off';
        if (category === 'Other') bgColor = 'cal-shift-other';

        calendarHtml += `<div class="calendar-day ${bgColor}">
                    <div class="day-number">${index + 1}</div>
                    <div class="day-shift">${shift || '-'}</div>
                </div>`;
    });
    calendarHtml += `</div>`;


    contentContainer.innerHTML = `
                <h2 class="employee-title">${employee.name}</h2>
                
                <div class="work-stats-summary">
                    <div class="stat-card stat-card-primary">
                        <div class="stat-icon"><img src="https://api.iconify.design/flat-color-icons:calendar.svg" class="shift-icon" alt="Dni pracy"></div>
                        <div class="stat-content">
                            <div class="stat-label">Dni pracy</div>
                            <div class="stat-value">${stats.workDays}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-card-primary">
                        <div class="stat-icon"><img src="https://api.iconify.design/flat-color-icons:clock.svg" class="shift-icon" alt="Suma godzin"></div>
                        <div class="stat-content">
                            <div class="stat-label">Suma godzin</div>
                            <div class="stat-value">${stats.totalHours}h</div>
                        </div>
                    </div>
                    
                    ${counts['1'] > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon"><img src="https://api.iconify.design/noto-v1:bright-button.svg" class="shift-icon" alt="Dniówka"></div>
                        <div class="stat-content">
                            <div class="stat-label">Dniówki (1)</div>
                            <div class="stat-value">${counts['1']} dni • ${shift1Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${counts['2'] > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon"><img src="https://api.iconify.design/noto-v1:crescent-moon.svg" class="shift-icon" alt="Nocka"></div>
                        <div class="stat-content">
                            <div class="stat-label">Nocki (2)</div>
                            <div class="stat-value">${counts['2']} dni • ${shift2Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${counts['N1'] > 0 ? `
                    <div class="stat-card stat-card-overtime">
                        <div class="stat-icon"><img src="https://api.iconify.design/noto-v1:sun.svg" class="shift-icon" alt="N1"></div>
                        <div class="stat-content">
                            <div class="stat-label">Nadg. Dzienne (N1)</div>
                            <div class="stat-value">${counts['N1']} dni • ${shiftN1Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${counts['N2'] > 0 ? `
                    <div class="stat-card stat-card-overtime">
                        <div class="stat-icon"><img src="https://api.iconify.design/noto-v1:crescent-moon.svg" class="shift-icon" alt="N2"></div>
                        <div class="stat-content">
                            <div class="stat-label">Nadg. Nocne (N2)</div>
                            <div class="stat-value">${counts['N2']} dni • ${shiftN2Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${counts['P1'] > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon"><img src="https://api.iconify.design/flat-color-icons:factory.svg" class="shift-icon" alt="PWRO5 Dzień"></div>
                        <div class="stat-content">
                            <div class="stat-label">PWRO5 Dzień (P1)</div>
                            <div class="stat-value">${counts['P1']} dni • ${shiftP1Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${counts['P2'] > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon"><img src="https://api.iconify.design/flat-color-icons:factory-breakdown.svg" class="shift-icon" alt="PWRO5 Nocka"></div>
                        <div class="stat-content">
                            <div class="stat-label">PWRO5 Nocka (P2)</div>
                            <div class="stat-value">${counts['P2']} dni • ${shiftP2Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${np1Count > 0 ? `
                    <div class="stat-card stat-card-overtime">
                        <div class="stat-icon"><img src="https://api.iconify.design/flat-color-icons:factory.svg" class="shift-icon" alt="NP1"></div>
                        <div class="stat-content">
                            <div class="stat-label">Nadg. PWRO5 Dzień (NP1)</div>
                            <div class="stat-value">${np1Count} dni • ${np1Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${np2Count > 0 ? `
                    <div class="stat-card stat-card-overtime">
                        <div class="stat-icon"><img src="https://api.iconify.design/flat-color-icons:factory-breakdown.svg" class="shift-icon" alt="NP2"></div>
                        <div class="stat-content">
                            <div class="stat-label">Nadg. PWRO5 Nocka (NP2)</div>
                            <div class="stat-value">${np2Count} dni • ${np2Hours}h</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${counts['Off'] > 0 ? `
                    <div class="stat-card">
                        <div class="stat-icon"><img src="https://api.iconify.design/noto-v1:palm-tree.svg" class="shift-icon" alt="Wolne"></div>
                        <div class="stat-content">
                            <div class="stat-label">Wolne/Urlopy</div>
                            <div class="stat-value">${counts['Off']} dni</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="individual-grid">
                    <div class="calendar-section">
                        <h3>Kalendarz miesięczny</h3>
                        ${calendarHtml}
                    </div>
                    <div class="summary-section">
                        <h3>Podsumowanie zmian</h3>
                         <div class="chart-container">
                           <canvas id="individual-chart"></canvas>
                         </div>
                    </div>
                </div>
            `;

    const ctx = document.getElementById('individual-chart').getContext('2d');
    if (individualChartInstance) {
        individualChartInstance.destroy();
    }

    // Get current theme
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const textColor = isDark ? '#e9ecef' : '#212529';

    individualChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['1 - Dniówka', '2 - Nocka', 'N1 - Nadg. Dzienne', 'N2 - Nadg. Nocne', 'P1 - PWRO5 Dzień', 'P2 - PWRO5 Nocka', 'NP1 - Nadg. PWRO5 Dzień', 'NP2 - Nadg. PWRO5 Nocka', 'Wolne', 'Inne'],
            datasets: [{
                data: [counts['1'], counts['2'], counts['N1'], counts['N2'], counts['P1'], counts['P2'], np1Count, np2Count, counts['Off'], counts['Other']],
                backgroundColor: [shiftColors['1'], shiftColors['2'], shiftColors['N1'], shiftColors['N2'], shiftColors['P'], shiftColors['P'], 'rgba(245, 158, 11, 0.9)', 'rgba(217, 119, 6, 0.9)', shiftColors['Off'], shiftColors['Other']],
                borderColor: isDark ? 'rgba(25, 25, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'left',
                    align: 'center',
                    labels: {
                        color: textColor,
                        font: {
                            size: 11
                        },
                        padding: 10,
                        boxWidth: 15,
                        boxHeight: 15
                    }
                }
            }
        }
    });
};

const showFullSchedule = () => {
    document.getElementById('full-schedule-view').classList.remove('hidden');
    document.getElementById('legend').classList.remove('hidden');
    document.getElementById('individual-view').classList.add('hidden');
    document.getElementById('compare-view').classList.add('hidden');
    state.selectedEmployee = null;
};

// Helper function to get employee group
const getEmployeeGroup = (originalIndex) => {
    if (originalIndex < 0) return 'Other'; // Safety check
    const totalRows = scheduleData.length;
    return getEmployeeGroupByIndex(originalIndex, totalRows) || 'Other';
};

// Helper function to extract first name and first letter of last name
const getEmployeeKey = (fullName) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return fullName; // If no last name, return as is
    const firstName = parts[0];
    const lastNameInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastNameInitial}`;
};

// Filter out duplicate employees from different groups
const filterDuplicatesFromDifferentGroups = (employees) => {
    const nameGroupMap = new Map();
    const toRemove = new Set();

    // Identify duplicates from different groups and keep only first one
    employees.forEach(emp => {
        const originalIndex = scheduleData.findIndex(e => e.name === emp.name);
        const group = getEmployeeGroup(originalIndex);
        const key = getEmployeeKey(emp.name);

        if (nameGroupMap.has(key)) {
            const existing = nameGroupMap.get(key);
            if (existing.group !== group) {
                // Found duplicate from different group - remove the second one
                toRemove.add(emp.name);
            }
        } else {
            nameGroupMap.set(key, { name: emp.name, group });
        }
    });

    // Filter out duplicates (keep only first occurrence)
    const filtered = employees.filter(emp => !toRemove.has(emp.name));

    return filtered;
};

// Compare view
const showCompareView = () => {
    if (state.selectedEmployees.size < 2) return;

    document.getElementById('full-schedule-view').classList.add('hidden');
    document.getElementById('legend').classList.add('hidden');
    document.getElementById('individual-view').classList.add('hidden');
    document.getElementById('compare-view').classList.remove('hidden');

    const compareContent = document.getElementById('compare-content');
    const selectedNames = Array.from(state.selectedEmployees);

    // Get only selected employees (exact match by name)
    let employees = scheduleData.filter(emp => selectedNames.includes(emp.name));

    // Remove exact duplicates (same full name) - keep unique by full name
    const uniqueEmployees = [];
    const seenNames = new Set();
    employees.forEach(emp => {
        if (!seenNames.has(emp.name)) {
            seenNames.add(emp.name);
            uniqueEmployees.push(emp);
        }
    });
    employees = uniqueEmployees;

    // Filter out duplicates from different groups (same first name + last name initial)
    employees = filterDuplicatesFromDifferentGroups(employees);

    let html = `<h2 class="compare-title">Porównanie harmonogramów (${employees.length} pracowników)</h2>`;
    html += '<div class="compare-table-container"><table class="compare-table">';

    // Header
    html += '<thead><tr><th class="compare-th-name">Pracownik</th>';
    const firstDayOfMonth = state.firstDayOfMonth; // 0=Mon
    for (let i = 1; i <= state.daysInMonth; i++) {
        const dayOfWeek = (firstDayOfMonth + i - 1) % 7;
        const isSaturday = dayOfWeek === 5;
        const isSunday = dayOfWeek === 6;
        const weekendClass = isSaturday ? ' weekend-saturday' : (isSunday ? ' weekend-sunday' : '');
        html += `<th class="compare-th-day${weekendClass}">${i}</th>`;
    }
    html += '</tr></thead><tbody>';

    // Rows
    employees.forEach((employee) => {
        // Check if this employee is in the last 24 rows, first 6 rows, or next 4 rows of the original data
        const originalIndex = scheduleData.findIndex(emp => emp.name === employee.name);
        const group = getEmployeeGroup(originalIndex);

        let rowClass = 'compare-row';
        let badge = '';
        if (group === 'Y') {
            rowClass = 'compare-row yard-worker';
            badge = ' <span class="yard-badge">Y</span>';
        } else if (group === 'M') {
            rowClass = 'compare-row m-worker';
            badge = ' <span class="m-badge">M</span>';
        } else if (group === 'D') {
            rowClass = 'compare-row priority-worker';
            badge = ' <span class="priority-badge">D</span>';
        } else if (group === 'S') {
            rowClass = 'compare-row sa-worker';
            badge = ' <span class="sa-badge">S</span>';
        } else if (group === 'L') {
            rowClass = 'compare-row light-blue-worker';
            badge = ' <span class="light-blue-badge">L</span>';
        } else if (group === 'K') {
            rowClass = 'compare-row k-worker';
            badge = ' <span class="k-badge">K</span>';
        }

        // Calculate work statistics
        const stats = calculateWorkStats(employee.schedule);

        html += `<tr class="${rowClass}">`;
        html += `<td class="compare-td-name">
            <div class="employee-name-section">
                <span class="employee-name-text">${badge}${employee.name}</span>
                <span class="employee-stats">${stats.workDays}dni • ${stats.totalHours}h</span>
            </div>
        </td>`;

        // Only show shifts for the current month
        employee.schedule.slice(0, state.daysInMonth).forEach(shift => {
            const category = getShiftCategory(shift);
            let bgColor = '';
            if (category === '1') bgColor = 'shift-1';
            else if (category === '2') bgColor = 'shift-2';
            else if (category === 'N1') bgColor = 'shift-n1';
            else if (category === 'N2') bgColor = 'shift-n2';
            else if (category === 'P1' || category === 'P2') bgColor = 'shift-p';
            else if (category === 'Off') bgColor = 'shift-off';
            else if (category === 'Other') bgColor = 'shift-other';

            html += `<td class="compare-td-shift ${bgColor}">${shift || ''}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    compareContent.innerHTML = html;
};

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');

    if (theme === 'dark') {
        html.setAttribute('theme', 'dark');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    } else {
        html.removeAttribute('theme');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    }

    localStorage.setItem(THEME_KEY, theme);

    // Reapply group colors when theme changes
    applyGroupColors();
}

function toggleTheme() {
    const html = document.documentElement;
    const body = document.body;
    const currentTheme = html.getAttribute('theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Add transitioning class for GPU optimization
    body.classList.add('theme-transitioning');

    applyTheme(newTheme);

    // Use requestAnimationFrame to defer chart updates and avoid janky transitions
    requestAnimationFrame(() => {
        // Update chart colors only, don't rebuild entire charts
        updateChartColors();

        // Remove transitioning class immediately - instant theme change
        setTimeout(() => {
            body.classList.remove('theme-transitioning');
        }, 50); // Minimal delay for DOM update
    });
}

// Optimized function to update only chart colors, not rebuild
function updateChartColors() {
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const textColor = isDark ? '#e9ecef' : '#212529';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

    // Update daily chart colors
    if (dailyChartInstance) {
        dailyChartInstance.options.plugins.title.color = textColor;
        dailyChartInstance.options.scales.x.ticks.color = textColor;
        dailyChartInstance.options.scales.y.ticks.color = textColor;
        dailyChartInstance.options.scales.x.grid.color = gridColor;
        dailyChartInstance.options.scales.y.grid.color = gridColor;
        dailyChartInstance.data.datasets[0].borderColor = borderColor;
        dailyChartInstance.update('none'); // 'none' mode = no animation for instant update
    }

    // Update individual chart colors
    if (individualChartInstance) {
        individualChartInstance.options.plugins.legend.labels.color = textColor;
        individualChartInstance.data.datasets[0].borderColor = isDark ? 'rgba(25, 25, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)';
        individualChartInstance.update('none'); // 'none' mode = no animation for instant update
    }
}

// Update current day info text
const updateCurrentDayInfo = () => {
    const infoElement = document.getElementById('current-day-info');
    if (!infoElement) return;

    const now = new Date();
    // Only show if the loaded schedule is for the current month and year
    if (state.selectedYear !== now.getFullYear() || state.selectedMonth !== (now.getMonth() + 1)) {
        infoElement.textContent = '';
        return;
    }

    const currentDay = getInitialWorkDay(); // Get 6-6 adjusted day
    const hour = now.getHours();

    if (hour < 6) {
        infoElement.textContent = `Aktualnie: ${currentDay} - zmiana nocna`;
    } else {
        infoElement.textContent = `Aktualnie: ${currentDay}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Load theme first to prevent flash
    loadTheme();

    // Load group settings BEFORE loading data
    loadGroupColors();
    loadGroupRanges();

    // Apply colors after loading
    applyGroupColors();

    // Load data from localStorage. This will call updateMonthData.
    const hasData = loadFromLocalStorage();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (!hasData) {
        // No data found, default to current month/year
        updateMonthData(currentMonth, currentYear);
    }

    // Set the initial selected day
    // If loaded month is current month, use work day. Otherwise, default to 1.
    if (state.selectedYear === currentYear && state.selectedMonth === currentMonth) {
        state.selectedDay = getInitialWorkDay();
    } else {
        state.selectedDay = 1; // Default to 1st day if not current month
    }

    // Clamp day just in case (e.g., 31st on a 30-day month)
    if (state.selectedDay > state.daysInMonth) {
        state.selectedDay = state.daysInMonth;
    }

    document.getElementById('day-selector').value = state.selectedDay;
    document.getElementById('day-value').textContent = state.selectedDay;
    document.getElementById('day-selector').max = state.daysInMonth; // Ensure max is set

    // Set initial current day info
    updateCurrentDayInfo();

    // Auto-update work day every minute (to catch 6:00 AM change)
    setInterval(() => {
        const now = new Date();
        // Only run if we are viewing the current month
        if (state.selectedYear !== now.getFullYear() || state.selectedMonth !== (now.getMonth() + 1)) {
            updateCurrentDayInfo(); // This will clear the info text
            return;
        }

        const newWorkDay = getInitialWorkDay();
        updateCurrentDayInfo();

        if (newWorkDay !== state.selectedDay && newWorkDay <= state.daysInMonth) {
            state.selectedDay = newWorkDay;
            document.getElementById('day-selector').value = state.selectedDay;
            document.getElementById('day-value').textContent = state.selectedDay;
            renderDayMarkers();
            renderDailySummary();
        }
    }, 60000); // Check every minute


    if (hasData) {
        const statusElement = document.getElementById('import-status');
        statusElement.textContent = `✓ Przywrócono ${scheduleData.length} pracowników`;
        statusElement.className = 'import-status success';
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'import-status';
        }, 3000);
    }

    // Initialize event delegations (ONCE)
    initializeTableEventDelegation();
    initializeDayMarkersEventDelegation();
    initializeTableHover();

    // Initial renders
    renderFullTable();
    renderDayMarkers();
    renderDailySummary();

    document.getElementById('day-selector').addEventListener('input', (e) => {
        state.selectedDay = parseInt(e.target.value, 10);
        document.getElementById('day-value').textContent = state.selectedDay;
        renderDayMarkers();
        renderDailySummary();
    });

    // Debounced search for performance
    const debouncedSearch = debounce((value) => {
        renderFullTable(value);
    }, 150);

    document.getElementById('search-box').addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    document.getElementById('back-to-full-schedule').addEventListener('click', showFullSchedule);
    document.getElementById('csv-import').addEventListener('change', handleCSVImport);
    document.getElementById('clear-data').addEventListener('click', handleClearData);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('compare-btn').addEventListener('click', showCompareView);
    document.getElementById('back-from-compare').addEventListener('click', showFullSchedule);
    document.getElementById('reset-selection-btn').addEventListener('click', handleResetSelection);
});

// Clear data handler
function handleClearData() {
    if (scheduleData.length === 0) {
        return;
    }

    // Use a custom modal/confirm if possible, but window.confirm is a fallback
    if (confirm('Czy na pewno chcesz usunąć wszystkie zapisane dane?\n\nTej operacji nie można cofnąć.')) {
        clearLocalStorage();

        // Reset to current month
        const now = new Date();
        updateMonthData(now.getMonth() + 1, now.getFullYear());
        state.selectedDay = getInitialWorkDay();
        document.getElementById('day-selector').value = state.selectedDay;
        document.getElementById('day-value').textContent = state.selectedDay;

        renderFullTable();
        renderDayMarkers();
        renderDailySummary();

        const statusElement = document.getElementById('import-status');
        statusElement.textContent = '✓ Dane zostały usunięte';
        statusElement.className = 'import-status success';

        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'import-status';
        }, 3000);
    }
}

// Reset selection handler
function handleResetSelection() {
    // Clear selected employees set
    state.selectedEmployees.clear();

    // Uncheck all checkboxes
    const allCheckboxes = document.querySelectorAll('.employee-checkbox');
    allCheckboxes.forEach(cb => cb.checked = false);

    // Uncheck select-all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }

    // Update compare button state
    updateCompareButton();
}

// Detect month from filename
function detectMonthFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();

    // Polish month names
    const polishMonths = {
        'styczen': 1, 'stycznia': 1,
        'luty': 2, 'lutego': 2,
        'marzec': 3, 'marca': 3,
        'kwiecien': 4, 'kwietnia': 4,
        'maj': 5, 'maja': 5,
        'czerwiec': 6, 'czerwca': 6,
        'lipiec': 7, 'lipca': 7,
        'sierpien': 8, 'sierpnia': 8,
        'wrzesien': 9, 'września': 9, 'wrzesnia': 9,
        'pazdziernik': 10, 'października': 10, 'pazdziernika': 10,
        'listopad': 11, 'listopada': 11,
        'grudzien': 12, 'grudnia': 12, 'grudzienia': 12
    };

    // Check for Polish month names
    for (const [monthName, monthNum] of Object.entries(polishMonths)) {
        if (lowerFilename.includes(monthName)) {
            return monthNum;
        }
    }

    // Check for numeric patterns (01, 02, ..., 12 or 1, 2, ..., 12)
    // Try to find month number, e.g., _09_ or .10.
    const numericMatch = lowerFilename.match(/[-_.](\d{1,2})[-_.]/);
    if (numericMatch) {
        const num = parseInt(numericMatch[1], 10);
        if (num >= 1 && num <= 12) {
            return num;
        }
    }

    // Check for pattern like "2025-10" or "2025_10"
    const dateMatch = lowerFilename.match(/202\d[-_](\d{1,2})/);
    if (dateMatch) {
        const num = parseInt(dateMatch[1], 10);
        if (num >= 1 && num <= 12) {
            return num;
        }
    }

    return null; // Month not detected
}

// CSV Import functionality
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusElement = document.getElementById('import-status');
    statusElement.textContent = 'Wczytuję...';
    statusElement.className = 'import-status loading';

    // Detect month and assume current year (or 2025 as fallback)
    const detectedMonth = detectMonthFromFilename(file.name) || (new Date().getMonth() + 1);
    // TODO: Detect year from filename if possible, e.g. 2024, 2025
    const detectedYear = (file.name.match(/202\d/)) ? parseInt(file.name.match(/202\d/)[0], 10) : new Date().getFullYear();

    // Update state with new month/year *before* parsing
    updateMonthData(detectedMonth, detectedYear);

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const csvText = e.target.result;
            // Pass the detected daysInMonth to the parser
            const newData = parseCSV(csvText, state.daysInMonth);

            if (newData.length === 0) {
                throw new Error('Brak danych w pliku CSV');
            }

            scheduleData = newData;
            saveToLocalStorage();

            // Set day based on new month
            const now = new Date();
            if (state.selectedYear === now.getFullYear() && state.selectedMonth === (now.getMonth() + 1)) {
                state.selectedDay = getInitialWorkDay();
            } else {
                state.selectedDay = 1; // Default to 1st
            }
            document.getElementById('day-selector').value = state.selectedDay;
            document.getElementById('day-value').textContent = state.selectedDay;


            // Re-render everything with new data and new month
            renderFullTable();
            renderDayMarkers();
            renderDailySummary();
            updateCurrentDayInfo(); // Update info text

            statusElement.textContent = `✓ Załadowano ${newData.length} pracowników`;
            statusElement.className = 'import-status success';

            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'import-status';
            }, 3000);
        } catch (error) {
            console.error('Błąd parsowania CSV:', error);
            statusElement.textContent = '✗ Błąd: ' + error.message;
            statusElement.className = 'import-status error';

            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'import-status';
            }, 5000);
        }
    };

    reader.onerror = function () {
        statusElement.textContent = '✗ Błąd wczytywania pliku';
        statusElement.className = 'import-status error';
    };

    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
}

function parseCSV(csvText, daysInMonth) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 3) {
        throw new Error('Nieprawidłowy format pliku CSV');
    }

    const employees = [];

    // Pomijamy pierwsze 2 wiersze (nagłówki z dniami i dniami tygodnia)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        const cells = line.split(';');

        if (cells.length < 2) continue;

        const name = cells[0].trim();
        if (!name) continue;

        // Create a 31-element array, but only fill up to daysInMonth
        const schedule = [];
        for (let day = 1; day <= 31; day++) {
            if (day <= daysInMonth) {
                const value = cells[day] ? cells[day].trim() : '';
                schedule.push(value);
            } else {
                schedule.push(''); // Pad with empty strings
            }
        }

        employees.push({
            name: name,
            schedule: schedule // schedule is always 31 elements long
        });
    }

    return employees;
}

// Optimized column hover - minimal JavaScript
let activeColumnLine = null;

function initColumnHover() {
    // Create single line element for reuse
    const line = document.createElement('div');
    line.className = 'column-hover-line-element';
    line.style.cssText = 'position: absolute; width: 1px; background: rgba(var(--hover-bg), 0.6); pointer-events: none; z-index: 1; opacity: 0; overflow: hidden;';
    document.body.appendChild(line);
    activeColumnLine = line;

    // Single event listener with delegation
    document.addEventListener('mouseover', handleColumnHover);
    document.addEventListener('mouseout', hideColumnLine);
}

function handleColumnHover(e) {
    const target = e.target;

    if (target.classList.contains('td-shift') ||
        target.classList.contains('compare-td-shift') ||
        target.classList.contains('th-day')) {

        const rect = target.getBoundingClientRect();
        const table = target.closest('.table-container, .compare-table-container');
        if (!table) return;

        const tableRect = table.getBoundingClientRect();

        if (activeColumnLine) {
            activeColumnLine.style.left = rect.right + 'px';
            activeColumnLine.style.top = tableRect.top + 'px';
            activeColumnLine.style.height = tableRect.height + 'px';
            activeColumnLine.style.opacity = '1';
        }

        // Add hover class only to current cell for background
        target.classList.add('column-hover');
    }
}

function hideColumnLine(e) {
    const target = e.target;

    if (target.classList.contains('td-shift') ||
        target.classList.contains('compare-td-shift') ||
        target.classList.contains('th-day')) {

        if (activeColumnLine) {
            activeColumnLine.style.opacity = '0';
        }
        target.classList.remove('column-hover');
    }
}

// Initialize additional features on page load
document.addEventListener('DOMContentLoaded', () => {
    initColumnHover();
    initColorSettings(); // Initialize color settings modal
});

// Color Settings Modal Functions
function initColorSettings() {
    const modal = document.getElementById('color-settings-modal');
    const openBtn = document.getElementById('color-settings-btn');
    const closeBtn = document.getElementById('close-color-modal');
    const saveBtn = document.getElementById('save-colors-btn');
    const resetBtn = document.getElementById('reset-colors-btn');
    const tabs = document.querySelectorAll('.modal-tab');
    const tabContents = document.querySelectorAll('.modal-tab-content');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            tabContents.forEach(content => {
                if (content.dataset.content === tabName) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Open modal
    openBtn?.addEventListener('click', () => {
        modal?.classList.remove('hidden');
        populateColorInputs();
        populateRangeInputs();
        attachRangeAutoSave(); // Attach auto-save to range inputs
    });

    // Close modal
    closeBtn?.addEventListener('click', () => {
        modal?.classList.add('hidden');
    });

    // Close on overlay click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Save colors and ranges
    saveBtn?.addEventListener('click', () => {
        saveColorSettings();
        saveRangeSettings();
        modal?.classList.add('hidden');
    });

    // Reset to defaults
    resetBtn?.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz przywrócić domyślne ustawienia?')) {
            groupColors = JSON.parse(JSON.stringify(defaultGroupColors));
            groupRanges = JSON.parse(JSON.stringify(defaultGroupRanges));
            saveGroupColors();
            saveGroupRanges();
            applyGroupColors();
            populateColorInputs();
            populateRangeInputs();
            renderFullTable();
        }
    });
}

function populateColorInputs() {
    Object.keys(groupColors).forEach(group => {
        const colors = groupColors[group];
        const lightInput = document.getElementById(`color-${group}-light`);
        const darkInput = document.getElementById(`color-${group}-dark`);

        if (lightInput) lightInput.value = colors.light;
        if (darkInput) darkInput.value = colors.dark;
    });
}

function saveColorSettings() {
    // Read values from color pickers
    const colorPickers = document.querySelectorAll('.color-picker');
    colorPickers.forEach(picker => {
        const group = picker.dataset.group;
        const type = picker.dataset.type;
        if (group && type && groupColors[group]) {
            groupColors[group][type] = picker.value;
        }
    });

    // Save to localStorage and apply
    saveGroupColors();
    applyGroupColors();

    // Re-render table to show new colors
    renderFullTable();

    console.log('Kolory grup zaktualizowane');
}

function populateRangeInputs() {
    // D, S, L, K - fixed ranges
    ['D', 'S', 'L', 'K'].forEach(group => {
        const range = groupRanges[group];
        if (range && range.from && range.to) {
            const fromInput = document.getElementById(`range-${group}-from`);
            const toInput = document.getElementById(`range-${group}-to`);
            if (fromInput) fromInput.value = range.from;
            if (toInput) toInput.value = range.to;
        }
    });

    // M, Y - dynamic counts
    const mRange = groupRanges['M'];
    if (mRange && mRange.count) {
        const mInput = document.getElementById('range-M-count');
        if (mInput) mInput.value = mRange.count;
    }

    const yRange = groupRanges['Y'];
    if (yRange && yRange.count) {
        const yInput = document.getElementById('range-Y-count');
        if (yInput) yInput.value = yRange.count;
    }
}

function saveRangeSettings() {
    // D, S, L, K - fixed ranges
    ['D', 'S', 'L', 'K'].forEach(group => {
        const fromInput = document.getElementById(`range-${group}-from`);
        const toInput = document.getElementById(`range-${group}-to`);

        if (fromInput && toInput) {
            const from = parseInt(fromInput.value, 10);
            const to = parseInt(toInput.value, 10);

            if (from > 0 && to >= from) {
                groupRanges[group].from = from;
                groupRanges[group].to = to;
            }
        }
    });

    // M - dynamic count
    const mInput = document.getElementById('range-M-count');
    if (mInput) {
        const count = parseInt(mInput.value, 10);
        if (count > 0) {
            groupRanges['M'].count = count;
        }
    }

    // Y - dynamic count
    const yInput = document.getElementById('range-Y-count');
    if (yInput) {
        const count = parseInt(yInput.value, 10);
        if (count > 0) {
            groupRanges['Y'].count = count;
        }
    }

    // Save to localStorage and re-render
    saveGroupRanges();
    renderFullTable();

    console.log('Zakresy grup zaktualizowane');
}

// Attach auto-save to range inputs
function attachRangeAutoSave() {
    // Get all range inputs
    const rangeInputs = document.querySelectorAll('.range-input');

    // Create debounced save function
    const debouncedSave = debounce(() => {
        saveRangeSettings();

        // Show feedback
        showRangeSaveFeedback();
    }, 500);

    // Attach change listeners
    rangeInputs.forEach(input => {
        // Remove old listeners if any
        input.removeEventListener('input', debouncedSave);
        input.removeEventListener('change', debouncedSave);

        // Add new listeners
        input.addEventListener('input', debouncedSave);
        input.addEventListener('change', debouncedSave);
    });
}

// Show feedback when ranges are saved
function showRangeSaveFeedback() {
    const footer = document.querySelector('.modal-footer');
    if (!footer) return;

    // Create or get feedback element
    let feedback = document.getElementById('range-save-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'range-save-feedback';
        feedback.className = 'range-save-feedback';
        footer.insertBefore(feedback, footer.firstChild);
    }

    // Show saving state
    feedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';
    feedback.classList.add('visible');

    // After a short delay, show success
    setTimeout(() => {
        feedback.innerHTML = '<i class="fas fa-check-circle"></i> Zapisano!';

        // Hide after 2 seconds
        setTimeout(() => {
            feedback.classList.remove('visible');
        }, 2000);
    }, 300);
}

