class SalesService {
    constructor(db) {
        this.db = db;
    }

    // Get all products
    getAllProducts() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM products WHERE stock_quantity > 0 ORDER BY name',
                [],
                (err, products) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(products);
                    }
                }
            );
        });
    }

    // Get product by ID
    getProductById(productId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM products WHERE id = ?',
                [productId],
                (err, product) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(product);
                    }
                }
            );
        });
    }

    // Calculate commission and profit for a sale
    calculateSaleMetrics(product, quantity, unitPrice) {
        const totalAmount = quantity * unitPrice;
        const commissionAmount = totalAmount * (product.commission_rate / 100);
        const profitAmount = totalAmount - (quantity * product.cost_price);
        
        return {
            totalAmount,
            commissionAmount,
            profitAmount
        };
    }

    // Create a new sale
    async createSale(saleData) {
        const { sales_person_id, product_id, quantity, unit_price } = saleData;
        
        try {
            // Get product details
            const product = await this.getProductById(product_id);
            if (!product) {
                throw new Error('Product not found');
            }

            // Check stock availability
            if (product.stock_quantity < quantity) {
                throw new Error('Insufficient stock');
            }

            // Calculate metrics
            const metrics = this.calculateSaleMetrics(product, quantity, unit_price);

            return new Promise((resolve, reject) => {
                this.db.run('BEGIN TRANSACTION');
                
                // Insert sale record
                const stmt = this.db.prepare(`
                    INSERT INTO sales (sales_person_id, product_id, quantity, unit_price, 
                                     total_amount, commission_amount, profit_amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                `);
                
                stmt.run([
                    sales_person_id, product_id, quantity, unit_price,
                    metrics.totalAmount, metrics.commissionAmount, metrics.profitAmount
                ], function(err) {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                    } else {
                        const saleId = this.lastID;
                        
                        // Update product stock (reserve the items)
                        this.db.run(
                            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                            [quantity, product_id],
                            (err) => {
                                if (err) {
                                    this.db.run('ROLLBACK');
                                    reject(err);
                                } else {
                                    this.db.run('COMMIT');
                                    resolve({ 
                                        id: saleId, 
                                        ...saleData, 
                                        ...metrics,
                                        status: 'pending'
                                    });
                                }
                            }
                        );
                    }
                });
                
                stmt.finalize();
            });
        } catch (error) {
            throw error;
        }
    }

    // Get sales by sales person
    getSalesBySalesPerson(salesPersonId, status = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT s.*, p.name as product_name, u.full_name as sales_person_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                JOIN users u ON s.sales_person_id = u.id
                WHERE s.sales_person_id = ?
            `;
            let params = [salesPersonId];

            if (status) {
                query += ' AND s.status = ?';
                params.push(status);
            }

            query += ' ORDER BY s.created_at DESC';

            this.db.all(query, params, (err, sales) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(sales);
                }
            });
        });
    }

    // Get pending sales for a sub-manager
    getPendingSalesForSubManager(subManagerId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT s.*, p.name as product_name, u.full_name as sales_person_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                JOIN users u ON s.sales_person_id = u.id
                WHERE u.sub_manager_id = ? AND s.status = 'pending'
                ORDER BY s.created_at ASC
            `, [subManagerId], (err, sales) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(sales);
                }
            });
        });
    }

    // Approve or reject a sale
    async approveSale(saleId, approverId, action) {
        if (!['approved', 'rejected'].includes(action)) {
            throw new Error('Invalid action');
        }

        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION');

            // Get sale details
            this.db.get('SELECT * FROM sales WHERE id = ?', [saleId], (err, sale) => {
                if (err) {
                    this.db.run('ROLLBACK');
                    reject(err);
                    return;
                }

                if (!sale) {
                    this.db.run('ROLLBACK');
                    reject(new Error('Sale not found'));
                    return;
                }

                if (sale.status !== 'pending') {
                    this.db.run('ROLLBACK');
                    reject(new Error('Sale already processed'));
                    return;
                }

                // Update sale status
                this.db.run(
                    'UPDATE sales SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [action, approverId, saleId],
                    (err) => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            if (action === 'rejected') {
                                // Return stock if rejected
                                this.db.run(
                                    'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                                    [sale.quantity, sale.product_id],
                                    (err) => {
                                        if (err) {
                                            this.db.run('ROLLBACK');
                                            reject(err);
                                        } else {
                                            this.db.run('COMMIT');
                                            resolve({ success: true, action });
                                        }
                                    }
                                );
                            } else {
                                // For approved sales, update financial funds
                                this.updateFinancialFunds(sale).then(() => {
                                    this.db.run('COMMIT');
                                    resolve({ success: true, action });
                                }).catch((err) => {
                                    this.db.run('ROLLBACK');
                                    reject(err);
                                });
                            }
                        }
                    }
                );
            });
        });
    }

    // Update financial funds after sale approval
    updateFinancialFunds(sale) {
        return new Promise((resolve, reject) => {
            // Update profit fund
            this.db.run(
                'UPDATE financial_funds SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE fund_type = "profit"',
                [sale.profit_amount],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Update commission fund
                        this.db.run(
                            'UPDATE financial_funds SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE fund_type = "commission"',
                            [sale.commission_amount],
                            (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            }
                        );
                    }
                }
            );
        });
    }

    // Get sales statistics for a sales person
    getSalesStatistics(salesPersonId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    COUNT(*) as total_sales,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sales,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_sales,
                    COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END), 0) as total_commission,
                    COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) as total_revenue
                FROM sales 
                WHERE sales_person_id = ?
            `, [salesPersonId], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0]);
                }
            });
        });
    }

    // Get recent sales for a sales person
    getRecentSales(salesPersonId, limit = 5) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT s.*, p.name as product_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE s.sales_person_id = ?
                ORDER BY s.created_at DESC
                LIMIT ?
            `, [salesPersonId, limit], (err, sales) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(sales);
                }
            });
        });
    }
}

module.exports = SalesService;

