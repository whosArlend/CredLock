import React from 'react';
import { Minus, Plus, Sliders } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  MIN_GENERATOR_LENGTH,
  MAX_GENERATOR_LENGTH,
} from '@/services/passwordGenerator';

interface LengthControlProps {
  length: number;
  onChange: (length: number) => void;
  disabled?: boolean;
}

const PRESET_LENGTHS = [
  { value: 12, label: '12' },
  { value: 16, label: '16 (Rec)' },
  { value: 24, label: '24' },
  { value: 32, label: '32' },
];

export const LengthControl: React.FC<LengthControlProps> = ({
  length,
  onChange,
  disabled = false,
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onChange(Math.max(MIN_GENERATOR_LENGTH, Math.min(MAX_GENERATOR_LENGTH, val)));
    }
  };

  const handleDecrement = () => {
    if (length > MIN_GENERATOR_LENGTH) {
      onChange(length - 1);
    }
  };

  const handleIncrement = () => {
    if (length < MAX_GENERATOR_LENGTH) {
      onChange(length + 1);
    }
  };

  const getLengthTier = (len: number) => {
    if (len < 12) return { label: 'Basic', variant: 'amber' as const };
    if (len < 20) return { label: 'Strong', variant: 'emerald' as const };
    return { label: 'High Entropy', variant: 'cyan' as const };
  };

  const tier = getLengthTier(length);

  return (
    <div className="rounded-xl border border-border bg-background-surface/80 p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
          <label
            htmlFor="password-length-slider"
            className="text-sm font-semibold text-foreground"
          >
            Password Length
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={tier.variant} size="sm">
            {tier.label}
          </Badge>
          <div className="flex items-center rounded-lg border border-border bg-background-base px-2 py-0.5">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabled || length <= MIN_GENERATOR_LENGTH}
              className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Decrease password length"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className="w-8 text-center font-mono font-bold text-sm text-cyber-cyan"
              aria-live="polite"
            >
              {length}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabled || length >= MAX_GENERATOR_LENGTH}
              className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Increase password length"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Range Slider */}
      <div className="space-y-1.5">
        <input
          id="password-length-slider"
          type="range"
          min={MIN_GENERATOR_LENGTH}
          max={MAX_GENERATOR_LENGTH}
          step={1}
          value={length}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 bg-background-base rounded-lg appearance-none cursor-pointer accent-cyber-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
          aria-valuemin={MIN_GENERATOR_LENGTH}
          aria-valuemax={MAX_GENERATOR_LENGTH}
          aria-valuenow={length}
          aria-label="Password length slider"
        />
        <div className="flex justify-between text-[11px] text-foreground-muted/70 font-mono">
          <span>{MIN_GENERATOR_LENGTH} chars (Min)</span>
          <span>36</span>
          <span>{MAX_GENERATOR_LENGTH} chars (Max)</span>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <span className="text-xs text-foreground-muted shrink-0">Presets:</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LENGTHS.map((preset) => {
            const isSelected = length === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange(preset.value)}
                disabled={disabled}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                  isSelected
                    ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40 font-semibold'
                    : 'bg-background-base text-foreground-muted hover:text-foreground border border-border/60 hover:border-border'
                }`}
                aria-pressed={isSelected}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
