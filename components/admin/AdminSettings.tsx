import React, { useState } from 'react';
import { Database, Plus, Trash2, User, Key, Shield, TestTube, CheckCircle, XCircle, Loader2, Pencil } from 'lucide-react';
import { AppUser, SupabaseConfig, ColorOption, Texture, DEFAULT_COLORS, DEFAULT_TEXTURES, PartsColors } from '../../types';
import { testConnection, fetchUsers, registerUser, updateUser, deleteUser, addColor, deleteColor, addTexture, deleteTexture } from '../../services/supabase';
import { Button } from '../ui/Button';

interface AdminSettingsProps {
  partsColors: PartsColors;
  textures: Texture[];
  onUpdatePartsColors: (c: PartsColors) => void;
  onUpdateTextures: (t: Texture[]) => void;
  onConfigUpdate: () => void;
  isOnline: boolean;
  currentUser: AppUser;
}

type Tab = 'cloud' | 'colors' | 'textures' | 'users';

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  partsColors, textures, onUpdatePartsColors, onUpdateTextures, onConfigUpdate, isOnline, currentUser
}) => {
  const [tab, setTab] = useState<Tab>('cloud');

  // Cloud config
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    try { return JSON.parse(localStorage.getItem('app-supabase-config') || '{}').supabaseUrl || ''; } catch { return ''; }
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    try { return JSON.parse(localStorage.getItem('app-supabase-config') || '{}').supabaseKey || ''; } catch { return ''; }
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  const handleSaveConfig = () => {
    const config: SupabaseConfig = { supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() };
    localStorage.setItem('app-supabase-config', JSON.stringify(config));
    onConfigUpdate();
    alert('Configuração salva! Reconectando...');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    const res = await testConnection({ supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() });
    setTestStatus(res.success ? 'ok' : 'error');
    setTestMsg(res.message || '');
  };

  // Colors
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [colorPart, setColorPart] = useState<'base' | 'ball' | 'top'>('base');

  const handleAddColor = async () => {
    if (!newColorName.trim()) return;
    if (isOnline) {
      await addColor(colorPart, newColorName.trim(), newColorHex);
      onConfigUpdate();
    } else {
      const newC: ColorOption = { name: newColorName.trim(), hex: newColorHex };
      onUpdatePartsColors({ ...partsColors, [colorPart]: [...partsColors[colorPart], newC] });
    }
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const handleDeleteColor = async (partType: 'base' | 'ball' | 'top', color: ColorOption) => {
    if (isOnline && color.id) {
      await deleteColor(color.id);
      onConfigUpdate();
    } else {
      onUpdatePartsColors({ ...partsColors, [partType]: partsColors[partType].filter(c => c.hex !== color.hex) });
    }
  };

  // Textures
  const [newTextureName, setNewTextureName] = useState('');

  const handleAddTexture = async () => {
    if (!newTextureName.trim()) return;
    if (isOnline) {
      await addTexture(newTextureName.trim());
      onConfigUpdate();
    } else {
      onUpdateTextures([...textures, { name: newTextureName.trim() }]);
    }
    setNewTextureName('');
  };

  const handleDeleteTexture = async (texture: Texture) => {
    if (isOnline && texture.id) {
      await deleteTexture(texture.id);
      onConfigUpdate();
    } else {
      onUpdateTextures(textures.filter(t => t.name !== texture.name));
    }
  };

  // Users
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [userError, setUserError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordError, setEditPasswordError] = useState('');

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
    setUsersLoaded(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    const res = await registerUser({ name: newUserName, username: newUsername, password: newPassword, role: newRole });
    if (res.success) {
      setNewUsername(''); setNewPassword(''); setNewUserName('');
      await loadUsers();
    } else {
      setUserError(res.message || 'Erro ao cadastrar.');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.id === currentUser.id) { alert('Você não pode excluir seu próprio usuário.'); return; }
    if (!confirm(`Excluir usuário "${user.name}"?`)) return;
    await deleteUser(user.id);
    await loadUsers();
  };

  const handleChangePassword = async (user: AppUser) => {
    setEditPasswordError('');
    if (!editPassword.trim()) { setEditPasswordError('Digite a nova senha.'); return; }
    const res = await updateUser({ ...user, password: editPassword.trim() });
    if (res?.success !== false) {
      setEditingUserId(null);
      setEditPassword('');
    } else {
      setEditPasswordError('Erro ao alterar senha.');
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cloud', label: 'Nuvem' },
    { id: 'colors', label: 'Cores' },
    { id: 'textures', label: 'Texturas' },
    { id: 'users', label: 'Usuários' },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900">Configurações</h2>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'users' && !usersLoaded) loadUsers(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cloud' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Conexão Supabase</h3>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isOnline ? 'Conectado' : 'Offline'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
            <input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Anon Key</label>
            <input type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGci..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          {testStatus === 'ok' && <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" /> Conexão bem-sucedida!</div>}
          {testStatus === 'error' && <div className="flex items-center gap-2 text-red-600 text-sm"><XCircle className="w-4 h-4" /> {testMsg}</div>}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testStatus === 'testing'}>
              {testStatus === 'testing' ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Testando...</> : <><TestTube className="w-4 h-4 mr-1.5" /> Testar</>}
            </Button>
            <Button size="sm" onClick={handleSaveConfig}>Salvar e Reconectar</Button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">Script SQL — crie as tabelas no Supabase:</p>
            <pre className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap">{`-- Execute no SQL Editor do Supabase:

create table if not exists app_users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  username text unique not null,
  password text not null,
  role text default 'user'
);

create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  cpf text,
  instagram text,
  address_full text,
  zip_code text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text
);

create table if not exists orders (
  id uuid primary key,
  created_at timestamptz default now(),
  status text default 'Pendente',
  total numeric default 0,
  shipping_cost numeric default 0,
  is_paid boolean default false,
  customer_id uuid references customers(id),
  items jsonb,
  line text,
  payment_method text
);

create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  description text,
  price numeric not null default 0,
  line text not null,
  category_id uuid,
  image_url text,
  active boolean default true,
  sort_order integer default 9999,
  highlight boolean default false
);

create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  line text,
  position integer default 9999,
  created_at timestamptz default now()
);

create table if not exists subcategories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references categories(id),
  created_at timestamptz default now()
);

create table if not exists banners (
  id uuid default gen_random_uuid() primary key,
  image_url text,
  title text,
  subtitle text,
  theme text,
  created_at timestamptz default now()
);

create table if not exists colors (
  id uuid default gen_random_uuid() primary key,
  part_type text not null,
  name text not null,
  hex text not null,
  position integer default 9999,
  created_at timestamptz default now()
);

create table if not exists textures (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Primeiro usuário admin:
insert into app_users (name, username, password, role)
values ('Admin', 'admin', 'admin123', 'admin');`}</pre>
          </div>
        </div>
      )}

      {tab === 'colors' && (
        <div className="space-y-5 max-w-xl">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Adicionar Cor</h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Parte</label>
                <select value={colorPart} onChange={e => setColorPart(e.target.value as any)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="base">Base</option>
                  <option value="ball">Corpo (Bola)</option>
                  <option value="top">Topo</option>
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
                <input value={newColorName} onChange={e => setNewColorName(e.target.value)}
                  placeholder="Ex: Azul Royal"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cor</label>
                <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-300" />
              </div>
              <Button size="sm" onClick={handleAddColor}><Plus className="w-4 h-4 mr-1.5" /> Adicionar</Button>
            </div>
          </div>

          {(['base', 'ball', 'top'] as const).map(part => {
            const partLabels = { base: 'Base', ball: 'Corpo (Bola)', top: 'Topo' };
            const colors = partsColors[part];
            return (
              <div key={part} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-3">{partLabels[part]}</h3>
                {colors.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma cor cadastrada</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <div key={c.hex} className="flex items-center gap-1.5 bg-slate-50 rounded-full px-3 py-1 border border-slate-200">
                        <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                        <span className="text-sm text-slate-700">{c.name}</span>
                        <button onClick={() => handleDeleteColor(part, c)} className="text-slate-400 hover:text-red-500 ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'textures' && (
        <div className="space-y-4 max-w-md">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Adicionar Textura</h3>
            <div className="flex gap-3">
              <input value={newTextureName} onChange={e => setNewTextureName(e.target.value)}
                placeholder="Ex: Madeira, Malha..." onKeyDown={e => e.key === 'Enter' && handleAddTexture()}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              <Button size="sm" onClick={handleAddTexture}><Plus className="w-4 h-4 mr-1.5" /> Adicionar</Button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Texturas Cadastradas</h3>
            {textures.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma textura cadastrada</p>
            ) : (
              <div className="space-y-2">
                {textures.map(t => (
                  <div key={t.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{t.name}</span>
                    <button onClick={() => handleDeleteTexture(t)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4 max-w-xl">
          {currentUser.role === 'admin' && (
            <form onSubmit={handleAddUser} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900">Novo Usuário</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
                  <input required value={newUserName} onChange={e => setNewUserName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Login</label>
                  <input required value={newUsername} onChange={e => setNewUsername(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Senha</label>
                  <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Papel</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {userError && <p className="text-red-600 text-sm">{userError}</p>}
              <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1.5" /> Criar Usuário</Button>
            </form>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Usuários</h3>
            {users.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum usuário cadastrado</p>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="bg-slate-50 rounded-lg px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">@{u.username} · {u.role}</p>
                      </div>
                      <button onClick={() => { setEditingUserId(editingUserId === u.id ? null : u.id!); setEditPassword(''); setEditPasswordError(''); }}
                        className="text-slate-400 hover:text-indigo-500" title="Alterar senha">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'admin' && u.id !== currentUser.id && (
                        <button onClick={() => handleDeleteUser(u)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {editingUserId === u.id && (
                      <div className="flex gap-2 items-center pt-1">
                        <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                          placeholder="Nova senha" onKeyDown={e => e.key === 'Enter' && handleChangePassword(u)}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
                        <Button size="sm" onClick={() => handleChangePassword(u)}>Salvar</Button>
                      </div>
                    )}
                    {editingUserId === u.id && editPasswordError && (
                      <p className="text-red-500 text-xs">{editPasswordError}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
