'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";
import './admin.css';

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  totalAmount: number;
  itemTotal: number;
  coffees: number;
  bagels: number;
  brownies: number;
}

interface Subscriber {
  subscriber_id: number;
  email: string;
  user_id: number | null;
  subscribed_at: string;
  is_active: number;
  first_name?: string;
}

interface EditedDataType {
  [key: number]: Partial<Order>;
}

export default function AdminOrders() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<EditedDataType>({});
  const [editingRow, setEditingRow] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchSubscribers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data.orders || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setSubscribersLoading(true);
      const response = await fetch('/api/admin?type=subscribers');
      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const handleEditStart = (orderId: number): void => {
    const row = orders.find(order => order.id === orderId);
    if (row) {
      setEditedData({ [orderId]: row });
      setEditingRow(orderId);
    }
  };

  const handleCellChange = (orderId: number, field: keyof Order, value: string | number): void => {
    setEditedData((prev) => ({
      ...prev,
      [orderId]: { 
        ...prev[orderId],
        [field]: value 
      },
    }));
  };

  const saveChanges = async (orderId: number): Promise<void> => {
    const updatedData = editedData[orderId];
    if (!updatedData) return;
  
    try {
      const response = await fetch(`/api/admin?orderId=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }
  
      await fetchOrders();
      setEditedData((prev) => {
        const { [orderId]: removed, ...rest } = prev;
        return rest;
      });
      setEditingRow(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      const response = await fetch(`/api/admin?orderId=${orderId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete order');
      }
  
      await fetchOrders();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  return (
    <div>
      {/* Navigation Bar */}
      <div className={`nav ${scrolled ? "scrolled" : ""}`} id="navbar">
        <div className="logo">
          <Link href="/">
            <Image 
              src="/images/logo-black.png"
              width={80}
              height={80}
              alt="Logo"
            />
          </Link>
        </div>
        <div className="nav-right">
          <div className="account-icon-container" onClick={() => setAccountOpen(!accountOpen)}>
            <Image 
              src="/icons/person-black.png"
              width={30}
              height={30}
              alt="Person Icon"
            />
          </div>
          <div onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "pointer" }}>
            <Image 
              src={menuOpen ? "/icons/x.png" : "/icons/menu-black.png"}
              width={30}
              height={30}
              alt="Menu Icon"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="landing">
        <div className="copy">
          {/* Orders Section */}
          <div className="top">
            <div className="title">ORDERS</div>
            <hr className="title-line" />
          </div>

          {loading ? (
            <div>Loading orders...</div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <div className="order-grid-container">
              <div className="grid-layout">
                <div className="grid-header">Order ID</div>
                <div className="grid-header">Name</div>
                <div className="grid-header">Email</div>
                <div className="grid-header">Created At</div>
                <div className="grid-header">Subtotal</div>
                <div className="grid-header">Item Total</div>
                <div className="grid-header">Coffees</div>
                <div className="grid-header">Bagels</div>
                <div className="grid-header">Brownies</div>
                <div className="grid-header">Actions</div>
              </div>

              {orders.map((order) => (
                <div key={`order-${order.id}`} className="grid-layout">
                  <div className="grid-cell">#{order.id}</div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="text"
                        value={editedData[order.id]?.customerName || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'customerName', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.customerName}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="text"
                        value={editedData[order.id]?.customerEmail || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'customerEmail', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.customerEmail}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="text"
                        value={editedData[order.id]?.createdAt || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'createdAt', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.createdAt}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="number"
                        value={editedData[order.id]?.totalAmount || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'totalAmount', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="number"
                        value={editedData[order.id]?.itemTotal || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'itemTotal', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.itemTotal}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="number"
                        value={editedData[order.id]?.coffees || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'coffees', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.coffees}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="number"
                        value={editedData[order.id]?.bagels || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'bagels', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.bagels}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell">
                    {editingRow === order.id ? (
                      <input
                        type="number"
                        value={editedData[order.id]?.brownies || ""}
                        onChange={(e) =>
                          handleCellChange(order.id, 'brownies', e.target.value)
                        }
                      />
                    ) : (
                      <span onClick={() => handleEditStart(order.id)}>
                        {order.brownies}
                      </span>
                    )}
                  </div>
                  <div className="grid-cell-button">
                    {editingRow === order.id ? (
                      <button
                        className="save-button"
                        onClick={() => saveChanges(order.id)}
                      >
                        <Check size={16} />
                      </button>
                    ) : (
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Newsletter Subscribers Section */}
          <div className='newsletter-subs-container'>
          <div className="top">
            <div className="title">NEWSLETTER SUBSCRIBERS</div>
            <hr className="title-line" />
          </div>
          {subscribersLoading ? (
            <div className='newsletter-subs'>Loading subscribers...</div>
          ) : subscribers.length === 0 ? (
            <div className='newsletter-subs'>No subscribers found</div>
          ) : (
            <>
              <div className='newsletter-subs'>
                <div className='newsletter-sub-name'>NAME</div>
                <div className='newsletter-sub-email'>EMAIL</div>
              </div>
              <hr className='sub-line' />
              {subscribers.map((subscriber) => (
                <div key={`sub-${subscriber.subscriber_id}`} className='newsletter-subs'>
                  <div className='newsletter-sub-name'>
                    {subscriber.first_name || 'N/A'}
                  </div>
                  <div className='newsletter-sub-email'>
                    {subscriber.email}
                  </div>
                </div>
              ))}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="menu-overlay">
          <div className="close-icon" onClick={() => setMenuOpen(false)}>
            <Image src="/icons/x.png" width={30} height={30} alt="Close Menu" />
          </div>
          <ul className="menu-list">
            <li><Link href="/shop">ORDER ONLINE</Link></li>
            <li><Link href="/newsletter">NEWSLETTER</Link></li>
            <li><Link href="/rewards">REWARDS</Link></li>
            <li><Link href="/helpdesk">HELPDESK</Link></li>
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="footer-section">
        <hr className="line" />
        <div className="footer-divider">
          <div className="logo-footer">
            <Image 
              src="/images/logo-black.png"
              width={150}
              height={150}
              alt="Logo"
            />
          </div>
          <div className="footer-links">
            <Link href="/shop"><div className="footer-online">ORDER ONLINE</div></Link>
            <Link href="/newsletter"><div className="footer-news">NEWSLETTER</div></Link>
            <Link href="/rewards"><div className="footer-rewards">REWARDS</div></Link>
            <Link href="/helpdesk"><div className="footer-help">HELPDESK</div></Link>
          </div>
        </div>
      </div>
    </div>
  );
}