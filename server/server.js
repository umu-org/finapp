const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');
const Database = require('./database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize database
const database = new Database();
const db = database.getDatabase();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Serve static files (frontend)
app.use(express.static('public'));

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Sales Management System Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



// Import authentication service
const AuthService = require('./auth');
const authService = new AuthService(db);

// Authentication routes
app.post('/api/register', async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await authService.loginUser(username, password);
        
        if (user) {
            req.session.user = user;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Could not log out' });
        } else {
            res.json({ success: true });
        }
    });
});

app.get('/api/me', authService.requireAuth, async (req, res) => {
    try {
        const user = await authService.getUserById(req.session.user.id);
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get users by role (for top managers)
app.get('/api/users/:role', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const users = await authService.getUsersByRole(req.params.role);
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sales persons under a sub-manager
app.get('/api/my-team', authService.requireAuth, authService.requireRole(['sub_manager']), async (req, res) => {
    try {
        const salesPersons = await authService.getSalesPersonsBySubManager(req.session.user.id);
        res.json({ salesPersons });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Import sales service
const SalesService = require('./sales');
const salesService = new SalesService(db);

// Sales routes
app.get('/api/products', authService.requireAuth, async (req, res) => {
    try {
        const products = await salesService.getAllProducts();
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sales', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const saleData = {
            ...req.body,
            sales_person_id: req.session.user.id
        };
        const sale = await salesService.createSale(saleData);
        res.json({ success: true, sale });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/my-sales', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const sales = await salesService.getSalesBySalesPerson(req.session.user.id);
        res.json({ sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sales-stats', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const stats = await salesService.getSalesStatistics(req.session.user.id);
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/recent-sales', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const sales = await salesService.getRecentSales(req.session.user.id);
        res.json({ sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pending-sales', authService.requireAuth, authService.requireRole(['sub_manager']), async (req, res) => {
    try {
        const sales = await salesService.getPendingSalesForSubManager(req.session.user.id);
        res.json({ sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sales/:id/approve', authService.requireAuth, authService.requireRole(['sub_manager']), async (req, res) => {
    try {
        const { action } = req.body; // 'approved' or 'rejected'
        const result = await salesService.approveSale(req.params.id, req.session.user.id, action);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Import additional services
const ProductService = require('./products');
const FinancialService = require('./financial');
const productService = new ProductService(db);
const financialService = new FinancialService(db);

// Product management routes (Top Manager only)
app.get('/api/products/all', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);
        res.json({ success: true, product });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/products/:id', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const result = await productService.updateProduct(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/products/:id', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/product-stats', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const stats = await productService.getProductStatistics();
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Financial management routes (Top Manager only)
app.get('/api/financial-funds', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const funds = await financialService.getFinancialFunds();
        res.json({ funds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/financial-funds/:type', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await financialService.updateFinancialFund(req.params.type, amount);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/system-settings', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const settings = await financialService.getSystemSettings();
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/system-settings/:key', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const { value } = req.body;
        const result = await financialService.updateSystemSetting(req.params.key, value);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/business-overview', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const overview = await financialService.getBusinessOverview();
        res.json({ overview });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sales-performance', authService.requireAuth, authService.requireRole(['top_manager']), async (req, res) => {
    try {
        const performance = await financialService.getSalesPerformance();
        res.json({ performance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Import loan service
const LoanService = require('./loans');
const loanService = new LoanService(db);

// Loan routes
app.post('/api/loans', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const loanData = {
            ...req.body,
            borrower_id: req.session.user.id
        };
        const loan = await loanService.applyForLoan(loanData);
        res.json({ success: true, loan });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/my-loans', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const loans = await loanService.getLoansByBorrower(req.session.user.id);
        res.json({ loans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/loan-stats', authService.requireAuth, authService.requireRole(['sales_person']), async (req, res) => {
    try {
        const stats = await loanService.getLoanStatistics(req.session.user.id);
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pending-loans', authService.requireAuth, authService.requireRole(['sub_manager']), async (req, res) => {
    try {
        const loans = await loanService.getPendingLoansForSubManager(req.session.user.id);
        res.json({ loans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/loans/:id/approve', authService.requireAuth, authService.requireRole(['sub_manager']), async (req, res) => {
    try {
        const { action } = req.body; // 'approved' or 'rejected'
        const result = await loanService.approveLoan(req.params.id, req.session.user.id, action);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/loans/:id/payment', authService.requireAuth, authService.requireRole(['sales_person', 'sub_manager', 'top_manager']), async (req, res) => {
    try {
        const { payment_amount, commission_deducted } = req.body;
        const result = await loanService.makeLoanPayment(req.params.id, payment_amount, commission_deducted || 0);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/default-interest-rate', authService.requireAuth, async (req, res) => {
    try {
        const rate = await loanService.getDefaultInterestRate();
        res.json({ rate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

