// app/api/auth/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../backend/db.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const [users] = await db.execute(
      'SELECT user_id, email, password_hash, first_name, last_name, is_admin FROM users WHERE email = ? AND is_active = 1',
      [username]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last_login timestamp
    await db.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    // Exclude the password hash from the response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Successfully signed in!'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}