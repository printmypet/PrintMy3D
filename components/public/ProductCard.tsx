import React, { useState } from 'react';
import { ShoppingCart, Package, Star } from 'lucide-react';
import { Product, CartItem, Customization, PetCustomization, HomeCustomization, SelfCustomization, DEFAULT_COLORS, DEFAULT_TEXTURES, PartsColors } from '../../types';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { PetCustomizer } from '../customization/PetCustomizer';
import { HomeCustomizer } from '../customization/HomeCustomizer';
import { SelfCustomizer } from '../customization/SelfCustomizer';
import { v4 as uuidv4 } from 'uuid';

interface ProductCardProps {
  product: Product;
  partsColors: PartsColors;
  availableTextures: string[];
  onAddToCart: (item: CartItem) => void;
}

const lineColors: Record<string, string> = {
  PET: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  HOME: 'bg-blue-50 border-blue-200 text-blue-700',
  SELF: 'bg-purple-50 border-purple-200 text-purple-700',
};

const initialCustomization = (product: Product): Customization => {
  if (product.line === 'PET') {
    return {
      type: 'PET',
      petName: '',
      baseColor: DEFAULT_COLORS[0],
      ballColor: DEFAULT_COLORS[0],
      topColor: DEFAULT_COLORS[0],
      textureType: 'cadastrada',
      textureValue: '',
      observations: '',
    } as PetCustomization;
  }
  if (product.line === 'HOME') {
    return {
      type: 'HOME',
      color: DEFAULT_COLORS[0],
      material: '',
      dimensions: '',
      observations: '',
    } as HomeCustomization;
  }
  return {
    type: 'SELF',
    color: DEFAULT_COLORS[0],
    material: '',
    customText: '',
    observations: '',
  } as SelfCustomization;
};

const PERSONALIZATION_PRICE = 9.90;
const PERSONALIZED_PRODUCTS = ['LickBowl'];

// URLs das imagens das peças por produto — substitua após fazer upload no GitHub
const PART_IMAGES: Record<string, { top?: string; ball?: string; base?: string }> = {
  LickBowl: {
    top: '',
    ball: '',
    base: '',
  },
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, partsColors, availableTextures, onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);
  const [customization, setCustomization] = useState<Customization>(() => initialCustomization(product));
  const [wantsPersonalization, setWantsPersonalization] = useState(false);
  const [personalizationPetName, setPersonalizationPetName] = useState('');

  const isPersonalizable = PERSONALIZED_PRODUCTS.includes(product.name);

  const handleAdd = () => {
    if (product.line === 'PET' && !isPersonalizable && !(customization as PetCustomization).petName.trim()) {
      alert('Por favor, informe o nome do pet.');
      return;
    }
    if (isPersonalizable && wantsPersonalization && !personalizationPetName.trim()) {
      alert('Por favor, informe o nome do pet.');
      return;
    }
    const finalPrice = isPersonalizable && wantsPersonalization
      ? product.price + PERSONALIZATION_PRICE
      : product.price;
    const finalCustomization: Customization = isPersonalizable && wantsPersonalization
      ? { ...customization, observations: `Nome do pet: ${personalizationPetName.trim()}` } as any
      : customization;
    const item: CartItem = {
      id: uuidv4(),
      product: { ...product, price: finalPrice },
      customization: finalCustomization,
      quantity: 1,
    };
    onAddToCart(item);
    setShowModal(false);
    setCustomization(initialCustomization(product));
    setWantsPersonalization(false);
    setPersonalizationPetName('');
  };

  const resolveImage = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url.slice(1) : url;
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
        <div className="relative bg-slate-100 h-48 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={resolveImage(product.imageUrl)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Package className="w-16 h-16 text-slate-300" />
          )}
          {product.highlight && (
            <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Destaque
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full border mb-2 ${lineColors[product.line]}`}>
            <Logo line={product.line} size="sm" className="text-xs" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
          {product.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{product.description}</p>}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
            <span className="text-lg font-bold text-slate-900">
              {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="font-semibold text-slate-900">{product.name}</h2>
                <p className="text-sm text-slate-500">Personalize seu produto</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {product.line === 'PET' && (
                <PetCustomizer
                  value={customization as PetCustomization}
                  onChange={v => setCustomization(v)}
                  partsColors={partsColors}
                  availableTextures={availableTextures}
                  hidePetName={isPersonalizable}
                  partImages={PART_IMAGES[product.name]}
                />
              )}
              {product.line === 'HOME' && (
                <HomeCustomizer
                  value={customization as HomeCustomization}
                  onChange={v => setCustomization(v)}
                />
              )}
              {product.line === 'SELF' && (
                <SelfCustomizer
                  value={customization as SelfCustomization}
                  onChange={v => setCustomization(v)}
                />
              )}
              {isPersonalizable && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${wantsPersonalization ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div>
                      <p className="font-medium text-slate-900">Personalizar</p>
                      <p className="text-sm text-slate-500">Adicionar nome do pet gravado</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-indigo-600">+ R$ 9,90</span>
                      <input
                        type="checkbox"
                        checked={wantsPersonalization}
                        onChange={e => setWantsPersonalization(e.target.checked)}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </label>
                  {wantsPersonalization && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Pet <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={personalizationPetName}
                        onChange={e => setPersonalizationPetName(e.target.value)}
                        placeholder="Ex: Thor, Mel, Bob..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex gap-3 rounded-b-2xl">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAdd}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
