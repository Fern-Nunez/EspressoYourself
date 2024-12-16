'use client';
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import './helpdesk.css';

type User = {
    first_name?: string;
    email: string;
    user_id: number;
    is_admin: number | boolean; // Added is_admin field
};

export default function HelpDesk() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [helpdeskStatus, setHelpdeskStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        
        document.body.style.overflow = menuOpen ? "hidden" : "auto";

        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.body.style.overflow = "auto";
        };
    }, [menuOpen]);

    // Check for existing user session
    useEffect(() => {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Clear status message after 3 seconds
    useEffect(() => {
        if (submitStatus.message) {
            const timer = setTimeout(() => {
                setSubmitStatus({ type: null, message: null });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus]);

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

    const handleHelpdeskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const nameInput = form.elements.namedItem('name') as HTMLInputElement;
        const emailInput = form.elements.namedItem('email') as HTMLInputElement;
        const issueInput = form.elements.namedItem('issue') as HTMLTextAreaElement;
    
        try {
            const response = await fetch('/api/helpdesk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: user ? (user.first_name || user.email) : nameInput.value,
                    email: user ? user.email : emailInput.value,
                    issue: issueInput.value,
                    user_id: user?.user_id // Include user_id if user is signed in
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit help ticket');
            }
    
            setHelpdeskStatus({
                type: 'success',
                message: data.ticketId 
                    ? `${data.message} Your ticket ID is #${data.ticketId}`
                    : data.message
            });
    
            // Clear form
            nameInput.value = '';
            emailInput.value = '';
            issueInput.value = '';
    
            // Clear success message after 3 seconds
            setTimeout(() => {
                setHelpdeskStatus({ type: null, message: null });
            }, 3000);
    
        } catch (error) {
            console.error('Helpdesk submission error:', error);
            setHelpdeskStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to submit help ticket'
            });
        }
    };

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

    return (
        <div>
            <div className="landing">
                <div className={`nav ${scrolled ? "scrolled" : ""}`} id="navbar">
                    <div className="logo">
                        <a href={"/"}>
                            <Image 
                                src={scrolled ? "/images/logo-black.png" : "/images/logo.png"} 
                                width={80} 
                                height={80} 
                                alt="Logo" 
                            />
                        </a>
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

                <div className="copy">
                    <div className='left'>
                        <div className='main-text'>
                            Got a Latte Questions? We're Here to Brew Up Some Answers!
                        </div>
                        <div className='subline'>
                            Whether you're curious about your coffee order, need help with our website, or just want to chat, we've got you covered.
                        </div>
                    </div>
                    <div className='right'>
                        <form className="contact-form" onSubmit={handleHelpdeskSubmit}>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    className='name-input-help' 
                                    placeholder='Name' 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    className='email-input-help' 
                                    placeholder='Email Address' 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <textarea 
                                    id="issue" 
                                    name="issue" 
                                    className='issue-input-help' 
                                    placeholder='Issue' 
                                    required 
                                />
                            </div>

                            <button type="submit" className="send-button-help">SEND</button>

                            {helpdeskStatus.message && (
                                <div 
                                    className={`status-message ${helpdeskStatus.type}`}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        backgroundColor: helpdeskStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                                        color: helpdeskStatus.type === 'success' ? '#155724' : '#721c24',
                                        border: `1px solid ${helpdeskStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                                    }}
                                >
                                    {helpdeskStatus.message}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {menuOpen && (
                <div className="menu-overlay">
                    <div className="close-icon" onClick={toggleMenu}>
                        <Image src="/icons/x.png" width={30} height={30} alt="Close Menu" />
                    </div>
                    <ul className="menu-list">
                        <li><a href="/shop">ORDER ONLINE</a></li>
                        <li><a href="/newsletter">NEWSLETTER</a></li>
                        <li><a href="/rewards">REWARDS</a></li>
                        <li><a href="/helpdesk">HELPDESK</a></li>
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
                        <a href="/shop">
                            <div className="footer-online">ORDER ONLINE</div>
                        </a>
                        <a href="/newsletter">
                            <div className="footer-news">NEWSLETTER</div>
                        </a>
                        <a href="/rewards">
                            <div className="footer-rewards">REWARDS</div>
                        </a>
                        <a href="/helpdesk">
                            <div className="footer-help">HELPDESK</div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}