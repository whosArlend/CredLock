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
  { value: 32, label: '32 (High)' },
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
    if (len < 12) return { label: 'MODERATE', variant: 'amber' as const };
    if (len < 20) return { label: 'STRONG', variant: 'emerald' as const };
    return { label: 'HIGH ENTROPY', variant: 'cyan' as const };
  };

  const tier = getLengthTier(length);

  return (
    <div className="rounded-2xl border border-border-strong bg-enclave-plate p-5 space-y-4 shadow-card-tactical text-left">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-accent" aria-hidden="true" />
          <label
            htmlFor="password-length-slider"
            className="text-xs font-bold uppercase tracking-wider text-foreground-secondary font-mono"
          >
            Key Length Specification
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={tier.variant} size="sm">
            {tier.label}
          </Badge>
          <span className="font-mono text-base font-bold text-accent tabular-nums">
            {length}
          </span>
        </div>
      </div>

      {/* Slider & Steppers */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || length <= MIN_GENERATOR_LENGTH}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-enclave-card hover:bg-enclave-elevated border border-border-strong text-foreground-secondary hover:text-foreground disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label="Decrease key length"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1">
          <input
            id="password-length-slider"
            type="range"
            min={MIN_GENERATOR_LENGTH}
            max={MAX_GENERATOR_LENGTH}
            value={length}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-enclave-void rounded-lg appearance-none cursor-pointer accent-accent border border-border/70 focus:outline-none"
            aria-valuemin={MIN_GENERATOR_LENGTH}
            aria-valuemax={MAX_GENERATOR_LENGTH}
            aria-valuenow={length}
            aria-label="Password length slider"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || length >= MAX_GENERATOR_LENGTH}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-enclave-card hover:bg-enclave-elevated border border-border-strong text-foreground-secondary hover:text-foreground disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label="Increase key length"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] font-mono text-foreground-dim uppercase">PRESETS:</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_LENGTHS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                length === preset.value
                  ? 'bg-accent/15 border-accent text-accent font-bold'
                  : 'bg-enclave-card border-border-strong text-foreground-secondary hover:border-border-strong hover:text-foreground'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
