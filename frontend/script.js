// frontend/script.js
// Frontend integration for Mutual Fund Transaction Dashboard

// Base URL for backend FastAPI server
const API_BASE_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Initialise UI tab event listeners
    setupTabs();

    // Query backend and populate tables on initial load
    loadDashboardData();

    // Bind Refresh button to reload table data based on input dates
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadDashboardData();
    });
});

/**
 * Attaches click event listeners to tabs to switch between report tables
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes from all buttons and panels
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Set clicked tab as active
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

/**
 * Triggers parallel fetch calls for all four report endpoints and manages UI states
 */
async function loadDashboardData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    const refreshBtn = document.getElementById('refreshBtn');
    const btnText = refreshBtn.querySelector('.btn-text');
    const btnLoader = refreshBtn.querySelector('.btn-loader');

    // 1. Enter button loading state
    btnText.textContent = "Loading...";
    btnLoader.classList.remove('hidden');
    refreshBtn.disabled = true;

    // Reset overview metric values to loading indicator
    document.getElementById('metricTotalAmount').textContent = "---";
    document.getElementById('metricTotalUnits').textContent = "---";
    document.getElementById('metricTotalInvestors').textContent = "---";
    document.getElementById('metricTotalFunds').textContent = "---";

    // 2. Set spinners in table bodies
    showTableLoaders();

    try {
        // Fetch all data in parallel
        const [overview, investorPurchases, fundPurchases, investors, funds] = await Promise.all([
            fetchData(`/overview?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/investor-purchases?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/fund-purchases?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/investors?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/funds?start_date=${startDate}&end_date=${endDate}`)
        ]);

        // Populate HTML overview cards and tables
        populateOverview(overview);
        populateInvestorPurchases(investorPurchases);
        populateFundPurchases(fundPurchases);
        populateInvestors(investors);
        populateFunds(funds);

    } catch (error) {
        console.error("Dashboard refresh failed:", error);
        showTableErrors("Failed to load dashboard data. Make sure the Python FastAPI backend server is running on http://127.0.0.1:8000");
        document.getElementById('metricTotalAmount').textContent = "Error";
        document.getElementById('metricTotalUnits').textContent = "Error";
        document.getElementById('metricTotalInvestors').textContent = "Error";
        document.getElementById('metricTotalFunds').textContent = "Error";
    } finally {
        // 3. Clear button loading state
        btnText.textContent = "Refresh Data";
        btnLoader.classList.add('hidden');
        refreshBtn.disabled = false;
    }
}

/**
 * Fetch wrapper supporting JSON and error parsing
 */
async function fetchData(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(`HTTP ${response.status}: ${errDetails}`);
    }
    return await response.json();
}

/**
 * Displays spinning progress wheel inside tables
 */
function showTableLoaders() {
    const tableIds = ['investorPurchasesTable', 'fundPurchasesTable', 'investorsTable', 'fundsTable'];
    tableIds.forEach(id => {
        const tbody = document.querySelector(`#${id} tbody`);
        tbody.innerHTML = `
            <tr>
                <td colspan="100%">
                    <div class="loader-container">
                        <div class="spinner"></div>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Connecting to API server...</p>
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Renders error message rows in place of table data
 */
function showTableErrors(message) {
    const tableIds = ['investorPurchasesTable', 'fundPurchasesTable', 'investorsTable', 'fundsTable'];
    tableIds.forEach(id => {
        const tbody = document.querySelector(`#${id} tbody`);
        tbody.innerHTML = `
            <tr>
                <td colspan="100%">
                    <div class="table-status-message error-badge">
                        ${message}
                    </div>
                </td>
            </tr>
        `;
    });
}

// --------------------------------------------------------
// Formatters for Premium Aesthetics (Indian Rupee / Standard units)
// --------------------------------------------------------
const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const unitsFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
});

const navFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
});

function formatAmount(val) {
    return currencyFormatter.format(val);
}

function formatUnits(val) {
    return unitsFormatter.format(val);
}

function formatNav(val) {
    return navFormatter.format(val);
}

// --------------------------------------------------------
// DOM Population Functions
// --------------------------------------------------------

function populateInvestorPurchases(data) {
    const tbody = document.querySelector('#investorPurchasesTable tbody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-status-message">No purchases found for the selected date range.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(row => `
        <tr>
            <td><strong>${row.inv_name}</strong></td>
            <td><code>${row.pan}</code></td>
            <td>${row.scheme}</td>
            <td class="number-col" style="color: var(--success); font-weight: 500;">${formatAmount(row.total_amount)}</td>
            <td class="number-col">${formatUnits(row.total_units)}</td>
        </tr>
    `).join('');
}

function populateFundPurchases(data) {
    const tbody = document.querySelector('#fundPurchasesTable tbody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-status-message">No records found for the selected date range.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(row => `
        <tr>
            <td><strong>${row.scheme}</strong></td>
            <td>${row.inv_name}</td>
            <td><code>${row.pan}</code></td>
            <td class="number-col" style="color: var(--success); font-weight: 500;">${formatAmount(row.total_amount)}</td>
            <td class="number-col">${formatUnits(row.total_units)}</td>
        </tr>
    `).join('');
}

function populateInvestors(data) {
    const tbody = document.querySelector('#investorsTable tbody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-status-message">No investors found for this range.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map((row, index) => `
        <tr>
            <td><span class="info-badge" style="background-color: var(--border-color); color: var(--text-primary); font-weight: 700;">#${index + 1}</span></td>
            <td><strong>${row.inv_name}</strong></td>
            <td><code>${row.pan}</code></td>
            <td class="number-col" style="color: var(--success); font-weight: 600;">${formatAmount(row.total_amount)}</td>
        </tr>
    `).join('');
}

function populateFunds(data) {
    const tbody = document.querySelector('#fundsTable tbody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-status-message">No mutual fund summary data found.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(row => `
        <tr>
            <td><strong>${row.scheme}</strong></td>
            <td class="number-col" style="color: var(--success); font-weight: 500;">${formatAmount(row.total_amount)}</td>
            <td class="number-col">${formatUnits(row.total_units)}</td>
            <td class="number-col" style="font-weight: 600; color: var(--text-primary);">${formatNav(row.avg_nav)}</td>
        </tr>
    `).join('');
}

// --------------------------------------------------------
// Overview Summary Metric Population
// --------------------------------------------------------
function populateOverview(data) {
    if (!data) return;
    document.getElementById('metricTotalAmount').textContent = formatAmount(data.total_invested || 0);
    document.getElementById('metricTotalUnits').textContent = formatUnits(data.total_units || 0);
    document.getElementById('metricTotalInvestors').textContent = (data.total_investors || 0).toLocaleString('en-IN');
    document.getElementById('metricTotalFunds').textContent = (data.total_funds || 0).toLocaleString('en-IN');
}
