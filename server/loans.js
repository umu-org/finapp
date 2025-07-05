class LoanService {
    constructor(db) {
        this.db = db;
    }

    // Calculate loan payment details
    calculateLoanPayment(amount, interestRate, durationMonths) {
        const monthlyRate = interestRate / 100 / 12;
        const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / 
                              (Math.pow(1 + monthlyRate, durationMonths) - 1);
        const totalRepayment = monthlyPayment * durationMonths;
        
        return {
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            totalRepayment: Math.round(totalRepayment * 100) / 100
        };
    }

    // Apply for a loan
    async applyForLoan(loanData) {
        const { borrower_id, amount, duration_months } = loanData;
        
        try {
            // Get default interest rate from system settings
            const interestRate = await this.getDefaultInterestRate();
            
            // Calculate payment details
            const paymentDetails = this.calculateLoanPayment(amount, interestRate, duration_months);
            
            return new Promise((resolve, reject) => {
                const stmt = this.db.prepare(`
                    INSERT INTO loans (borrower_id, amount, interest_rate, duration_months, 
                                     monthly_payment, total_repayment, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'pending')
                `);
                
                stmt.run([
                    borrower_id, amount, interestRate, duration_months,
                    paymentDetails.monthlyPayment, paymentDetails.totalRepayment
                ], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ 
                            id: this.lastID, 
                            ...loanData,
                            interest_rate: interestRate,
                            ...paymentDetails,
                            status: 'pending'
                        });
                    }
                });
                
                stmt.finalize();
            });
        } catch (error) {
            throw error;
        }
    }

    // Get default interest rate from system settings
    getDefaultInterestRate() {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT setting_value FROM system_settings WHERE setting_key = "default_loan_interest_rate"',
                [],
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(parseFloat(result?.setting_value || 10.0));
                    }
                }
            );
        });
    }

    // Get loans by borrower
    getLoansByBorrower(borrowerId, status = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT l.*, u.full_name as borrower_name
                FROM loans l
                JOIN users u ON l.borrower_id = u.id
                WHERE l.borrower_id = ?
            `;
            let params = [borrowerId];

            if (status) {
                query += ' AND l.status = ?';
                params.push(status);
            }

            query += ' ORDER BY l.created_at DESC';

            this.db.all(query, params, (err, loans) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(loans);
                }
            });
        });
    }

    // Get pending loans for a sub-manager
    getPendingLoansForSubManager(subManagerId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT l.*, u.full_name as borrower_name
                FROM loans l
                JOIN users u ON l.borrower_id = u.id
                WHERE u.sub_manager_id = ? AND l.status = 'pending'
                ORDER BY l.created_at ASC
            `, [subManagerId], (err, loans) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(loans);
                }
            });
        });
    }

    // Approve or reject a loan
    async approveLoan(loanId, approverId, action) {
        if (!['approved', 'rejected'].includes(action)) {
            throw new Error('Invalid action');
        }

        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION');

            // Get loan details
            this.db.get('SELECT * FROM loans WHERE id = ?', [loanId], (err, loan) => {
                if (err) {
                    this.db.run('ROLLBACK');
                    reject(err);
                    return;
                }

                if (!loan) {
                    this.db.run('ROLLBACK');
                    reject(new Error('Loan not found'));
                    return;
                }

                if (loan.status !== 'pending') {
                    this.db.run('ROLLBACK');
                    reject(new Error('Loan already processed'));
                    return;
                }

                // Update loan status
                this.db.run(
                    'UPDATE loans SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [action, approverId, loanId],
                    (err) => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            if (action === 'approved') {
                                // Update loan status to active and disburse funds
                                this.db.run(
                                    'UPDATE loans SET status = "active", disbursed_at = CURRENT_TIMESTAMP WHERE id = ?',
                                    [loanId],
                                    (err) => {
                                        if (err) {
                                            this.db.run('ROLLBACK');
                                            reject(err);
                                        } else {
                                            // Update bank fund (subtract loan amount)
                                            this.db.run(
                                                'UPDATE financial_funds SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP WHERE fund_type = "bank"',
                                                [loan.amount],
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
                                        }
                                    }
                                );
                            } else {
                                this.db.run('COMMIT');
                                resolve({ success: true, action });
                            }
                        }
                    }
                );
            });
        });
    }

    // Make a loan payment
    async makeLoanPayment(loanId, paymentAmount, commissionDeducted = 0) {
        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION');

            // Get loan details
            this.db.get('SELECT * FROM loans WHERE id = ?', [loanId], (err, loan) => {
                if (err) {
                    this.db.run('ROLLBACK');
                    reject(err);
                    return;
                }

                if (!loan || loan.status !== 'active') {
                    this.db.run('ROLLBACK');
                    reject(new Error('Loan not found or not active'));
                    return;
                }

                // Insert payment record
                this.db.run(
                    'INSERT INTO loan_payments (loan_id, payment_amount, commission_deducted) VALUES (?, ?, ?)',
                    [loanId, paymentAmount, commissionDeducted],
                    function(err) {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            // Update bank fund (add payment)
                            this.db.run(
                                'UPDATE financial_funds SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE fund_type = "bank"',
                                [paymentAmount],
                                (err) => {
                                    if (err) {
                                        this.db.run('ROLLBACK');
                                        reject(err);
                                    } else {
                                        // Check if loan is fully paid
                                        this.db.get(
                                            'SELECT SUM(payment_amount) as total_paid FROM loan_payments WHERE loan_id = ?',
                                            [loanId],
                                            (err, result) => {
                                                if (err) {
                                                    this.db.run('ROLLBACK');
                                                    reject(err);
                                                } else {
                                                    const totalPaid = result.total_paid || 0;
                                                    if (totalPaid >= loan.total_repayment) {
                                                        // Mark loan as completed
                                                        this.db.run(
                                                            'UPDATE loans SET status = "completed" WHERE id = ?',
                                                            [loanId],
                                                            (err) => {
                                                                if (err) {
                                                                    this.db.run('ROLLBACK');
                                                                    reject(err);
                                                                } else {
                                                                    this.db.run('COMMIT');
                                                                    resolve({ success: true, loanCompleted: true });
                                                                }
                                                            }
                                                        );
                                                    } else {
                                                        this.db.run('COMMIT');
                                                        resolve({ success: true, loanCompleted: false });
                                                    }
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    }
                );
            });
        });
    }

    // Get loan statistics for a borrower
    getLoanStatistics(borrowerId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    COUNT(*) as total_loans,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_loans,
                    COALESCE(SUM(CASE WHEN status IN ('active', 'completed') THEN amount ELSE 0 END), 0) as total_borrowed,
                    COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as outstanding_amount
                FROM loans 
                WHERE borrower_id = ?
            `, [borrowerId], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0]);
                }
            });
        });
    }
}

module.exports = LoanService;

