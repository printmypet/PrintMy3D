
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SupabaseConfig, Order, Customer, AppUser, Product, Category,
  Banner, ColorOption, PartsColors, Texture, Subcategory
} from '../types';

let supabase: SupabaseClient | undefined;

export const initSupabase = (config: SupabaseConfig): boolean => {
  try {
    if (!config.supabaseUrl || !config.supabaseKey) return false;
    const url = config.supabaseUrl.trim();
    const key = config.supabaseKey.trim();
    if (!url.startsWith('http')) return false;
    supabase = createClient(url, key);
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
};

export const testConnection = async (config: SupabaseConfig): Promise<{ success: boolean; message?: string }> => {
  try {
    const url = config.supabaseUrl.trim();
    const key = config.supabaseKey.trim();
    if (!url.startsWith('https://')) return { success: false, message: 'A URL deve começar com https://' };
    const client = createClient(url, key);
    const { error } = await client.from('orders').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('does not exist'))
        return { success: false, message: 'Conexão OK, mas tabelas não existem. Execute o script SQL.' };
      if (error.message?.includes('JWT'))
        return { success: false, message: 'Chave de API inválida ou expirada.' };
      return { success: false, message: `Erro: ${error.message}` };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, message: `Erro de configuração: ${e.message}` };
  }
};

export const getClient = () => supabase;

// --- Auth ---

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; user?: AppUser; message?: string }> => {
  if (!supabase) return { success: false, message: 'Banco de dados não conectado.' };
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    if (error || !data) return { success: false, message: 'Usuário ou senha incorretos.' };
    return { success: true, user: data as AppUser };
  } catch {
    return { success: false, message: 'Erro ao tentar login.' };
  }
};

export const registerUser = async (user: Omit<AppUser, 'id'>): Promise<{ success: boolean; message?: string }> => {
  if (!supabase) return { success: false, message: 'Banco de dados não conectado.' };
  try {
    const { data: existing } = await supabase.from('app_users').select('id').eq('username', user.username).single();
    if (existing) return { success: false, message: 'Este usuário já existe.' };
    const { error } = await supabase.from('app_users').insert([user]);
    if (error) throw error;
    return { success: true, message: 'Usuário cadastrado com sucesso!' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro ao cadastrar.' };
  }
};

export const fetchUsers = async (): Promise<AppUser[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('app_users').select('*').order('name', { ascending: true });
  if (error) return [];
  return data as AppUser[];
};

export const updateUser = async (user: AppUser): Promise<{ success: boolean; message?: string }> => {
  if (!supabase) return { success: false, message: 'Offline' };
  try {
    const { data: existing } = await supabase.from('app_users').select('id').eq('username', user.username).neq('id', user.id).single();
    if (existing) return { success: false, message: 'Este login já está em uso.' };
    const { error } = await supabase.from('app_users').update({ name: user.name, username: user.username, password: user.password, role: user.role }).eq('id', user.id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const deleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
  if (!supabase) return { success: false, message: 'Offline' };
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) return { success: false, message: error.message };
  return { success: true };
};

// --- Colors ---

export const fetchColors = async (): Promise<PartsColors | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return null;
  const result: PartsColors = { base: [], ball: [], top: [] };
  data.forEach((item: any) => {
    const color: ColorOption = { id: item.id, name: item.name, hex: item.hex, position: item.position };
    if (item.part_type === 'base') result.base.push(color);
    if (item.part_type === 'ball') result.ball.push(color);
    if (item.part_type === 'top') result.top.push(color);
  });
  return result;
};

export const addColor = async (partType: string, name: string, hex: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('colors').insert([{ part_type: partType, name, hex, position: 9999 }]);
  if (error) throw error;
};

export const deleteColor = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('colors').delete().eq('id', id);
  if (error) throw error;
};

// --- Textures ---

export const fetchTextures = async (): Promise<Texture[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('textures').select('*').order('created_at', { ascending: true });
  if (error || !data) return null;
  return data.map((item: any) => ({ id: item.id, name: item.name }));
};

export const addTexture = async (name: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('textures').insert([{ name }]);
  if (error) throw error;
};

export const deleteTexture = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('textures').delete().eq('id', id);
  if (error) throw error;
};

// --- Banners ---

export const fetchBanners = async (): Promise<Banner[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data.map((b: any) => ({ id: b.id, imageUrl: b.image_url || '' }));
};

export const addBanner = async (imageUrl: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('banners').insert([{ image_url: imageUrl, title: 'Banner', subtitle: '', theme: 'dark' }]);
  if (error) throw error;
};

export const deleteBanner = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
};

// --- Categories ---

export const fetchCategories = async (): Promise<Category[]> => {
  if (!supabase) return [];
  let { data: cats, error } = await supabase.from('categories').select('*').order('position', { ascending: true }).order('created_at', { ascending: true });
  if (error && error.code === '42703') {
    const retry = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    cats = retry.data;
    error = retry.error;
  }
  if (error || !cats) return [];
  const { data: subs } = await supabase.from('subcategories').select('*').order('name', { ascending: true });
  return cats.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    line: cat.line,
    position: cat.position,
    subcategories: (subs || []).filter((s: any) => s.category_id === cat.id).map((s: any) => ({ id: s.id, name: s.name, categoryId: s.category_id }))
  }));
};

export const addCategory = async (name: string, line?: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('categories').insert([{ name, line, position: 9999 }]);
  if (error) throw error;
};

export const updateCategory = async (id: string, name: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);
  if (error) throw error;
};

export const deleteCategory = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

export const addSubcategory = async (name: string, categoryId: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('subcategories').insert([{ name, category_id: categoryId }]);
  if (error) throw error;
};

export const deleteSubcategory = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw error;
};

// --- Products ---

export const fetchProducts = async (line?: string): Promise<Product[]> => {
  if (!supabase) return [];
  let query = supabase.from('products').select('*').eq('active', true).order('sort_order', { ascending: true });
  if (line) query = query.eq('line', line);
  const { data, error } = await query;
  if (error) { console.error('Error fetching products:', error.message); return []; }
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    line: p.line,
    categoryId: p.category_id,
    imageUrl: p.image_url || '',
    active: p.active,
    sortOrder: p.sort_order,
    highlight: p.highlight || false,
    sizes: p.sizes || [],
    images: p.images || (p.image_url ? [p.image_url] : []),
  }));
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('products').select('*').order('line', { ascending: true }).order('sort_order', { ascending: true });
  if (error) { console.error('Error fetching all products:', error.message); return []; }
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    line: p.line,
    categoryId: p.category_id,
    imageUrl: p.image_url || '',
    active: p.active,
    sortOrder: p.sort_order,
    highlight: p.highlight || false,
    sizes: p.sizes || [],
    images: p.images || (p.image_url ? [p.image_url] : []),
  }));
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  if (!supabase) return;
  const payload = {
    name: product.name,
    description: product.description,
    price: product.price,
    line: product.line,
    category_id: product.categoryId || null,
    image_url: product.imageUrl,
    active: product.active,
    sort_order: product.sortOrder || 9999,
    highlight: product.highlight || false,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : null,
    images: product.images && product.images.length > 0 ? product.images : null,
  };
  const { error } = await supabase.from('products').insert([payload]);
  if (error) throw error;
};

export const updateProduct = async (product: Product) => {
  if (!supabase) return;
  const payload = {
    name: product.name,
    description: product.description,
    price: product.price,
    line: product.line,
    category_id: product.categoryId || null,
    image_url: product.imageUrl,
    active: product.active,
    sort_order: product.sortOrder || 9999,
    highlight: product.highlight || false,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : null,
    images: product.images && product.images.length > 0 ? product.images : null,
  };
  const { error } = await supabase.from('products').update(payload).eq('id', product.id);
  if (error) throw error;
};

export const deleteProduct = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// --- Customer ---

const mapCustomerFromDb = (data: any): Customer => ({
  id: data.id,
  name: data.name,
  email: data.email || '',
  phone: data.phone || '',
  cpf: data.cpf || '',
  instagram: data.instagram || '',
  address: data.address_full || '',
  zipCode: data.zip_code || '',
  street: data.street || '',
  number: data.number || '',
  complement: data.complement || '',
  neighborhood: data.neighborhood || '',
  city: data.city || '',
  state: data.state || '',
});

export const upsertCustomer = async (customer: Customer): Promise<string> => {
  if (!supabase) throw new Error('Supabase not initialized');
  const toNull = (val?: string) => (!val || val.trim() === '') ? null : val.trim();
  const cleanCpf = toNull(customer.cpf);
  let existing = null;
  if (cleanCpf) {
    const { data } = await supabase.from('customers').select('id').eq('cpf', cleanCpf).single();
    existing = data;
  }
  if (!existing && customer.id) {
    const { data } = await supabase.from('customers').select('id').eq('id', customer.id).single();
    existing = data;
  }
  const payload = {
    name: customer.name.trim(),
    email: toNull(customer.email),
    phone: toNull(customer.phone),
    cpf: cleanCpf,
    instagram: toNull(customer.instagram),
    address_full: toNull(customer.address),
    zip_code: toNull(customer.zipCode),
    street: toNull(customer.street),
    number: toNull(customer.number),
    complement: toNull(customer.complement),
    neighborhood: toNull(customer.neighborhood),
    city: toNull(customer.city),
    state: toNull(customer.state),
  };
  if (existing) {
    const { error } = await supabase.from('customers').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  } else {
    const { data: newCust, error } = await supabase.from('customers').insert([payload]).select('id').single();
    if (error) throw error;
    return newCust.id;
  }
};

// --- Orders ---

const mapOrderFromRow = (row: any): Order => {
  let customerData: Customer | null = null;
  if (row.customers) {
    customerData = mapCustomerFromDb(row.customers);
  } else if (row.customer) {
    customerData = row.customer;
  }
  return {
    ...row,
    customer: customerData || row.customer,
    createdAt: row.created_at || new Date().toISOString(),
    shippingCost: row.shipping_cost || 0,
    isPaid: row.is_paid || false,
    items: row.items || [],
    line: row.line || 'MIXED',
  };
};

export const subscribeToOrders = (onUpdate: (orders: Order[]) => void) => {
  if (!supabase) return () => {};

  const fetchOrders = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching orders:', error.message); return; }
    if (data) onUpdate(data.map(mapOrderFromRow));
  };

  fetchOrders();

  const channel = supabase
    .channel('orders_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
    .subscribe();

  return () => { supabase?.removeChannel(channel); };
};

export const addOrder = async (order: Order) => {
  if (!supabase) return;
  const customerId = await upsertCustomer(order.customer);
  const payload = {
    id: order.id,
    created_at: order.createdAt,
    status: order.status,
    total: order.total,
    shipping_cost: order.shippingCost,
    is_paid: order.isPaid,
    customer_id: customerId,
    items: order.items,
    line: order.line,
    payment_method: order.paymentMethod || null,
  };
  const { error } = await supabase.from('orders').insert([payload]);
  if (error) throw error;
};

export const updateOrder = async (order: Order) => {
  if (!supabase) return;
  const customerId = await upsertCustomer(order.customer);
  const payload = {
    status: order.status,
    total: order.total,
    shipping_cost: order.shippingCost,
    is_paid: order.isPaid,
    customer_id: customerId,
    items: order.items,
    line: order.line,
  };
  const { error } = await supabase.from('orders').update(payload).eq('id', order.id);
  if (error) throw error;
};

export const updateOrderStatus = async (id: string, status: string) => {
  if (!supabase) return;
  await supabase.from('orders').update({ status }).eq('id', id);
};

export const updateOrderPaid = async (id: string, isPaid: boolean) => {
  if (!supabase) return;
  await supabase.from('orders').update({ is_paid: isPaid }).eq('id', id);
};

export const deleteOrder = async (id: string) => {
  if (!supabase) return;
  await supabase.from('orders').delete().eq('id', id);
};
