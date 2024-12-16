// app/api/orders/route.js

import { NextResponse } from 'next/server';
import db from '../../backend/db.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required', orders: [] },
                { status: 400 }
            );
        }

        const query = `
            SELECT 
                o.order_id,
                o.total_amount,
                o.order_status,
                o.payment_status,
                o.payment_method,
                o.created_at,
                o.completed_at,
                oi.product_id,
                oi.quantity,
                oi.unit_price,
                oi.subtotal,
                p.name as product_name
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `;

        const [rows] = await db.query(query, [userId]);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ orders: [] }, { status: 200 });
        }

        // Group the results by order
        const ordersMap = new Map();
        
        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                const createdAt = new Date(row.created_at);
                const readyTime = new Date(createdAt.getTime() + 15 * 60000); // 15 minutes later

                ordersMap.set(row.order_id, {
                    orderNumber: `#${row.order_id}`,
                    items: [],
                    subtotal: Number(row.total_amount) || 0,
                    orderDate: createdAt.toISOString(),
                    readyTime: readyTime.toISOString(),
                    status: row.order_status,
                    paymentStatus: row.payment_status,
                    paymentMethod: row.payment_method
                });
            }

            if (row.product_id && row.quantity) {
                ordersMap.get(row.order_id).items.push({
                    name: row.product_name || 'Unknown Product',
                    quantity: row.quantity,
                    unitPrice: Number(row.unit_price) || 0,
                    subtotal: Number(row.subtotal) || 0
                });
            }
        });

        const orders = Array.from(ordersMap.values());
        return NextResponse.json({ orders }, { status: 200 });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders', orders: [] },
            { status: 500 }
        );
    }
}