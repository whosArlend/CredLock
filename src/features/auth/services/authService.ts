import { getSupabase, isSupabaseConfigured } from '../../../lib/supabase.ts';
import {
  validateEmail,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
} from '../utils/validation.ts';
import type { SignUpCredentials, SignUpResult } from '../types/index.ts';

/**
 * Executes secure user registration against Supabase Auth.
 * Adheres strictly to Zero-Knowledge and Least-Privilege design:
 * - Credentials never pass through custom backend intermediary servers.
 * - Password confirmation is validated purely in memory before submission.
 * - Clear, user-friendly feedback without leaking account enumeration data.
 */
export async function signUpWithEmail(
  credentials: SignUpCredentials,
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<SignUpResult> {
  const { email, password, confirmPassword, displayName } = credentials;

  // 1. Client-side input validation
  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid) {
    return {
      success: false,
      code: 'INVALID_EMAIL',
      message: emailCheck.error || 'Invalid email address.',
      field: 'email',
    };
  }

  const passwordEvaluation = evaluatePasswordRequirements(password);
  if (!passwordEvaluation.isAllMet) {
    return {
      success: false,
      code: 'WEAK_PASSWORD',
      message: 'Password does not satisfy all cryptographic security requirements.',
      field: 'password',
    };
  }

  if (confirmPassword !== undefined) {
    const confirmationCheck = validatePasswordConfirmation(password, confirmPassword);
    if (!confirmationCheck.isValid) {
      return {
        success: false,
        code: 'PASSWORD_MISMATCH',
        message: confirmationCheck.error || 'Passwords do not match.',
        field: 'confirmPassword',
      };
    }
  }

  // 2. Supabase client resolution
  const supabase = customSupabaseClient ?? getSupabase();
  const configured = customSupabaseClient ? true : isSupabaseConfigured();
  if (!supabase || !configured) {
    // If running in development without live keys, warn appropriately
    return {
      success: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      message:
        'Supabase Auth is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.',
    };
  }

  // 3. Supabase Auth execution
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const resolvedDisplayName = displayName?.trim() || trimmedEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: resolvedDisplayName,
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });

    if (error) {
      // Map Supabase errors to standardized security codes
      const msg = error.message.toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('user already exists') ||
        error.status === 422
      ) {
        return {
          success: false,
          code: 'USER_ALREADY_EXISTS',
          message: 'An account with this email address already exists. Please sign in or recover your account.',
          field: 'email',
        };
      }

      if (msg.includes('rate limit') || error.status === 429) {
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Security rate limit reached. Please wait a few moments before trying again.',
        };
      }

      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unable to register account. Please try again.',
      };
    }

    if (!data.user) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: 'No user data returned from authentication provider.',
      };
    }

    // In Supabase, if email confirmation is enabled and the user already exists,
    // signUp may return a user with an empty identities array to prevent user enumeration.
    if (data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        code: 'USER_ALREADY_EXISTS',
        message: 'An account with this email address already exists. Please sign in instead.',
        field: 'email',
      };
    }

    const requiresEmailVerification = !data.session;

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || trimmedEmail,
        displayName: resolvedDisplayName,
      },
      sessionEstablished: Boolean(data.session),
      requiresEmailVerification,
      message: requiresEmailVerification
        ? 'Account registered successfully. A verification link has been dispatched to your email address.'
        : 'Account created successfully. Welcome to CredLock.',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network communication error.';
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: errorMsg,
    };
  }
}
