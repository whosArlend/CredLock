import { useState, useId, FormEvent } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PasswordRequirements } from './PasswordRequirements';
import {
  validateUsername,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
} from '../utils/validation';
import { signUpWithUsername } from '../services/authService';
import type { SignUpResult } from '../types';
import { cn } from '@/lib/utils';

export interface SignUpFormProps {
  onSuccess?: (result: Extract<SignUpResult, { success: true }>) => void;
  onNavigateToSignIn?: () => void;
  className?: string;
}

export function SignUpForm({
  onSuccess,
  onNavigateToSignIn,
  className,
}: SignUpFormProps) {
  // Field states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form lifecycle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successResult, setSuccessResult] = useState<Extract<SignUpResult, { success: true }> | null>(null);

  // Accessible IDs
  const id = useId();
  const usernameId = `${id}-username`;
  const nameId = `${id}-name`;
  const passwordId = `${id}-password`;
  const confirmPasswordId = `${id}-confirm`;
  const errorAlertId = `${id}-error-alert`;

  // Real-time password evaluation
  const passwordEval = evaluatePasswordRequirements(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset error states
    setSubmitError(null);
    const errors: Record<string, string> = {};

    // 1. Username validation
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.isValid) {
      errors.username = usernameCheck.error || 'Invalid username format.';
    }

    // 2. Password requirements validation
    if (!passwordEval.isAllMet) {
      errors.password = 'Master passphrase does not satisfy all cryptographic security requirements.';
    }

    // 3. Password confirmation validation
    const confirmCheck = validatePasswordConfirmation(password, confirmPassword);
    if (!confirmCheck.isValid) {
      errors.confirmPassword = confirmCheck.error || 'Passphrases do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await signUpWithUsername({
        username,
        password,
        confirmPassword,
        displayName: displayName.trim() || undefined,
      });

      if (!result.success) {
        setSubmitError(result.message);
        if (result.field) {
          setFieldErrors({ [result.field]: result.message });
        }
      } else {
        setSuccessResult(result);
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // VIEW: Registration Success Screen
  // ==========================================================================
  if (successResult) {
    return (
      <div className={cn('space-y-6 text-left animate-in fade-in duration-200', className)}>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Operative Enclave Initialized
              </h3>
              <p className="text-xs font-mono text-emerald-400/90">
                IDENTITY // ARMED
              </p>
            </div>
          </div>

          <div className="text-sm text-foreground-secondary leading-relaxed space-y-2">
            <p>
              Your operative identity{' '}
              <strong className="text-white font-mono">@{successResult.user.username}</strong>{' '}
              has been successfully registered with zero personal information collection.
            </p>
            <div className="p-3.5 rounded-xl bg-background-base/80 border border-border space-y-2 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5 font-mono text-[11px] text-accent">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero-Knowledge Identity Reminder</span>
              </div>
              <p className="text-muted leading-relaxed">
                Remember: CredLock cannot reset your master passphrase. Always store your passphrase securely.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onNavigateToSignIn && (
              <Button
                type="button"
                variant="primary"
                onClick={onNavigateToSignIn}
                className="w-full sm:w-auto"
              >
                <span>Authorize Enclave Access</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessResult(null);
                setUsername('');
                setDisplayName('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full sm:w-auto text-xs"
            >
              <span>Register Another Operative</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: Main Sign Up Form
  // ==========================================================================
  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4 text-left font-sans', className)} noValidate>
      {/* Permanent Account Warning Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-accent block font-mono">PERMANENT ACCOUNT WARNING</span>
          <p className="text-amber-200/90 leading-relaxed font-sans">
            CredLock does not collect a recovery email or provide password reset. If you lose your master passphrase, your account and its data cannot be recovered. Store your credentials securely.
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {submitError && (
        <div
          id={errorAlertId}
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-3 animate-in fade-in"
        >
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-red-400 block font-mono">REGISTRATION REJECTED</span>
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
            aria-describedby={fieldErrors.username ? `${usernameId}-error` : `${usernameId}-helper`}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 font-mono',
              fieldErrors.username
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
        </div>
        {fieldErrors.username ? (
          <p id={`${usernameId}-error`} className="text-[11px] text-red-400 font-sans flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.username}</span>
          </p>
        ) : (
          <p id={`${usernameId}-helper`} className="text-[11px] text-muted font-sans mt-0.5">
            3–24 characters: ASCII letters, numbers, underscores, and hyphens. Immutable after registration.
          </p>
        )}
      </div>

      {/* Field: Display Name (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="block text-xs font-medium text-foreground-secondary">
          Display Alias <span className="text-muted font-normal text-[11px]">(Optional / Visible Handle)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <KeyRound className="h-4 w-4" />
          </div>
          <input
            id={nameId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Agent Zero"
            maxLength={50}
            autoComplete="name"
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border border-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Field: Master Passphrase */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={passwordId} className="block text-xs font-medium text-foreground-secondary">
            Master Passphrase <span className="text-accent">*</span>
          </label>
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
            placeholder="Cryptographic passphrase"
            autoComplete="new-password"
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

      {/* Password Requirements Checklist */}
      <PasswordRequirements evaluation={passwordEval} />

      {/* Field: Confirm Master Passphrase */}
      <div className="space-y-1.5">
        <label htmlFor={confirmPasswordId} className="block text-xs font-medium text-foreground-secondary">
          Confirm Master Passphrase <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id={confirmPasswordId}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            disabled={isSubmitting}
            placeholder="Re-enter master passphrase"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
            className={cn(
              'w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 font-mono',
              fieldErrors.confirmPassword
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Hide confirmed passphrase' : 'Show confirmed passphrase'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p id={`${confirmPasswordId}-error`} className="text-[11px] text-red-400 font-sans flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.confirmPassword}</span>
          </p>
        )}
      </div>

      {/* Submit Action */}
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
              <span>Arming Enclave Identity...</span>
            </>
          ) : (
            <>
              <span>Initialize Operative Enclave</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Sign In Navigation Link */}
      {onNavigateToSignIn && (
        <div className="pt-1 text-center">
          <p className="text-xs text-muted">
            Already armed?{' '}
            <button
              type="button"
              onClick={onNavigateToSignIn}
              className="text-accent hover:underline font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
            >
              Sign in to Enclave →
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
