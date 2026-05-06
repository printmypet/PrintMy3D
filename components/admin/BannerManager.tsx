import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image, Upload, Loader2 } from 'lucide-react';
import { Banner } from '../../types';
import { fetchBanners, addBanner, deleteBanner } from '../../services/supabase';
import { uploadImageToGitHub } from '../../services/github';
import { Button } from '../ui/Button';

const MAX_BANNERS = 5;

export const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchBanners();
    setBanners(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (url: string) => {
    if (!url.trim()) { setError('Informe a URL da imagem.'); return; }
    if (banners.length >= MAX_BANNERS) { setError(`Limite de ${MAX_BANNERS} banners atingido.`); return; }
    setSaving(true);
    setError('');
    try {
      await addBanner(url.trim());
      setNewUrl('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (banners.length >= MAX_BANNERS) { setError(`Limite de ${MAX_BANNERS} banners atingido.`); return; }
    const token = localStorage.getItem('app-github-token') || import.meta.env.VITE_GITHUB_TOKEN || '';
    if (!token) { setError('Token GitHub não configurado. Vá em Configurações → Nuvem.'); return; }
    setUploading(true);
    setError('');
    const res = await uploadImageToGitHub(token, file);
    setUploading(false);
    if (res.success && res.url) {
      await handleAdd(res.url);
    } else {
      setError(res.message || 'Erro ao fazer upload.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    await deleteBanner(id);
    await load();
  };

  const atLimit = banners.length >= MAX_BANNERS;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Banners</h2>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Adicionar Banner</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${atLimit ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
            {banners.length}/{MAX_BANNERS}
          </span>
        </div>

        {atLimit ? (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Limite de {MAX_BANNERS} banners atingido. Remova um para adicionar outro.</p>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="URL da imagem (https://...)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                onKeyDown={e => e.key === 'Enter' && handleAdd(newUrl)}
              />
              <Button type="button" size="sm" onClick={() => handleAdd(newUrl)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Upload className="w-4 h-4" /> Fazer upload de imagem</>}
            </button>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <p className="text-xs text-slate-400">Recomendado: 1200×400px. Aceita JPG, PNG ou WebP.</p>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Carregando...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Image className="w-12 h-12 mx-auto mb-3" />
          <p>Nenhum banner cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banners.map((b, i) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 h-36 flex items-center justify-center overflow-hidden relative">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <Image className="w-10 h-10 text-slate-400" />
                )}
                <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                  #{i + 1}
                </span>
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
