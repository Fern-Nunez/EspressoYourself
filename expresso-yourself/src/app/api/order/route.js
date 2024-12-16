// src/app/api/order/route.js

import db from '../../backend/db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { user_id, items, payment_method } = body;

        // Validate required fields
        if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid order data' },
                { status: 400 }
            );
        }

        try {
            // Start transaction
            await db.query('START TRANSACTION');

            // Calculate total amount and validate stock
            let total_amount = 0;
            for (const item of items) {
                const [rows] = await db.query(
                    'SELECT price, is_available FROM products WHERE product_id = ?',
                    [item.product_id]
                );

                if (!rows[0] || !rows[0].is_available) {
                    await db.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, message: `Product ${item.product_id} is not available` },
                        { status: 400 }
                    );
                }

                total_amount += rows[0].price * item.quantity;
            }

            // Create order
            const [orderResult] = await db.query(
                `INSERT INTO orders (user_id, total_amount, order_status, payment_status, payment_method) 
                 VALUES (?, ?, 'PENDING', 'PENDING', ?)`,
                [user_id, total_amount, payment_method]
            );

            const order_id = orderResult.insertId;

            // Create order items with subtotal
            for (const item of items) {
                const [priceResult] = await db.query(
                    'SELECT price FROM products WHERE product_id = ?',
                    [item.product_id]
                );
                
                const unit_price = priceResult[0].price;
                const subtotal = unit_price * item.quantity;

                await db.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [order_id, item.product_id, item.quantity, unit_price, subtotal]
                );
            }

            // Calculate points (1 point per dollar spent, rounded down)
            const points_earned = Math.floor(total_amount);

            // Check if user exists in rewards table
            const [rewardsResult] = await db.query(
                'SELECT points_balance FROM rewards WHERE user_id = ?',
                [user_id]
            );

            if (rewardsResult.length === 0) {
                // Create new rewards record if user doesn't exist
                await db.query(
                    `INSERT INTO rewards (user_id, points_balance, lifetime_points) 
                     VALUES (?, ?, ?)`,
                    [user_id, points_earned, points_earned]
                );
            } else {
                // Update existing rewards record
                await db.query(
                    `UPDATE rewards 
                     SET points_balance = points_balance + ?,
                         lifetime_points = lifetime_points + ?,
                         last_activity = CURRENT_TIMESTAMP
                     WHERE user_id = ?`,
                    [points_earned, points_earned, user_id]
                );
            }

            // Record the transaction
            await db.query(
                `INSERT INTO rewards_transactions 
                 (user_id, points_change, transaction_type, reference_id)
                 VALUES (?, ?, 'EARN', ?)`,
                [user_id, points_earned, order_id]
            );

            // Get updated points balance
            const [updatedBalance] = await db.query(
                'SELECT points_balance FROM rewards WHERE user_id = ?',
                [user_id]
            );

            // Commit transaction
            await db.query('COMMIT');

            return NextResponse.json({
                success: true,
                order_id,
                total_amount,
                points_earned,
                current_points_balance: updatedBalance[0].points_balance,
                message: `Order processed successfully! You earned ${points_earned} points! Your new balance is ${updatedBalance[0].points_balance} points.`
            });

        } catch (dbError) {
            await db.query('ROLLBACK');
            console.error('Database error:', dbError);
            return NextResponse.json(
                { success: false, message: 'Database error occurred' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Order processing error:', error);
        return NextResponse.json(
            { success: false, message: 'Error processing order' },
            { status: 400 }
        );
    }
}