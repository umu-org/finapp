class SalesManagementApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'login';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/me');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            this.showLogin();
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                this.showDashboard();
                errorDiv.style.display = 'none';
            } else {
                errorDiv.textContent = data.error;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.currentUser = null;
            this.showLogin();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    showLogin() {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('dashboard-container').style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    showDashboard() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'block';
        
        // Update user info
        document.getElementById('user-name').textContent = this.currentUser.full_name;
        document.getElementById('user-role').textContent = this.currentUser.role.replace('_', ' ').toUpperCase();
        
        // Setup navigation based on role
        this.setupNavigation();
        
        // Load default view
        this.loadDefaultView();
    }

    setupNavigation() {
        const navMenu = document.getElementById('nav-menu');
        navMenu.innerHTML = '';

        const menuItems = this.getMenuItemsByRole(this.currentUser.role);
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = item.label;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadView(item.view);
                this.setActiveNavItem(a);
            });
            li.appendChild(a);
            navMenu.appendChild(li);
        });

        // Set first item as active
        if (navMenu.firstChild) {
            navMenu.firstChild.firstChild.classList.add('active');
        }
    }

    getMenuItemsByRole(role) {
        const menus = {
            sales_person: [
                { label: 'Dashboard', view: 'sales-dashboard' },
                { label: 'New Sale', view: 'new-sale' },
                { label: 'My Sales', view: 'my-sales' },
                { label: 'Apply for Loan', view: 'apply-loan' },
                { label: 'My Loans', view: 'my-loans' }
            ],
            sub_manager: [
                { label: 'Dashboard', view: 'manager-dashboard' },
                { label: 'Pending Sales', view: 'pending-sales' },
                { label: 'Pending Loans', view: 'pending-loans' },
                { label: 'Team Performance', view: 'team-performance' },
                { label: 'Reports', view: 'manager-reports' }
            ],
            top_manager: [
                { label: 'Dashboard', view: 'top-dashboard' },
                { label: 'User Management', view: 'user-management' },
                { label: 'Product Management', view: 'product-management' },
                { label: 'Financial Overview', view: 'financial-overview' },
                { label: 'System Settings', view: 'system-settings' },
                { label: 'Reports', view: 'top-reports' }
            ]
        };

        return menus[role] || [];
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.navigation a').forEach(a => {
            a.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    loadDefaultView() {
        const defaultViews = {
            sales_person: 'sales-dashboard',
            sub_manager: 'manager-dashboard',
            top_manager: 'top-dashboard'
        };

        this.loadView(defaultViews[this.currentUser.role]);
    }

    async loadView(viewName) {
        const contentArea = document.getElementById('content-area');
        
        try {
            switch (viewName) {
                case 'sales-dashboard':
                    contentArea.innerHTML = this.getSalesDashboardHTML();
                    this.loadSalesDashboard();
                    break;
                case 'new-sale':
                    contentArea.innerHTML = this.getNewSaleHTML();
                    this.setupNewSaleForm();
                    break;
                case 'my-sales':
                    contentArea.innerHTML = this.getMySalesHTML();
                    this.loadMySales();
                    break;
                case 'apply-loan':
                    contentArea.innerHTML = this.getApplyLoanHTML();
                    this.setupLoanForm();
                    break;
                case 'my-loans':
                    contentArea.innerHTML = this.getMyLoansHTML();
                    this.loadMyLoans();
                    break;
                case 'manager-dashboard':
                    contentArea.innerHTML = this.getManagerDashboardHTML();
                    this.loadManagerDashboard();
                    break;
                case 'pending-sales':
                    contentArea.innerHTML = this.getPendingSalesHTML();
                    this.loadPendingSales();
                    break;
                case 'pending-loans':
                    contentArea.innerHTML = this.getPendingLoansHTML();
                    this.loadPendingLoans();
                    break;
                case 'top-dashboard':
                    contentArea.innerHTML = this.getTopDashboardHTML();
                    this.loadTopDashboard();
                    break;
                case 'user-management':
                    contentArea.innerHTML = this.getUserManagementHTML();
                    this.loadUsers();
                    break;
                case 'product-management':
                    contentArea.innerHTML = this.getProductManagementHTML();
                    this.loadProducts();
                    break;
                default:
                    contentArea.innerHTML = '<h2>View not implemented yet</h2>';
            }
        } catch (error) {
            console.error('Error loading view:', error);
            contentArea.innerHTML = '<h2>Error loading content</h2>';
        }
    }

    getSalesDashboardHTML() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="total-sales">0</div>
                    <div class="stat-label">Total Sales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="pending-sales">0</div>
                    <div class="stat-label">Pending Sales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="total-commission">$0</div>
                    <div class="stat-label">Total Commission</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="active-loans">0</div>
                    <div class="stat-label">Active Loans</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Sales</h3>
                </div>
                <div class="card-body">
                    <div id="recent-sales">Loading...</div>
                </div>
            </div>
        `;
    }

    getNewSaleHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Record New Sale</h3>
                </div>
                <div class="card-body">
                    <form id="new-sale-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="product-select">Product:</label>
                                <select id="product-select" name="product_id" required>
                                    <option value="">Select a product</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="quantity">Quantity:</label>
                                <input type="number" id="quantity" name="quantity" min="1" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="unit-price">Unit Price:</label>
                                <input type="number" id="unit-price" name="unit_price" step="0.01" readonly>
                            </div>
                            <div class="form-group">
                                <label for="total-amount">Total Amount:</label>
                                <input type="number" id="total-amount" name="total_amount" step="0.01" readonly>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="commission-amount">Commission:</label>
                                <input type="number" id="commission-amount" name="commission_amount" step="0.01" readonly>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">Submit Sale</button>
                    </form>
                </div>
            </div>
        `;
    }

    getMySalesHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">My Sales</h3>
                </div>
                <div class="card-body">
                    <div id="my-sales-table">Loading...</div>
                </div>
            </div>
        `;
    }

    getApplyLoanHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Apply for Loan</h3>
                </div>
                <div class="card-body">
                    <form id="loan-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="loan-amount">Loan Amount:</label>
                                <input type="number" id="loan-amount" name="amount" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="duration">Duration (months):</label>
                                <select id="duration" name="duration_months" required>
                                    <option value="">Select duration</option>
                                    <option value="6">6 months</option>
                                    <option value="12">12 months</option>
                                    <option value="18">18 months</option>
                                    <option value="24">24 months</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="interest-rate">Interest Rate (%):</label>
                                <input type="number" id="interest-rate" name="interest_rate" step="0.01" readonly>
                            </div>
                            <div class="form-group">
                                <label for="monthly-payment">Monthly Payment:</label>
                                <input type="number" id="monthly-payment" name="monthly_payment" step="0.01" readonly>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">Apply for Loan</button>
                    </form>
                </div>
            </div>
        `;
    }

    getMyLoansHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">My Loans</h3>
                </div>
                <div class="card-body">
                    <div id="my-loans-table">Loading...</div>
                </div>
            </div>
        `;
    }

    getManagerDashboardHTML() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="team-sales">0</div>
                    <div class="stat-label">Team Sales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="pending-approvals">0</div>
                    <div class="stat-label">Pending Approvals</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="team-commission">$0</div>
                    <div class="stat-label">Team Commission</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="team-members">0</div>
                    <div class="stat-label">Team Members</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Team Activity</h3>
                </div>
                <div class="card-body">
                    <div id="team-activity">Loading...</div>
                </div>
            </div>
        `;
    }

    getPendingSalesHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Pending Sales Approvals</h3>
                </div>
                <div class="card-body">
                    <div id="pending-sales-table">Loading...</div>
                </div>
            </div>
        `;
    }

    getPendingLoansHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Pending Loan Approvals</h3>
                </div>
                <div class="card-body">
                    <div id="pending-loans-table">Loading...</div>
                </div>
            </div>
        `;
    }

    getTopDashboardHTML() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="total-revenue">$0</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="total-profit">$0</div>
                    <div class="stat-label">Total Profit</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="active-users">0</div>
                    <div class="stat-label">Active Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="total-products">0</div>
                    <div class="stat-label">Total Products</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Financial Overview</h3>
                </div>
                <div class="card-body">
                    <div id="financial-overview">Loading...</div>
                </div>
            </div>
        `;
    }

    getUserManagementHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">User Management</h3>
                    <button class="btn btn-success" onclick="app.showAddUserForm()">Add New User</button>
                </div>
                <div class="card-body">
                    <div id="users-table">Loading...</div>
                </div>
            </div>
            <div id="add-user-modal" style="display: none;">
                <!-- Add user form will be inserted here -->
            </div>
        `;
    }

    getProductManagementHTML() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Product Management</h3>
                    <button class="btn btn-success" onclick="app.showAddProductForm()">Add New Product</button>
                </div>
                <div class="card-body">
                    <div id="products-table">Loading...</div>
                </div>
            </div>
        `;
    }

    // Setup new sale form
    async setupNewSaleForm() {
        try {
            // Load products
            const response = await fetch('/api/products');
            const data = await response.json();
            
            const productSelect = document.getElementById('product-select');
            productSelect.innerHTML = '<option value="">Select a product</option>';
            
            data.products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - $${product.selling_price} (Stock: ${product.stock_quantity})`;
                option.dataset.price = product.selling_price;
                option.dataset.commission = product.commission_rate;
                productSelect.appendChild(option);
            });

            // Setup form event listeners
            productSelect.addEventListener('change', this.updateSaleCalculations.bind(this));
            document.getElementById('quantity').addEventListener('input', this.updateSaleCalculations.bind(this));
            
            document.getElementById('new-sale-form').addEventListener('submit', this.handleNewSale.bind(this));
        } catch (error) {
            console.error('Error setting up new sale form:', error);
        }
    }

    updateSaleCalculations() {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('quantity');
        const unitPriceInput = document.getElementById('unit-price');
        const totalAmountInput = document.getElementById('total-amount');
        const commissionAmountInput = document.getElementById('commission-amount');

        const selectedOption = productSelect.selectedOptions[0];
        const quantity = parseInt(quantityInput.value) || 0;

        if (selectedOption && selectedOption.value) {
            const unitPrice = parseFloat(selectedOption.dataset.price);
            const commissionRate = parseFloat(selectedOption.dataset.commission);
            const totalAmount = quantity * unitPrice;
            const commissionAmount = totalAmount * (commissionRate / 100);

            unitPriceInput.value = unitPrice.toFixed(2);
            totalAmountInput.value = totalAmount.toFixed(2);
            commissionAmountInput.value = commissionAmount.toFixed(2);
        } else {
            unitPriceInput.value = '';
            totalAmountInput.value = '';
            commissionAmountInput.value = '';
        }
    }

    async handleNewSale(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const saleData = {
            product_id: parseInt(formData.get('product_id')),
            quantity: parseInt(formData.get('quantity')),
            unit_price: parseFloat(formData.get('unit_price'))
        };

        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(saleData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Sale submitted successfully! Waiting for approval.');
                e.target.reset();
                this.updateSaleCalculations();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error submitting sale: ' + error.message);
        }
    }

    async loadMySales() {
        try {
            const response = await fetch('/api/my-sales');
            const data = await response.json();
            
            const tableContainer = document.getElementById('my-sales-table');
            
            if (data.sales.length === 0) {
                tableContainer.innerHTML = '<p>No sales found.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total Amount</th>
                            <th>Commission</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.sales.forEach(sale => {
                const date = new Date(sale.created_at).toLocaleDateString();
                const statusClass = `status-${sale.status}`;
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${sale.product_name}</td>
                        <td>${sale.quantity}</td>
                        <td>$${sale.unit_price}</td>
                        <td>$${sale.total_amount}</td>
                        <td>$${sale.commission_amount}</td>
                        <td><span class="status-badge ${statusClass}">${sale.status}</span></td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading sales:', error);
            document.getElementById('my-sales-table').innerHTML = '<p>Error loading sales.</p>';
        }
    }

    async loadSalesDashboard() {
        try {
            // Load sales statistics
            const statsResponse = await fetch('/api/sales-stats');
            const statsData = await statsResponse.json();
            
            document.getElementById('total-sales').textContent = statsData.stats.total_sales;
            document.getElementById('pending-sales').textContent = statsData.stats.pending_sales;
            document.getElementById('total-commission').textContent = '$' + statsData.stats.total_commission.toFixed(2);

            // Load recent sales
            const recentResponse = await fetch('/api/recent-sales');
            const recentData = await recentResponse.json();
            
            const recentSalesContainer = document.getElementById('recent-sales');
            
            if (recentData.sales.length === 0) {
                recentSalesContainer.innerHTML = '<p>No recent sales.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            recentData.sales.forEach(sale => {
                const date = new Date(sale.created_at).toLocaleDateString();
                const statusClass = `status-${sale.status}`;
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${sale.product_name}</td>
                        <td>$${sale.total_amount}</td>
                        <td><span class="status-badge ${statusClass}">${sale.status}</span></td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            recentSalesContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async setupLoanForm() {
        try {
            // Load default interest rate
            const response = await fetch('/api/default-interest-rate');
            const data = await response.json();
            
            document.getElementById('interest-rate').value = data.rate.toFixed(2);
            
            // Setup form event listeners
            document.getElementById('loan-amount').addEventListener('input', this.updateLoanCalculations.bind(this));
            document.getElementById('duration').addEventListener('change', this.updateLoanCalculations.bind(this));
            
            document.getElementById('loan-form').addEventListener('submit', this.handleLoanApplication.bind(this));
        } catch (error) {
            console.error('Error setting up loan form:', error);
        }
    }

    updateLoanCalculations() {
        const amountInput = document.getElementById('loan-amount');
        const durationSelect = document.getElementById('duration');
        const interestRateInput = document.getElementById('interest-rate');
        const monthlyPaymentInput = document.getElementById('monthly-payment');

        const amount = parseFloat(amountInput.value) || 0;
        const duration = parseInt(durationSelect.value) || 0;
        const interestRate = parseFloat(interestRateInput.value) || 0;

        if (amount > 0 && duration > 0 && interestRate > 0) {
            const monthlyRate = interestRate / 100 / 12;
            const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / 
                                  (Math.pow(1 + monthlyRate, duration) - 1);
            
            monthlyPaymentInput.value = monthlyPayment.toFixed(2);
        } else {
            monthlyPaymentInput.value = '';
        }
    }

    async handleLoanApplication(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loanData = {
            amount: parseFloat(formData.get('amount')),
            duration_months: parseInt(formData.get('duration_months'))
        };

        try {
            const response = await fetch('/api/loans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loanData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Loan application submitted successfully! Waiting for approval.');
                e.target.reset();
                this.updateLoanCalculations();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error submitting loan application: ' + error.message);
        }
    }

    async loadMyLoans() {
        try {
            const response = await fetch('/api/my-loans');
            const data = await response.json();
            
            const tableContainer = document.getElementById('my-loans-table');
            
            if (data.loans.length === 0) {
                tableContainer.innerHTML = '<p>No loans found.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date Applied</th>
                            <th>Amount</th>
                            <th>Duration</th>
                            <th>Interest Rate</th>
                            <th>Monthly Payment</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.loans.forEach(loan => {
                const date = new Date(loan.created_at).toLocaleDateString();
                const statusClass = `status-${loan.status}`;
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>$${loan.amount}</td>
                        <td>${loan.duration_months} months</td>
                        <td>${loan.interest_rate}%</td>
                        <td>$${loan.monthly_payment}</td>
                        <td><span class="status-badge ${statusClass}">${loan.status}</span></td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading loans:', error);
            document.getElementById('my-loans-table').innerHTML = '<p>Error loading loans.</p>';
        }
    }

    async loadPendingLoans() {
        try {
            const response = await fetch('/api/pending-loans');
            const data = await response.json();
            
            const tableContainer = document.getElementById('pending-loans-table');
            
            if (data.loans.length === 0) {
                tableContainer.innerHTML = '<p>No pending loans for approval.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Borrower</th>
                            <th>Amount</th>
                            <th>Duration</th>
                            <th>Monthly Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.loans.forEach(loan => {
                const date = new Date(loan.created_at).toLocaleDateString();
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${loan.borrower_name}</td>
                        <td>$${loan.amount}</td>
                        <td>${loan.duration_months} months</td>
                        <td>$${loan.monthly_payment}</td>
                        <td>
                            <button class="btn btn-success" onclick="app.approveLoan(${loan.id}, 'approved')">Approve</button>
                            <button class="btn btn-danger" onclick="app.approveLoan(${loan.id}, 'rejected')">Reject</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading pending loans:', error);
            document.getElementById('pending-loans-table').innerHTML = '<p>Error loading pending loans.</p>';
        }
    }

    async approveLoan(loanId, action) {
        try {
            const response = await fetch(`/api/loans/${loanId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Loan ${action} successfully!`);
                this.loadPendingLoans(); // Reload the table
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error processing loan: ' + error.message);
        }
    }

    async loadPendingSales() {
        try {
            const response = await fetch('/api/pending-sales');
            const data = await response.json();
            
            const tableContainer = document.getElementById('pending-sales-table');
            
            if (data.sales.length === 0) {
                tableContainer.innerHTML = '<p>No pending sales for approval.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sales Person</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Total Amount</th>
                            <th>Commission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.sales.forEach(sale => {
                const date = new Date(sale.created_at).toLocaleDateString();
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${sale.sales_person_name}</td>
                        <td>${sale.product_name}</td>
                        <td>${sale.quantity}</td>
                        <td>$${sale.total_amount}</td>
                        <td>$${sale.commission_amount}</td>
                        <td>
                            <button class="btn btn-success" onclick="app.approveSale(${sale.id}, 'approved')">Approve</button>
                            <button class="btn btn-danger" onclick="app.approveSale(${sale.id}, 'rejected')">Reject</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading pending sales:', error);
            document.getElementById('pending-sales-table').innerHTML = '<p>Error loading pending sales.</p>';
        }
    }

    async approveSale(saleId, action) {
        try {
            const response = await fetch(`/api/sales/${saleId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Sale ${action} successfully!`);
                this.loadPendingSales(); // Reload the table
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error processing sale: ' + error.message);
        }
    }

    async loadManagerDashboard() {
        try {
            // Load team statistics
            const teamResponse = await fetch('/api/my-team');
            const teamData = await teamResponse.json();
            
            document.getElementById('team-members').textContent = teamData.salesPersons.length;

            // Load pending sales count
            const pendingResponse = await fetch('/api/pending-sales');
            const pendingData = await pendingResponse.json();
            
            document.getElementById('pending-approvals').textContent = pendingData.sales.length;

            // Load team activity
            const activityContainer = document.getElementById('team-activity');
            
            if (pendingData.sales.length === 0) {
                activityContainer.innerHTML = '<p>No recent team activity.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sales Person</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            pendingData.sales.slice(0, 5).forEach(sale => {
                const date = new Date(sale.created_at).toLocaleDateString();
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${sale.sales_person_name}</td>
                        <td>${sale.product_name}</td>
                        <td>$${sale.total_amount}</td>
                        <td><span class="status-badge status-pending">Pending</span></td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            activityContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading manager dashboard:', error);
        }
    }

    loadPendingLoans() {
        // Implementation will be added in next phase
        console.log('Loading pending loans...');
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users/sales_person');
            const salesData = await response.json();
            
            const subManagerResponse = await fetch('/api/users/sub_manager');
            const subManagerData = await subManagerResponse.json();
            
            const tableContainer = document.getElementById('users-table');
            const allUsers = [...salesData.users, ...subManagerData.users];
            
            if (allUsers.length === 0) {
                tableContainer.innerHTML = '<p>No users found.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            allUsers.forEach(user => {
                tableHTML += `
                    <tr>
                        <td>${user.full_name}</td>
                        <td>${user.username}</td>
                        <td>${user.role.replace('_', ' ')}</td>
                        <td>${user.email || 'N/A'}</td>
                        <td>${user.phone || 'N/A'}</td>
                        <td>
                            <button class="btn btn-warning" onclick="app.editUser(${user.id})">Edit</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('users-table').innerHTML = '<p>Error loading users.</p>';
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products/all');
            const data = await response.json();
            
            const tableContainer = document.getElementById('products-table');
            
            if (data.products.length === 0) {
                tableContainer.innerHTML = '<p>No products found.</p>';
                return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Cost Price</th>
                            <th>Selling Price</th>
                            <th>Stock</th>
                            <th>Commission %</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.products.forEach(product => {
                tableHTML += `
                    <tr>
                        <td>${product.name}</td>
                        <td>$${product.cost_price}</td>
                        <td>$${product.selling_price}</td>
                        <td>${product.stock_quantity}</td>
                        <td>${product.commission_rate}%</td>
                        <td>
                            <button class="btn btn-warning" onclick="app.editProduct(${product.id})">Edit</button>
                            <button class="btn btn-danger" onclick="app.deleteProduct(${product.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('products-table').innerHTML = '<p>Error loading products.</p>';
        }
    }

    async loadTopDashboard() {
        try {
            // Load business overview
            const overviewResponse = await fetch('/api/business-overview');
            const overviewData = await overviewResponse.json();
            
            document.getElementById('total-revenue').textContent = '$' + overviewData.overview.total_revenue.toFixed(2);
            document.getElementById('total-profit').textContent = '$' + overviewData.overview.total_profit.toFixed(2);
            document.getElementById('active-users').textContent = overviewData.overview.total_users;
            document.getElementById('total-products').textContent = overviewData.overview.total_products;

            // Load financial overview
            const fundsResponse = await fetch('/api/financial-funds');
            const fundsData = await fundsResponse.json();
            
            const financialContainer = document.getElementById('financial-overview');
            
            let fundsHTML = `
                <div class="stats-grid">
            `;

            fundsData.funds.forEach(fund => {
                fundsHTML += `
                    <div class="stat-card">
                        <div class="stat-value">$${fund.amount.toFixed(2)}</div>
                        <div class="stat-label">${fund.fund_type.charAt(0).toUpperCase() + fund.fund_type.slice(1)} Fund</div>
                    </div>
                `;
            });

            fundsHTML += '</div>';
            financialContainer.innerHTML = fundsHTML;
        } catch (error) {
            console.error('Error loading top dashboard:', error);
        }
    }

    showAddProductForm() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Add New Product</h3>
                <form id="add-product-form">
                    <div class="form-group">
                        <label for="product-name">Product Name:</label>
                        <input type="text" id="product-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="product-description">Description:</label>
                        <textarea id="product-description" name="description"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="cost-price">Cost Price:</label>
                            <input type="number" id="cost-price" name="cost_price" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="selling-price">Selling Price:</label>
                            <input type="number" id="selling-price" name="selling_price" step="0.01" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="stock-quantity">Stock Quantity:</label>
                            <input type="number" id="stock-quantity" name="stock_quantity" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="commission-rate">Commission Rate (%):</label>
                            <input type="number" id="commission-rate" name="commission_rate" step="0.01" min="0" max="100" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Add Product</button>
                        <button type="button" class="btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('add-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                cost_price: parseFloat(formData.get('cost_price')),
                selling_price: parseFloat(formData.get('selling_price')),
                stock_quantity: parseInt(formData.get('stock_quantity')),
                commission_rate: parseFloat(formData.get('commission_rate'))
            };

            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData),
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Product added successfully!');
                    modal.remove();
                    this.loadProducts();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error adding product: ' + error.message);
            }
        });
    }

    async deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Product deleted successfully!');
                    this.loadProducts();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error deleting product: ' + error.message);
            }
        }
    }
}

// Initialize the application
const app = new SalesManagementApp();

