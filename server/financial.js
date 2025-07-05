class FinancialService {
    constructor(db) {
        this.db = db;
    }

    // Get all financial funds
    getFinancialFunds() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM financial_funds ORDER BY fund_type',
                [],
                (err, funds) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(funds);
                    }
                }
            );
        });
    }

    // Update financial fund
    updateFinancialFund(fundType, amount) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE financial_funds SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE fund_type = ?',
                [amount, fundType],
                function(err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        reject(new Error('Fund type not found'));
                    } else {
                        resolve({ success: true });
                    }
                }
            );
        });
    }

    // Get system settings
    getSystemSettings() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM system_settings',
                [],
                (err, settings) => {
                    if (err) {
                        reject(err);
                    } else {
                        const settingsObj = {};
                        settings.forEach(setting => {
                            settingsObj[setting.setting_key] = setting.setting_value;
                        });
                        resolve(settingsObj);
                    }
                }
            );
        });
    }

    // Update system setting
    updateSystemSetting(key, value) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
                [value, key],
                function(err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        // Insert if doesn't exist
                        this.db.run(
                            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
                            [key, value],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({ success: true });
                                }
                            }
                        );
                    } else {
                        resolve({ success: true });
                    }
                }
            );
        });
    }

    // Get business overview statistics
    getBusinessOverview() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    COUNT(DISTINCT u.id) as total_users,
                    COUNT(DISTINCT p.id) as total_products,
                    COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.total_amount ELSE 0 END), 0) as total_revenue,
                    COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.profit_amount ELSE 0 END), 0) as total_profit,
                    COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.commission_amount ELSE 0 END), 0) as total_commission,
                    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_sales,
                    COUNT(CASE WHEN l.status = 'pending' THEN 1 END) as pending_loans
                FROM users u
                CROSS JOIN products p
                LEFT JOIN sales s ON 1=1
                LEFT JOIN loans l ON 1=1
            `, [], (err, overview) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(overview);
                }
            });
        });
    }

    // Get sales performance by user
    getSalesPerformance() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    u.full_name,
                    u.role,
                    COUNT(s.id) as total_sales,
                    COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.total_amount ELSE 0 END), 0) as total_revenue,
                    COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.commission_amount ELSE 0 END), 0) as total_commission
                FROM users u
                LEFT JOIN sales s ON u.id = s.sales_person_id
                WHERE u.role = 'sales_person'
                GROUP BY u.id, u.full_name, u.role
                ORDER BY total_revenue DESC
            `, [], (err, performance) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(performance);
                }
            });
        });
    }
}

module.exports = FinancialService;

