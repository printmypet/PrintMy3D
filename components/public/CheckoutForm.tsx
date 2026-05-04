import React, { useState } from 'react';
import { ArrowLeft, Package, CheckCircle, Loader2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { CartItem, Customer, Order, OrderStatus } from '../../types';
import { Button } from '../ui/Button';
import { addOrder } from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';

interface CheckoutFormProps {
  items: CartItem[];
  isOnline: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

const emptyCustomer: Customer = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  instagram: '',
  address: '',
  zipCode: '',
  city: '',
  state: '',
};

const determineLine = (items: CartItem[]): Order['line'] => {
  const lines = [...new Set(items.map(i => i.product.line))];
  return lines.length === 1 ? lines[0] : 'MIXED';
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ items, isOnline, onBack, onSuccess }) => {
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) { setError('É necessário estar online para enviar o pedido.'); return; }

    setLoading(true);
    setError('');
    const id = uuidv4();
    const order: Order = {
      id,
      createdAt: new Date().toISOString(),
      customer,
      items,
      total,
      shippingCost,
      status: 'Pendente' as OrderStatus,
      isPaid: false,
      line: determineLine(items),
    };

    try {
      await addOrder(order);
      setOrderId(id.slice(0, 8).toUpperCase());
      setSubmitted(true);
    } catch (e: any) {
      setError('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Pedido Enviado!</h2>
        <p className="text-slate-500 mb-4">
          Seu pedido <strong>#{orderId}</strong> foi recebido com sucesso.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          Entraremos em contato via e-mail ou telefone para confirmar os detalhes e combinar o pagamento.
        </p>
        <Button onClick={onSuccess} className="w-full max-w-xs mx-auto">
          Continuar Comprando
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Finalizar Pedido</h2>
          <p className="text-sm text-slate-500">{items.length} {items.length === 1 ? 'item' : 'itens'} no carrinho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados do Cliente
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo <span className="text-red-500">*</span></label>
                <input required value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Seu nome" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail <span className="text-red-500">*</span></label>
                  <input required type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="seu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone <span className="text-red-500">*</span></label>
                  <input required value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                  <input value={customer.cpf} onChange={e => setCustomer({ ...customer, cpf: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                  <input value={customer.instagram} onChange={e => setCustomer({ ...customer, instagram: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="@usuario" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço de Entrega
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                  <input value={customer.zipCode} onChange={e => setCustomer({ ...customer, zipCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="00000-000" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Sua cidade" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço completo</label>
                <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Rua, número, bairro..." />
              </div>
            </div>
          </div>

          {/* Pagamento: placeholder para integração futura */}
          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-5 text-center">
            <p className="text-sm text-slate-500 font-medium">Pagamento</p>
            <p className="text-xs text-slate-400 mt-1">
              Após receber seu pedido, entraremos em contato para combinar o pagamento (PIX, transferência ou outro meio).
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : 'Confirmar Pedido'}
          </Button>
        </form>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Resumo
            </h3>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 truncate flex-1 mr-2">{item.product.name}</span>
                  <span className="font-medium text-slate-900 flex-shrink-0">
                    {item.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Frete</span>
                <span className="text-xs text-slate-400 italic">A combinar</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                <span className="text-slate-900">Total</span>
                <span className="text-indigo-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
