import React, { useRef, useEffect } from 'react';
import { PetCustomization, ColorOption, PartsColors, DEFAULT_COLORS, DEFAULT_TEXTURES } from '../../types';

const drawTexturePattern = (ctx: CanvasRenderingContext2D, texture: string, w: number, h: number) => {
  const t = texture.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  ctx.save();

  if (t.includes('madeira') || t.includes('wood')) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < h; y += 7) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 3) {
        ctx.lineTo(x, y + Math.sin(x * 0.18 + y * 0.05) * 2.5);
      }
      ctx.stroke();
    }
  } else if (t.includes('malha') || t.includes('mesh') || t.includes('grade') || t.includes('trico')) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 9) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 9) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  } else if (t.includes('couro') || t.includes('leather')) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + h, 0); ctx.lineTo(i, h); ctx.stroke();
    }
  } else if (t.includes('pedra') || t.includes('stone') || t.includes('marble') || t.includes('marmore')) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, 0);
      for (let x = 0; x <= w; x += 5) {
        ctx.lineTo(x, (x / w) * h + Math.sin(x * 0.3 + i) * 20);
      }
      ctx.stroke();
    }
  } else if (t.includes('ponto') || t.includes('dot') || t.includes('bola')) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 6; x < w; x += 10) {
      for (let y = 6; y < h; y += 10) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (!t.includes('liso') && !t.includes('smooth') && t.trim() !== '') {
    // Padrão genérico: linhas diagonais suaves
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    }
  }

  ctx.restore();
};

const PartImage: React.FC<{ imageUrl: string; color: string; texture?: string }> = ({ imageUrl, color, texture }) => {
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
      // Aplica tint de cor sobre os pixels não-transparentes
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // Aplica padrão de textura clipado à forma da imagem
      if (texture) {
        ctx.globalCompositeOperation = 'source-atop';
        drawTexturePattern(ctx, texture, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    img.src = imageUrl;
  }, [imageUrl, color, texture]);

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
  texture?: string;
}> = ({ label, colors, selected, onSelect, imageUrl, texture }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
    <div className="flex items-center gap-4">
      {imageUrl && (
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
          <PartImage imageUrl={imageUrl} color={selected.hex} texture={texture} />
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

      <ColorPicker label="Cor da Tampa" colors={colors.top} selected={value.topColor} onSelect={c => onChange({ ...value, topColor: c })} imageUrl={partImages?.top} texture={value.textureValue || undefined} />
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
