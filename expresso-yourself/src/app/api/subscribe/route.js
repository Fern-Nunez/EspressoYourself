import db from '../../backend/db.js';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const data = await req.json();
        const { email, user_id } = data;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Insert new subscriber
        try {
            let query, params;
            if (user_id) {
                // If user is signed in, include user_id
                query = 'INSERT INTO newsletter_subscribers (email, is_active, user_id) VALUES (?, 1, ?)';
                params = [email, user_id];
            } else {
                // If user is not signed in, only include email
                query = 'INSERT INTO newsletter_subscribers (email, is_active) VALUES (?, 1)';
                params = [email];
            }

            await db.query(query, params);
            
            return NextResponse.json(
                { message: 'Successfully subscribed to newsletter!' },
                { status: 200 }
            );
        } catch (error) {
            console.error('Database error:', error);
            // Check for duplicate entry error (e.g., duplicate email)
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                return NextResponse.json(
                    { error: 'Email already subscribed' },
                    { status: 409 }
                );
            }
            // If it's not a duplicate entry error, rethrow it to the outer catch block
            throw error;
        }
    } catch (error) {
        // Outer error handling
        console.error('Outer catch - Newsletter subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to subscribe to newsletter. Please try again later.' },
            { status: 500 }
        );
    }
}