import React from 'react';
import { SelfCustomization, ColorOption, DEFAULT_COLORS } from '../../types';

interface SelfCustomizerProps {
  value: SelfCustomization;
  onChange: (v: SelfCustomization) => void;
  colors?: ColorOption[];
  hideCustomText?: boolean;
}

export const SelfCustomizer: React.FC<SelfCustomizerProps> = ({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  hideCustomText = false,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cor</p>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => onChange({ ...value, color: c })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${value.color.hex === c.hex ? 'border-indigo-500 scale-110 shadow-md' : 'border-slate-300 hover:scale-105'}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">{value.color.name}</p>
      </div>

      {!hideCustomText && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Texto Personalizado</label>
          <input
            type="text"
            value={value.customText}
            onChange={e => onChange({ ...value, customText: e.target.value })}
            placeholder="Ex: João Silva, Happy Birthday, 2024..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
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
};
