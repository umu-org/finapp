class ProductService {
    constructor(db) {
        this.db = db;
    }

    // Create a new product
    createProduct(productData) {
        const { name, description, cost_price, selling_price, stock_quantity, commission_rate } = productData;
        
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO products (name, description, cost_price, selling_price, stock_quantity, commission_rate)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([name, description, cost_price, selling_price, stock_quantity, commission_rate], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        id: this.lastID, 
                        ...productData,
                        created_at: new Date().toISOString()
                    });
                }
            });
            
            stmt.finalize();
        });
    }

    // Get all products
    getAllProducts() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM products ORDER BY name',
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

    // Update product
    updateProduct(productId, productData) {
        const { name, description, cost_price, selling_price, stock_quantity, commission_rate } = productData;
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE products 
                SET name = ?, description = ?, cost_price = ?, selling_price = ?, 
                    stock_quantity = ?, commission_rate = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [name, description, cost_price, selling_price, stock_quantity, commission_rate, productId], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Product not found'));
                } else {
                    resolve({ success: true });
                }
            });
        });
    }

    // Delete product
    deleteProduct(productId) {
        return new Promise((resolve, reject) => {
            // Check if product has any sales
            this.db.get(
                'SELECT COUNT(*) as count FROM sales WHERE product_id = ?',
                [productId],
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else if (result.count > 0) {
                        reject(new Error('Cannot delete product with existing sales'));
                    } else {
                        this.db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
                            if (err) {
                                reject(err);
                            } else if (this.changes === 0) {
                                reject(new Error('Product not found'));
                            } else {
                                resolve({ success: true });
                            }
                        });
                    }
                }
            );
        });
    }

    // Get product statistics
    getProductStatistics() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    p.id,
                    p.name,
                    p.stock_quantity,
                    COALESCE(SUM(s.quantity), 0) as total_sold,
                    COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.total_amount ELSE 0 END), 0) as total_revenue
                FROM products p
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY p.id, p.name, p.stock_quantity
                ORDER BY total_revenue DESC
            `, [], (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats);
                }
            });
        });
    }
}

module.exports = ProductService;

