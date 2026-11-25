import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import LogsPage from './pages/LogsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import { api, getToken, clearSession, imageUrl } from './lib/api';
import {
  initialStats, revenueData, categorySalesData, initialActivityLogs,
  initialNotifications, trafficSourceData, deviceAnalyticsData
} from './data/mockData.js';

const titleCase = (s='') => s.charAt(0).toUpperCase() + s.slice(1);
const mapProduct = p => ({
  ...p, id: p._id, sku: p.sku || (p.legacyId ? `SHOP-${p.legacyId}` : String(p._id).slice(-7)),
  status: Number(p.stock) === 0 ? 'Out of Stock' : Number(p.stock) <= 15 ? 'Low Stock' : 'In Stock',
  imageUrl: imageUrl(p.image), salesCount: p.salesCount || 0
});
const mapOrder = o => ({
  ...o, id: o._id, customer: o.user?.name || o.shippingAddress?.fullName || 'Customer',
  email: o.user?.email || '', date: new Date(o.createdAt).toLocaleString(),
  total: Number(o.total || 0), itemsCount: o.items?.reduce((n,i)=>n+Number(i.quantity||1),0) || 0,
  status: titleCase(o.status), paymentMethod: o.paymentMethod || 'Cash on delivery',
  shippingAddress: [o.shippingAddress?.address,o.shippingAddress?.city,o.shippingAddress?.country].filter(Boolean).join(', ')
});

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [stats] = useState(initialStats);
  const [revenueTimeline] = useState(revenueData);
  const [categorySales] = useState(categorySalesData);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState(initialActivityLogs);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shopco_admin_user') || '{}'); } catch { return {}; }
  });
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [p, o, u] = await Promise.all([
        api('/api/products?limit=100'),
        api('/api/orders'),
        api('/api/users')
      ]);
      setProducts((p.products || []).map(mapProduct));
      setOrders((o.orders || []).map(mapOrder));
      setUsers((u.users || []).map(x => ({
        id: x._id, name: x.name, email: x.email, role: titleCase(x.role),
        status: 'Active', department: '—', joinedDate: x.createdAt ? new Date(x.createdAt).toLocaleDateString() : ''
      })));
    } catch (e) {
      setLoadError(e.message);
      if (/token|login|admin access/i.test(e.message)) { clearSession(); setAuthenticated(false); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authenticated) loadAll();
  }, [authenticated, loadAll]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogin = (user) => { setCurrentUser(user); setAuthenticated(true); };
  const handleLogout = () => { clearSession(); setAuthenticated(false); setCurrentUser({}); };
  const handleExportReport = () => {
    const csv = [['Order ID','Customer','Email','Date','Total','Status'].join(','), ...orders.map(o=>[o.id,`"${o.customer}"`,o.email,o.date,o.total,o.status].join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8;'}));
    const a = document.createElement('a'); a.href=url; a.download='shopco-orders.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const createProduct = async (payload) => {
    const result = await api('/api/products', { method:'POST', body:JSON.stringify(payload) });
    setProducts(prev => [mapProduct(result.product), ...prev]);
  };
  const updateProduct = async (id, payload) => {
    const result = await api(`/api/products/${id}`, { method:'PUT', body:JSON.stringify(payload) });
    setProducts(prev => prev.map(p => p.id === id ? mapProduct(result.product) : p));
  };
  const deleteProduct = async (id) => {
    await api(`/api/products/${id}`, { method:'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  };
  const updateOrderStatus = async (id, status) => {
    const result = await api(`/api/orders/${id}/status`, { method:'PATCH', body:JSON.stringify({status:status.toLowerCase()}) });
    const mapped = mapOrder(result.order);
    setOrders(prev => prev.map(o => o.id === id ? mapped : o));
    setSelectedOrder(prev => prev?.id === id ? mapped : prev);
  };
  const handleSelectOrderAndNavigate = (order) => { setSelectedOrder(order); setActivePage('orders'); };

  if (!authenticated) return <AdminLogin onLogin={handleLogin} />;

  const lowStockCount = products.filter(p=>p.status==='Low Stock').length;
  const pendingOrdersCount = orders.filter(o=>o.status==='Processing').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150 relative isolate">
      <div className="ambient-glow" aria-hidden="true">
        <div className="absolute -top-32 -left-20 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 dark:from-indigo-500/25 dark:to-violet-600/10 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-cyan-400/15 to-indigo-500/10 dark:from-cyan-400/15 dark:to-indigo-500/10 blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] rounded-full bg-gradient-to-br from-violet-500/10 to-transparent blur-3xl animate-float" />
      </div>
      <Sidebar activePage={activePage} setActivePage={setActivePage} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} counts={{usersCount:users.length,lowStockCount,pendingOrdersCount}} />
      <Header isCollapsed={isSidebarCollapsed} setIsMobileOpen={setIsMobileSidebarOpen} searchTerm={searchTerm} setSearchTerm={setSearchTerm} notifications={notifications} setNotifications={setNotifications} onOpenNewProduct={()=>{setActivePage('products');setIsAddProductModalOpen(true);}} onExportReport={handleExportReport} darkMode={darkMode} setDarkMode={setDarkMode} currentUser={currentUser} onLogout={handleLogout} />
      <main id="main-content-viewport" className={`relative z-10 flex-1 transition-all duration-200 ease-in-out pt-16 ${isSidebarCollapsed?'lg:pl-20':'lg:pl-64'}`}>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {loadError && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{loadError} <button className="underline ml-2" onClick={loadAll}>Retry</button></div>}
          {loading && <div className="mb-4 text-sm text-slate-500">Loading live data from Shop.Co backend...</div>}
          {activePage==='dashboard' && <DashboardPage stats={{...stats,totalOrders:orders.length,activeUsers:users.length}} revenueTimeline={revenueTimeline} categorySales={categorySales} orders={orders} users={users} onNavigate={setActivePage} onSelectOrder={handleSelectOrderAndNavigate} />}
          {activePage==='analytics' && <AnalyticsPage trafficSources={trafficSourceData} deviceAnalytics={deviceAnalyticsData} />}
          {activePage==='users' && <UsersPage users={users} setUsers={setUsers} searchTerm={searchTerm} />}
          {activePage==='products' && <ProductsPage products={products} setProducts={setProducts} searchTerm={searchTerm} isAddModalOpen={isAddProductModalOpen} setIsAddModalOpen={setIsAddProductModalOpen} onCreateProduct={createProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />}
          {activePage==='orders' && <OrdersPage orders={orders} setOrders={setOrders} searchTerm={searchTerm} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} onExportReport={handleExportReport} onUpdateOrderStatus={updateOrderStatus} />}
          {activePage==='logs' && <LogsPage logs={logs} setLogs={setLogs} searchTerm={searchTerm} />}
          {activePage==='settings' && <SettingsPage currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        </div>
      </main>
    </div>
  );
}
