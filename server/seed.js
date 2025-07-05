const Database = require('./database');
const AuthService = require('./auth');
const ProductService = require('./products');

async function seedDatabase() {
    const database = new Database();
    const db = database.getDatabase();
    const authService = new AuthService(db);
    const productService = new ProductService(db);

    try {
        console.log('Seeding database with sample data...');

        // Create top manager
        await authService.registerUser({
            username: 'admin',
            password: 'admin123',
            role: 'top_manager',
            full_name: 'System Administrator',
            email: 'admin@company.com',
            phone: '+1234567890',
            sub_manager_id: null
        });

        // Create sub-managers
        const subManager1 = await authService.registerUser({
            username: 'manager1',
            password: 'manager123',
            role: 'sub_manager',
            full_name: 'John Manager',
            email: 'john@company.com',
            phone: '+1234567891',
            sub_manager_id: null
        });

        const subManager2 = await authService.registerUser({
            username: 'manager2',
            password: 'manager123',
            role: 'sub_manager',
            full_name: 'Jane Manager',
            email: 'jane@company.com',
            phone: '+1234567892',
            sub_manager_id: null
        });

        // Create sales persons
        await authService.registerUser({
            username: 'sales1',
            password: 'sales123',
            role: 'sales_person',
            full_name: 'Alice Sales',
            email: 'alice@company.com',
            phone: '+1234567893',
            sub_manager_id: subManager1.id
        });

        await authService.registerUser({
            username: 'sales2',
            password: 'sales123',
            role: 'sales_person',
            full_name: 'Bob Sales',
            email: 'bob@company.com',
            phone: '+1234567894',
            sub_manager_id: subManager1.id
        });

        await authService.registerUser({
            username: 'sales3',
            password: 'sales123',
            role: 'sales_person',
            full_name: 'Charlie Sales',
            email: 'charlie@company.com',
            phone: '+1234567895',
            sub_manager_id: subManager2.id
        });

        // Create sample products
        await productService.createProduct({
            name: 'Laptop Computer',
            description: 'High-performance laptop for business use',
            cost_price: 800.00,
            selling_price: 1200.00,
            stock_quantity: 50,
            commission_rate: 8.0
        });

        await productService.createProduct({
            name: 'Wireless Mouse',
            description: 'Ergonomic wireless mouse',
            cost_price: 15.00,
            selling_price: 25.00,
            stock_quantity: 200,
            commission_rate: 5.0
        });

        await productService.createProduct({
            name: 'Office Chair',
            description: 'Comfortable ergonomic office chair',
            cost_price: 150.00,
            selling_price: 250.00,
            stock_quantity: 30,
            commission_rate: 10.0
        });

        await productService.createProduct({
            name: 'Monitor 24"',
            description: '24-inch LED monitor',
            cost_price: 200.00,
            selling_price: 300.00,
            stock_quantity: 75,
            commission_rate: 7.0
        });

        await productService.createProduct({
            name: 'Keyboard',
            description: 'Mechanical keyboard',
            cost_price: 50.00,
            selling_price: 80.00,
            stock_quantity: 100,
            commission_rate: 6.0
        });

        // Initialize financial funds with some starting amounts
        db.run('UPDATE financial_funds SET amount = 10000 WHERE fund_type = "bank"');
        db.run('UPDATE financial_funds SET amount = 5000 WHERE fund_type = "stock"');

        console.log('Database seeded successfully!');
        console.log('\nLogin credentials:');
        console.log('Top Manager: admin / admin123');
        console.log('Sub-Manager 1: manager1 / manager123');
        console.log('Sub-Manager 2: manager2 / manager123');
        console.log('Sales Person 1: sales1 / sales123');
        console.log('Sales Person 2: sales2 / sales123');
        console.log('Sales Person 3: sales3 / sales123');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        database.close();
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;

