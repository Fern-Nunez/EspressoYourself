'use client';
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Link from 'next/link';
import './orders.css';

type User = {
    first_name?: string;
    email: string;
    user_id: number;
    is_admin: number | boolean;
};

interface OrderItem {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

interface Order {
    orderNumber: string;
    items: OrderItem[];
    subtotal: number;
    orderDate: string;
    readyTime: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
}

export default function Orders() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });

    const formatTime = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return 'Invalid time';
        }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.user_id) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`/api/orders?userId=${user.user_id}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data?.orders) {
                    throw new Error('Invalid response format');
                }
                
                setOrders(data.orders);
                
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch orders');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
    
        fetchOrders();
    }, [user?.user_id]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 0);
        };

        window.addEventListener("scroll", handleScroll);
        document.body.style.overflow = menuOpen ? "hidden" : "auto";

        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.body.style.overflow = "auto";
        };
    }, [menuOpen]);

    useEffect(() => {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const dropdown = document.querySelector('.account-dropdown');
            const accountIcon = document.querySelector('.account-icon-container');
            
            if (dropdown && accountIcon) {
                if (!dropdown.contains(event.target as Node) && 
                    !accountIcon.contains(event.target as Node)) {
                    setAccountOpen(false);
                    setSubmitStatus({ type: null, message: null });
                }
            }
        };

        if (accountOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [accountOpen]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        setAccountOpen(false);
    };

    const toggleAccount = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAccountOpen(!accountOpen);
        setSubmitStatus({ type: null, message: null });
    };

    const handleAccountClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleSignOut = () => {
        sessionStorage.removeItem('user');
        setUser(null);
        setAccountOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message);
            }
            
            setSubmitStatus({
                type: 'success',
                message: data.message
            });
            
            sessionStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            setFormData({ username: '', password: '' });
            
        } catch (error) {
            console.error('Login error:', error);
            setSubmitStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Invalid credentials'
            });
        }
    };

    const renderOrderCard = (order: Order) => (
        <div key={order.orderNumber} className="order-card">
            <div className="order-header">
                <span className="order-number">Order {order.orderNumber}</span>
                <div className="order-info">
                    <span className="order-time">
                        Ordered at: {formatTime(order.orderDate)}
                    </span>
                </div>
            </div>

            <div className="order-items">
                {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                        <div className="item-details">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">×{item.quantity}</span>
                        </div>
                        
                    </div>
                ))}
            </div>

            <div className="order-footer">
                <div className="order-total">
                    <span>Total:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="ready-time">
                    <span>Ready by:</span>
                    <span>{formatTime(order.readyTime)}</span>
                </div>
            </div>
        </div>
    );

    const renderOrders = () => {
        if (loading) {
            return <p className="loading">Loading your orders...</p>;
        }

        if (error) {
            return <p className="error">Error: {error}</p>;
        }

        if (!user) {
            return <p className="no-orders">Please sign in to view your orders.</p>;
        }

        if (orders.length === 0) {
            return <p className="no-orders">No orders found.</p>;
        }

        return (
            <div className="orders-list">
                {orders.map(renderOrderCard)}
            </div>
        );
    };

    return (
        <div>
            <div className={`nav ${scrolled ? "scrolled" : ""}`} id="navbar">
                <div className="logo">
                    <Link href="/">
                        <Image 
                            src={scrolled ? "/images/logo-black.png" : "/images/logo.png"} 
                            width={80} 
                            height={80} 
                            alt="Logo" 
                        />
                    </Link>
                </div>
                <div className="nav-right">
                    <div className="account-icon-container" onClick={toggleAccount}>
                        <Image 
                            src={scrolled ? "/icons/person-black.png" : "/icons/person.png"} 
                            width={30} 
                            height={30} 
                            alt="Person Icon" 
                        />
                        {accountOpen && (
                            <div 
                                className="account-dropdown"
                                onClick={handleAccountClick}
                            >
                                {user ? (
                                    <div>
                                        <div className="account-welcome">
                                            Welcome back, {user.first_name || user.email}!
                                        </div>
                                        <button 
                                            onClick={handleSignOut}
                                            className="sign-in-button"
                                            style={{ marginTop: '10px' }}
                                        >
                                            Sign Out
                                        </button>
                                        {user.is_admin === 1 || user.is_admin === true ? (
                                            <button 
                                                className="admin-panel-button"
                                                onClick={() => window.location.href = '/admin'}
                                                style={{ marginTop: '10px' }}
                                            >
                                                Admin Panel
                                            </button>
                                        ) : (
                                            <button 
                                                className="my-orders-button"
                                                onClick={() => window.location.href = '/orders'}
                                                style={{ marginTop: '10px' }}
                                            >
                                                My Orders
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="account-welcome">Welcome Back!</div>
                                        {submitStatus.message && (
                                            <div className={`status-message ${submitStatus.type}`}>
                                                {submitStatus.message}
                                            </div>
                                        )}
                                        <form onSubmit={handleSubmit}>
                                            <div className="account-form-group">
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    placeholder="Username"
                                                    className="account-input"
                                                    required
                                                />
                                            </div>
                                            <div className="account-form-group">
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    placeholder="Password"
                                                    className="account-input"
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="sign-in-button">
                                                Sign In
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div onClick={toggleMenu} style={{ cursor: "pointer" }}>
                        <Image 
                            src={menuOpen ? "/icons/x.png" : scrolled ? "/icons/menu-black.png" : "/icons/menu.png"} 
                            width={30} 
                            height={30} 
                            alt="Menu Icon" 
                        />
                    </div>
                </div>
            </div>

            <div className="landing">
                <div className="copy">
                    <div className='top'>
                        <div className='title'>
                            My Orders
                        </div>
                        <hr className='top-line' />
                    </div>
                    <div className="orders-container">
                        {renderOrders()}
                    </div>
                </div>
            </div>

            {menuOpen && (
                <div className="menu-overlay">
                    <div className="close-icon" onClick={toggleMenu}>
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

            <div className="footer-section">
                <hr />
                <div className="footer-divider">
                    <div className="logo-footer">
                        <Image 
                            src="/images/logo.png"
                            width={150}
                            height={150}
                            alt="Logo"
                        />
                    </div>
                    <div className="footer-links">
                        <Link href="/shop">
                            <div className="footer-online">ORDER ONLINE</div>
                        </Link>
                        <Link href="/newsletter">
                            <div className="footer-news">NEWSLETTER</div>
                        </Link>
                        <Link href="/rewards">
                            <div className="footer-rewards">REWARDS</div>
                        </Link>
                        <Link href="/helpdesk">
                            <div className="footer-help">HELPDESK</div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}