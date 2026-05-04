import React from 'react';
import { X, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import { CartItem, PetCustomization, HomeCustomization, SelfCustomization } from '../../types';
import { Button } from '../ui/Button';

interface CartSidebarProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const customizationSummary = (item: CartItem): string => {
  const c = item.customization;
  if (c.type === 'PET') {
    const p = c as PetCustomization;
    if (p.observations && !p.petName) return p.observations;
    return `Pet: ${p.petName || '—'} | Base: ${p.baseColor.name} | Corpo: ${p.ballColor.name} | Topo: ${p.topColor.name}`;
  }
  if (c.type === 'HOME') {
    const h = c as HomeCustomization;
    const parts = [h.color?.name, h.material, h.dimensions, h.observations].filter(Boolean);
    return parts.join(' | ') || '—';
  }
  const s = c as SelfCustomization;
  const parts = [s.color?.name, s.material, s.customText, s.observations].filter(Boolean);
  return parts.join(' | ') || '—';
};

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, items, onClose, onRemove, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Carrinho</h2>
            {items.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Package className="w-12 h-12" />
              <p className="text-sm font-medium">Carrinho vazio</p>
              <p className="text-xs text-center">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{customizationSummary(item)}</p>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Qtd: {item.quantity}</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {(item.product.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-slate-900">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <p className="text-xs text-slate-400">Frete calculado no próximo passo.</p>
            <Button className="w-full" onClick={onCheckout}>
              Finalizar Pedido
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
