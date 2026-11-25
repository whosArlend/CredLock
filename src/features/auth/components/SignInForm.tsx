import { useState, useId, FormEvent } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  Loader2,
  ArrowRight,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signInWithUsername } from '../services/authService';
import type { SignInResult, SignInSuccessResult } from '../types';
import { cn } from '@/lib/utils';

export interface SignInFormProps {
  onSuccess?: (result: SignInSuccessResult) => void;
  onNavigateToSignUp?: () => void;
  className?: string;
}

export function SignInForm({
  onSuccess,
  onNavigateToSignUp,
  className,
}: SignInFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const id = useId();
  const usernameId = `${id}-signin-username`;
  const passwordId = `${id}-signin-password`;
  const errorAlertId = `${id}-signin-error-alert`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    const errors: Record<string, string> = {};

    // 1. Username presence check
    if (!username || username.trim().length === 0) {
      errors.username = 'Operative username is required.';
    }

    // 2. Password check
    if (!password || password.trim().length === 0) {
      errors.password = 'Master passphrase is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result: SignInResult = await signInWithUsername({
        username,
        password,
      });

      if (!result.success) {
        setSubmitError(result.message);
        if (result.field) {
          setFieldErrors({ [result.field]: result.message });
        }
      } else {
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Sign in request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4 text-left font-sans', className)} noValidate>
      {/* Global Error Banner */}
      {submitError && (
        <div
          id={errorAlertId}
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-3 animate-in fade-in"
        >
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-red-400 block font-mono">AUTHORIZATION DENIED</span>
            <p className="text-red-200/90 leading-relaxed">{submitError}</p>
          </div>
        </div>
      )}

      {/* Field: Username */}
      <div className="space-y-1.5">
        <label htmlFor={usernameId} className="block text-xs font-medium text-foreground-secondary">
          Operative Username <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <User className="h-4 w-4" />
          </div>
          <input
            id={usernameId}
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: '' }));
              }
            }}
            disabled={isSubmitting}
            placeholder="e.g. cipher_operative"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={24}
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? `${usernameId}-error` : undefined}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 font-mono',
              fieldErrors.username
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
        </div>
        {fieldErrors.username && (
          <p id={`${usernameId}-error`} className="text-[11px] text-red-400 font-sans flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.username}</span>
          </p>
        )}
      </div>

      {/* Field: Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={passwordId} className="block text-xs font-medium text-foreground-secondary">
            Master Passphrase <span className="text-accent">*</span>
          </label>
          <span className="text-[11px] font-mono text-muted">
            No recovery option
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            disabled={isSubmitting}
            placeholder="Enter master passphrase"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
            className={cn(
              'w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 font-mono',
              fieldErrors.password
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide master passphrase' : 'Show master passphrase'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p id={`${passwordId}-error`} className="text-[11px] text-red-400 font-sans flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.password}</span>
          </p>
        )}
      </div>

      {/* Zero-Knowledge Passphrase Policy Info Box */}
      <div className="p-3 rounded-xl bg-background-base/70 border border-border/70 text-xs text-muted flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans text-[11px] text-muted">
          <strong className="text-foreground">Permanent Identity:</strong> Master passphrases cannot be reset or recovered. Enter your registered operative handle and master passphrase.
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 font-medium shadow-sm transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Enclave Session...</span>
            </>
          ) : (
            <>
              <span>Authorize Enclave Access</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Navigation link to Sign Up */}
      {onNavigateToSignUp && (
        <div className="pt-1 text-center">
          <p className="text-xs text-muted">
            New operative?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="text-accent hover:underline font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
            >
              Create CredLock Account →
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
