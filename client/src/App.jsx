import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ArrowRight, Award, ChefHat, Check, CheckCircle, Circle, Clock, Cpu, Globe, LogOut,
  Minus, Package, Plus, RefreshCw, Search, ShoppingBag, Truck, Utensils, Wifi, X,
  Star, Flame, Leaf, Info, AlertCircle, Shield, Activity, Server, Zap, Settings,
  List, Grid, ChevronRight, Eye, EyeOff, Edit, Trash2, ChevronDown, User
} from 'lucide-react';
import { api, getToken, setToken, clearToken, money, BASE_URL } from './api.js';

// ============================================================
// DFA State Configuration (mirrors backend)
// ============================================================
const DFA_STATES = {
  S0: { label: 'Order Created', color: 'var(--s0)', emoji: '📋', icon: Package, desc: 'Order placed and queued for review.' },
  S1: { label: 'Order Confirmed', color: 'var(--s1)', emoji: '✅', icon: Check, desc: 'Restaurant accepted your order.' },
  S2: { label: 'Food Preparation Started', color: 'var(--s2)', emoji: '🍳', icon: ChefHat, desc: 'Chef is cooking your food.' },
  S3: { label: 'Food Prepared', color: 'var(--s3)', emoji: '🎁', icon: CheckCircle, desc: 'Your food is packed and ready.' },
  S4: { label: 'Out for Delivery', color: 'var(--s4)', emoji: '🛵', icon: Truck, desc: 'On the way to your doorstep!' },
  S5: { label: 'Delivered', color: 'var(--s5)', emoji: '🎉', icon: CheckCircle, desc: 'Order delivered successfully!' },
  S6: { label: 'Cancelled', color: 'var(--s6)', emoji: '↩', icon: X, desc: 'Order was cancelled.' }
};

const DFA_TRANSITIONS = {
  S0: { confirm: 'S1', cancel: 'S6' },
  S1: { start_preparation: 'S2', cancel: 'S6' },
  S2: { food_ready: 'S3' },
  S3: { dispatch: 'S4' },
  S4: { deliver: 'S5' },
  S5: {},
  S6: {}
};

const ADMIN_ACTIONS = {
  S0: { action: 'confirm', label: 'Accept Order', icon: Check, variant: 'primary' },
  S1: { action: 'start_preparation', label: 'Start Cooking', icon: ChefHat, variant: 'primary' },
  S2: { action: 'food_ready', label: 'Mark Food Ready', icon: Package, variant: 'primary' },
  S3: { action: 'dispatch', label: 'Dispatch', icon: Truck, variant: 'primary' },
  S4: { action: 'deliver', label: 'Mark Delivered', icon: Check, variant: 'primary' }
};

const TRACKING_STAGES = [
  { state: 'S0', label: 'Order Placed', desc: 'Your order is in the kitchen queue.', emoji: '📋' },
  { state: 'S1', label: 'Order Confirmed', desc: 'Restaurant has accepted your order.', emoji: '✅' },
  { state: 'S2', label: 'Preparing Food', desc: 'Your food is being freshly cooked.', emoji: '🍳' },
  { state: 'S3', label: 'Food Ready', desc: 'Packed and ready for pickup.', emoji: '🎁' },
  { state: 'S4', label: 'Out for Delivery', desc: 'Rider is on the way to you.', emoji: '🛵' },
  { state: 'S5', label: 'Delivered!', desc: 'Enjoy your meal. Bon appétit!', emoji: '🎉' }
];

const STATE_CLASS = s => `state-${s.toLowerCase()}`;

// ============================================================
// App Root
// ============================================================
function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('food-dfa-user') || 'null'); } catch { return null; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('food-dfa-cart') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Persist cart to localStorage
  useEffect(() => { localStorage.setItem('food-dfa-cart', JSON.stringify(cart)); }, [cart]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3800);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  function login(payload) {
    setToken(payload.token);
    localStorage.setItem('food-dfa-user', JSON.stringify(payload.user));
    setUser(payload.user);
  }

  function logout() {
    clearToken();
    localStorage.removeItem('food-dfa-user');
    localStorage.removeItem('food-dfa-cart');
    setUser(null);
    setCart([]);
    navigate('/');
    notify('You have been signed out.', 'info');
  }

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(r => r._id === item._id);
      return existing
        ? prev.map(r => r._id === item._id ? { ...r, quantity: Math.min(20, r.quantity + 1) } : r)
        : [...prev, { ...item, quantity: 1 }];
    });
    notify(`${item.name} added to your bag 🛍️`, 'success');
  }

  function changeQty(id, delta) {
    setCart(prev => prev.map(r => r._id === id ? { ...r, quantity: r.quantity + delta } : r).filter(r => r.quantity > 0));
  }

  const cartCount = cart.reduce((s, r) => s + r.quantity, 0);

  return (
    <>
      <Navbar user={user} cartCount={cartCount} onLogout={logout} onCartOpen={() => setCartOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage addToCart={addToCart} user={user} />} />
        <Route path="/login" element={<AuthPage mode="login" onLogin={login} />} />
        <Route path="/register" element={<AuthPage mode="register" onLogin={login} />} />
        <Route path="/orders" element={<OrdersPage user={user} />} />
        <Route path="/orders/:id" element={<TrackingPage user={user} notify={notify} />} />
        <Route path="/admin" element={<AdminPage user={user} notify={notify} />} />
        <Route path="/dfa" element={<DfaPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SiteFooter />
      {cartOpen && (
        <CartDrawer
          cart={cart}
          changeQty={changeQty}
          user={user}
          notify={notify}
          onClose={() => setCartOpen(false)}
          onOrderPlaced={(order) => {
            setCart([]);
            setCartOpen(false);
            navigate(`/orders/${order._id}`);
            notify('🎉 Order placed! Tracking your delivery in real-time.', 'success');
          }}
        />
      )}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
          <span className="toast-icon">{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          {toast.msg}
          <button className="toast-close" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}
    </>
  );
}

// ============================================================
// Navbar
// ============================================================
function Navbar({ user, cartCount, onLogout, onCartOpen }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <header className="navbar" style={{ boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.1)' : '' }}>
      <div className="shell nav-inner">
        <Link to="/" className="nav-brand">
          <div className="brand-icon">🍔</div>
          <div>
            <div className="brand-text">DFA <span>Food</span>Express</div>
            <div className="brand-sub">CN · FLAT · FSWD</div>
          </div>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>🍽️ Menu</NavLink>
          {user && <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>📦 My Orders</NavLink>}
          <NavLink to="/dfa" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>🤖 DFA Engine</NavLink>
          <NavLink to="/network" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>🌐 Networks</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>⚙️ Dashboard</NavLink>}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <div className="user-pill">
                <div className="avatar-initials">{initials}</div>
                <span>{user.name.split(' ')[0]}</span>
                {user.role === 'admin' && <span style={{ fontSize: '0.7rem', color: 'var(--brand)' }}>Admin</span>}
              </div>
              <button className="icon-btn" onClick={onLogout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-signin">Sign In <ArrowRight size={14} /></Link>
          )}
          <button className="cart-btn" onClick={onCartOpen} aria-label="Open Cart">
            <ShoppingBag size={17} />
            <span>Bag</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Home Page
// ============================================================
function HomePage({ addToCart, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api('/foods').then(({ items }) => { if (alive) setItems(items); }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => ['All', ...new Set(items.map(i => i.category))], [items]);

  const visible = useMemo(() =>
    items.filter(item =>
      (category === 'All' || item.category === category) &&
      (!vegOnly || item.isVeg) &&
      (!search || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase()))
    ), [items, category, vegOnly, search]);

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="shell hero-inner">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="hero-dot" /> REAL-TIME DFA ORDER TRACKING
            </div>
            <h1>
              Delicious Food,<br />
              <em>Delivered Right.</em>
            </h1>
            <p className="hero-desc">
              Fresh meals crafted with care — every order tracked through a Deterministic Finite Automaton
              that guarantees every delivery step is validated and logged.
            </p>
            <div className="hero-cta">
              <a href="#menu" className="btn btn-primary btn-lg">
                Browse Menu <ArrowRight size={18} />
              </a>
              <Link to="/dfa" className="btn btn-secondary btn-lg">
                See DFA in Action <Cpu size={16} />
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">7</div>
                <div className="hero-stat-label">DFA States</div>
              </div>
              <div>
                <div className="hero-stat-num">6</div>
                <div className="hero-stat-label">Alphabet Symbols</div>
              </div>
              <div>
                <div className="hero-stat-num">100%</div>
                <div className="hero-stat-label">State-Validated</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-img-wrap">
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=90" alt="Delicious fresh food" />
            </div>
            <div className="hero-float">
              <div className="hero-float-icon">🤖</div>
              <div>
                <strong>DFA-Validated</strong>
                <small>Every order transition verified</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promise Bar */}
      <div className="promise-bar">
        <div className="shell promise-items">
          <div className="promise-item"><Flame size={16} /> Made Fresh to Order</div>
          <div className="promise-item"><Truck size={16} /> Real-Time GPS Tracking</div>
          <div className="promise-item"><Shield size={16} /> DFA State-Validated</div>
          <div className="promise-item"><Zap size={16} /> WebSocket Live Updates</div>
          <div className="promise-item"><Star size={16} /> 4.9 ★ Rated</div>
        </div>
      </div>

      {/* Menu */}
      <section className="menu-section" id="menu">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">THE MENU</div>
              <h2 className="section-title">Find Your <em>Favourite.</em></h2>
              <p className="section-desc">Every order is tracked through our DFA validation engine.</p>
            </div>
          </div>

          <div className="search-filter-bar">
            <div className="search-box">
              <Search size={16} />
              <input className="search-input" placeholder="Search pizza, burgers, bowls..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className={`btn btn-sm ${vegOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setVegOnly(!vegOnly)}>
              <Leaf size={14} /> {vegOnly ? 'All Items' : 'Veg Only'}
            </button>
          </div>

          <div className="filter-tags" style={{ marginBottom: 24 }}>
            {categories.map(cat => (
              <button key={cat} className={`filter-tag ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-state"><RefreshCw size={20} className="spin" /> Loading delicious options…</div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">❌</div>
              <h3>Menu couldn't load</h3>
              <p>{error}. Make sure the API server is running on port 4000.</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No items found</h3>
              <p>Try a different search or filter combination.</p>
              <button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory('All'); setVegOnly(false); }}>Reset filters</button>
            </div>
          ) : (
            <div className="food-grid">
              {visible.map((item, i) => <FoodCard key={item._id} item={item} index={i} onAdd={() => addToCart(item)} />)}
            </div>
          )}
        </div>
      </section>

      {/* DFA promo section */}
      <section style={{ background: 'var(--text)', color: 'white', padding: '70px 0' }}>
        <div className="shell" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: 1, marginBottom: 12 }}>FLAT — FORMAL LANGUAGES & AUTOMATA THEORY</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>Every order follows a<br /><span style={{ color: 'var(--brand)' }}>deterministic path.</span></h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.65 }}>
              Our DFA M = (Q, Σ, δ, q₀, F) validates every status update. With 7 states and 6 input symbols,
              no order can skip steps, go backwards, or transition after reaching a terminal state.
            </p>
            <Link to="/dfa" className="btn btn-primary">Explore the DFA <ChevronRight size={16} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {Object.entries(DFA_STATES).map(([key, val]) => (
              <div key={key} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '1.4rem' }}>{val.emoji}</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 6 }}>{key}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{val.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function FoodCard({ item, index, onAdd }) {
  return (
    <article className="food-card fade-in" style={{ '--delay': `${index * 50}ms` }}>
      <div className="food-photo">
        <img
          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85'}
          alt={item.name}
          loading="lazy"
        />
        <span className={`food-badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
          {item.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}
        </span>
        <span className="badge-cat">{item.category}</span>
      </div>
      <div className="food-info">
        <div className="food-name">{item.name}</div>
        <p className="food-desc">{item.description}</p>
        <div className="food-meta">
          <span className="food-rating"><Star size={12} fill="currentColor" /> {item.rating || '4.8'}</span>
          <span className="food-prep"><Clock size={11} /> {item.prepTimeMinutes || 15} mins</span>
        </div>
        <div className="food-footer">
          <span className="food-price">{money(item.price)}</span>
          <button className="add-btn" onClick={onAdd} aria-label={`Add ${item.name} to cart`}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// Cart Drawer
// ============================================================
function CartDrawer({ cart, changeQty, user, notify, onClose, onOrderPlaced }) {
  const [loading, setLoading] = useState(false);
  const total = cart.reduce((s, r) => s + r.price * r.quantity, 0);

  async function placeOrder() {
    if (!user) { onClose(); window.location.href = '/login'; return; }
    setLoading(true);
    try {
      const { order } = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({ items: cart.map(({ _id, quantity }) => ({ foodId: _id, quantity })) })
      });
      onOrderPlaced(order);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2>Your Bag <span>{cart.reduce((n, r) => n + r.quantity, 0)}</span></h2>
            {!user && <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginTop: 4 }}>Sign in to place your order</p>}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h3>Your bag is empty</h3>
              <p>Add something delicious from the menu!</p>
              <button className="btn btn-secondary" onClick={onClose}>Browse Menu</button>
            </div>
          ) : cart.map(item => (
            <div className="cart-item" key={item._id}>
              <img className="cart-item-img" src={item.image || ''} alt={item.name} />
              <div className="cart-item-main">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{money(item.price)}</div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => changeQty(item._id, -1)}><Minus size={12} /></button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(item._id, 1)}><Plus size={12} /></button>
                </div>
              </div>
              <div className="cart-item-total">{money(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="total-row"><span>Subtotal</span><span>{money(total)}</span></div>
            <div className="total-row"><span>Delivery</span><span style={{ color: 'var(--success)' }}>FREE 🎉</span></div>
            <div className="total-row final"><span>Total</span><span className="total-val">{money(total)}</span></div>
            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 16 }} onClick={placeOrder} disabled={loading}>
              {loading ? <><RefreshCw size={16} className="spin" /> Placing order…</> : <>Place Order <ArrowRight size={16} /></>}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
              {user ? '🤖 Order will be tracked by DFA engine' : '🔑 Sign in required to checkout'}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ============================================================
// Auth Page
// ============================================================
function AuthPage({ mode, onLogin }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());

    if (!isLogin && body.password !== body.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    delete body.confirmPassword;

    try {
      const payload = await api(`/auth/${isLogin ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify(body) });
      onLogin(payload);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function demoLogin(role) {
    setDemoLoading(true);
    setError('');
    try {
      const creds = await api('/auth/demo-credentials');
      const demoUser = role === 'admin' ? creds.admin : creds.customer;
      const payload = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoUser.email, password: demoUser.password })
      });
      onLogin(payload);
      navigate(role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=90" alt="Food" />
        <div className="auth-art-overlay">
          <div className="auth-art-quote">
            <h2>"Good food is the foundation of genuine happiness."</h2>
            <p>— Auguste Escoffier</p>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <Link to="/" className="back-link"><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to menu</Link>
          <h1>{isLogin ? 'Welcome back! 👋' : 'Join us! 🎉'}</h1>
          <p>{isLogin ? 'Sign in to track your orders and enjoy delicious food.' : 'Create your account and experience DFA-powered order tracking.'}</p>

          {/* Demo login shortcuts */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => demoLogin('customer')} disabled={demoLoading}>
              {demoLoading ? <RefreshCw size={12} className="spin" /> : '👤'} Demo Customer
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => demoLogin('admin')} disabled={demoLoading}>
              {demoLoading ? <RefreshCw size={12} className="spin" /> : '⚙️'} Demo Admin
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>or fill the form</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && <div className="form-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{error}</div>}

          <form onSubmit={submit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" required minLength={2} placeholder="Alex Morgan" autoComplete="name" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" className="form-input" required placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" className="form-input" required minLength={isLogin ? 1 : 6} placeholder={isLogin ? 'Your password' : 'At least 6 characters'} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input name="confirmPassword" type="password" className="form-input" required placeholder="Same as above" autoComplete="new-password" />
              </div>
            )}
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><RefreshCw size={16} className="spin" /> Processing…</> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? "New to DFA FoodExpress?" : "Already have an account?"}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? ' Create an account' : ' Sign in'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Orders History Page
// ============================================================
function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    api('/orders/mine').then(({ orders }) => { if (alive) setOrders(orders); }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user]);

  if (!user) return <SignInWall />;

  return (
    <main className="orders-page page-top">
      <div className="shell">
        <div className="orders-page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="section-eyebrow">YOUR HISTORY</div>
              <h1>My Orders</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Each order's progress is verified by our DFA engine.</p>
            </div>
            <Link to="/" className="btn btn-secondary">Browse Menu <ArrowRight size={14} /></Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><RefreshCw size={20} className="spin" /> Loading your orders…</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-icon">🧺</div>
            <h3>No orders yet</h3>
            <p>Start your first order and experience DFA-validated delivery tracking!</p>
            <Link to="/" className="btn btn-primary">Explore Menu <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => <OrderRow key={order._id} order={order} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function OrderRow({ order }) {
  const state = order.currentState;
  const cfg = DFA_STATES[state];
  return (
    <Link to={`/orders/${order._id}`} className="order-row">
      <div className="order-row-icon" style={{ background: cfg.color + '20', color: cfg.color }}>
        {cfg.emoji}
      </div>
      <div className="order-row-main">
        <div className="order-row-id">Order #{order._id.slice(-6).toUpperCase()}</div>
        <div className="order-row-items">{order.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}</div>
        <div className="order-row-time">{new Date(order.createdAt).toLocaleString()}</div>
      </div>
      <div className="order-row-right">
        <span className={`status-pill ${STATE_CLASS(state)}`}>
          <span className="state-dot" style={{ background: cfg.color }} /> {cfg.label}
        </span>
        <span className="order-row-total">{money(order.totalAmount)}</span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
    </Link>
  );
}

// ============================================================
// Tracking Page (Customer)
// ============================================================
function TrackingPage({ user, notify }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const socketRef = useRef(null);

  const loadOrder = useCallback(() => {
    if (!user) return;
    api(`/orders/${id}`).then(({ order }) => { setOrder(order); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    loadOrder();

    // Connect WebSocket for live updates
    const socketUrl = BASE_URL.replace('/api', '');
    const socket = io(socketUrl, { auth: { token: getToken() } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:order', id);
    });

    socket.on('order:state_changed', ({ order }) => {
      setOrder(prev => ({ ...prev, currentState: order.currentState, orderHistory: order.orderHistory, updatedAt: order.updatedAt }));
      notify(`🤖 DFA Update: ${DFA_STATES[order.currentState]?.label || order.currentState}`, 'info');
    });

    // Polling fallback every 5 seconds
    const pollTimer = setInterval(loadOrder, 5000);

    return () => {
      socket.disconnect();
      clearInterval(pollTimer);
    };
  }, [id, user, loadOrder, notify]);

  async function cancelOrder() {
    setCancelling(true);
    try {
      const { order: updated } = await api(`/orders/${id}/transition`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) });
      setOrder(updated);
      notify('Order cancelled successfully.', 'info');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  }

  if (!user) return <SignInWall />;

  if (loading) return (
    <main className="page-top">
      <div className="shell loading-state"><RefreshCw size={20} className="spin" /> Finding your order…</div>
    </main>
  );

  if (error) return (
    <main className="page-top">
      <div className="shell">
        <div className="form-error">{error}</div>
        <Link to="/orders" className="btn btn-secondary" style={{ marginTop: 16 }}>← Back to Orders</Link>
      </div>
    </main>
  );

  const state = order.currentState;
  const cfg = DFA_STATES[state];
  const isCancelled = state === 'S6';
  const isDelivered = state === 'S5';
  const stageIndex = isCancelled ? -1 : TRACKING_STAGES.findIndex(s => s.state === state);
  const history = order.orderHistory || [];

  return (
    <main className="tracking-page">
      <div className="shell">
        <Link to="/orders" className="btn btn-secondary btn-sm" style={{ marginBottom: 24 }}>← All Orders</Link>

        <div className="tracking-layout">
          <div>
            {/* Header */}
            <div className="track-header">
              <div className="track-overline">
                <span className="live-dot" /> LIVE DFA TRACKING — REAL-TIME VIA WEBSOCKET
              </div>
              <h1 className="track-title">
                {isCancelled ? '😔 Order Cancelled' : isDelivered ? '🎉 Delivered with love!' : '🚀 Your order is on its way!'}
              </h1>
              <div className="track-meta">
                Order #{order._id.slice(-6).toUpperCase()} · Placed {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>

            {/* State Banner */}
            <div className="track-card">
              <div className="state-banner" style={{ background: cfg.color + '15' }}>
                <div className="state-emoji">{cfg.emoji}</div>
                <div className="state-banner-info">
                  <h3>{cfg.label}</h3>
                  <p>{cfg.desc}</p>
                </div>
                <div className="state-code-badge" style={{ background: cfg.color + '20', color: cfg.color }}>
                  DFA: {state}
                </div>
              </div>

              {/* Timeline */}
              {!isCancelled && (
                <div className="timeline">
                  {TRACKING_STAGES.map((stage, i) => {
                    const isComplete = isDelivered || i < stageIndex;
                    const isActive = i === stageIndex && !isDelivered;
                    const histEntry = history.find(h => h.state === stage.state);

                    return (
                      <div key={stage.state} className={`timeline-row ${isComplete ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                        <div className="timeline-icon">
                          {isComplete ? <Check size={14} /> : isActive ? '•' : i + 1}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-label">{stage.emoji} {stage.label}</div>
                          <div className="timeline-desc">{stage.desc}</div>
                          {histEntry && (
                            <div className="timeline-time">
                              <Clock size={11} /> {new Date(histEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {histEntry.actor && ` · by ${histEntry.actor}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isCancelled && (
                <div style={{ padding: 24 }}>
                  <div style={{ background: 'var(--danger-bg)', borderRadius: 12, padding: 20, border: '1px solid rgba(220,38,38,0.2)' }}>
                    <h3 style={{ color: 'var(--danger)' }}>Order Cancelled</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                      This order was cancelled at {new Date(history[history.length - 1]?.timestamp || order.updatedAt).toLocaleString()}.
                      DFA transition: → S6 (Terminal State — no further transitions possible).
                    </p>
                  </div>
                </div>
              )}

              <div className="track-footer">
                <span><Wifi size={13} /> Updates via WebSocket + 5s polling fallback</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>DFA: δ(*, *) → {state}</span>
              </div>
            </div>

            {/* Cancel Option */}
            {!isCancelled && !isDelivered && ['S0', 'S1'].includes(state) && (
              <div className="cancel-zone" style={{ marginTop: 16 }}>
                <p>Changed your mind? You can cancel before cooking starts.</p>
                <button className="btn btn-danger btn-sm" onClick={cancelOrder} disabled={cancelling}>
                  {cancelling ? <RefreshCw size={14} className="spin" /> : <X size={14} />}
                  {cancelling ? ' Cancelling…' : ' Cancel Order'}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <aside>
            <div className="order-summary">
              <h3>🛍️ Order Details</h3>
              <div className="summary-items">
                {order.items.map((item, i) => (
                  <div key={i} className="summary-item">
                    <img src={item.image || ''} alt={item.name} />
                    <div className="summary-item-info">
                      <div className="summary-item-name">{item.name}</div>
                      <div className="summary-item-qty">Qty: {item.quantity}</div>
                    </div>
                    <div className="summary-item-price">{money(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span style={{ color: 'var(--brand)' }}>{money(order.totalAmount)}</span>
              </div>
              <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>DFA STATE HISTORY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'var(--bg-tint)', padding: '1px 6px', borderRadius: 4 }}>{h.state}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{h.label}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Admin Dashboard
// ============================================================
function AdminPage({ user, notify }) {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const socketRef = useRef(null);

  async function loadData() {
    try {
      const [oRes, fRes] = await Promise.all([api('/orders'), api('/foods?all=true')]);
      setOrders(oRes.orders);
      setFoods(fRes.items);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadData();

    // WebSocket for live order updates
    const socketUrl = BASE_URL.replace('/api', '');
    const socket = io(socketUrl);
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join:admin'));
    socket.on('admin:new_order', () => { loadData(); notify('🔔 New order received!', 'info'); });
    socket.on('admin:order_updated', () => loadData());

    return () => socket.disconnect();
  }, [user]);

  if (!user) return <SignInWall />;
  if (user.role !== 'admin') return (
    <main className="page-top">
      <div className="shell empty-state" style={{ marginTop: 60 }}>
        <div className="empty-icon">🔒</div>
        <h3>Admin Access Required</h3>
        <p>This dashboard is restricted to restaurant staff.</p>
      </div>
    </main>
  );

  async function doTransition(orderId, action) {
    setActionLoading(true);
    try {
      await api(`/orders/${orderId}/transition`, { method: 'PATCH', body: JSON.stringify({ action }) });
      await loadData();
      notify(`✅ Order advanced: ${action.replaceAll('_', ' ')}`, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function saveFood(e) {
    e.preventDefault();
    setActionLoading(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.price = Number(body.price);
    body.isVeg = body.isVeg === 'true';
    body.prepTimeMinutes = Number(body.prepTimeMinutes || 15);
    try {
      if (editing) {
        await api(`/foods/${editing._id}`, { method: 'PATCH', body: JSON.stringify(body) });
        notify('Menu item updated!', 'success');
      } else {
        await api('/foods', { method: 'POST', body: JSON.stringify(body) });
        notify('New food item added!', 'success');
      }
      setEditing(null);
      e.currentTarget.reset();
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteFood(id) {
    if (!confirm('Delete this food item from the menu?')) return;
    try {
      await api(`/foods/${id}`, { method: 'DELETE' });
      notify('Food item removed.', 'info');
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function toggleAvailability(item) {
    try {
      await api(`/foods/${item._id}`, { method: 'PATCH', body: JSON.stringify({ availability: !item.availability }) });
      await loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  const activeOrders = orders.filter(o => !['S5', 'S6'].includes(o.currentState));
  const completedOrders = orders.filter(o => ['S5', 'S6'].includes(o.currentState));

  return (
    <main className="admin-page">
      <div className="shell">
        <div className="admin-header">
          <div>
            <div className="section-eyebrow">RESTAURANT DASHBOARD</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Kitchen Control Panel</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Every status change is validated by the DFA engine before saving.</p>
          </div>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--brand)' }}>{activeOrders.length}</div>
              <div className="stat-label">Active Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--success)' }}>{completedOrders.filter(o => o.currentState === 'S5').length}</div>
              <div className="stat-label">Delivered</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--text-secondary)' }}>{foods.filter(f => f.availability).length}</div>
              <div className="stat-label">Menu Items</div>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>📦 Orders ({orders.length})</button>
          <button className={`admin-tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>🍔 Menu Management</button>
        </div>

        {loading ? (
          <div className="loading-state"><RefreshCw size={18} className="spin" /> Loading dashboard…</div>
        ) : tab === 'orders' ? (
          <div className="admin-orders">
            {orders.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🤫</div><h3>No orders yet</h3><p>New customer orders will appear here in real-time.</p></div>
            ) : orders.map(order => (
              <AdminOrderCard key={order._id} order={order} onAction={doTransition} loading={actionLoading} />
            ))}
          </div>
        ) : (
          <div className="menu-admin">
            {/* Food Form */}
            <div className="food-form-card">
              <h3>{editing ? '✏️ Edit Item' : '➕ Add New Item'}</h3>
              <form key={editing?._id || 'new'} onSubmit={saveFood}>
                <div className="form-group">
                  <label className="form-label">Food Name *</label>
                  <input name="name" className="form-input" required defaultValue={editing?.name} placeholder="Crispy Chicken Burger" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input name="description" className="form-input" required defaultValue={editing?.description} placeholder="Short description" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input name="price" type="number" className="form-input" required min="1" step="0.01" defaultValue={editing?.price} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input name="category" className="form-input" required defaultValue={editing?.category} placeholder="Burgers" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Veg / Non-Veg</label>
                    <select name="isVeg" className="form-input" defaultValue={editing?.isVeg !== undefined ? String(editing.isVeg) : 'true'}>
                      <option value="true">🌱 Vegetarian</option>
                      <option value="false">🍖 Non-Vegetarian</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prep Time (mins)</label>
                    <input name="prepTimeMinutes" type="number" className="form-input" defaultValue={editing?.prepTimeMinutes || 15} min="1" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input name="image" type="url" className="form-input" defaultValue={editing?.image} placeholder="https://…" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? <RefreshCw size={14} className="spin" /> : (editing ? <Check size={14} /> : <Plus size={14} />)}
                    {editing ? ' Save Changes' : ' Add Item'}
                  </button>
                  {editing && <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>}
                </div>
              </form>
            </div>

            {/* Food List */}
            <div>
              <div className="food-admin-grid">
                {foods.map(food => (
                  <div className="food-admin-card" key={food._id}>
                    <div className="food-admin-img">
                      <img src={food.image || ''} alt={food.name} loading="lazy" />
                    </div>
                    <div className="food-admin-info">
                      <div className="food-admin-name">{food.name}</div>
                      <div className="food-admin-meta">{food.category} · {money(food.price)}</div>
                      <div className="food-admin-actions">
                        <button className="avail-btn" onClick={() => { setEditing(food); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          <Edit size={12} /> Edit
                        </button>
                        <button className={`avail-btn ${food.availability ? 'on' : 'off'}`} onClick={() => toggleAvailability(food)}>
                          {food.availability ? <Eye size={12} /> : <EyeOff size={12} />}
                          {food.availability ? ' Available' : ' Hidden'}
                        </button>
                        <button className="avail-btn off" onClick={() => deleteFood(food._id)}>
                          <Trash2 size={12} /> Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function AdminOrderCard({ order, onAction, loading }) {
  const state = order.currentState;
  const cfg = DFA_STATES[state];
  const nextAction = ADMIN_ACTIONS[state];

  return (
    <div className="admin-order-card">
      <div className="admin-order-top">
        <div>
          <div className="admin-order-id">Order #{order._id.slice(-6).toUpperCase()}</div>
          <div className="admin-order-customer">
            {order.userId?.name || 'Customer'} · {order.userId?.email}
            <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <span className={`status-pill ${STATE_CLASS(state)}`}>
          <span className="state-dot" style={{ background: cfg.color }} />
          {cfg.label} · {state}
        </span>
      </div>

      <div className="admin-order-items">
        {order.items.map((item, i) => (
          <span key={i} className="item-chip">{item.quantity}× {item.name}</span>
        ))}
        <span className="admin-order-total">{money(order.totalAmount)}</span>
      </div>

      <div className="admin-order-bottom">
        <div className="dfa-trail">
          {order.orderHistory.map((h, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={`dfa-trail-state ${STATE_CLASS(h.state)}`}>{h.state}</span>
              {i < order.orderHistory.length - 1 && <span className="dfa-trail-arrow">→</span>}
            </span>
          ))}
        </div>
        <div className="admin-actions">
          {['S0', 'S1'].includes(state) && (
            <button className="btn btn-danger btn-sm" onClick={() => onAction(order._id, 'cancel')} disabled={loading}>
              <X size={13} /> {state === 'S0' ? 'Reject' : 'Cancel'}
            </button>
          )}
          {nextAction && (
            <button className="btn btn-primary btn-sm" onClick={() => onAction(order._id, nextAction.action)} disabled={loading}>
              {loading ? <RefreshCw size={13} className="spin" /> : <nextAction.icon size={13} />} {nextAction.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DFA Visualization Page
// ============================================================
function DfaPage() {
  const [simInput, setSimInput] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const transitionRows = [
    ['S0', 'confirm', 'S1'],
    ['S0', 'cancel', 'S6'],
    ['S1', 'start_preparation', 'S2'],
    ['S1', 'cancel', 'S6'],
    ['S2', 'food_ready', 'S3'],
    ['S3', 'dispatch', 'S4'],
    ['S4', 'deliver', 'S5']
  ];

  async function simulate() {
    setSimLoading(true);
    const sequence = simInput.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const result = await api('/dfa/simulate', { method: 'POST', body: JSON.stringify({ sequence }) });
      setSimResult(result);
    } catch (err) {
      setSimResult({ accepted: false, reason: err.message, trace: [] });
    } finally {
      setSimLoading(false);
    }
  }

  const stateColors = { S0: '#64748B', S1: '#0EA5E9', S2: '#F59E0B', S3: '#10B981', S4: '#8B5CF6', S5: '#16A34A', S6: '#DC2626' };

  return (
    <main className="dfa-page page-top">
      <div className="shell">
        <div className="section-eyebrow">FORMAL LANGUAGES & AUTOMATA THEORY</div>
        <h1 className="section-title" style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', marginBottom: 8 }}>DFA <em>Order Engine</em></h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 580 }}>
          Our order processing is backed by a Deterministic Finite Automaton (DFA).
          Every state transition is mathematically validated before updating the database.
        </p>

        {/* Formal Definition */}
        <div className="dfa-definition-card">
          <h2>🔵 Formal Definition: M = (Q, Σ, δ, q₀, F)</h2>
          <div className="definition-grid">
            <div className="def-item">
              <div className="def-label">Q — States</div>
              <div className="def-value">{'{'} S0, S1, S2, S3, S4, S5, S6 {'}'}</div>
            </div>
            <div className="def-item">
              <div className="def-label">Σ — Input Alphabet</div>
              <div className="def-value" style={{ fontSize: '0.78rem' }}>confirm, start_preparation, food_ready, dispatch, deliver, cancel</div>
            </div>
            <div className="def-item">
              <div className="def-label">q₀ — Initial State</div>
              <div className="def-value">S0 (Order Created)</div>
            </div>
            <div className="def-item">
              <div className="def-label">F — Final States</div>
              <div className="def-value">{'{'} S5 (Delivered), S6 (Cancelled) {'}'}</div>
            </div>
            <div className="def-item" style={{ gridColumn: 'span 2' }}>
              <div className="def-label">δ — Transition Function</div>
              <div className="def-value">Partial function δ: Q × Σ → Q (7 defined transitions)</div>
            </div>
          </div>
        </div>

        {/* State Nodes Visualization */}
        <div className="dfa-definition-card">
          <h2>⚡ State Diagram</h2>
          <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 760, padding: '20px 0' }}>
              {/* START marker */}
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: 10 }}>→ START</div>

              {/* Main path: S0 → S1 → S2 → S3 → S4 → S5 */}
              {['S0', 'S1', 'S2', 'S3', 'S4', 'S5'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <div style={{
                    width: 85, height: 85, borderRadius: '50%',
                    border: `3px solid ${stateColors[s]}`,
                    ...(s === 'S5' ? { outline: `3px solid ${stateColors[s]}`, outlineOffset: 4 } : {}),
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: stateColors[s] + '15', flexShrink: 0
                  }}>
                    <div style={{ fontWeight: 800, color: stateColors[s] }}>{s}</div>
                    <div style={{ fontSize: '0.58rem', color: stateColors[s], textAlign: 'center', lineHeight: 1.2, padding: '0 6px' }}>
                      {DFA_STATES[s].label.split(' ').slice(0, 2).join(' ')}
                    </div>
                  </div>
                  {i < 5 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70 }}>
                      <div style={{ width: '100%', height: 2, background: stateColors['S' + (i + 1)], position: 'relative' }}>
                        <span style={{ position: 'absolute', right: -4, top: -7, fontSize: 10, color: stateColors['S' + (i + 1)] }}>▶</span>
                      </div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>
                        {Object.entries(DFA_TRANSITIONS['S' + i]).find(([_, v]) => v === 'S' + (i + 1))?.[0] || ''}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cancel branch indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderTop: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cancel transitions from S0 and S1:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '4px 10px', borderRadius: 8 }}>
                S0 → S6 (cancel)
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '4px 10px', borderRadius: 8 }}>
                S1 → S6 (cancel)
              </span>
              <div style={{
                width: 70, height: 70, borderRadius: '50%',
                border: `3px solid ${stateColors.S6}`,
                outline: `3px solid ${stateColors.S6}`, outlineOffset: 3,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: stateColors.S6 + '15'
              }}>
                <div style={{ fontWeight: 800, color: stateColors.S6 }}>S6</div>
                <div style={{ fontSize: '0.58rem', color: stateColors.S6 }}>Cancelled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Transition Table */}
        <div className="dfa-definition-card">
          <h2>📋 Transition Table δ(q, a) = p</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
            All undefined transitions are rejected with HTTP 422. Final states S5 and S6 have no outgoing transitions.
          </p>
          <div className="transition-table-wrap">
            <table className="transition-table">
              <thead>
                <tr>
                  <th>Current State (q)</th>
                  <th>Input Symbol (a) ∈ Σ</th>
                  <th>Next State δ(q,a)</th>
                  <th>Transition Proof</th>
                </tr>
              </thead>
              <tbody>
                {transitionRows.map(([from, action, to]) => (
                  <tr key={`${from}-${action}`}>
                    <td>
                      <span className="state-token" style={{ background: stateColors[from] + '20', color: stateColors[from] }}>{from}</span>
                      {DFA_STATES[from].label}
                    </td>
                    <td><span className="action-code">{action}</span></td>
                    <td>
                      <span className={`state-token ${to === 'S5' || to === 'S6' ? (to === 'S6' ? 'cancelled-token' : 'terminal-token') : ''}`}
                        style={to !== 'S5' && to !== 'S6' ? { background: stateColors[to] + '20', color: stateColors[to] } : {}}>
                        {to}
                      </span>
                      {DFA_STATES[to].label}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      δ({from}, {action}) = {to}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* String Simulator */}
        <div className="dfa-sim">
          <h2>🧪 DFA String Simulator</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Simulate an input string w ∈ Σ* on the automaton starting from q₀ = S0. Enter comma-separated symbols.
          </p>
          <div className="sim-input">
            <div className="sim-sequence">
              <label className="form-label">Input sequence (comma-separated)</label>
              <input
                className="form-input"
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                placeholder="confirm, start_preparation, food_ready, dispatch, deliver"
              />
            </div>
            <button className="btn btn-primary" onClick={simulate} disabled={simLoading || !simInput.trim()}>
              {simLoading ? <RefreshCw size={14} className="spin" /> : <Activity size={14} />} Simulate
            </button>
          </div>

          {/* Quick example buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try:</span>
            {[
              ['Full Order (Accepted)', 'confirm, start_preparation, food_ready, dispatch, deliver'],
              ['Cancel at S0 (Accepted)', 'cancel'],
              ['Cancel at S1 (Accepted)', 'confirm, cancel'],
              ['Skip Steps (Rejected)', 'confirm, dispatch'],
              ['Incomplete (Rejected)', 'confirm, start_preparation']
            ].map(([label, val]) => (
              <button key={label} className="btn btn-secondary btn-sm" onClick={() => setSimInput(val)}>
                {label}
              </button>
            ))}
          </div>

          {simResult && (
            <div className={`sim-result ${simResult.accepted ? 'accepted' : 'rejected'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>{simResult.accepted ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontWeight: 800 }}>{simResult.accepted ? 'String ACCEPTED — w ∈ L(M)' : 'String REJECTED — w ∉ L(M)'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{simResult.reason}</div>
                </div>
              </div>
              {simResult.trace?.length > 0 && (
                <div className="sim-trace">
                  {simResult.trace.map((step, i) => (
                    <div key={i} className={`sim-step ${step.valid ? 'valid-step' : 'invalid-step'}`}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>Step {step.step}</span>
                      <span>δ({step.from}, <code>{step.input}</code>)</span>
                      <span>{step.valid ? `→ ${step.to}` : '→ ∅ (undefined)'}</span>
                      <span style={{ fontSize: '0.78rem', color: step.valid ? 'var(--success)' : 'var(--danger)', marginLeft: 'auto' }}>
                        {step.valid ? `✓ ${step.label}` : step.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Language Definition */}
        <div className="dfa-definition-card" style={{ marginTop: 28 }}>
          <h2>📚 Language L(M)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            The language L(M) accepted by this DFA consists of all valid order processing sequences:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Accepted (Full Delivery)', 'confirm · start_preparation · food_ready · dispatch · deliver', true],
              ['Accepted (Cancel at S0)', 'cancel', true],
              ['Accepted (Cancel at S1)', 'confirm · cancel', true],
              ['Rejected (Skip S2)', 'confirm · dispatch', false],
              ['Rejected (Already delivered)', 'confirm · start_preparation · food_ready · dispatch · deliver · cancel', false]
            ].map(([label, seq, accepted]) => (
              <div key={label} style={{
                display: 'flex', gap: 14, padding: '10px 14px', borderRadius: 10,
                background: accepted ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${accepted ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1rem' }}>{accepted ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: 2 }}>{seq}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Computer Networks Page
// ============================================================
function NetworkPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/network-info/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
    const t = setInterval(() => api('/network-info/stats').then(setStats).catch(() => {}), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="cn-page page-top">
      <div className="shell">
        <div className="section-eyebrow">COMPUTER NETWORKS</div>
        <h1 className="section-title">CN <em>Concepts Demo</em></h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 580 }}>
          This page demonstrates real Computer Networks concepts in action — live metrics from the actual TCP server process.
        </p>

        {loading ? (
          <div className="loading-state"><RefreshCw className="spin" size={18} /> Loading network stats…</div>
        ) : stats ? (
          <>
            {/* Live Metrics */}
            <div className="cn-card">
              <h3><Activity size={18} style={{ display: 'inline', marginRight: 8 }} />Live Server Metrics (Auto-refreshes every 5s)</h3>
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-num">{stats.metrics?.totalHttpRequestsServed || 0}</div>
                  <div className="metric-label">HTTP Requests Served</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">{stats.metrics?.totalWebSocketFramesDispatched || 0}</div>
                  <div className="metric-label">WebSocket Frames</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">{stats.transport?.activeWebSocketSockets || 0}</div>
                  <div className="metric-label">Active TCP Sockets</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">{stats.metrics?.serverUptimeHuman || '—'}</div>
                  <div className="metric-label">Server Uptime</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">{stats.metrics?.processMemoryUsageMB || 0} MB</div>
                  <div className="metric-label">Memory Usage</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">{stats.transport?.listeningPort || 4000}</div>
                  <div className="metric-label">TCP Port</div>
                </div>
              </div>
            </div>

            {/* HTTP Info */}
            <div className="cn-card">
              <h3><Globe size={18} style={{ display: 'inline', marginRight: 8 }} />HTTP Request Details (This Very Request!)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {[
                  ['Protocol', stats.protocol],
                  ['HTTP Version', stats.httpVersion],
                  ['Method', stats.method],
                  ['Host', stats.headers?.host],
                  ['Origin', stats.headers?.origin],
                  ['TCP Port', stats.transport?.listeningPort]
                ].map(([label, val]) => (
                  <div key={label} style={{ background: 'var(--bg-tint)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem' }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* OSI Layers */}
            <div className="cn-card">
              <h3><Server size={18} style={{ display: 'inline', marginRight: 8 }} />OSI Model — How This App Works at Each Layer</h3>
              {stats.educationalContext?.osiModel && (
                <div className="osi-table">
                  {Object.entries(stats.educationalContext.osiModel).reverse().map(([key, val], i) => (
                    <div key={key} className={`osi-layer osi-${7 - i}`}>
                      <span className="osi-num">{7 - i}</span>
                      <span className="osi-name">{val.split(':')[0]}</span>
                      <span className="osi-desc">{val.split(': ')[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TCP Handshake */}
            <div className="cn-card">
              <h3><Wifi size={18} style={{ display: 'inline', marginRight: 8 }} />TCP 3-Way Handshake (Client → Server)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>{stats.educationalContext?.threeWayHandshake}</p>
              <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap' }}>
                {[
                  { step: '1', label: 'SYN', desc: 'Client requests connection', color: '#0EA5E9', dir: '→' },
                  { step: '2', label: 'SYN-ACK', desc: 'Server acknowledges', color: '#10B981', dir: '←' },
                  { step: '3', label: 'ACK', desc: 'Client confirms, connection established', color: '#8B5CF6', dir: '→' }
                ].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: h.color + '12', border: `1.5px solid ${h.color}30`, borderRadius: 12, padding: '16px', margin: '0 4px', textAlign: 'center', minWidth: 140 }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: h.color }}>{h.dir}</div>
                    <div style={{ fontWeight: 800, color: h.color, fontSize: '0.95rem' }}>Step {h.step}: {h.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{h.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* REST API Explanation */}
            <div className="cn-card">
              <h3><Globe size={18} style={{ display: 'inline', marginRight: 8 }} />REST API + HTTP Methods Used in This Application</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['GET', '/api/foods', 'Retrieve food menu (Read)', '#0EA5E9'],
                  ['POST', '/api/auth/register', 'Register new user (Create)', '#10B981'],
                  ['POST', '/api/orders', 'Place new order (Create)', '#10B981'],
                  ['PATCH', '/api/orders/:id/transition', 'DFA State Transition (Update)', '#F59E0B'],
                  ['DELETE', '/api/foods/:id', 'Remove food item (Delete)', '#DC2626'],
                  ['WebSocket', 'socket.io events', 'Real-time push updates (Duplex)', '#8B5CF6']
                ].map(([method, path, purpose, color]) => (
                  <div key={path} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 16px', background: 'var(--bg-tint)', borderRadius: 10 }}>
                    <span style={{ background: color + '20', color, fontWeight: 800, fontFamily: 'monospace', fontSize: '0.78rem', padding: '3px 10px', borderRadius: 6, minWidth: 70, textAlign: 'center' }}>
                      {method}
                    </span>
                    <code style={{ fontSize: '0.85rem', flex: 1 }}>{path}</code>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="form-error">Could not load network stats. Ensure the API server is running.</div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// Utility Components
// ============================================================
function SignInWall() {
  return (
    <main className="page-top">
      <div className="shell empty-state" style={{ marginTop: 60 }}>
        <div className="empty-icon">🔑</div>
        <h3>Sign in to continue</h3>
        <p>Your order details are safely stored in your account.</p>
        <Link to="/login" className="btn btn-primary">Sign In <ArrowRight size={14} /></Link>
      </div>
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">🍔 DFA FoodExpress</div>
            <p className="footer-desc">
              Academic project demonstrating the integration of Computer Networks (CN),
              Formal Languages & Automata Theory (FLAT), and Full Stack Web Development (FSWD)
              through a real-world food delivery platform.
            </p>
          </div>
          <div className="footer-links">
            <Link to="/">🍽️ Menu</Link>
            <Link to="/orders">📦 My Orders</Link>
            <Link to="/dfa">🤖 DFA Engine</Link>
            <Link to="/network">🌐 CN Concepts</Link>
            <Link to="/admin">⚙️ Admin Panel</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 DFA FoodExpress — Academic Project</span>
          <span>CN · FLAT · FSWD | M = (Q, Σ, δ, q₀, F)</span>
        </div>
      </div>
    </footer>
  );
}

function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 10 }}>Back to Home</Link>
    </div>
  );
}

export default App;
