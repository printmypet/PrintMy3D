import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LogIn, ShoppingCart, Search, PawPrint, Home, User } from 'lucide-react';
import { Banner, Product, CartItem, PartsColors, ProductLine } from '../../types';
import { fetchBanners, fetchProducts } from '../../services/supabase';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ProductCard } from './ProductCard';
import { CartSidebar } from './CartSidebar';
import { CheckoutForm } from './CheckoutForm';

interface LandingPageProps {
  onEnterAdmin: () => void;
  isOnline: boolean;
  partsColors: PartsColors;
  availableTextures: string[];
}

const LINE_META: Record<ProductLine, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  PET: { icon: PawPrint, label: 'Para seu pet', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  HOME: { icon: Home, label: 'Para sua casa', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  SELF: { icon: User, label: 'Para você', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAdmin, isOnline, partsColors, availableTextures }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLine, setActiveLine] = useState<ProductLine | 'all'>('all');

  useEffect(() => {
    if (!isOnline) return;
    fetchBanners().then(setBanners);
    fetchProducts().then(setProducts);
  }, [isOnline]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
    setCartOpen(true);
  };

  const handleRemoveFromCart = (id: string) => setCartItems(prev => prev.filter(i => i.id !== id));

  const handleCheckoutSuccess = () => {
    setCartItems([]);
    setShowCheckout(false);
    setCartOpen(false);
  };

  const resolveImage = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url.slice(1) : url;
  };

  const filteredProducts = products.filter(p => {
    const matchesLine = activeLine === 'all' || p.line === activeLine;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLine && matchesSearch;
  });

  const lines: ProductLine[] = ['PET', 'HOME', 'SELF'];

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center px-4">
          <Logo size="md" />
        </nav>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <CheckoutForm
            items={cartItems}
            isOnline={isOnline}
            onBack={() => setShowCheckout(false)}
            onSuccess={handleCheckoutSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Carrinho</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
            <button
              onClick={onEnterAdmin}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
              title="Acesso Administrativo"
            >
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Entrar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Banner Carousel */}
      {banners.length > 0 ? (
        <div className="relative bg-slate-900 overflow-hidden" style={{ height: '340px' }}>
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === currentBanner ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={resolveImage(banner.imageUrl)} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="px-12 max-w-xl">
                  <Logo size="xl" className="mb-4 block" />
                  <p className="text-white/80 text-lg">Produtos personalizados em impressão 3D</p>
                </div>
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <>
              <button onClick={() => setCurrentBanner(p => (p - 1 + banners.length) % banners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentBanner(p => (p + 1) % banners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setCurrentBanner(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'bg-white w-6' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 py-20 px-4 text-center">
          <Logo size="xl" className="justify-center mb-4 flex" />
          <p className="text-white/70 text-lg">Produtos personalizados em impressão 3D para pets, casa e você</p>
        </div>
      )}

      {/* Line selector + search */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveLine('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeLine === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
            >
              Todos
            </button>
            {lines.map(line => {
              const meta = LINE_META[line];
              const Icon = meta.icon;
              return (
                <button
                  key={line}
                  onClick={() => setActiveLine(line)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${activeLine === line ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <Logo line={line} size="sm" className={`text-xs ${activeLine === line ? 'text-white [&>span]:text-white' : ''}`} />
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-9 pr-4 py-2 rounded-full border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-60"
            />
          </div>
        </div>
      </div>

      {/* Product sections */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {(activeLine === 'all' ? lines : [activeLine as ProductLine]).map(line => {
          const meta = LINE_META[line];
          const Icon = meta.icon;
          const lineProducts = filteredProducts.filter(p => p.line === line);
          if (lineProducts.length === 0 && activeLine !== 'all') {
            return (
              <div key={line} className="text-center py-16 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">Nenhum produto encontrado</p>
              </div>
            );
          }
          if (lineProducts.length === 0) return null;
          return (
            <section key={line} className="mb-14">
              <div className={`flex items-center gap-3 mb-6 p-4 rounded-2xl border ${meta.bg}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div>
                  <Logo line={line} size="lg" />
                  <p className={`text-sm ${meta.color}`}>{meta.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lineProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    partsColors={partsColors}
                    availableTextures={availableTextures}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filteredProducts.length === 0 && searchQuery && (
          <div className="text-center py-20 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium text-lg">Nenhum produto para "{searchQuery}"</p>
          </div>
        )}

        {products.length === 0 && !searchQuery && isOnline && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-sm">Nenhum produto cadastrado ainda.</p>
          </div>
        )}

        {!isOnline && (
          <div className="text-center py-20 text-slate-400">
            <p className="font-medium">Site offline</p>
            <p className="text-sm mt-1">Configure o banco de dados no painel admin.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center">
          <Logo size="sm" className="justify-center mb-2 inline-flex" />
          <p className="text-xs text-slate-400 mt-1">&copy; {new Date().getFullYear()} PrintMy[]3D — Impressão 3D Personalizada</p>
        </div>
      </footer>

      <CartSidebar
        isOpen={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onRemove={handleRemoveFromCart}
        onCheckout={() => { setCartOpen(false); setShowCheckout(true); }}
      />
    </div>
  );
};
