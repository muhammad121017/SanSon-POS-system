import { useEffect, useState, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  FiLayout, FiShoppingCart, FiBox, FiLayers, FiUsers, 
  FiTruck, FiDollarSign, FiClock, FiFileText, FiSettings, 
  FiLogOut, FiSearch, FiPlus, FiTrash2, FiEdit, FiRefreshCw, 
  FiCheckCircle, FiAlertTriangle, FiPercent, FiActivity, FiX, FiCheck, FiPrinter, FiPlusCircle, FiFilePlus,
  FiTrendingUp
} from 'react-icons/fi';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

import {
  loginUser, getUserRole, getUsers, getProducts, createProduct,
  updateProduct, deleteProduct, getCategories, createCategory, deleteCategory,
  getCustomers, createCustomer, deleteCustomer, getCustomerHistory,
  getSuppliers, createSupplier, deleteSupplier, getPurchaseOrders,
  createPurchaseOrder, receivePurchaseOrder, getExpenses, createExpense,
  deleteExpense, getDiscounts, createDiscount, deleteDiscount, getSales,
  processCheckout, processRefund, getDashboardData, stockAdjustment, getActivityLog
} from './services/api';

import './App.css';

const CHART_COLORS = ['#ffffff', '#888888', '#555555', '#333333', '#222222', '#111111'];

function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState({ username: '', user_id: '', role: 'Admin' });
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });

  // Navigation
  const [activeView, setActiveView] = useState('Dashboard');
  const [loading, setLoading] = useState(true);

  // Database / Store state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  // Keyboard shortcut instructions display
  const [showShortcuts, setShowShortcuts] = useState(true);

  // Search & Filters
  const [invSearch, setInvSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Interactive Modals Forms
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ id: null, sku: '', name: '', category: '', supplier: '', barcode: '', cost_price: '', selling_price: '', stock_quantity: '', reorder_level: '', image_url: '' });
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });
  
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({ name: '', code: '', discount_type: 'percentage', value: '', min_purchase: '', is_active: true });
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Other', amount: '', description: '', payment_method: 'Cash', date: new Date().toISOString().split('T')[0] });
  
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ product_id: '', new_quantity: '', reason: '' });

  // PO Creator state
  const [newPoItems, setNewPoItems] = useState([]);
  const [newPoSupplier, setNewPoSupplier] = useState('');
  const [newPoNotes, setNewPoNotes] = useState('');

  // Cart & POS Checkout Terminal state
  const [cart, setCart] = useState([]);
  const [checkoutCustomer, setCheckoutCustomer] = useState('');
  const [checkoutDiscountCode, setCheckoutDiscountCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [taxRate, setTaxRate] = useState(0); 
  const [receiptData, setReceiptData] = useState(null);

  // Customer detailed history modal
  const [selectedCustHistory, setSelectedCustHistory] = useState(null);

  const searchInputRef = useRef(null);

  // Live Math calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.qty), 0);
  
  // Calculate discount amount
  let discountAmount = 0;
  if (checkoutDiscountCode) {
    const activeDiscountObj = discounts.find(d => d.code === checkoutDiscountCode && d.is_active);
    if (activeDiscountObj) {
      if (cartSubtotal >= parseFloat(activeDiscountObj.min_purchase)) {
        if (activeDiscountObj.discount_type === 'percentage') {
          discountAmount = cartSubtotal * (parseFloat(activeDiscountObj.value) / 100);
        } else {
          discountAmount = parseFloat(activeDiscountObj.value);
        }
      }
    }
  }

  const cartTax = (cartSubtotal - discountAmount) * (taxRate / 100);
  const cartTotal = cartSubtotal - discountAmount + cartTax;
  const changeDue = paymentMethod === 'Cash' ? (parseFloat(amountTendered || 0) - cartTotal) : 0;

  // Load Store Data
  const loadStoreData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const uData = await getUserRole();
      setUser(uData);

      const [productsData, categoriesData, customersData, suppliersData, discountsData, expensesData, poData, salesData, dashboardData] = await Promise.all([
        getProducts(), getCategories(), getCustomers(), getSuppliers(), getDiscounts(), getExpenses(), getPurchaseOrders(), getSales(), getDashboardData()
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setDiscounts(discountsData);
      setExpenses(expensesData);
      setPurchaseOrders(poData);
      setSalesHistory(salesData);
      setDashboard(dashboardData);

      if (uData.role === 'Admin') {
        const [logsData, usersData] = await Promise.all([getActivityLog(), getUsers()]);
        setActivityLogs(logsData);
        setStaffUsers(usersData);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [token, activeView]);

  // Barcode / Scanner listener simulation
  useEffect(() => {
    if (activeView === 'Sales' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeView, cart]);

  // Global Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!token) return;
      if (e.key === 'F1') { e.preventDefault(); setActiveView('Dashboard'); }
      if (e.key === 'F2') { e.preventDefault(); setActiveView('Sales'); }
      if (e.key === 'F3') { e.preventDefault(); setActiveView('Inventory'); }
      if (e.key === 'F4') { e.preventDefault(); setActiveView('History'); }
      if (e.key === 'F5') { e.preventDefault(); loadStoreData(); toast.success("Refreshed store ledger"); }
      if (e.key === 'F6' && activeView === 'Sales') { e.preventDefault(); handleCompleteCheckout(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [token, activeView, cart, checkoutCustomer, checkoutDiscountCode, paymentMethod, amountTendered, taxRate]);

  // --- Auth Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(loginCreds);
      localStorage.setItem('token', res.token);
      setToken(res.token);
      toast.success(`Welcome back, ${res.user.username}!`);
    } catch (err) {
      toast.error("Invalid Username or Password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    toast.success("Log out successful.");
  };

  // --- POS Cashier Handlers ---
  const handleAddToCart = (prod) => {
    const exists = cart.find(item => item.id === prod.id);
    if (exists) {
      if (exists.qty + 1 > prod.stock_quantity) {
        toast.error("No more stock available!");
        return;
      }
      setCart(cart.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...prod, qty: 1 }]);
    }
    setSalesSearch('');
    toast.success(`${prod.name} added to cart`, { duration: 1000 });
  };

  const updateCartQty = (id, newQty, stockQty) => {
    if (newQty < 1 || isNaN(newQty)) newQty = 1;
    if (newQty > stockQty) {
      toast.error(`Only ${stockQty} units available in inventory.`);
      newQty = stockQty;
    }
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const handleRemoveCartItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
    setAmountTendered('');
    setCheckoutCustomer('');
    setCheckoutDiscountCode('');
    toast.success("Cart cleared");
  };

  const handleCompleteCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty!");
    if (paymentMethod === 'Cash' && changeDue < 0) return toast.error("Amount tendered is less than Grand Total!");

    try {
      const payload = {
        cart,
        payment_method: paymentMethod,
        tax_rate: taxRate,
        amount_tendered: paymentMethod === 'Cash' ? parseFloat(amountTendered) : cartTotal,
        customer_id: checkoutCustomer || null,
        discount_code: checkoutDiscountCode || ""
      };

      const res = await processCheckout(payload);
      
      // Load receipt
      const now = new Date();
      const customerObj = customers.find(c => c.id === parseInt(checkoutCustomer));
      
      setReceiptData({
        id: res.sale_id,
        cart,
        subtotal: cartSubtotal,
        discountAmount,
        taxAmount: cartTax,
        grandTotal: cartTotal,
        amount_tendered: payload.amount_tendered,
        changeDue,
        payment_method: paymentMethod,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        customer_name: customerObj ? customerObj.name : 'Walk-in Customer',
        cashier_name: user.username
      });

      setCart([]);
      setAmountTendered('');
      setCheckoutCustomer('');
      setCheckoutDiscountCode('');
      toast.success("Transaction completed successfully!");
      loadStoreData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Checkout failed");
    }
  };

  // --- Void / Refund ---
  const handleVoidSale = async (id) => {
    if (window.confirm("Void this sale transaction and restock items?")) {
      try {
        await processRefund(id);
        toast.success("Transaction voided successfully!");
        loadStoreData();
      } catch (err) {
        toast.error("Refund processing failed.");
      }
    }
  };

  // --- PO Creator Handlers ---
  const handleAddPoItem = (prodId) => {
    if (!prodId) return;
    const prod = products.find(p => p.id === parseInt(prodId));
    if (!prod) return;
    if (newPoItems.some(i => i.product_id === prod.id)) return;
    setNewPoItems([...newPoItems, { product_id: prod.id, name: prod.name, quantity: 1, unit_cost: parseFloat(prod.cost_price) }]);
  };

  const handleUpdatePoQty = (prodId, val) => {
    setNewPoItems(newPoItems.map(i => i.product_id === prodId ? { ...i, quantity: parseInt(val) || 1 } : i));
  };

  const handleUpdatePoCost = (prodId, val) => {
    setNewPoItems(newPoItems.map(i => i.product_id === prodId ? { ...i, unit_cost: parseFloat(val) || 0.0 } : i));
  };

  const handleRemovePoItem = (prodId) => {
    setNewPoItems(newPoItems.filter(i => i.product_id !== prodId));
  };

  const handleSubmitPo = async () => {
    if (!newPoSupplier) return toast.error("Please select a Supplier");
    if (newPoItems.length === 0) return toast.error("Add at least 1 item to purchase order");

    try {
      await createPurchaseOrder({
        supplier_id: newPoSupplier,
        items: newPoItems,
        notes: newPoNotes
      });
      toast.success("Purchase Order submitted successfully!");
      setNewPoItems([]);
      setNewPoNotes('');
      setNewPoSupplier('');
      setActiveView('Orders');
    } catch (err) {
      toast.error("Failed to create PO");
    }
  };

  const handleReceivePo = async (id) => {
    try {
      await receivePurchaseOrder(id);
      toast.success("Stock received and items updated in database!");
      loadStoreData();
    } catch (err) {
      toast.error("Failed to receive PO stock");
    }
  };

  // --- Category Handlers ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory({ name: newCatName, description: newCatDesc });
      toast.success("Category created!");
      setNewCatName('');
      setNewCatDesc('');
      loadStoreData();
    } catch (err) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategoryObj = async (id) => {
    if (window.confirm("Delete this category? This might affect products linked to it.")) {
      try {
        await deleteCategory(id);
        toast.success("Category deleted.");
        loadStoreData();
      } catch (err) {
        toast.error("Failed to delete category");
      }
    }
  };

  // --- Modal Form CRUD Submissions ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (productForm.id) {
        await updateProduct(productForm.id, productForm);
        toast.success("Product updated!");
      } else {
        await createProduct(productForm);
        toast.success("Product created!");
      }
      setShowProductModal(false);
      loadStoreData();
    } catch (err) {
      toast.error("Product submission failed");
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCustomer(customerForm);
      toast.success("Customer profile registered!");
      setShowCustomerModal(false);
      setCustomerForm({ name: '', phone: '', email: '', address: '' });
      loadStoreData();
    } catch (err) {
      toast.error("Registration failed");
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSupplier(supplierForm);
      toast.success("Supplier registered!");
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
      loadStoreData();
    } catch (err) {
      toast.error("Registration failed");
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDiscount(discountForm);
      toast.success("Promotion saved!");
      setShowDiscountModal(false);
      setDiscountForm({ name: '', code: '', discount_type: 'percentage', value: '', min_purchase: '', is_active: true });
      loadStoreData();
    } catch (err) {
      toast.error("Failed to create promotion");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpense(expenseForm);
      toast.success("Expense logged!");
      setShowExpenseModal(false);
      setExpenseForm({ category: 'Other', amount: '', description: '', payment_method: 'Cash', date: new Date().toISOString().split('T')[0] });
      loadStoreData();
    } catch (err) {
      toast.error("Failed to log expense");
    }
  };

  const handleStockAdjustmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await stockAdjustment(adjustForm);
      toast.success("Stock audited & updated!");
      setShowStockAdjustModal(false);
      setAdjustForm({ product_id: '', new_quantity: '', reason: '' });
      loadStoreData();
    } catch (err) {
      toast.error("Auditing failed");
    }
  };

  const handleDeleteProductObj = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        toast.success("Product deleted");
        loadStoreData();
      } catch (err) {
        toast.error("Failed to delete product");
      }
    }
  };

  // View Customer History
  const handleViewCustHistory = async (cust) => {
    try {
      const history = await getCustomerHistory(cust.id);
      setSelectedCustHistory({ customer: cust, sales: history });
    } catch (err) {
      toast.error("Failed to load customer profile history");
    }
  };

  // Exports
  const handleExportSales = () => {
    window.open(`${API_BASE}export/sales/`, '_blank');
    toast.success("Downloading sales report CSV");
  };

  const handleExportInventory = () => {
    window.open(`${API_BASE}export/inventory/`, '_blank');
    toast.success("Downloading inventory report CSV");
  };

  // Quick navigation items
  const viewsList = [
    { name: 'Dashboard', icon: <FiLayout />, role: 'Viewer' },
    { name: 'Sales', icon: <FiShoppingCart />, role: 'Cashier' },
    { name: 'Inventory', icon: <FiBox />, role: 'Admin' },
    { name: 'Categories', icon: <FiLayers />, role: 'Admin' },
    { name: 'Customers', icon: <FiUsers />, role: 'Admin' },
    { name: 'Suppliers', icon: <FiTruck />, role: 'Admin' },
    { name: 'Orders', icon: <FiFilePlus />, role: 'Admin' },
    { name: 'Expenses', icon: <FiDollarSign />, role: 'Admin' },
    { name: 'History', icon: <FiClock />, role: 'Viewer' },
    { name: 'Settings', icon: <FiSettings />, role: 'Admin' }
  ];

  const allowedViews = viewsList.filter(v => {
    if (user.role === 'Admin') return true;
    if (user.role === 'Cashier') return v.role === 'Cashier' || v.name === 'History';
    return v.role === 'Viewer';
  });

  // Filters search lists
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(invSearch.toLowerCase()) || p.sku.toLowerCase().includes(invSearch.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || p.category.toString() === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const salesFilteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(salesSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(salesSearch.toLowerCase())) || (p.barcode && p.barcode.includes(salesSearch));
    const matchesCategory = selectedCategoryFilter === 'All' || p.category.toString() === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Login Screen render
  if (!token) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000000' }}>
      <form onSubmit={handleLogin} className="glass-card" style={{ width: '360px', textAlign: 'center', padding: '40px 30px' }}>
        <div className="brand-mark" style={{ margin: '0 auto 20px auto' }}>S</div>
        <h2 style={{ fontFamily: 'Inter', fontSize: '1.8rem', marginBottom: '8px', fontWeight: '600', letterSpacing: '-0.04em' }}>SanSons POS</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>Enterprise Management Portal</p>
        
        <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label>Username</label>
          <input 
            type="text" 
            placeholder="Enter username" 
            required 
            onChange={e => setLoginCreds({...loginCreds, username: e.target.value})} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: '25px', textAlign: 'left' }}>
          <label>Password</label>
          <input 
            type="password" 
            placeholder="Enter password" 
            required 
            onChange={e => setLoginCreds({...loginCreds, password: e.target.value})} 
          />
        </div>

        <button type="submit" className="primary-btn" style={{ width: '100%', padding: '14px' }}>
          Verify Credentials & Enter
        </button>
      </form>
    </div>
  );

  return (
    <div className="dashboard-shell">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0a0a0a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.08)' } }} />
      
      {/* Sidebar navigation */}
      <aside className="sidebar no-print">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <h2>SanSons</h2>
            <p>v2.0 Enterprise</p>
          </div>
        </div>

        <nav className="nav-links">
          {allowedViews.map(item => (
            <button 
              key={item.name} 
              className={activeView === item.name ? 'active' : ''} 
              onClick={() => { setActiveView(item.name); setSelectedCategoryFilter('All'); }}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="user-meta">
            <h4>{user.username || 'System User'}</h4>
            <p>{user.role || 'Cashier'}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Main dashboard body */}
      <main className="main-panel">
        
        {/* Keyboard shortcut guide */}
        {showShortcuts && token && (
          <div className="glass-card no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(79, 70, 229, 0.08)', borderColor: 'rgba(79, 70, 229, 0.25)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 'bold' }}>
              <span>⌨️ Shortcuts:</span>
              <span><kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>F1</kbd> Dashboard</span>
              <span><kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>F2</kbd> Sales Terminal</span>
              <span><kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>F3</kbd> Inventory</span>
              <span><kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>F4</kbd> History</span>
              <span><kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>F5</kbd> Sync DB</span>
              {activeView === 'Sales' && <span><kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>F6</kbd> Checkout</span>}
            </div>
            <button onClick={() => setShowShortcuts(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><FiX /></button>
          </div>
        )}

        <header className="topbar no-print">
          <h1>{activeView}</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="secondary-btn" onClick={loadStoreData} title="Sync database data">
              <FiRefreshCw />
              Sync Ledger
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px' }}>
              Terminal Active
            </span>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1, justifyItems: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <FiRefreshCw className="spin" style={{ fontSize: '3rem', color: 'var(--accent-primary)', animation: 'spin 2s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Synchronizing store models...</p>
          </div>
        ) : (
          <>
            {/* ==================== DASHBOARD VIEW ==================== */}
            {activeView === 'Dashboard' && dashboard && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon primary"><FiDollarSign /></div>
                    <div className="stat-info">
                      <p>Today's Sales</p>
                      <h2>PKR {dashboard.today_revenue.toLocaleString()}</h2>
                      <div className="stat-compare" style={{ color: dashboard.today_revenue >= dashboard.yesterday_revenue ? '#34d399' : '#f87171' }}>
                        <span>{dashboard.today_count} receipts today</span>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon success"><FiTrendingUp /></div>
                    <div className="stat-info">
                      <p>Monthly Sales</p>
                      <h2>PKR {dashboard.month_revenue.toLocaleString()}</h2>
                      <div className="stat-compare" style={{ color: '#34d399' }}>
                        <span>Est Profit: PKR {(dashboard.month_profit).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon danger"><FiDollarSign /></div>
                    <div className="stat-info">
                      <p>Monthly Expenses</p>
                      <h2>PKR {dashboard.month_expenses.toLocaleString()}</h2>
                      <div className="stat-compare" style={{ color: '#f87171' }}>
                        <span>Outflow records</span>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon warning"><FiAlertTriangle /></div>
                    <div className="stat-info">
                      <p>Low Stock Items</p>
                      <h2 style={{ color: dashboard.low_stock > 0 ? '#fbbf24' : 'inherit' }}>{dashboard.low_stock}</h2>
                      <div className="stat-compare">
                        <span>Reorder triggers active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  {/* Revenue Trend Area Chart */}
                  <div className="glass-card">
                    <h3 style={{ marginBottom: '15px', fontFamily: 'Outfit' }}>Weekly Revenue Trend</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer>
                        <AreaChart data={dashboard.daily_revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                          <YAxis stroke="var(--text-secondary)" fontSize={11} />
                          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="revenue" name="Revenue (PKR)" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Breakdown Pie Chart */}
                  <div className="glass-card">
                    <h3 style={{ marginBottom: '15px', fontFamily: 'Outfit' }}>Sales by Category</h3>
                    <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {dashboard.category_revenue.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No monthly sales data</p>
                      ) : (
                        <>
                          <div style={{ width: '100%', height: '200px' }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                  data={dashboard.category_revenue}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  dataKey="revenue"
                                  nameKey="product__category__name"
                                >
                                  {dashboard.category_revenue.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
                            {dashboard.category_revenue.map((entry, index) => (
                              <div key={entry.product__category__name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                                <span style={{ color: 'var(--text-secondary)' }}>{entry.product__category__name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Top Products Table */}
                  <div className="glass-card">
                    <h3 style={{ marginBottom: '15px', fontFamily: 'Outfit' }}>Fastest Selling Items</h3>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th style={{ textAlign: 'right' }}>Qty Sold</th>
                            <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.top_products.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.product__name}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total_qty} units</td>
                              <td style={{ textAlign: 'right', color: 'var(--accent-success)', fontWeight: 'bold' }}>PKR {item.total_revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                          {dashboard.top_products.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No items sold this month.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontFamily: 'Outfit' }}>Inventory Reorder Alerts</h3>
                      {dashboard.low_stock > 0 && <span className="badge warning">Action Needed</span>}
                    </div>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Product</th>
                            <th style={{ textAlign: 'right' }}>Stock Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.filter(p => p.stock_quantity <= p.reorder_level).slice(0, 6).map(p => (
                            <tr key={p.id}>
                              <td><code>{p.sku}</code></td>
                              <td>{p.name}</td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`badge ${p.stock_quantity === 0 ? 'danger' : 'warning'}`}>
                                  {p.stock_quantity} available (min: {p.reorder_level})
                                </span>
                              </td>
                            </tr>
                          ))}
                          {products.filter(p => p.stock_quantity <= p.reorder_level).length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'center', color: 'var(--accent-success)', fontWeight: 'bold', padding: '30px' }}>
                                <FiCheckCircle style={{ marginRight: '5px', verticalAlign: 'middle' }} /> All items fully stocked!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SALES TERMINAL ==================== */}
            {activeView === 'Sales' && (
              <div className="pos-layout" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {/* Left Side: Product catalog lookup */}
                <div className="product-selector">
                  <div className="search-box-wrapper">
                    <FiSearch className="search-box-icon" />
                    <input 
                      ref={searchInputRef}
                      type="text"
                      placeholder="Scan product barcode, SKU or type product name..."
                      value={salesSearch}
                      onChange={e => {
                        const val = e.target.value;
                        setSalesSearch(val);
                        // Auto Add product if barcode exactly matches
                        const found = products.find(p => p.barcode === val || p.sku === val);
                        if (found && found.stock_quantity > 0) {
                          handleAddToCart(found);
                        }
                      }}
                    />
                  </div>

                  <div className="category-filter-bar">
                    <button 
                      className={`cat-filter-btn ${selectedCategoryFilter === 'All' ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryFilter('All')}
                    >
                      All Categories
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        className={`cat-filter-btn ${selectedCategoryFilter === c.id.toString() ? 'active' : ''}`}
                        onClick={() => setSelectedCategoryFilter(c.id.toString())}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  <div className="pos-product-grid">
                    {salesFilteredProducts.map(p => (
                      <div 
                        key={p.id}
                        className={`pos-product-card ${p.stock_quantity <= 0 ? 'out-of-stock' : ''}`}
                        onClick={() => p.stock_quantity > 0 && handleAddToCart(p)}
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width: '100%', aspectRatio: '1.3', objectFit: 'cover', borderRadius: '12px' }} />
                        ) : (
                          <div className="img-placeholder">🛍️</div>
                        )}
                        <h4>{p.name}</h4>
                        <div className="price-row">
                          <span className="price">PKR {p.selling_price}</span>
                          <span className="stock-badge">Stock: {p.stock_quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Billing Cart */}
                <div className="glass-card pos-cart-panel" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontFamily: 'Outfit' }}>Current Receipt</h3>
                    {cart.length > 0 && (
                      <button onClick={handleClearCart} style={{ color: 'var(--accent-danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                        Clear Cart
                      </button>
                    )}
                  </div>

                  <div className="cart-items-list">
                    {cart.length === 0 ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '10px' }}>
                        <FiShoppingCart style={{ fontSize: '3rem', opacity: 0.3 }} />
                        <p>No products in receipt yet.</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-info">
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-meta">PKR {item.selling_price} each</div>
                          </div>
                          
                          <div className="cart-item-qty-control">
                            <button onClick={() => updateCartQty(item.id, item.qty - 1, item.stock_quantity)}>-</button>
                            <input 
                              type="number" 
                              value={item.qty}
                              onChange={e => updateCartQty(item.id, parseInt(e.target.value) || 1, item.stock_quantity)} 
                            />
                            <button onClick={() => updateCartQty(item.id, item.qty + 1, item.stock_quantity)}>+</button>
                          </div>

                          <div className="cart-item-price">
                            PKR {(item.selling_price * item.qty).toLocaleString()}
                          </div>
                          
                          <button 
                            onClick={() => handleRemoveCartItem(item.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '10px' }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Checkout calculations summary */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: '15px' }}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div className="form-group">
                        <select value={checkoutCustomer} onChange={e => setCheckoutCustomer(e.target.value)}>
                          <option value="">Walk-in Customer</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <input 
                          type="text" 
                          placeholder="Promo code" 
                          value={checkoutDiscountCode}
                          onChange={e => setCheckoutDiscountCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span style={{ color: 'var(--text-primary)' }}>PKR {cartSubtotal.toLocaleString()}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-success)' }}>
                          <span>Discount Applied:</span>
                          <span>- PKR {discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Tax Rate (%):</span>
                        <input 
                          type="number" 
                          value={taxRate} 
                          onChange={e => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))} 
                          style={{ width: '60px', padding: '3px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center', color: '#fff' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px' }}>
                      <h3 style={{ fontFamily: 'Outfit' }}>Total Bill:</h3>
                      <h2 style={{ fontFamily: 'Outfit', color: 'var(--accent-success)' }}>PKR {cartTotal.toLocaleString()}</h2>
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div className="form-group">
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                          <option value="Cash">Cash Payment</option>
                          <option value="Card">Card Reader</option>
                          <option value="Mobile">JazzCash / Easypaisa</option>
                        </select>
                      </div>
                      {paymentMethod === 'Cash' ? (
                        <div className="form-group">
                          <input 
                            type="number"
                            placeholder="Cash Rendered"
                            value={amountTendered}
                            onChange={e => setAmountTendered(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Automatic validation
                        </div>
                      )}
                    </div>

                    {paymentMethod === 'Cash' && amountTendered && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: changeDue < 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 'bold' }}>
                        <span>{changeDue < 0 ? "Amount Deficit" : "Change Return:"}</span>
                        <span>PKR {Math.abs(changeDue).toLocaleString()}</span>
                      </div>
                    )}

                    <button 
                      className="primary-btn" 
                      style={{ width: '100%', padding: '15px', fontSize: '1.05rem', background: 'linear-gradient(135deg, var(--accent-success) 0%, #065f46 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                      onClick={handleCompleteCheckout}
                    >
                      <FiCheckCircle /> Complete Sale (F6)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== INVENTORY VIEW ==================== */}
            {activeView === 'Inventory' && (
              <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-box-wrapper" style={{ margin: 0 }}>
                      <FiSearch className="search-box-icon" />
                      <input 
                        type="text" 
                        placeholder="Search SKU or Name..." 
                        value={invSearch}
                        onChange={e => setInvSearch(e.target.value)}
                        style={{ width: '260px' }}
                      />
                    </div>
                    
                    <select 
                      value={selectedCategoryFilter} 
                      onChange={e => setSelectedCategoryFilter(e.target.value)}
                      style={{ padding: '10px 16px', background: 'rgba(11, 15, 25, 0.6)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px' }}
                    >
                      <option value="All">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="secondary-btn" onClick={() => setShowStockAdjustModal(true)}>
                      <FiActivity /> Adjust Stock Audit
                    </button>
                    <button 
                      className="primary-btn"
                      onClick={() => {
                        setProductForm({ id: null, sku: '', name: '', category: '', supplier: '', barcode: '', cost_price: '', selling_price: '', stock_quantity: '', reorder_level: '', image_url: '' });
                        setShowProductModal(true);
                      }}
                    >
                      <FiPlus /> New Product
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Barcode</th>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Supplier</th>
                        <th>Cost Price</th>
                        <th>Selling Price</th>
                        <th>In Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td><code>{p.barcode || 'N/A'}</code></td>
                          <td><code>{p.sku}</code></td>
                          <td style={{ fontWeight: '600' }}>{p.name}</td>
                          <td>{p.supplier_name || 'Generic'}</td>
                          <td>PKR {parseFloat(p.cost_price).toLocaleString()}</td>
                          <td style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>PKR {parseFloat(p.selling_price).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${p.stock_quantity === 0 ? 'danger' : p.stock_quantity <= p.reorder_level ? 'warning' : 'success'}`}>
                              {p.stock_quantity} units
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => {
                                  setProductForm(p);
                                  setShowProductModal(true);
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#818cf8', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px' }}
                              >
                                <FiEdit />
                              </button>
                              <button 
                                onClick={() => handleDeleteProductObj(p.id)}
                                style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px' }}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>No products found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== CATEGORIES VIEW ==================== */}
            {activeView === 'Categories' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                <form onSubmit={handleAddCategory} className="glass-card" style={{ height: 'fit-content' }}>
                  <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Add Category</h3>
                  
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Category Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Groceries, Electronics" 
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Description (Optional)</label>
                    <textarea 
                      rows="3"
                      placeholder="Category notes..." 
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      style={{ background: 'rgba(11, 15, 25, 0.6)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '12px', padding: '12px' }}
                    />
                  </div>

                  <button type="submit" className="primary-btn" style={{ width: '100%' }}>
                    Save Category
                  </button>
                </form>

                <div className="glass-card">
                  <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Product Categories</h3>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Category Name</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'center' }}>Total Products</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: '600' }}>{c.name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{c.description || 'N/A'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{c.product_count || 0}</td>
                            <td>
                              <button 
                                onClick={() => handleDeleteCategoryObj(c.id)}
                                style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px' }}
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== CUSTOMERS (CRM) ==================== */}
            {activeView === 'Customers' && (
              <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Outfit' }}>Loyalty Customer CRM</h3>
                  <button className="primary-btn" onClick={() => setShowCustomerModal(true)}>
                    <FiPlus /> Register Customer
                  </button>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Loyalty Points</th>
                        <th>Total Purchases</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: '600' }}>{c.name}</td>
                          <td><code>{c.phone}</code></td>
                          <td>{c.email || 'N/A'}</td>
                          <td>{c.address || 'N/A'}</td>
                          <td style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{c.loyalty_points} PTS</td>
                          <td style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>PKR {parseFloat(c.total_spent).toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="secondary-btn" 
                                style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
                                onClick={() => handleViewCustHistory(c)}
                              >
                                View ledger
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm("Remove customer record?")) {
                                    deleteCustomer(c.id).then(() => { toast.success("Customer removed"); loadStoreData(); });
                                  }
                                }}
                                style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px' }}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>No loyalty customers registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== SUPPLIERS VIEW ==================== */}
            {activeView === 'Suppliers' && (
              <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Outfit' }}>Registered Suppliers</h3>
                  <button className="primary-btn" onClick={() => setShowSupplierModal(true)}>
                    <FiPlus /> Register Supplier
                  </button>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: '600' }}>{s.name}</td>
                          <td>{s.contact_person || 'N/A'}</td>
                          <td><code>{s.phone}</code></td>
                          <td>{s.email || 'N/A'}</td>
                          <td>{s.address || 'N/A'}</td>
                          <td>
                            <button 
                              onClick={() => {
                                if (window.confirm("Remove supplier record?")) {
                                  deleteSupplier(s.id).then(() => { toast.success("Supplier removed"); loadStoreData(); });
                                }
                              }}
                              style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px' }}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {suppliers.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>No suppliers registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== ORDERS (STOCK PURCHASING) ==================== */}
            {activeView === 'Orders' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="glass-card">
                  <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Create Stock Purchase Order</h3>
                  
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Supplier</label>
                    <select value={newPoSupplier} onChange={e => setNewPoSupplier(e.target.value)}>
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Select Product to Restock</label>
                    <select onChange={e => handleAddPoItem(e.target.value)} defaultValue="">
                      <option value="" disabled>Choose product to append to order...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                      ))}
                    </select>
                  </div>

                  {newPoItems.length > 0 && (
                    <div className="table-responsive" style={{ marginBottom: '20px' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th style={{ width: '80px' }}>Qty</th>
                            <th style={{ width: '120px' }}>Unit Cost (PKR)</th>
                            <th>Subtotal</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {newPoItems.map(item => (
                            <tr key={item.product_id}>
                              <td>{item.name}</td>
                              <td>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={item.quantity} 
                                  onChange={e => handleUpdatePoQty(item.product_id, e.target.value)}
                                  style={{ padding: '6px', width: '70px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', textAlign: 'center', borderRadius: '8px' }}
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  min="0"
                                  value={item.unit_cost} 
                                  onChange={e => handleUpdatePoCost(item.product_id, e.target.value)}
                                  style={{ padding: '6px', width: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                                />
                              </td>
                              <td>PKR {(item.quantity * item.unit_cost).toLocaleString()}</td>
                              <td>
                                <button onClick={() => handleRemovePoItem(item.product_id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><FiTrash2 /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Purchase Notes / Instructions</label>
                    <textarea 
                      rows="2"
                      placeholder="PO terms, expected delivery dates..."
                      value={newPoNotes}
                      onChange={e => setNewPoNotes(e.target.value)}
                      style={{ background: 'rgba(11, 15, 25, 0.6)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '12px', padding: '12px' }}
                    />
                  </div>

                  <button className="primary-btn" style={{ width: '100%' }} onClick={handleSubmitPo}>
                    Submit Purchase Order
                  </button>
                </div>

                <div className="glass-card">
                  <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>PO Order Log Ledger</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', maxHeight: '65vh' }}>
                    {purchaseOrders.map(po => (
                      <div key={po.id} style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>PO #{po.id}</span>
                          <span className={`badge ${po.status === 'Pending' ? 'warning' : po.status === 'Received' ? 'success' : 'danger'}`}>{po.status}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Supplier: <strong>{po.supplier_name}</strong><br/>
                          Cost: <strong>PKR {parseFloat(po.total_cost).toLocaleString()}</strong><br/>
                          Date: {new Date(po.created_at).toLocaleDateString()}
                        </div>
                        {po.status === 'Pending' && (
                          <button 
                            className="primary-btn" 
                            style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--accent-success) 0%, #065f46 100%)' }}
                            onClick={() => handleReceivePo(po.id)}
                          >
                            <FiCheck /> Confirm Stocks Received
                          </button>
                        )}
                      </div>
                    ))}
                    {purchaseOrders.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>No purchase orders recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== EXPENSES VIEW ==================== */}
            {activeView === 'Expenses' && (
              <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Outfit' }}>Expense Log Ledger</h3>
                  <button className="primary-btn" onClick={() => setShowExpenseModal(true)}>
                    <FiPlus /> Log Expense Voucher
                  </button>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Payment Method</th>
                        <th>Logged By</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id}>
                          <td><code>{e.date}</code></td>
                          <td><span className="badge info">{e.category}</span></td>
                          <td>{e.description || 'N/A'}</td>
                          <td>{e.payment_method}</td>
                          <td>{e.created_by_name || 'System'}</td>
                          <td style={{ textAlign: 'right', color: 'var(--accent-danger)', fontWeight: 'bold' }}>PKR {parseFloat(e.amount).toLocaleString()}</td>
                          <td>
                            <button 
                              onClick={() => {
                                if (window.confirm("Delete expense record?")) {
                                  deleteExpense(e.id).then(() => { toast.success("Expense deleted"); loadStoreData(); });
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>No business expense vouchers logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== HISTORY VIEW ==================== */}
            {activeView === 'History' && (
              <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Sales Transactions Log</h3>
                
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Receipt ID</th>
                        <th>Date & Time</th>
                        <th>Cashier</th>
                        <th>Customer</th>
                        <th>Payment Method</th>
                        <th>Discount</th>
                        <th>Grand Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesHistory.map(sale => (
                        <tr key={sale.id} style={{ opacity: sale.status === 'Refunded' ? 0.5 : 1 }}>
                          <td><code>#{sale.id}</code></td>
                          <td>{new Date(sale.created_at).toLocaleString()}</td>
                          <td>{sale.cashier_name || 'N/A'}</td>
                          <td>{sale.customer_name || 'Walk-in'}</td>
                          <td>{sale.payment_method}</td>
                          <td>PKR {parseFloat(sale.discount_amount).toLocaleString()}</td>
                          <td style={{ fontWeight: 'bold' }}>PKR {parseFloat(sale.total_amount).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${sale.status === 'Completed' ? 'success' : 'danger'}`}>
                              {sale.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="secondary-btn" 
                                style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
                                onClick={() => {
                                  const dateObj = new Date(sale.created_at);
                                  setReceiptData({
                                    id: sale.id,
                                    cart: sale.items.map(item => ({
                                      id: item.product,
                                      name: item.product_name || 'Product',
                                      qty: item.quantity,
                                      selling_price: parseFloat(item.price_at_sale)
                                    })),
                                    subtotal: parseFloat(sale.total_amount) + parseFloat(sale.discount_amount) - parseFloat(sale.tax_amount),
                                    discountAmount: parseFloat(sale.discount_amount),
                                    taxAmount: parseFloat(sale.tax_amount),
                                    grandTotal: parseFloat(sale.total_amount),
                                    amount_tendered: parseFloat(sale.amount_tendered),
                                    changeDue: parseFloat(sale.change_due),
                                    payment_method: sale.payment_method,
                                    date: dateObj.toLocaleDateString(),
                                    time: dateObj.toLocaleTimeString(),
                                    customer_name: sale.customer_name || 'Walk-in Customer',
                                    cashier_name: sale.cashier_name || 'System Cashier'
                                  });
                                }}
                              >
                                <FiPrinter /> Print Receipt
                              </button>
                              {sale.status === 'Completed' && user.role === 'Admin' && (
                                <button 
                                  className="danger-btn"
                                  onClick={() => handleVoidSale(sale.id)}
                                >
                                  Void Sale
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {salesHistory.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>No transaction history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== SETTINGS & UTILITIES ==================== */}
            {activeView === 'Settings' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                
                {/* Promo Code Discount Panel */}
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Outfit' }}>Promotion Discount Codes</h3>
                    <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowDiscountModal(true)}>
                      <FiPlus /> Add Promotion
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Promo Code</th>
                          <th>Reduction</th>
                          <th>Min Order</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts.map(d => (
                          <tr key={d.id}>
                            <td><code>{d.code}</code></td>
                            <td>{d.discount_type === 'percentage' ? `${d.value}%` : `PKR ${d.value}`}</td>
                            <td>PKR {parseFloat(d.min_purchase).toLocaleString()}</td>
                            <td><span className={`badge ${d.is_active ? 'success' : 'danger'}`}>{d.is_active ? 'Active' : 'Expired'}</span></td>
                            <td>
                              <button 
                                onClick={() => {
                                  deleteDiscount(d.id).then(() => { toast.success("Promo code deleted"); loadStoreData(); });
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {discounts.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No promotional codes set.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Database export, sync control */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>System Reports Data Export</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Export complete store transaction ledger and inventory catalogs directly into CSV formatted sheets for audits.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="primary-btn" onClick={handleExportSales} style={{ flex: 1 }}>
                        <FiFileText /> Export Sales CSV
                      </button>
                      <button className="primary-btn" onClick={handleExportInventory} style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #0369a1 100%)', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)' }}>
                        <FiBox /> Export Inventory CSV
                      </button>
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3 style={{ marginBottom: '15px', fontFamily: 'Outfit' }}>Staff & Cashiers Users</h3>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>System Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffUsers.map(st => (
                            <tr key={st.id}>
                              <td><strong>{st.username}</strong></td>
                              <td>{st.email || 'N/A'}</td>
                              <td>
                                <span className={`badge ${st.role === 'Admin' ? 'success' : 'info'}`}>
                                  {st.role}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Audit Logs Trail */}
                <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Security Activity Audit Logs</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activityLogs.map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>[{log.username}]</span>{' '}
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>{log.action}</span>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>({log.target})</span>{' '}
                          <span style={{ color: 'var(--text-muted)' }}>- {log.details}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No audit activities recorded.</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </main>

      {/* ==================== INTERACTIVE FORM MODALS ==================== */}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>{productForm.id ? 'Edit Product Details' : 'Add New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            
            <form onSubmit={handleProductSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    required 
                    value={productForm.name} 
                    onChange={e => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    required 
                    value={productForm.sku} 
                    onChange={e => setProductForm({...productForm, sku: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Barcode ID</label>
                  <input 
                    type="text" 
                    value={productForm.barcode || ''} 
                    onChange={e => setProductForm({...productForm, barcode: e.target.value})}
                    placeholder="Scan or type barcode"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    required 
                    value={productForm.category} 
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                  >
                    <option value="">Choose category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier Partner</label>
                  <select 
                    value={productForm.supplier || ''} 
                    onChange={e => setProductForm({...productForm, supplier: e.target.value})}
                  >
                    <option value="">Generic (None)</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input 
                    type="text" 
                    value={productForm.image_url || ''} 
                    onChange={e => setProductForm({...productForm, image_url: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Buy Cost (PKR)</label>
                  <input 
                    type="number" 
                    required 
                    value={productForm.cost_price} 
                    onChange={e => setProductForm({...productForm, cost_price: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Retail Price (PKR)</label>
                  <input 
                    type="number" 
                    required 
                    value={productForm.selling_price} 
                    onChange={e => setProductForm({...productForm, selling_price: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>In Stock Quantity</label>
                  <input 
                    type="number" 
                    required 
                    value={productForm.stock_quantity} 
                    onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Low Limit Reorder Level</label>
                  <input 
                    type="number" 
                    required 
                    value={productForm.reorder_level} 
                    onChange={e => setProductForm({...productForm, reorder_level: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '10px' }}>
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Registration Modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>Customer Registration</h3>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Customer Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={customerForm.name} 
                  onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Phone Number (Unique)</label>
                <input 
                  type="text" 
                  required 
                  value={customerForm.phone} 
                  onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Email Address</label>
                <input 
                  type="text" 
                  value={customerForm.email} 
                  onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Billing Address</label>
                <textarea 
                  rows="2" 
                  value={customerForm.address} 
                  onChange={e => setCustomerForm({...customerForm, address: e.target.value})}
                  style={{ background: 'rgba(11, 15, 25, 0.6)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '12px', padding: '12px' }}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%' }}>
                Register Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Registration Modal */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>Supplier Registration</h3>
              <button onClick={() => setShowSupplierModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Company / Supplier Name</label>
                <input 
                  type="text" 
                  required 
                  value={supplierForm.name} 
                  onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Contact Person</label>
                <input 
                  type="text" 
                  value={supplierForm.contact_person} 
                  onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Phone Number</label>
                <input 
                  type="text" 
                  required 
                  value={supplierForm.phone} 
                  onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Email Address</label>
                <input 
                  type="text" 
                  value={supplierForm.email} 
                  onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Corporate Address</label>
                <textarea 
                  rows="2" 
                  value={supplierForm.address} 
                  onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                  style={{ background: 'rgba(11, 15, 25, 0.6)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '12px', padding: '12px' }}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%' }}>
                Register Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Discount Modal */}
      {showDiscountModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>Add Promotional Code</h3>
              <button onClick={() => setShowDiscountModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            
            <form onSubmit={handleDiscountSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Campaign Name</label>
                <input 
                  type="text" 
                  required 
                  value={discountForm.name} 
                  onChange={e => setDiscountForm({...discountForm, name: e.target.value})}
                  placeholder="e.g. Summer Sale"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Promo Code (Matches exactly at checkout)</label>
                <input 
                  type="text" 
                  required 
                  value={discountForm.code} 
                  onChange={e => setDiscountForm({...discountForm, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. SUMMER25"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Discount Type</label>
                <select value={discountForm.discount_type} onChange={e => setDiscountForm({...discountForm, discount_type: e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Reduction Amount (PKR)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Discount Value</label>
                <input 
                  type="number" 
                  required 
                  value={discountForm.value} 
                  onChange={e => setDiscountForm({...discountForm, value: e.target.value})}
                  placeholder="e.g. 10 or 500"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Minimum Purchase Amount Required (PKR)</label>
                <input 
                  type="number" 
                  required 
                  value={discountForm.min_purchase} 
                  onChange={e => setDiscountForm({...discountForm, min_purchase: e.target.value})}
                  placeholder="e.g. 1000"
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%' }}>
                Save Promotion
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expense Logging Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>Log Expense Voucher</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Voucher Category</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Transport">Transport</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Amount Spent (PKR)</label>
                <input 
                  type="number" 
                  required 
                  value={expenseForm.amount} 
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Voucher Description</label>
                <input 
                  type="text" 
                  required 
                  value={expenseForm.description} 
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Payment Method Used</label>
                <input 
                  type="text" 
                  required 
                  value={expenseForm.payment_method} 
                  onChange={e => setExpenseForm({...expenseForm, payment_method: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Expense Date</label>
                <input 
                  type="date" 
                  required 
                  value={expenseForm.date} 
                  onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%' }}>
                Log Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Audit Modal */}
      {showStockAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>Adjust Stock Count</h3>
              <button onClick={() => setShowStockAdjustModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            
            <form onSubmit={handleStockAdjustmentSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Select Product</label>
                <select required value={adjustForm.product_id} onChange={e => setAdjustForm({...adjustForm, product_id: e.target.value})}>
                  <option value="">Choose item...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>New In-Stock Quantity</label>
                <input 
                  type="number" 
                  required 
                  value={adjustForm.new_quantity} 
                  onChange={e => setAdjustForm({...adjustForm, new_quantity: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Reason / Audit Notes</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. damaged stock, manual count discrepancy"
                  value={adjustForm.reason} 
                  onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%' }}>
                Approve Adjustments
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Loyalty Customer Purchases Ledger Modal */}
      {selectedCustHistory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit' }}>{selectedCustHistory.customer.name}'s Ledger</h3>
              <button onClick={() => setSelectedCustHistory(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
            </div>
            <div className="table-responsive" style={{ maxHeight: '400px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustHistory.sales.map(s => (
                    <tr key={s.id}>
                      <td><code>#{s.id}</code></td>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td>{s.payment_method}</td>
                      <td><span className={`badge ${s.status === 'Completed' ? 'success' : 'danger'}`}>{s.status}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>PKR {parseFloat(s.total_amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {selectedCustHistory.sales.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found for this customer.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINTABLE THERMAL RECEIPT MODAL ==================== */}
      {receiptData && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ width: '380px', padding: '24px' }}>
            
            {/* The actual formatted area that will be printed */}
            <div id="print-receipt-area" style={{ fontFamily: 'monospace', color: 'black', background: 'white', padding: '15px' }}>
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', letterSpacing: '1px' }}>SANSONS STORE</h2>
                <span style={{ fontSize: '11px', color: '#444' }}>Pakistan Retail POS Portal</span><br/>
                <span style={{ fontSize: '11px', color: '#444' }}>Phone: sansons.shop</span>
              </div>
              
              <div style={{ fontSize: '11px', borderBottom: '1px dashed #000', borderTop: '1px dashed #000', padding: '8px 0', margin: '10px 0' }}>
                Receipt: #{receiptData.id}<br/>
                Date: {receiptData.date} | Time: {receiptData.time}<br/>
                Cashier: {receiptData.cashier_name}<br/>
                Customer: {receiptData.customer_name}
              </div>

              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0', color: '#000', fontSize: '11px' }}>Item Desc</th>
                    <th style={{ textAlign: 'center', color: '#000', fontSize: '11px' }}>Qty</th>
                    <th style={{ textAlign: 'right', color: '#000', fontSize: '11px' }}>Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.cart.map(item => (
                    <tr key={item.id}>
                      <td style={{ padding: '6px 0', fontSize: '11px' }}>{item.name}</td>
                      <td style={{ textAlign: 'center', fontSize: '11px' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', fontSize: '11px' }}>{(item.selling_price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Subtotal:</span>
                  <span>PKR {receiptData.subtotal.toLocaleString()}</span>
                </div>
                {receiptData.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>Promo Discount:</span>
                    <span>- PKR {receiptData.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Tax Amount:</span>
                  <span>PKR {receiptData.taxAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', margin: '8px 0 5px 0', fontSize: '14px', borderTop: '1px solid #000', paddingTop: '6px' }}>
                  <span>GRAND TOTAL:</span>
                  <span>PKR {receiptData.grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Paid via {receiptData.payment_method}:</span>
                  <span>PKR {receiptData.amount_tendered.toLocaleString()}</span>
                </div>
                {receiptData.payment_method === 'Cash' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>Change Returned:</span>
                    <span>PKR {receiptData.changeDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '11px' }}>
                Thank you for shopping with SanSons!<br/>
                Visit: https://sansons.shop
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="primary-btn" 
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1e1b4b 100%)' }}
                onClick={() => window.print()}
              >
                <FiPrinter /> Send to Printer
              </button>
              <button 
                className="secondary-btn" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setReceiptData(null)}
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;