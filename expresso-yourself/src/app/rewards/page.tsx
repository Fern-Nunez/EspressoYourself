'use client';
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import './rewards.css';

type User = {
    first_name?: string;
    email: string;
    user_id: number;
    is_admin: number | boolean; // Added is_admin field
};

export default function Rewards() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [points, setPoints] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });

    const [claimStatus, setClaimStatus] = useState<{
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

    const fetchPoints = async (userId: number) => {
        try {
            const response = await fetch(`/api/points?user_id=${userId}`);
            const data = await response.json();

            if (data.success) {
                setPoints(data.points_balance);
            } else {
                console.error('Failed to fetch points:', data.message);
                setPoints(0);
            }
        } catch (error) {
            console.error('Error fetching points:', error);
            setPoints(0);
        }
    };

    useEffect(() => {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            fetchPoints(userData.user_id);
        }
    }, []);

    useEffect(() => {
        if (submitStatus.message) {
            const timer = setTimeout(() => {
                setSubmitStatus({ type: null, message: null });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus]);

    const handleSignOut = () => {
        sessionStorage.removeItem('user');
        setUser(null);
        setAccountOpen(false);
        setPoints(null);
    };

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
            fetchPoints(data.user.user_id);
            setFormData({ username: '', password: '' });
            
        } catch (error) {
            console.error('Login error:', error);
            setSubmitStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Invalid credentials'
            });
        }
    };

    const claimReward = async (rewardType: string) => {
        if (!user) {
            setClaimStatus({
                type: 'error',
                message: 'Please sign in to claim rewards'
            });
            return;
        }
    
        try {
            const response = await fetch('/api/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.user_id,
                    rewardType
                })
            });
    
            const data = await response.json();
    
            if (data.success) {
                setClaimStatus({
                    type: 'success',
                    message: data.message || 'Successfully claimed reward!'
                });
                fetchPoints(user.user_id);
            } else {
                setClaimStatus({
                    type: 'error',
                    message: data.message || 'Failed to claim reward'
                });
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
            setClaimStatus({
                type: 'error',
                message: 'Failed to claim reward. Please try again.'
            });
        }

        setTimeout(() => {
            setClaimStatus({ type: null, message: null });
        }, 3000);
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
                            Sip, Score, Repeat – Join Our Rewards!
                        </div>
                        <div className='subline'>
                            Every coffee, bagel, and brownie gets you closer to a reward!
                        </div>
                    </div>
                    <div className='right'>
                        <div className='points-section'>
                            {user ? (
                                <>
                                    <div className='points-num'>
                                        {points !== null ? points : 'Loading...'}
                                    </div>
                                    <div className='points-text'>
                                        POINTS
                                    </div>
                                </>
                            ) : (
                                <div className='points-text'>Sign in to view points</div>
                            )}
                        </div>

                        <hr className='line'></hr>

                        <div className='rewards'>
                            <div className='reward-title'>COFFEE</div>
                            <div className='rewards-extra'>
                                <div className='reward-price'>35</div>
                                <button className="claim-reward" onClick={() => claimReward('COFFEE')}>
                                    CLAIM
                                </button>
                            </div>
                        </div>
                        <hr className='line-divider'></hr>
                        <div className='rewards'>
                            <div className='reward-title'>BAGEL</div>
                            <div className='rewards-extra'>
                                <div className='reward-price'>40</div>
                                <button className="claim-reward" onClick={() => claimReward('BAGEL')}>
                                    CLAIM
                                </button>
                            </div>
                        </div>
                        <hr className='line-divider'></hr>
                        <div className='rewards'>
                            <div className='reward-title'>BROWNIE</div>
                            <div className='rewards-extra'>
                                <div className='reward-price'>50</div>
                                <button className="claim-reward" onClick={() => claimReward('BROWNIE')}>
                                    CLAIM
                                </button>
                            </div>
                        </div>
                        <hr className='line-divider'></hr>
                        
                        {claimStatus.message && (
                            <div className='notification-container'>
                                <div 
                                    className={`status-message ${claimStatus.type}`}
                                >
                                    {claimStatus.message}
                                </div>
                            </div>
                        )}
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