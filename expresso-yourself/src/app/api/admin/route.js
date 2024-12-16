// app/api/admin/route.js
import { NextResponse } from 'next/server';
import db from '../../backend/db.js';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'subscribers') {
      // Fetch newsletter subscribers
      const [subscribers] = await db.query(`
        SELECT 
          subscriber_id,
          email,
          user_id,
          subscribed_at,
          is_active
        FROM newsletter_subscribers
        WHERE is_active = 1
        ORDER BY subscribed_at DESC
      `);

      if (!subscribers.length) {
        return NextResponse.json({ subscribers: [] }, { status: 200 });
      }

      // Attach first names for subscribers with user_id
      const subscribersWithNames = await Promise.all(
        subscribers.map(async (subscriber) => {
          if (subscriber.user_id) {
            const [userRows] = await db.query(
              'SELECT first_name FROM users WHERE user_id = ?',
              [subscriber.user_id]
            );
            return {
              ...subscriber,
              first_name: userRows[0]?.first_name || 'N/A',
              subscribed_at: formatDate(subscriber.subscribed_at),
            };
          }
          return {
            ...subscriber,
            first_name: 'N/A',
            subscribed_at: formatDate(subscriber.subscribed_at),
          };
        })
      );

      return NextResponse.json({ subscribers: subscribersWithNames }, { status: 200 });
    } else {
      // Fetch orders
      const [rows] = await db.query(`
        SELECT 
          o.order_id,
          COALESCE(u.first_name, 'Guest') as customer_name,
          COALESCE(u.email, 'N/A') as customer_email,
          o.total_amount,
          o.created_at,
          SUM(oi.quantity) as item_total,
          SUM(CASE WHEN oi.product_id = 1 THEN oi.quantity ELSE 0 END) as coffees,
          SUM(CASE WHEN oi.product_id = 2 THEN oi.quantity ELSE 0 END) as bagels,
          SUM(CASE WHEN oi.product_id = 3 THEN oi.quantity ELSE 0 END) as brownies
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        GROUP BY o.order_id, o.created_at, o.total_amount, u.first_name, u.email
        ORDER BY o.created_at DESC
      `);

      if (!rows) {
        return NextResponse.json({ orders: [] }, { status: 200 });
      }

      const orders = rows.map(row => ({
        id: row.order_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        totalAmount: Number(row.total_amount) || 0,
        createdAt: formatDate(row.created_at),
        itemTotal: Number(row.item_total) || 0,
        coffees: Number(row.coffees) || 0,
        bagels: Number(row.bagels) || 0,
        brownies: Number(row.brownies) || 0
      }));

      return NextResponse.json({ orders }, { status: 200 });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await db.query('START TRANSACTION');

    try {
      await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      const [result] = await db.query('DELETE FROM orders WHERE order_id = ?', [orderId]);

      if (result.affectedRows === 0) {
        await db.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      await db.query('COMMIT');
      return NextResponse.json(
        { message: 'Order deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const updatedData = await request.json();

    console.log("Received updated data:", updatedData);

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await db.query('START TRANSACTION');

    try {
      const orderFields = {};
      const orderItemFields = {};

      for (const [key, value] of Object.entries(updatedData)) {
        if (key === 'totalAmount') {
          orderFields['total_amount'] = value;
        } else if (key === 'createdAt') {
          orderFields['created_at'] = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
        } else if (['coffees', 'bagels', 'brownies'].includes(key)) {
          orderItemFields[key] = value;
        }
      }

      console.log("Parsed orderItemFields:", orderItemFields);

      if (Object.keys(orderFields).length > 0) {
        const updateOrderFields = Object.entries(orderFields)
          .map(([key]) => `${key} = ?`)
          .join(', ');

        const orderValues = [...Object.values(orderFields), orderId];
        await db.query(`UPDATE orders SET ${updateOrderFields} WHERE order_id = ?`, orderValues);
      }

      const unitPrices = { coffees: 5.0, bagels: 3.0, brownies: 4.0 };
      const productMapping = { coffees: 1, bagels: 2, brownies: 3 };

      for (const [key, quantity] of Object.entries(orderItemFields)) {
        const productId = productMapping[key];
        const unitPrice = unitPrices[key];
        const subtotal = quantity * unitPrice;

        console.log(`Updating product ${key} (ID: ${productId}): Quantity = ${quantity}, Unit Price = ${unitPrice}, Subtotal = ${subtotal}`);

        const [rows] = await db.query(
          'SELECT order_item_id FROM order_items WHERE order_id = ? AND product_id = ?',
          [orderId, productId]
        );

        if (rows.length > 0) {
          await db.query(
            'UPDATE order_items SET quantity = ?, unit_price = ?, subtotal = ? WHERE order_id = ? AND product_id = ?',
            [quantity, unitPrice, subtotal, orderId, productId]
          );
        } else {
          await db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [orderId, productId, quantity, unitPrice, subtotal]
          );
        }
      }

      await db.query('COMMIT');
      return NextResponse.json(
        { message: 'Order updated successfully' },
        { status: 200 }
      );
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

function formatDate(date) {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (err) {
    return 'Invalid Date';
  }
}