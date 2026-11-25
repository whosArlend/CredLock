import { useState, useId, FormEvent } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PasswordRequirements } from './PasswordRequirements';
import {
  validateEmail,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
} from '../utils/validation';
import { signUpWithEmail } from '../services/authService';
import type { SignUpResult } from '../types';
import { cn } from '@/lib/utils';

export interface SignUpFormProps {
  onSuccess?: (result: Extract<SignUpResult, { success: true }>) => void;
  onNavigateToSignIn?: () => void;
  className?: string;
  isCompact?: boolean;
}

export function SignUpForm({
  onSuccess,
  onNavigateToSignIn,
  className,
  isCompact = false,
}: SignUpFormProps) {
  // Field states
  const [email, setEmail] = useState('');
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
  const emailId = `${id}-email`;
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

    // 1. Email validation
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.error || 'Invalid email format.';
    }

    // 2. Password requirements validation
    if (!passwordEval.isAllMet) {
      errors.password = 'Password does not satisfy all cryptographic security requirements.';
    }

    // 3. Password confirmation validation
    const confirmCheck = validatePasswordConfirmation(password, confirmPassword);
    if (!confirmCheck.isValid) {
      errors.confirmPassword = confirmCheck.error || 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await signUpWithEmail({
        email,
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
  // VIEW: Email Verification Pending / Success Screen
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
                {successResult.requiresEmailVerification
                  ? 'Verification Required'
                  : 'Account Activated'}
              </h3>
              <p className="text-xs font-mono text-emerald-400/90">
                {successResult.requiresEmailVerification
                  ? 'DISPATCHED // ENCLAVE CONFIRMATION'
                  : 'IDENTITY // ARMED'}
              </p>
            </div>
          </div>

          <div className="text-sm text-foreground-secondary leading-relaxed space-y-2">
            <p>
              {successResult.requiresEmailVerification ? (
                <>
                  A cryptographically signed activation token has been dispatched to{' '}
                  <strong className="text-white font-mono break-all">{successResult.user.email}</strong>.
                </>
              ) : (
                'Your CredLock account is provisioned and ready for zero-knowledge synchronization.'
              )}
            </p>
            {successResult.requiresEmailVerification && (
              <div className="p-3.5 rounded-xl bg-background-base/80 border border-border space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>Next Activation Steps</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-muted">
                  <li>Check your inbox (and spam filter) for the Supabase verification email.</li>
                  <li>Click the confirmation link to authorize your identity enclave.</li>
                  <li>Return to CredLock to sign in.</li>
                </ol>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onNavigateToSignIn && (
              <Button
                type="button"
                variant="primary"
                onClick={onNavigateToSignIn}
                className="w-full sm:w-auto"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessResult(null);
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

      {/* Field: Display Name (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="block text-xs font-medium text-foreground-secondary">
          Display Name <span className="text-muted font-normal text-[11px]">(Optional / Alias)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <User className="h-4 w-4" />
          </div>
          <input
            id={nameId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Agent Zero"
            maxLength={50}
            autoComplete="name"
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-surface-elevated/70 border border-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors disabled:opacity-50"
          />
        </div>
      </div>

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

      {/* Field: Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={passwordId} className="block text-xs font-medium text-foreground-secondary">
            Master Password <span className="text-accent">*</span>
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

      {/* Live Password Requirements & Strength Feedback */}
      {password.length > 0 && (
        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border/60">
          <PasswordRequirements evaluation={passwordEval} showRequirements={!isCompact || password.length > 0} />
        </div>
      )}

      {/* Field: Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor={confirmPasswordId} className="block text-xs font-medium text-foreground-secondary">
          Confirm Master Password <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <KeyRound className="h-4 w-4" />
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
            placeholder="Re-enter master password"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
            className={cn(
              'w-full pl-9 pr-10 py-2 text-xs sm:text-sm font-mono rounded-lg bg-surface-elevated/70 border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50',
              fieldErrors.confirmPassword
                ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500'
                : 'border-border focus:ring-accent focus:border-accent'
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors focus:outline-none"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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

      {/* Zero-Knowledge Disclaimer */}
      <div className="rounded-lg bg-surface-elevated/30 border border-border/50 p-2.5 text-[11px] text-muted flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Zero-Knowledge Enforcement: Your master password encrypts all local data in browser memory. It is never transmitted unhashed or stored in plaintext on any server.
        </p>
      </div>

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
            <span>Provisioning Enclave Account...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <span>Create CredLock Account</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </span>
        )}
      </Button>

      {/* Sign In Navigation Link */}
      {onNavigateToSignIn && (
        <div className="pt-2 text-center text-xs text-muted">
          <span>Already registered with CredLock? </span>
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
          >
            Sign In to Enclave
          </button>
        </div>
      )}
    </form>
  );
}
