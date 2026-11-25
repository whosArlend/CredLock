import { useState, useId, FormEvent } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { validateEmail } from '../utils/validation';
import { signInWithEmail } from '../services/authService';
import type { SignInResult, SignInSuccessResult } from '../types';
import { cn } from '@/lib/utils';

export interface SignInFormProps {
  onSuccess?: (result: SignInSuccessResult) => void;
  onNavigateToSignUp?: () => void;
  onForgotPassword?: () => void;
  className?: string;
  isCompact?: boolean;
}

export function SignInForm({
  onSuccess,
  onNavigateToSignUp,
  onForgotPassword,
  className,
  isCompact = false,
}: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const id = useId();
  const emailId = `${id}-signin-email`;
  const passwordId = `${id}-signin-password`;
  const errorAlertId = `${id}-signin-error-alert`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setShowForgotNotice(false);
    const errors: Record<string, string> = {};

    // 1. Email format check
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.error || 'Please enter a valid email address.';
    }

    // 2. Password check
    if (!password || password.trim().length === 0) {
      errors.password = 'Master password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result: SignInResult = await signInWithEmail({
        email,
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

  const handleForgotPasswordClick = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setShowForgotNotice((prev) => !prev);
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

      {/* Forgot Password Enclave Notice */}
      {showForgotNotice && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5 flex items-start gap-3 animate-in fade-in">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-foreground-secondary">
            <span className="font-semibold text-accent block font-mono">ZERO-KNOWLEDGE RECOVERY NOTICE</span>
            <p className="leading-relaxed">
              CredLock never stores your master password in plaintext. Password resets require emergency recovery key verification. Cryptographic key rotation will be fully enabled in Phase 2B.
            </p>
          </div>
        </div>
      )}

      {/* Field: Email Address */}
      <div className="space-y-1.5">
        <label htmlFor={emailId} className="block text-xs font-medium text-foreground-secondary">
          Email Address <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Mail className="h-4 w-4" />
          </div>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            disabled={isSubmitting}
            placeholder="operative@domain.com"
            autoComplete="email"
            inputMode="email"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50',
              fieldErrors.email
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
        </div>
        {fieldErrors.email && (
          <p id={`${emailId}-error`} className="text-[11px] text-red-400 font-sans flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.email}</span>
          </p>
        )}
      </div>

      {/* Field: Master Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={passwordId} className="block text-xs font-medium text-foreground-secondary">
            Master Password <span className="text-accent">*</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPasswordClick}
            className="text-[11px] font-mono text-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
          >
            Forgot passphrase?
          </button>
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
            placeholder="Enter master password"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
            className={cn(
              'w-full pl-9 pr-10 py-2 text-xs sm:text-sm font-mono rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50',
              fieldErrors.password
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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

      {/* Security Disclaimer */}
      {!isCompact && (
        <div className="rounded-lg bg-surface-elevated/30 border border-border/50 p-2.5 text-[11px] text-muted flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Encrypted Session: Authentication establishes a cryptographically signed JWT session. Master keys derive in browser memory and are never transmitted.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-semibold tracking-wide font-sans shadow-glow-sm"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-background-base" />
            <span>Authenticating Identity Enclave...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <span>Authorize Enclave Access</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </span>
        )}
      </Button>

      {/* Sign Up Link */}
      {onNavigateToSignUp && (
        <div className="pt-2 text-center text-xs text-muted">
          <span>New operative? </span>
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
          >
            Create CredLock Account →
          </button>
        </div>
      )}
    </form>
  );
}

export default SignInForm;
