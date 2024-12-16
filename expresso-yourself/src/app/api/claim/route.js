// src/app/api/claim/route.js
import db from '../../backend/db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { user_id, rewardType } = await request.json();

        // Define points required for each reward type
        const rewardPoints = {
            COFFEE: 35,
            BAGEL: 40,
            BROWNIE: 50,
        };

        // Check if rewardType is valid and get required points
        const pointsRequired = rewardPoints[rewardType];
        if (!pointsRequired) {
            return NextResponse.json({ success: false, message: 'Invalid reward type' }, { status: 400 });
        }

        // Check if the user exists and retrieve their points balance
        const [userResult] = await db.query('SELECT points_balance FROM rewards WHERE user_id = ?', [user_id]);
        if (userResult.length === 0) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const { points_balance } = userResult[0];

        // Check if the user has enough points
        if (points_balance < pointsRequired) {
            return NextResponse.json({ success: false, message: 'Not enough points' }, { status: 403 });
        }

        // Deduct points from the user's balance
        const [deductionResult] = await db.query(
            'UPDATE rewards SET points_balance = points_balance - ? WHERE user_id = ?',
            [pointsRequired, user_id]
        );

        if (deductionResult.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Failed to deduct points' }, { status: 500 });
        }

        // Log the transaction in the rewards_transactions table
        await db.query(
            `INSERT INTO rewards_transactions (user_id, points_change, transaction_type, reference_id) 
             VALUES (?, ?, 'REDEEM', NULL)`,
            [user_id, -pointsRequired]
        );

        // Create a new order for the redeemed reward
        const [orderResult] = await db.query(
            `INSERT INTO orders (user_id, total_amount, order_status, payment_status, payment_method) 
             VALUES (?, 0.00, 'CONFIRMED', 'PAID', 'POINTS')`,
            [user_id]
        );

        const orderId = orderResult.insertId;

        // Map reward types to product IDs (update these to match your actual product IDs)
        const productMap = {
            COFFEE: 1,  // Example product ID for coffee
            BAGEL: 2,   // Example product ID for bagel
            BROWNIE: 3  // Example product ID for brownie
        };

        const productId = productMap[rewardType];
        const quantity = 1;
        const unitPrice = 0.00;
        const subtotal = 0.00;

        // Insert the redeemed item as an order item
        await db.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, productId, quantity, unitPrice, subtotal]
        );

        return NextResponse.json({ success: true, message: `${rewardType} claimed successfully!` });
    } catch (error) {
        console.error('Error claiming reward:', error);
        return NextResponse.json({ success: false, message: 'Error claiming reward' }, { status: 500 });
    }
}
