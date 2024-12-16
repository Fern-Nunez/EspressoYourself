'use client';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import './styles/main.css';

interface User {
  first_name?: string;
  email: string;
  user_id: number;
  is_admin: number | boolean; // Allow for boolean or number depending on backend
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
      username: '',
      password: ''
  });
  const [subscribeStatus, setSubscribeStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });
  const [submitStatus, setSubmitStatus] = useState<{
      type: 'success' | 'error' | null;
      message: string | null;
  }>({ type: null, message: null });

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

  // Clear status message after 3 seconds
  useEffect(() => {
      if (submitStatus.message) {
          const timer = setTimeout(() => {
              setSubmitStatus({ type: null, message: null });
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [submitStatus]);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        console.log("User Data from Session:", parsedUser); // Check if is_admin is present
        setUser(parsedUser);
    }
  }, []);

  const toggleMenu = () => {
      setMenuOpen(!menuOpen);
      setAccountOpen(false);
  };

  const toggleAccount = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAccountOpen(!accountOpen);
      // Clear any existing status messages when opening/closing
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

  const handleSignOut = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    setAccountOpen(false);
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
        
        console.log("Login Data:", data.user); // Log to verify user data
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

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: emailInput.value,
                user_id: user?.user_id // Include user_id if user is signed in
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        setSubscribeStatus({
            type: 'success',
            message: data.message || 'Successfully subscribed to newsletter!'
        });
        emailInput.value = '';

    } catch (error) {
        setSubscribeStatus({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to subscribe'
        });
    }
  };

  return (
    <div>
        <div className="landing">
            <div className={`nav ${scrolled ? "scrolled" : ""}`} id="navbar">
                <div className="logo">
                    <a href="/">
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

            <div className="hero-copy">
                <div className="headline">
                    Brewed to Perfection, Crafted for You
                </div>
                <div className="subline">
                    Sip the extraordinary with every cup.
                </div>
                <a href="/shop">
                    <button className="online-order-button">Order Online</button>
                </a>
            </div>
        </div>

        {/* Menu Overlay */}
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

        <div className="menu">
            <div className="coffee-shop">
                <a href="/shop">
                    <Image 
                        src={"/images/coffee.jpg"}
                        width={200}
                        height={200}
                        alt="Coffee Image"
                        className="coffee-image"
                    />
                    <button className="shop-button">Shop Coffee</button>
                </a>
            </div>

            <div className="bagel-shop">
                <a href="/shop">
                    <Image 
                        src={"/images/bagel.jpg"}
                        width={200}
                        height={200}
                        alt="Bagel Image"
                    />
                    <button className="shop-button">Shop Bagels</button>
                </a>
            </div>

            <div className="brownie-shop">
                <a href="/shop">
                    <Image 
                        src={"/images/brownie.jpg"}
                        width={200}
                        height={200}
                        alt="Brownie Image"
                    />
                    <button className="shop-button">Shop Brownies</button>
                </a>
            </div>
        </div>
      
        <div className="about">
            <div className="about-headline">
                More Than Coffee – A Story of Passion and Craft
            </div>

            <div className="about-subline">
                At Expresso Yourself, we believe every cup of coffee tells a story. From ethically sourced beans to expertly crafted brews, our passion for quality shines in every sip. Whether you're here for a moment of calm or a lively chat, we're dedicated to making your experience memorable.
            </div>
        </div>

        <div className="newsletter-section">
            <div className="newsletter-copy">
                <div className="new-headline">
                    Don't Miss a Drop!
                </div>
                <div className="new-subline">
                    Sign up for our newsletter to enjoy member-only perks and coffee news.
                </div>
                <form className="email-form" onSubmit={handleNewsletterSubmit}>
                    <div className="email-container">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Email Address" 
                            className="email-input" 
                            required 
                        />
                        <button type="submit" className="send-button">Subscribe</button>
                    </div>
                    {subscribeStatus.message && (
                        <div 
                            className={`status-message ${subscribeStatus.type}`}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                textAlign: 'center',
                                backgroundColor: subscribeStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                                color: subscribeStatus.type === 'success' ? '#155724' : '#721c24',
                                border: `1px solid ${subscribeStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                            }}
                        >
                            {subscribeStatus.message}
                        </div>
                    )}
                </form>
            </div>
        </div>

        <div className="footer-section">
            <hr />
            <div className="footer-divider">
                <div className="logo-footer">
                    <Image src={"/images/logo.png"}
                        width={150}
                        height={150}
                        alt="Logo"
                    />
                </div>
                <div className="footer-links">
                    <a href={"/shop"}>
                        <div className="footer-online">
                            ORDER ONLINE
                        </div>
                    </a>
                    <a href={"/newsletter"}>
                        <div className="footer-news">
                            NEWSLETTER
                        </div>
                    </a>
                    <a href={"/rewards"}>
                        <div className="footer-rewards">
                            REWARDS
                        </div>
                    </a>
                    <a href={"/helpdesk"}>
                        <div className="footer-help">
                            HELPDESK
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>
  );
}