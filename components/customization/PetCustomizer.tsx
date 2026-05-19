import React, { useRef, useEffect, useState } from 'react';
import { PetCustomization, ColorOption, PartsColors, DEFAULT_COLORS, DEFAULT_TEXTURES } from '../../types';

const hashName = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const PATTERNS: ((ctx: CanvasRenderingContext2D, w: number, h: number) => void)[] = [
  // 0 — linhas horizontais onduladas (madeira)
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5;
    for (let y = 4; y < h; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 3) ctx.lineTo(x, y + Math.sin(x * 0.2 + y * 0.05) * 3);
      ctx.stroke();
    }
  },
  // 1 — grade quadriculada
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  },
  // 2 — xadrez diagonal duplo (couro)
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + h, 0); ctx.lineTo(i, h); ctx.stroke();
    }
  },
  // 3 — bolinhas
  (ctx, w, h) => {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = 6; x < w; x += 11) for (let y = 6; y < h; y += 11) {
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  },
  // 4 — escamas (peixes/réptil)
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    const r = 10;
    for (let row = 0; row * r < h + r; row++) {
      const offset = (row % 2) * r;
      for (let col = -1; col * (r * 2) < w + r * 2; col++) {
        const cx = col * r * 2 + offset;
        const cy = row * r;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI); ctx.stroke();
      }
    }
  },
  // 5 — zigue-zague horizontal
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5;
    const step = 10;
    for (let y = step; y < h; y += step * 2) {
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += step) ctx.lineTo(x, y + (x / step % 2 === 0 ? step : 0));
      ctx.stroke();
    }
  },
  // 6 — losangos (diamante)
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
    const s = 12;
    for (let y = 0; y < h + s; y += s) for (let x = 0; x < w + s; x += s) {
      ctx.beginPath();
      ctx.moveTo(x, y - s / 2); ctx.lineTo(x + s / 2, y);
      ctx.lineTo(x, y + s / 2); ctx.lineTo(x - s / 2, y);
      ctx.closePath(); ctx.stroke();
    }
  },
  // 7 — traços curtos aleatórios (rugoso)
  (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
    const rng = (seed: number) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; };
    const rand = rng(42);
    for (let i = 0; i < 80; i++) {
      const x = rand() * w, y = rand() * h, a = rand() * Math.PI, l = 5 + rand() * 8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
  },
];

const drawTexturePattern = (ctx: CanvasRenderingContext2D, texture: string, w: number, h: number) => {
  if (!texture.trim()) return;
  const idx = hashName(texture) % PATTERNS.length;
  ctx.save();
  PATTERNS[idx](ctx, w, h);
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
  colorLabels?: { top?: string; ball?: string; base?: string };
  comedouroMode?: boolean;
  singleColorMode?: boolean;
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

export const PetCustomizer: React.FC<PetCustomizerProps> = ({ value, onChange, partsColors, availableTextures, hidePetName = false, partImages, colorLabels, comedouroMode = false, singleColorMode = false }) => {
  const [comedouroColorCount, setComedouroColorCount] = useState<'single' | 'double'>('single');

  const colors = {
    base: partsColors.base.length > 0 ? partsColors.base : DEFAULT_COLORS,
    ball: partsColors.ball.length > 0 ? partsColors.ball : DEFAULT_COLORS,
    top: partsColors.top.length > 0 ? partsColors.top : DEFAULT_COLORS,
  };
  const allColors = colors.base;

  if (singleColorMode) {
    return (
      <div className="space-y-5">
        <ColorPicker
          label="Cor"
          colors={allColors}
          selected={value.baseColor}
          onSelect={c => onChange({ ...value, baseColor: c, ballColor: c, topColor: c })}
        />
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
  }

  if (comedouroMode) {
    return (
      <div className="space-y-5">
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

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Opção de cor</p>
          <div className="flex gap-3">
            {(['single', 'double'] as const).map(opt => (
              <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${comedouroColorCount === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <input type="radio" className="hidden" checked={comedouroColorCount === opt} onChange={() => setComedouroColorCount(opt)} />
                <span className="text-sm font-medium">{opt === 'single' ? 'Uma Cor' : 'Duas Cores'}</span>
              </label>
            ))}
          </div>
        </div>

        {comedouroColorCount === 'single' && (
          <ColorPicker label="Escolha a Cor" colors={allColors} selected={value.baseColor} onSelect={c => onChange({ ...value, baseColor: c, topColor: c, ballColor: c })} />
        )}

        {comedouroColorCount === 'double' && (
          <>
            <ColorPicker label="Cor da Base" colors={allColors} selected={value.baseColor} onSelect={c => onChange({ ...value, baseColor: c })} />
            <ColorPicker label="Cor Superior" colors={allColors} selected={value.topColor} onSelect={c => onChange({ ...value, topColor: c })} />
          </>
        )}

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
  }

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

      <ColorPicker label={colorLabels?.top ?? "Cor da Tampa"} colors={colors.top} selected={value.topColor} onSelect={c => onChange({ ...value, topColor: c })} imageUrl={partImages?.top} texture={value.textureValue || undefined} />
      <ColorPicker label={colorLabels?.ball ?? "Cor da Bola"} colors={colors.ball} selected={value.ballColor} onSelect={c => onChange({ ...value, ballColor: c })} imageUrl={partImages?.ball} />
      <ColorPicker label={colorLabels?.base ?? "Cor da Base"} colors={colors.base} selected={value.baseColor} onSelect={c => onChange({ ...value, baseColor: c })} imageUrl={partImages?.base} />

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
