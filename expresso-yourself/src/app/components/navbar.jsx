'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from './Navbar.module.css';

interface User {
  first_name?: string;
  email: string;
  user_id: number;
  is_admin: number | boolean;
}

interface NavbarProps {
  scrolled?: boolean;
  onMenuToggle?: (isOpen: boolean) => void;
}

// Create Navbar.module.css in the same directory with these styles
const cssContent = `
.nav {
    display: flex;
    align-items: center;
    position: fixed;
    top: 0;
    width: 100%;
    background-color: transparent;
    transition: background-color 0.3s ease;
    z-index: 10000;
}

.nav.scrolled {
    background-color: white;
    color: black;
}

.logo {
    padding: 15px;
}

.navRight {
    display: flex;
    margin-left: auto;
    justify-content: flex-end;
    gap: 20px;
    margin-right: 20px;
}

.menuOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #8FA88F;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10010;
    transition: 0.3s ease;
}

.menuList {
    list-style: none;
    padding: 0;
}

.menuList li {
    font-size: 6rem;
    margin-left: -20rem;
}

.menuList a {
    color: white;
    text-decoration: none;
    font-weight: bold;
}

.menuList a:hover {
    text-decoration: underline;
}

.closeIcon {
    position: absolute;
    top: 40px;
    right: 40px;
    cursor: pointer;
}
`;

export default function Navbar({ scrolled: propScrolled, onMenuToggle }: NavbarProps) {
  const [scrolled, setScrolled] = useState(propScrolled || false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  useEffect(() => {
    if (propScrolled === undefined) {
      const handleScroll = () => {
        setScrolled(window.scrollY > 0);
      };

      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [propScrolled]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    if (onMenuToggle) {
      onMenuToggle(menuOpen);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen, onMenuToggle]);

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
      setUser(parsedUser);
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

  return (
    <>
      <div className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`} id="navbar">
        <div className={styles.logo}>
          <a href="/">
            <Image 
              src={scrolled ? "/images/logo-black.png" : "/images/logo.png"} 
              width={80} 
              height={80} 
              alt="Logo" 
            />
          </a>
        </div>
        <div className={styles.navRight}>
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

      {menuOpen && (
        <div className={styles.menuOverlay}>
          <div className={styles.closeIcon} onClick={toggleMenu}>
            <Image src="/icons/x.png" width={30} height={30} alt="Close Menu" />
          </div>
          <ul className={styles.menuList}>
            <li><a href="/shop">ORDER ONLINE</a></li>
            <li><a href="/newsletter">NEWSLETTER</a></li>
            <li><a href="/rewards">REWARDS</a></li>
            <li><a href="/helpdesk">HELPDESK</a></li>
          </ul>
        </div>
      )}
    </>
  );
}