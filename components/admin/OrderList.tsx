import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Trash2, CheckCircle, Circle, Package, PawPrint, Home, User } from 'lucide-react';
import { Order, OrderStatus, ProductLine } from '../../types';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

interface OrderListProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdatePaid: (id: string, isPaid: boolean) => void;
  onDelete: (id: string) => void;
}

const STATUSES: OrderStatus[] = ['Pendente', 'Em Impressão', 'Acabamento', 'Concluído', 'Entregue'];

const STATUS_STYLES: Record<OrderStatus, string> = {
  'Pendente': 'bg-amber-100 text-amber-700',
  'Em Impressão': 'bg-blue-100 text-blue-700',
  'Acabamento': 'bg-purple-100 text-purple-700',
  'Concluído': 'bg-emerald-100 text-emerald-700',
  'Entregue': 'bg-slate-100 text-slate-600',
};

const LINE_ICONS: Record<string, React.ElementType> = { PET: PawPrint, HOME: Home, SELF: User, MIXED: Package };

export const OrderList: React.FC<OrderListProps> = ({ orders, onUpdateStatus, onUpdatePaid, onDelete }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterLine, setFilterLine] = useState<ProductLine | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.cpf?.includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchLine = filterLine === 'all' || o.line === filterLine;
    return matchSearch && matchStatus && matchLine;
  });

  const handleDelete = (id: string) => {
    if (confirm('Excluir este pedido?')) onDelete(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF ou ID..."
            className="pl-9 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos os status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterLine}
          onChange={e => setFilterLine(e.target.value as any)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todas as linhas</option>
          <option value="PET">PET</option>
          <option value="HOME">HOME</option>
          <option value="SELF">SELF</option>
        </select>
      </div>

      <div className="text-sm text-slate-500">{filtered.length} pedido(s)</div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p>Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const expanded = expandedId === order.id;
            const LineIcon = LINE_ICONS[order.line] || Package;
            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 select-none"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <LineIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{order.customer?.name || 'Cliente'}</span>
                      <span className="text-xs text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                      {order.line !== 'MIXED' && <Logo line={order.line as ProductLine} size="sm" className="text-xs" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs font-semibold text-slate-700">{(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                    <button
                      onClick={e => { e.stopPropagation(); onUpdatePaid(order.id, !order.isPaid); }}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${order.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'}`}
                    >
                      {order.isPaid ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {order.isPaid ? 'Pago' : 'Pendente'}
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase">E-mail</p>
                        <p className="text-slate-700">{order.customer?.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase">Telefone</p>
                        <p className="text-slate-700">{order.customer?.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase">CPF</p>
                        <p className="text-slate-700">{order.customer?.cpf || '—'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-xs text-slate-400 font-medium uppercase">Endereço</p>
                        <p className="text-slate-700">{[order.customer?.address, order.customer?.city, order.customer?.state].filter(Boolean).join(', ') || '—'}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase mb-2">Itens</p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-800">{item.product?.name}</p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {item.customization.type === 'PET' && `Pet: ${(item.customization as any).petName || '—'} | Base: ${(item.customization as any).baseColor?.name} | Corpo: ${(item.customization as any).ballColor?.name} | Topo: ${(item.customization as any).topColor?.name}`}
                                {item.customization.type === 'HOME' && `Cor: ${(item.customization as any).color?.name} | Material: ${(item.customization as any).material || '—'} | Dimensões: ${(item.customization as any).dimensions || '—'}`}
                                {item.customization.type === 'SELF' && `Cor: ${(item.customization as any).color?.name} | Material: ${(item.customization as any).material || '—'} | Texto: ${(item.customization as any).customText || '—'}`}
                              </p>
                              {(item.customization as any).observations && (
                                <p className="text-slate-400 text-xs mt-1">Obs: {(item.customization as any).observations}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium uppercase mb-1">Status</label>
                        <select
                          value={order.status}
                          onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="ml-auto">
                        <Button size="sm" variant="danger" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
