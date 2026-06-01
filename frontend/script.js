const API_BASE_URL = window.location.hostname === '' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : 'https://wealthify-x6qj.onrender.com/api';

// Global cache for transaction list to power client-side lookup during edits
let currentTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI tab event listeners
    setupTabs();

    // Setup Toast alert container
    setupToastContainer();

    // Setup CRUD modal and actions event handlers
    setupCRUD();

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
 * Creates a toast container in the DOM for displaying floating alert messages
 */
function setupToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

/**
 * Displays a non-blocking floating message to the user
 * @param {string} message Text to display
 * @param {'success' | 'error'} type Type of alert
 */
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '✗'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Force reflow and add class to animate in
    toast.offsetHeight;
    toast.classList.add('show');

    // Automatically remove toast after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

/**
 * Returns the current date and time formatted as 'YYYY-MM-DD HH:MM:SS'
 */
function getCurrentTimestampString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Binds event listeners for modal toggling, submission, and transaction row events
 */
function setupCRUD() {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const transactionsTableBody = document.querySelector('#transactionsTable tbody');

    // Open Modal for Create (Add)
    addTransactionBtn.addEventListener('click', () => {
        editForm.reset();
        document.getElementById('editTrxId').value = '';
        document.getElementById('modalTitle').textContent = 'Add Transaction';
        
        // Prefill date field with current local timestamp
        document.getElementById('editDate').value = getCurrentTimestampString();
        
        editModal.classList.remove('hidden');
    });

    // Close Modal actions
    const hideModal = () => {
        editModal.classList.add('hidden');
    };
    cancelModalBtn.addEventListener('click', hideModal);
    closeModalBtn.addEventListener('click', hideModal);

    // Event delegation on table body to handle edit/delete clicks
    transactionsTableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            const id = parseInt(editBtn.getAttribute('data-id'));
            const transaction = currentTransactions.find(t => t.id === id);
            if (transaction) {
                openEditModal(transaction);
            }
        } else if (deleteBtn) {
            const id = parseInt(deleteBtn.getAttribute('data-id'));
            handleDelete(id);
        }
    });

    // Form submission action (Add / Edit)
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('editTrxId').value;
        const payload = {
            scheme: document.getElementById('editScheme').value.trim(),
            inv_name: document.getElementById('editInvName').value.trim(),
            pan: document.getElementById('editPan').value.trim(),
            traddate: document.getElementById('editDate').value.trim(),
            purprice: parseFloat(document.getElementById('editPurPrice').value),
            units: parseFloat(document.getElementById('editUnits').value),
            amount: parseFloat(document.getElementById('editAmount').value)
        };

        const isEdit = !!id;
        const endpoint = isEdit ? `/transactions/${id}` : '/transactions';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let parsedError = errorText;
                try {
                    const jsonErr = JSON.parse(errorText);
                    parsedError = jsonErr.detail || errorText;
                } catch (_) {}
                throw new Error(parsedError);
            }

            const result = await response.json();
            showToast(result.message || 'Transaction saved successfully!', 'success');
            hideModal();
            loadDashboardData(); // Automatically reload all dashboard details

        } catch (error) {
            console.error("Save transaction error:", error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
}

/**
 * Pre-populates form fields and presents the Edit modal
 * @param {object} trx Transaction details
 */
function openEditModal(trx) {
    document.getElementById('editTrxId').value = trx.id;
    document.getElementById('editDate').value = trx.traddate;
    document.getElementById('editInvName').value = trx.inv_name;
    document.getElementById('editPan').value = trx.pan;
    document.getElementById('editScheme').value = trx.scheme;
    document.getElementById('editPurPrice').value = trx.purprice;
    document.getElementById('editUnits').value = trx.units;
    document.getElementById('editAmount').value = trx.amount;

    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('editModal').classList.remove('hidden');
}

/**
 * Confirms and issues a DELETE request to remove a transaction record
 * @param {number} id Transaction ID
 */
async function handleDelete(id) {
    if (!confirm('Are you sure you want to permanently delete this transaction? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to delete transaction.');
        }

        const result = await response.json();
        showToast(result.message || 'Transaction deleted successfully!', 'success');
        loadDashboardData(); // Automatically refresh data

    } catch (error) {
        console.error("Delete transaction error:", error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

/**
 * Triggers parallel fetch calls for all dashboard data and individual transactions
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
        // Fetch all data in parallel, including individual transaction records
        const [overview, investorPurchases, fundPurchases, investors, funds, transactions] = await Promise.all([
            fetchData(`/overview?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/investor-purchases?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/fund-purchases?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/investors?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/funds?start_date=${startDate}&end_date=${endDate}`),
            fetchData(`/transactions?start_date=${startDate}&end_date=${endDate}`)
        ]);

        // Populate HTML overview cards and tables
        populateOverview(overview);
        populateInvestorPurchases(investorPurchases);
        populateFundPurchases(fundPurchases);
        populateInvestors(investors);
        populateFunds(funds);

        // Store globally and render individual transactions
        currentTransactions = transactions;
        populateTransactions(transactions);

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
    const tableIds = [
        'investorPurchasesTable',
        'fundPurchasesTable',
        'investorsTable',
        'fundsTable',
        'transactionsTable'
    ];
    tableIds.forEach(id => {
        const tbody = document.querySelector(`#${id} tbody`);
        if (tbody) {
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
        }
    });
}

/**
 * Renders error message rows in place of table data
 */
function showTableErrors(message) {
    const tableIds = [
        'investorPurchasesTable',
        'fundPurchasesTable',
        'investorsTable',
        'fundsTable',
        'transactionsTable'
    ];
    tableIds.forEach(id => {
        const tbody = document.querySelector(`#${id} tbody`);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%">
                        <div class="table-status-message error-badge">
                            ${message}
                        </div>
                    </td>
                </tr>
            `;
        }
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
    if (!tbody) return;
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
    if (!tbody) return;
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
    if (!tbody) return;
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
    if (!tbody) return;
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

function populateTransactions(data) {
    const tbody = document.querySelector('#transactionsTable tbody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="table-status-message">No transaction logs found for the selected date range.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(row => `
        <tr>
            <td><code>${row.id}</code></td>
            <td style="white-space: nowrap;">${row.traddate}</td>
            <td><strong>${row.inv_name}</strong></td>
            <td><code>${row.pan}</code></td>
            <td>${row.scheme}</td>
            <td class="number-col">${formatNav(row.purprice)}</td>
            <td class="number-col">${formatUnits(row.units)}</td>
            <td class="number-col" style="color: var(--primary); font-weight: 600;">${formatAmount(row.amount)}</td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="edit-btn" data-id="${row.id}">Edit</button>
                <button class="delete-btn" data-id="${row.id}">Delete</button>
            </td>
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
