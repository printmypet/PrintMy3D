import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Package, Star, Eye, EyeOff, Upload, Loader2, X } from 'lucide-react';
import { Product, ProductLine, ProductSize } from '../../types';
import { fetchAllProducts, addProduct, updateProduct, deleteProduct } from '../../services/supabase';
import { uploadImageToGitHub } from '../../services/github';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

const LINES: ProductLine[] = ['PET', 'HOME', 'SELF'];

const emptyProduct = (): Omit<Product, 'id'> => ({
  name: '',
  description: '',
  price: 0,
  line: 'PET',
  imageUrl: '',
  active: true,
  sortOrder: 9999,
  highlight: false,
  sizes: [],
});

export const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLine, setActiveLine] = useState<ProductLine | 'all'>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyProduct());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('app-github-token');
    if (!token) {
      setError('Token GitHub não configurado. Vá em Configurações → Nuvem e adicione seu token.');
      return;
    }
    setUploading(true);
    setError('');
    const res = await uploadImageToGitHub(token, file);
    setUploading(false);
    if (res.success && res.url) {
      setForm(f => ({ ...f, imageUrl: res.url! }));
    } else {
      setError(res.message || 'Erro ao fazer upload da imagem.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const load = async () => {
    setLoading(true);
    const data = await fetchAllProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNew = () => {
    setForm(emptyProduct());
    setEditing(null);
    setIsNew(true);
    setError('');
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description, price: p.price, line: p.line, imageUrl: p.imageUrl, active: p.active, sortOrder: p.sortOrder, highlight: p.highlight, sizes: p.sizes || [] });
    setEditing(p);
    setIsNew(false);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Informe o nome do produto.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await addProduct(form);
      } else if (editing) {
        await updateProduct({ ...editing, ...form });
      }
      await load();
      setIsNew(false);
      setEditing(null);
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await deleteProduct(id);
    await load();
  };

  const handleToggleActive = async (p: Product) => {
    await updateProduct({ ...p, active: !p.active });
    await load();
  };

  const filtered = products.filter(p => activeLine === 'all' || p.line === activeLine);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Produtos</h2>
        <Button size="sm" onClick={handleNew}><Plus className="w-4 h-4 mr-1.5" /> Novo Produto</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', ...LINES] as const).map(l => (
          <button key={l} onClick={() => setActiveLine(l)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeLine === l ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
            {l === 'all' ? 'Todos' : <Logo line={l} size="sm" className="text-xs" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p className="font-medium">Nenhum produto</p>
          <Button size="sm" className="mt-4" onClick={handleNew}><Plus className="w-4 h-4 mr-1.5" /> Adicionar</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border ${p.active ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-4 flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).style.display = 'none'} /> : <Package className="w-6 h-6 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                  <Logo line={p.line} size="sm" className="text-xs" />
                  {p.highlight && <Star className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggleActive(p)} title={p.active ? 'Desativar' : 'Ativar'} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                  {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isNew || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{isNew ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button onClick={() => { setIsNew(false); setEditing(null); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Preço base (R$) <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-slate-400 ml-1">— usado quando não há tamanhos</span>
                  </label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tamanhos (opcional, máx. 3)</label>
                  <div className="space-y-2">
                    {(form.sizes || []).map((size, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={size.name}
                          onChange={e => { const s = [...(form.sizes || [])]; s[i] = { ...s[i], name: e.target.value }; setForm({ ...form, sizes: s }); }}
                          placeholder="Ex: Pequeno, Médio, Grande"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <input
                          type="number" min="0" step="0.01" value={size.price}
                          onChange={e => { const s = [...(form.sizes || [])]; s[i] = { ...s[i], price: parseFloat(e.target.value) || 0 }; setForm({ ...form, sizes: s }); }}
                          placeholder="Preço"
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button type="button" onClick={() => setForm({ ...form, sizes: (form.sizes || []).filter((_, j) => j !== i) })}
                          className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(form.sizes || []).length < 3 && (
                      <button type="button"
                        onClick={() => setForm({ ...form, sizes: [...(form.sizes || []), { name: '', price: 0 }] })}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800">
                        <Plus className="w-4 h-4" /> Adicionar tamanho
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Linha <span className="text-red-500">*</span></label>
                  <select value={form.line} onChange={e => setForm({ ...form, line: e.target.value as ProductLine })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm">
                    {LINES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Imagem</label>
                  <div className="flex gap-2 items-start">
                    <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://... ou faça upload →" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm" />
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-slate-200" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-indigo-600" />
                    Ativo
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.highlight} onChange={e => setForm({ ...form, highlight: e.target.checked })} className="accent-amber-500" />
                    Destaque
                  </label>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsNew(false); setEditing(null); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
