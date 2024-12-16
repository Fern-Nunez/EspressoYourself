// src/app/api/points/route.js

import db from '../../backend/db.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const user_id = url.searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        const [rewardsResult] = await db.query(
            `SELECT points_balance, lifetime_points, last_activity 
             FROM rewards 
             WHERE user_id = ?`,
            [user_id]
        );

        if (rewardsResult.length === 0) {
            return NextResponse.json({
                success: true,
                points_balance: 0,
                lifetime_points: 0,
                last_activity: null
            });
        }

        return NextResponse.json({
            success: true,
            ...rewardsResult[0]
        });

    } catch (error) {
        console.error('Error fetching points balance:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching points balance' },
            { status: 500 }
        );
    }
}
