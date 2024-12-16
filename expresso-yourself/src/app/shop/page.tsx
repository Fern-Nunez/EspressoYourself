'use client';

import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import './shop.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface User {
  first_name?: string;
  email: string;
  user_id: number;
  is_admin: number | boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface OrderResponse {
  success: boolean;
  message?: string;
  points_earned?: number;
}

export default function Shop() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  // Product data with categories
  const [products] = useState([
    { id: 1, name: 'Coffee', price: 3.99, image: '/images/coffee-shop.jpg', category: 'Coffee' },
    { id: 2, name: 'Bagel', price: 2.99, image: '/images/bagel-shop.jpg', category: 'Bagels' },
    { id: 3, name: 'Brownie', price: 4.29, image: '/images/brownie-shop.jpg', category: 'Brownies' },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Calculate total items in cart
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);

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
        setUser(JSON.parse(savedUser));
    }
}, []);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle account dropdown
      const accountDropdown = document.querySelector('.account-dropdown');
      const accountIcon = document.querySelector('.account-icon-container');
      
      if (accountDropdown && accountIcon) {
        if (!accountDropdown.contains(event.target as Node) && 
            !accountIcon.contains(event.target as Node)) {
          setAccountOpen(false);
          setSubmitStatus({ type: null, message: null });
        }
      }

      // Handle cart dropdown
      const cartDropdown = document.querySelector('.cart-dropdown');
      const cartIcon = document.querySelector('.cart-icon-container');
      
      if (cartDropdown && cartIcon) {
        if (!cartDropdown.contains(event.target as Node) && 
            !cartIcon.contains(event.target as Node)) {
          setCartOpen(false);
        }
      }
    };

    if (accountOpen || cartOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [accountOpen, cartOpen]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setAccountOpen(false);
    setCartOpen(false);
  };
  

  const toggleAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountOpen(!accountOpen);
    setCartOpen(false);
    setSubmitStatus({ type: null, message: null });
  };

  const toggleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartOpen(!cartOpen);
    setAccountOpen(false);
  };

  const handleAccountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCartClick = (e: React.MouseEvent) => {
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

const handleFilterClick = (category: string): void => {
  setSelectedCategory(category);
};

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory);

    const addToCart = (product: Product): void => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevCart, {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
          }];
        }
      });
    };

    const removeFromCart = (productId: number): void => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === productId);
        
        if (existingItem?.quantity === 1) {
          return prevCart.filter(item => item.id !== productId);
        } else {
          return prevCart.map(item =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        }
      });
    };

  const clearCart = () => {
    setCart([]);
    setCartOpen(false);
  };

  const handleCheckout = async () => {
    if (!user) {
        setSubmitStatus({
            type: 'error',
            message: 'Please sign in to complete your order'
        });
        setCartOpen(false);
        setAccountOpen(true);
        return;
    }

    try {
        const orderData = {
            user_id: user.user_id,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            })),
            payment_method: 'CREDIT_CARD'
        };

        const response = await fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (result.success) {
            clearCart();
            setCartOpen(false);
            setSubmitStatus({
                type: 'success',
                message: `Order placed successfully! You earned ${result.points_earned} points!`
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        setSubmitStatus({
            type: 'error',
            message: error instanceof Error ? error.message : 'Error placing order'
        });
    }
};

  return (
    <div>
      <div className="landing">
        <div className={`nav ${scrolled ? "scrolled" : ""}`} id="navbar">
          <div className="logo">
            <a href={"/"}>
              <Image 
                src="/images/logo-black.png"
                width={80} 
                height={80} 
                alt="Logo" 
              />
            </a>
          </div>
          <div className="nav-right">
            <div className="cart-icon-container" onClick={toggleCart}>
              <div className="cart-icon-wrapper">
                <Image 
                  src="/icons/cart.png" 
                  width={30} 
                  height={30} 
                  alt="Cart Icon" 
                />
                {cartItemCount > 0 && (
                  <span className="cart-badge">{cartItemCount}</span>
                )}
              </div>
              {cartOpen && (
  <div 
    className="cart-dropdown"
    onClick={handleCartClick}
  >
    <div className="cart-header">
      <h3>Shopping Cart</h3>
      {cart.length > 0 && (
        <button onClick={clearCart} className="clear-cart-button">
          Clear Cart
        </button>
      )}
    </div>
    
    {submitStatus.message && (
      <div className={`status-message ${submitStatus.type}`}>
        {submitStatus.message}
      </div>
    )}
    
    {cart.length === 0 ? (
      <div className="empty-cart-message">
        Your cart is empty
      </div>
    ) : (
      <>
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <Image 
                  src={item.image}
                  width={50}
                  height={50}
                  alt={item.name}
                  priority
                  onError={() => {
                    // Next.js Image component handles errors differently
                    // You might want to use a state to track the error and show fallback
                    const fallbackSrc = '/images/placeholder.jpg';
                    return fallbackSrc;
                  }}
                />
              </div>
              <div className="cart-item-details">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
              <div className="cart-item-quantity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(item.id);
                  }}
                  className="quantity-button"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const product = products.find(p => p.id === item.id);
                    if (product) addToCart(product);
                  }}
                  className="quantity-button"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <div className="cart-total">
            Total: ${cartTotal.toFixed(2)}
          </div>
          <button 
  onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user) {
      setSubmitStatus({
        type: 'error',
        message: 'Please sign in to complete your order'
      });
      setCartOpen(false);
      setAccountOpen(true);
      return;
    }
    
    try {
      const orderData = {
        user_id: user.user_id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        payment_method: 'CREDIT_CARD' as const
      };

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json() as OrderResponse;
      
      if (result.success) {
        clearCart();
        setCartOpen(false);
        setSubmitStatus({
          type: 'success',
          message: `Order placed successfully! You earned ${result.points_earned ?? 0} points!`
        });
      } else {
        throw new Error(result.message || 'Order failed');
      }
    } catch (error: unknown) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error placing order'
      });
    }
  }}
  className="checkout-button"
>
  Checkout
</button>
        </div>
      </>
    )}
  </div>
)}
            </div>
            <div className="account-icon-container" onClick={toggleAccount}>
              <Image 
                src="/icons/person-black.png" 
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
                src={menuOpen ? "/icons/x.png" : "/icons/menu-black.png"} 
                width={30} 
                height={30} 
                alt="Menu Icon" 
              />
            </div>
          </div>
        </div>

        <div className="copy">
          <div className='left'>
            <div className='filters-text'>FILTERS</div>
            <hr className='line-divider' />
            <div className='menu-button' onClick={() => handleFilterClick('All')}>ALL</div>
            <div className='menu-button' onClick={() => handleFilterClick('Coffee')}>COFFEE</div>
            <div className='menu-button' onClick={() => handleFilterClick('Bagels')}>BAGELS</div>
            <div className='menu-button' onClick={() => handleFilterClick('Brownies')}>BROWNIES</div>
          </div>

          <div className='right'>
            {filteredProducts.map((product) => (
              <div className='item-container' key={product.id}>
                <div className="item-shop">
                  <Image 
                    src={product.image}
                    width={200}
                    height={200}
                    alt={`${product.name} Image`}
                    className="item-image"
                  />
                </div>
                <div className='item-details'>
                  <div className='top'>
                    <div className='title'>{product.name.toUpperCase()}</div>
                    <div className='price'>${product.price.toFixed(2)}</div>
                  </div>
                  <div className='middle'>
                    {product.category === 'Coffee' ? 'Rich, smooth, and expertly brewed' :
                    product.category === 'Bagels' ? 'Freshly baked and lightly toasted' :
                    'Fudgy with a rich chocolate flavor'}
                  </div>
                  <div className='bottom'>
                    <button 
                      onClick={() => removeFromCart(product.id)} 
                      disabled={!cart.find(item => item.id === product.id)}
                    >
                      -
                    </button>
                    <span>
                      {cart.find(item => item.id === product.id)?.quantity || 0}
                    </span>
                    <button onClick={() => addToCart(product)}>+</button>
                  </div>
                </div>
              </div>
            ))}
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
        <hr className='line' />
        <div className="footer-divider">
          <div className="logo-footer">
            <Image src={"/images/logo-black.png"} width={150} height={150} alt="Logo" />
          </div>
          <div className="footer-links">
            <a href={"/shop"}><div className="footer-online">ORDER ONLINE</div></a>
            <a href={"/newsletter"}><div className="footer-news">NEWSLETTER</div></a>
            <a href={"/rewards"}><div className="footer-rewards">REWARDS</div></a>
            <a href={"/helpdesk"}><div className="footer-help">HELPDESK</div></a>
          </div>
        </div>
      </div>
    </div>
  );
}