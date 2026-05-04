import React, { useRef, useEffect } from 'react';
import { PetCustomization, ColorOption, PartsColors, DEFAULT_COLORS, DEFAULT_TEXTURES } from '../../types';

const PartImage: React.FC<{ imageUrl: string; color: string }> = ({ imageUrl, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    };
    img.src = imageUrl;
  }, [imageUrl, color]);

  return <canvas ref={canvasRef} className="w-full h-full object-contain" />;
};

interface PetCustomizerProps {
  value: PetCustomization;
  onChange: (v: PetCustomization) => void;
  partsColors: PartsColors;
  availableTextures: string[];
  hidePetName?: boolean;
  partImages?: { top?: string; ball?: string; base?: string };
}

const ColorPicker: React.FC<{
  label: string;
  colors: ColorOption[];
  selected: ColorOption;
  onSelect: (c: ColorOption) => void;
  imageUrl?: string;
}> = ({ label, colors, selected, onSelect, imageUrl }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
    <div className="flex items-center gap-4">
      {imageUrl && (
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
          <PartImage imageUrl={imageUrl} color={selected.hex} />
        </div>
      )}
      <div className="flex-1">
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => onSelect(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${selected.hex === c.hex ? 'border-indigo-500 scale-110 shadow-md' : 'border-slate-300 hover:scale-105'}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">{selected.name}</p>
      </div>
    </div>
  </div>
);

export const PetCustomizer: React.FC<PetCustomizerProps> = ({ value, onChange, partsColors, availableTextures, hidePetName = false, partImages }) => {
  const colors = {
    base: partsColors.base.length > 0 ? partsColors.base : DEFAULT_COLORS,
    ball: partsColors.ball.length > 0 ? partsColors.ball : DEFAULT_COLORS,
    top: partsColors.top.length > 0 ? partsColors.top : DEFAULT_COLORS,
  };

  return (
    <div className="space-y-5">
      {!hidePetName && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Pet <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={value.petName}
            onChange={e => onChange({ ...value, petName: e.target.value })}
            placeholder="Ex: Rex, Luna, Bolinha..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      )}

      <ColorPicker label="Cor da Tampa" colors={colors.top} selected={value.topColor} onSelect={c => onChange({ ...value, topColor: c })} imageUrl={partImages?.top} />
      <ColorPicker label="Cor da Bola" colors={colors.ball} selected={value.ballColor} onSelect={c => onChange({ ...value, ballColor: c })} imageUrl={partImages?.ball} />
      <ColorPicker label="Cor da Base" colors={colors.base} selected={value.baseColor} onSelect={c => onChange({ ...value, baseColor: c })} imageUrl={partImages?.base} />

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Textura</p>
        <div className="flex gap-3 mb-3">
          {['cadastrada', 'personalizada'].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="textureType"
                value={t}
                checked={value.textureType === t}
                onChange={() => onChange({ ...value, textureType: t as any, textureValue: '' })}
                className="accent-indigo-600"
              />
              <span className="text-sm text-slate-700 capitalize">{t}</span>
            </label>
          ))}
        </div>
        {value.textureType === 'cadastrada' ? (
          <select
            value={value.textureValue}
            onChange={e => onChange({ ...value, textureValue: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione uma textura</option>
            {availableTextures.map(t => <option key={t} value={t}>{t}</option>)}
            {availableTextures.length === 0 && DEFAULT_TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : (
          <input
            type="text"
            value={value.textureValue}
            onChange={e => onChange({ ...value, textureValue: e.target.value })}
            placeholder="Descreva a textura personalizada..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea
          value={value.observations}
          onChange={e => onChange({ ...value, observations: e.target.value })}
          placeholder="Informações adicionais sobre o pedido..."
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    </div>
  );
};
