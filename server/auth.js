const bcrypt = require('bcrypt');

class AuthService {
    constructor(db) {
        this.db = db;
    }

    // Register a new user
    async registerUser(userData) {
        const { username, password, role, full_name, email, phone, sub_manager_id } = userData;
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            return new Promise((resolve, reject) => {
                const stmt = this.db.prepare(`
                    INSERT INTO users (username, password, role, full_name, email, phone, sub_manager_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                
                stmt.run([username, hashedPassword, role, full_name, email, phone, sub_manager_id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, username, role, full_name });
                    }
                });
                
                stmt.finalize();
            });
        } catch (error) {
            throw error;
        }
    }

    // Login user
    async loginUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE username = ?',
                [username],
                async (err, user) => {
                    if (err) {
                        reject(err);
                    } else if (!user) {
                        resolve(null);
                    } else {
                        try {
                            const isValidPassword = await bcrypt.compare(password, user.password);
                            if (isValidPassword) {
                                // Remove password from user object
                                const { password, ...userWithoutPassword } = user;
                                resolve(userWithoutPassword);
                            } else {
                                resolve(null);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                }
            );
        });
    }

    // Get user by ID
    getUserById(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, username, role, full_name, email, phone, sub_manager_id FROM users WHERE id = ?',
                [userId],
                (err, user) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(user);
                    }
                }
            );
        });
    }

    // Get all users by role
    getUsersByRole(role) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT id, username, role, full_name, email, phone, sub_manager_id FROM users WHERE role = ?',
                [role],
                (err, users) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(users);
                    }
                }
            );
        });
    }

    // Get sales persons under a sub-manager
    getSalesPersonsBySubManager(subManagerId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT id, username, role, full_name, email, phone FROM users WHERE sub_manager_id = ? AND role = "sales_person"',
                [subManagerId],
                (err, users) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(users);
                    }
                }
            );
        });
    }

    // Middleware to check if user is authenticated
    requireAuth(req, res, next) {
        if (req.session && req.session.user) {
            next();
        } else {
            res.status(401).json({ error: 'Authentication required' });
        }
    }

    // Middleware to check user role
    requireRole(roles) {
        return (req, res, next) => {
            if (req.session && req.session.user && roles.includes(req.session.user.role)) {
                next();
            } else {
                res.status(403).json({ error: 'Insufficient permissions' });
            }
        };
    }
}

module.exports = AuthService;

