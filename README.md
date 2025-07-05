# Sales Management System

A comprehensive sales management system with distinct user roles (Sales Persons, Sub-Managers, Top Managers), incorporating sales tracking, commission calculation, stock management, loan processing, and reporting functionalities.

## Features

### Multi-Role System
- **Sales Persons**: Record sales transactions, apply for loans, track commissions
- **Sub-Managers**: Approve/reject sales and loan applications from their team members
- **Top Managers**: Complete system oversight, user management, product management, financial controls

### Core Functionality
- **Sales Management**: Record sales with automatic commission and profit calculations
- **Stock Management**: Real-time inventory tracking with automatic stock updates
- **Loan System**: Mini banking functionality with loan applications, approvals, and repayment tracking
- **Financial Management**: Separate fund pools (stock, bank, profit, commission)
- **Approval Workflows**: Hierarchical approval system for sales and loans
- **Real-time Analytics**: Role-specific dashboards and reporting

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: bcrypt, express-session
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Environment**: dotenv for configuration

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd sales_management_system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Seed the database with sample data**:
   ```bash
   npm run seed
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:8080`

**Note**: The `node_modules` folder is excluded from version control. After cloning the repository, run `npm install` to set up the project dependencies.

## Default Login Credentials

After running the seed script, you can use these credentials to test the system:

### Top Manager
- **Username**: admin
- **Password**: admin123

### Sub-Managers
- **Username**: manager1 / **Password**: manager123
- **Username**: manager2 / **Password**: manager123

### Sales Persons
- **Username**: sales1 / **Password**: sales123
- **Username**: sales2 / **Password**: sales123
- **Username**: sales3 / **Password**: sales123

## System Architecture

### Database Schema

The system uses SQLite with the following main tables:
- `users` - User accounts with role-based access
- `products` - Product catalog with pricing and stock
- `sales` - Sales transactions with approval workflow
- `loans` - Loan applications and management
- `loan_payments` - Loan repayment tracking
- `financial_funds` - Separate fund management
- `system_settings` - Configurable system parameters
- `notifications` - User notifications system

### User Roles and Permissions

#### Sales Person
- Record new sales transactions
- View personal sales history and statistics
- Apply for loans
- Track loan status and payments
- View personal dashboard with metrics

#### Sub-Manager
- Approve/reject sales from team members
- Approve/reject loan applications from team members
- View team performance metrics
- Monitor pending approvals
- Access team-specific reports

#### Top Manager
- Complete system oversight and analytics
- User management (create, edit users)
- Product management (add, edit, delete products)
- Financial fund management
- System settings configuration
- Access to all reports and analytics

### Financial System

The system maintains separate financial funds:
- **Stock Fund**: Inventory value
- **Bank Fund**: Available cash for loans
- **Profit Fund**: Accumulated profits from sales
- **Commission Fund**: Commission pool for sales persons

### Workflow Process

1. **Sales Process**:
   - Sales person records a sale
   - Stock is automatically reserved
   - Sale goes to sub-manager for approval
   - Upon approval: stock is confirmed sold, funds are updated
   - Upon rejection: stock is returned to inventory

2. **Loan Process**:
   - Sales person applies for a loan
   - Application goes to sub-manager for approval
   - Upon approval: loan becomes active, funds are disbursed
   - Repayments can be tracked with automatic commission deductions

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user info

### Sales Management
- `GET /api/products` - Get available products
- `POST /api/sales` - Create new sale
- `GET /api/my-sales` - Get user's sales
- `GET /api/pending-sales` - Get pending sales (sub-manager)
- `POST /api/sales/:id/approve` - Approve/reject sale

### Loan Management
- `POST /api/loans` - Apply for loan
- `GET /api/my-loans` - Get user's loans
- `GET /api/pending-loans` - Get pending loans (sub-manager)
- `POST /api/loans/:id/approve` - Approve/reject loan
- `POST /api/loans/:id/payment` - Record loan payment

### Product Management (Top Manager)
- `GET /api/products/all` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Financial Management (Top Manager)
- `GET /api/financial-funds` - Get all funds
- `PUT /api/financial-funds/:type` - Update fund amount
- `GET /api/system-settings` - Get system settings
- `PUT /api/system-settings/:key` - Update system setting

## Configuration

Environment variables can be set in the `.env` file:

```env
PORT=8080
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=development
```

## Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server
- `npm run seed` - Seed database with sample data

### Project Structure

```
sales_management_system/
├── server/
│   ├── server.js          # Main server file
│   ├── database.js        # Database schema and initialization
│   ├── auth.js           # Authentication service
│   ├── sales.js          # Sales management service
│   ├── loans.js          # Loan management service
│   ├── products.js       # Product management service
│   ├── financial.js      # Financial management service
│   └── seed.js           # Database seeding script
├── public/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── app.js           # Frontend JavaScript
├── .env                  # Environment configuration
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- SQL injection prevention with prepared statements
- Input validation and sanitization

## Future Enhancements

- Email notifications for approvals
- Advanced reporting and analytics
- Mobile responsive design improvements
- API rate limiting
- Audit logging
- Data export functionality
- Multi-currency support
- Advanced loan repayment schedules

## License

This project is licensed under the ISC License.

## Support

For support or questions, please contact the development team or create an issue in the repository.

