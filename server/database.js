const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('./database.db', (err) => {
            if (err) {
                console.error('Error connecting to database:', err.message);
            } else {
                console.log('Connected to the SQLite database.');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        // Users table
        this.db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('sales_person', 'sub_manager', 'top_manager')),
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            sub_manager_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sub_manager_id) REFERENCES users(id)
        )`);

        // Products table
        this.db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            cost_price DECIMAL(10,2) NOT NULL,
            selling_price DECIMAL(10,2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            commission_rate DECIMAL(5,2) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Sales table
        this.db.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sales_person_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            commission_amount DECIMAL(10,2) NOT NULL,
            profit_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            approved_by INTEGER,
            approved_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sales_person_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (approved_by) REFERENCES users(id)
        )`);

        // Loans table
        this.db.run(`CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            borrower_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            interest_rate DECIMAL(5,2) NOT NULL,
            duration_months INTEGER NOT NULL,
            monthly_payment DECIMAL(10,2) NOT NULL,
            total_repayment DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'active', 'completed')),
            approved_by INTEGER,
            approved_at DATETIME,
            disbursed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (borrower_id) REFERENCES users(id),
            FOREIGN KEY (approved_by) REFERENCES users(id)
        )`);

        // Loan payments table
        this.db.run(`CREATE TABLE IF NOT EXISTS loan_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            payment_amount DECIMAL(10,2) NOT NULL,
            commission_deducted DECIMAL(10,2) DEFAULT 0,
            payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loan_id) REFERENCES loans(id)
        )`);

        // Financial funds table
        this.db.run(`CREATE TABLE IF NOT EXISTS financial_funds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fund_type TEXT NOT NULL CHECK(fund_type IN ('stock', 'bank', 'profit', 'commission')),
            amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // System settings table
        this.db.run(`CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Notifications table
        this.db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('sale_approval', 'loan_approval', 'general')),
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Initialize default financial funds
        this.db.run(`INSERT OR IGNORE INTO financial_funds (fund_type, amount) VALUES 
            ('stock', 0),
            ('bank', 0),
            ('profit', 0),
            ('commission', 0)`);

        // Initialize default system settings
        this.db.run(`INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES 
            ('default_commission_rate', '5.0'),
            ('default_loan_interest_rate', '10.0')`);

        console.log('Database tables initialized successfully.');
    }

    getDatabase() {
        return this.db;
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

module.exports = Database;

