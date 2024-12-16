// app/api/helpdesk/route.js
import db from '../../backend/db.js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

async function sendNotificationEmail(name, email, issue, ticketId) {
    // Create a transporter object using hMailServer settings
    const transporter = nodemailer.createTransport({
        host: "localhost",  // Local hMailServer
        port: 25,          // Default SMTP port
        secure: false,     // Don't use SSL
        auth: {
            user: process.env.SMTP_USER || 'admin@espressoyourselfcafe.com',
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false // Accept self-signed certificates
        }
    });

    const mailOptions = {
        from: `"Espresso Yourself Cafe Support" <admin@espressoyourselfcafe.com>`,
        to: process.env.HELPDESK_EMAIL || 'helpdesk@espressoyourselfcafe.com',
        subject: `New Help Ticket #${ticketId}`,
        text: `New help ticket submitted:
        
Ticket ID: ${ticketId}
Name: ${name}
Email: ${email}
Issue: ${issue}
Status: OPEN`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Help Ticket #${ticketId}</h2>
                <table style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ticket ID:</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${ticketId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Issue:</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${issue}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">OPEN</td>
                    </tr>
                </table>
            </div>
        `
    };

    try {
        await transporter.verify();
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        const { name, email, issue } = data;

        // Basic validation
        if (!name || !email || !issue) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        try {
            // Insert into database
            const query = 'INSERT INTO help_tickets (name, email, issue, status) VALUES (?, ?, ?, ?)';
            const result = await db.query(query, [name, email, issue, 'OPEN']);
            
            // Get the ticket ID
            const ticketId = result.insertId;

            // Send notification email
            try {
                await sendNotificationEmail(name, email, issue, ticketId);
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
                // Continue even if email fails - ticket is still created
            }

            return NextResponse.json(
                { 
                    message: 'Your help ticket has been submitted successfully!',
                    ticketId: ticketId
                },
                { status: 200 }
            );
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Help desk submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit help ticket. Please try again later.' },
            { status: 500 }
        );
    }
}