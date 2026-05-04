
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, Package, Image, Settings, LogOut, User, Store, Bell } from 'lucide-react';
import {
  Order, OrderStatus, AppUser, PartsColors, Texture,
  DEFAULT_COLORS, DEFAULT_TEXTURES, SupabaseConfig
} from './types';
import { LandingPage } from './components/public/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OrderList } from './components/admin/OrderList';
import { ProductManager } from './components/admin/ProductManager';
import { BannerManager } from './components/admin/BannerManager';
import { AdminSettings } from './components/admin/AdminSettings';
import { Logo } from './components/ui/Logo';
import { Button } from './components/ui/Button';
import {
  initSupabase,
  subscribeToOrders,
  updateOrderStatus,
  updateOrderPaid,
  deleteOrder,
  fetchColors,
  fetchTextures,
} from './services/supabase';

// --- CONFIGURAÇÃO FIXA DE PRODUÇÃO ---
// Substitua pelos dados do seu projeto Supabase depois de criar as tabelas.
const FIXED_CONFIG = {
  url: '',
  key: '',
};

type AdminView = 'dashboard' | 'orders' | 'products' | 'banners' | 'settings';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<AdminView>('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const previousCount = useRef<number | null>(null);

  const [partsColors, setPartsColors] = useState<PartsColors>(() => {
    const saved = localStorage.getItem('pm3d-colors');
    if (saved) return JSON.parse(saved);
    return { base: [...DEFAULT_COLORS], ball: [...DEFAULT_COLORS], top: [...DEFAULT_COLORS] };
  });

  const [availableTextures, setAvailableTextures] = useState<Texture[]>(() => {
    const saved = localStorage.getItem('pm3d-textures');
    if (saved) return JSON.parse(saved);
    return DEFAULT_TEXTURES.map(t => ({ id: uuidv4(), name: t }));
  });

  useEffect(() => {
    if (previousCount.current === null) {
      if (orders.length > 0) previousCount.current = orders.length;
      return;
    }
    if (orders.length > previousCount.current) setNewOrderAlert(true);
    previousCount.current = orders.length;
  }, [orders]);

  useEffect(() => {
    let configToUse: SupabaseConfig | null = null;
    const localStr = localStorage.getItem('app-supabase-config');
    if (localStr) {
      try {
        const parsed = JSON.parse(localStr);
        if (parsed?.supabaseUrl && parsed?.supabaseKey) configToUse = parsed;
      } catch {}
    }
    if (!configToUse && FIXED_CONFIG.url && FIXED_CONFIG.key) {
      configToUse = { supabaseUrl: FIXED_CONFIG.url, supabaseKey: FIXED_CONFIG.key };
      localStorage.setItem('app-supabase-config', JSON.stringify(configToUse));
    }

    let connected = false;
    let unsubscribe = () => {};

    if (configToUse) {
      connected = initSupabase(configToUse);
      setIsOnline(connected);
    } else {
      setIsOnline(false);
    }

    if (connected) {
      unsubscribe = subscribeToOrders(setOrders);
      fetchColors().then(colors => { if (colors) setPartsColors(colors); });
      fetchTextures().then(txts => { if (txts && txts.length > 0) setAvailableTextures(txts); });
    } else {
      const saved = localStorage.getItem('pm3d-orders');
      if (saved) { try { setOrders(JSON.parse(saved)); } catch {} }
    }

    return () => unsubscribe();
  }, [reloadKey]);

  useEffect(() => { if (!isOnline) localStorage.setItem('pm3d-orders', JSON.stringify(orders)); }, [orders, isOnline]);
  useEffect(() => { localStorage.setItem('pm3d-colors', JSON.stringify(partsColors)); }, [partsColors]);
  useEffect(() => { localStorage.setItem('pm3d-textures', JSON.stringify(availableTextures)); }, [availableTextures]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (isOnline) await updateOrderStatus(id, status);
  };

  const handleUpdatePaid = async (id: string, isPaid: boolean) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, isPaid } : o));
    if (isOnline) await updateOrderPaid(id, isPaid);
  };

  const handleDelete = async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    if (isOnline) await deleteOrder(id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
    setShowLanding(true);
  };

  // --- Public landing ---
  if (showLanding) {
    return (
      <LandingPage
        onEnterAdmin={() => setShowLanding(false)}
        isOnline={isOnline}
        partsColors={partsColors}
        availableTextures={availableTextures.map(t => t.name)}
      />
    );
  }

  // --- Login ---
  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} isOnline={isOnline} onBack={() => setShowLanding(true)} />;
  }

  // --- Admin panel ---
  const navItems: { id: AdminView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: Package },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isOnline ? '● Online' : '○ Offline'}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-slate-300"><User className="w-3 h-3 inline mr-1" />{currentUser.name}</span>
            <button onClick={() => setShowLanding(true)} className="flex items-center gap-1 hover:text-sky-400 transition-colors text-slate-300">
              <Store className="w-3 h-3" /> Loja
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <LogOut className="w-3 h-3" /> Sair
            </button>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setView('dashboard')} className="font-logo">
              <Logo size="md" />
            </button>
            <nav className="flex gap-1 overflow-x-auto">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); if (item.id === 'orders') setNewOrderAlert(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${view === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {item.id === 'orders' && newOrderAlert && view !== 'orders' ? (
                    <Bell className="w-4 h-4 text-amber-500 animate-pulse" />
                  ) : (
                    <item.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && <AdminDashboard orders={orders} />}
        {view === 'orders' && (
          <OrderList
            orders={orders}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePaid={handleUpdatePaid}
            onDelete={handleDelete}
          />
        )}
        {view === 'products' && <ProductManager />}
        {view === 'banners' && <BannerManager />}
        {view === 'settings' && (
          <AdminSettings
            partsColors={partsColors}
            textures={availableTextures}
            onUpdatePartsColors={setPartsColors}
            onUpdateTextures={setAvailableTextures}
            onConfigUpdate={() => setReloadKey(k => k + 1)}
            isOnline={isOnline}
            currentUser={currentUser}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} PrintMy[]3D — Painel Admin</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
