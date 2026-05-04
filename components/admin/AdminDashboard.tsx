import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, ShoppingBag, TrendingUp, CheckCircle } from 'lucide-react';
import { Order, OrderStatus, ProductLine } from '../../types';

interface AdminDashboardProps {
  orders: Order[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  'Pendente': '#F59E0B',
  'Em Impressão': '#3B82F6',
  'Acabamento': '#8B5CF6',
  'Concluído': '#10B981',
  'Entregue': '#6B7280',
};

const LINE_COLORS: Record<string, string> = {
  PET: '#10B981',
  HOME: '#3B82F6',
  SELF: '#8B5CF6',
  MIXED: '#F59E0B',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders }) => {
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name as OrderStatus] || '#6B7280' }));
  }, [orders]);

  const lineData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { const l = o.line || 'MIXED'; counts[l] = (counts[l] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const revenueData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      byMonth[month] = (byMonth[month] || 0) + (o.total || 0);
    });
    return Object.entries(byMonth).slice(-6).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const total = orders.reduce((s, o) => s + (o.total || 0), 0);
  const paid = orders.filter(o => o.isPaid).reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => o.status === 'Pendente').length;
  const delivered = orders.filter(o => o.status === 'Entregue').length;

  const stats = [
    { label: 'Total de Pedidos', value: orders.length, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Faturamento', value: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pendentes', value: pending, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Entregues', value: delivered, icon: CheckCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Painel</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Pedidos por Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Pedidos por Linha</h3>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lineData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Pedidos" radius={[4, 4, 0, 0]}>
                  {lineData.map((entry, i) => <Cell key={i} fill={LINE_COLORS[entry.name] || '#6B7280'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {revenueData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Faturamento nos últimos meses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <Bar dataKey="value" name="Faturamento" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
