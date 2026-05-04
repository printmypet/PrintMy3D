import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image } from 'lucide-react';
import { Banner } from '../../types';
import { fetchBanners, addBanner, deleteBanner } from '../../services/supabase';
import { Button } from '../ui/Button';

export const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchBanners();
    setBanners(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) { setError('Informe a URL da imagem.'); return; }
    setSaving(true);
    setError('');
    try {
      await addBanner(newUrl.trim());
      setNewUrl('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    await deleteBanner(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Banners</h2>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Adicionar Banner</h3>
        <div className="flex gap-3">
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="URL da imagem (https://...)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" size="sm" disabled={saving}>
            <Plus className="w-4 h-4 mr-1.5" /> {saving ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <p className="text-xs text-slate-400 mt-2">Use imagens de 1200×400px ou similar para melhor resultado.</p>
      </form>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Carregando...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Image className="w-12 h-12 mx-auto mb-3" />
          <p>Nenhum banner cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 h-36 flex items-center justify-center overflow-hidden">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <Image className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <p className="text-xs text-slate-500 truncate flex-1 mr-2">{b.imageUrl}</p>
                <button onClick={() => handleDelete(b.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
