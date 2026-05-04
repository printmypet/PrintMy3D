
export type ProductLine = 'PET' | 'HOME' | 'SELF';

export type OrderStatus = 'Pendente' | 'Em Impressão' | 'Acabamento' | 'Concluído' | 'Entregue';

export type UserRole = 'admin' | 'user';

export type ColorOption = {
  id?: string;
  name: string;
  hex: string;
  position?: number;
};

export interface Texture {
  id?: string;
  name: string;
}

export const DEFAULT_COLORS: ColorOption[] = [
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Preto', hex: '#1F2937' },
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Verde', hex: '#22C55E' },
  { name: 'Amarelo', hex: '#EAB308' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Roxo', hex: '#A855F7' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Cinza', hex: '#6B7280' },
];

export const DEFAULT_TEXTURES: string[] = [
  'Liso',
  'Hexagonal',
  'Listrado',
  'Pontilhado',
  'Voronoi',
];

export const DEFAULT_MATERIALS: string[] = [
  'PLA',
  'PETG',
  'ABS',
  'TPU',
  'PETG HS',
];

export interface PartsColors {
  base: ColorOption[];
  ball: ColorOption[];
  top: ColorOption[];
}

// --- Customization types per product line ---

export interface PetCustomization {
  type: 'PET';
  petName: string;
  baseColor: ColorOption;
  ballColor: ColorOption;
  topColor: ColorOption;
  textureType: 'cadastrada' | 'personalizada';
  textureValue: string;
  observations: string;
}

export interface HomeCustomization {
  type: 'HOME';
  color: ColorOption;
  material: string;
  dimensions: string;
  observations: string;
}

export interface SelfCustomization {
  type: 'SELF';
  color: ColorOption;
  material: string;
  customText: string;
  observations: string;
}

export type Customization = PetCustomization | HomeCustomization | SelfCustomization;

// --- Cart ---

export interface CartItem {
  id: string;
  product: Product;
  customization: Customization;
  quantity: number;
}

// --- Catalog ---

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  line: ProductLine;
  categoryId?: string;
  imageUrl: string;
  active: boolean;
  sortOrder?: number;
  highlight?: boolean;
}

export interface Category {
  id: string;
  name: string;
  line?: ProductLine;
  position?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
}

// --- Customer & Order ---

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  instagram?: string;
  address: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: Customer;
  customerId?: string;
  items: CartItem[];
  total: number;
  shippingCost: number;
  status: OrderStatus;
  isPaid: boolean;
  paymentMethod?: string;
  line: ProductLine | 'MIXED';
}

// --- Admin ---

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}
