import { getSupabase, isSupabaseConfigured } from '../../../lib/supabase.ts';
import {
  validateEmail,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
} from '../utils/validation.ts';
import type {
  SignUpCredentials,
  SignUpResult,
  SignInCredentials,
  SignInResult,
  UserProfile,
} from '../types/index.ts';

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

/**
 * Authenticates user credentials against Supabase Auth.
 * Requirements:
 * - Direct authentication via supabase.auth.signInWithPassword()
 * - Secure handling of invalid credentials, unverified email, and network errors
 * - Zero plaintext password persistence
 */
export async function signInWithEmail(
  credentials: SignInCredentials,
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<SignInResult> {
  const { email, password } = credentials;

  // 1. Client-side input validation
  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid) {
    return {
      success: false,
      code: 'INVALID_EMAIL',
      message: emailCheck.error || 'Please enter a valid email address.',
      field: 'email',
    };
  }

  if (!password || password.trim().length === 0) {
    return {
      success: false,
      code: 'MISSING_PASSWORD',
      message: 'Password is required to authenticate.',
      field: 'password',
    };
  }

  // 2. Supabase client resolution
  const supabase = customSupabaseClient ?? getSupabase();
  const configured = customSupabaseClient ? true : isSupabaseConfigured();
  if (!supabase || !configured) {
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();

      // Email unconfirmed error (check before general 400)
      if (
        msg.includes('email not confirmed') ||
        msg.includes('unverified') ||
        msg.includes('email_not_confirmed')
      ) {
        return {
          success: false,
          code: 'EMAIL_NOT_CONFIRMED',
          message:
            'Your email address has not been confirmed yet. Please verify your account via the activation link sent to your inbox.',
          field: 'email',
        };
      }

      // Rate limiting
      if (msg.includes('rate limit') || error.status === 429) {
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please wait a few moments before trying again.',
        };
      }

      // Invalid credentials error mapping (OWASP: avoid leaking whether email vs password was wrong)
      if (
        msg.includes('invalid login credentials') ||
        msg.includes('invalid grant') ||
        msg.includes('user not found') ||
        error.status === 400
      ) {
        return {
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or master password. Please verify your credentials.',
        };
      }

      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unable to authenticate. Please check your network connection.',
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: 'No active session returned from identity provider.',
      };
    }

    const resolvedDisplayName =
      data.user.user_metadata?.display_name ||
      data.user.email?.split('@')[0] ||
      'Operative';

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || trimmedEmail,
        displayName: resolvedDisplayName,
      },
      session: {
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at,
      },
      message: 'Enclave authorization granted. Welcome back.',
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

/**
 * Terminates the active Supabase session and flushes client state.
 */
export async function signOutUser(
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<{ success: boolean; error?: string }> {
  const supabase = customSupabaseClient ?? getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to terminate session',
    };
  }
}

/**
 * Safely fetches the public profile associated with an authenticated user id.
 * Falls back to local defaults if the profile table is not yet accessible.
 */
export async function fetchUserProfile(
  userId: string,
  userMetadata?: Record<string, unknown>,
  userEmail?: string | null,
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<UserProfile> {
  const fallbackProfile: UserProfile = {
    id: userId,
    email: userEmail ?? null,
    displayName: (userMetadata?.display_name as string) ?? (userEmail ? userEmail.split('@')[0] : 'Operative'),
    avatarUrl: (userMetadata?.avatar_url as string) ?? null,
    role: 'user',
    isActive: true,
  };

  const supabase = customSupabaseClient ?? getSupabase();
  const configured = customSupabaseClient ? true : isSupabaseConfigured();
  if (!supabase || !configured) {
    return fallbackProfile;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return fallbackProfile;
    }

    return {
      id: data.id,
      email: data.email ?? userEmail ?? null,
      displayName: data.display_name ?? fallbackProfile.displayName,
      avatarUrl: data.avatar_url ?? null,
      role: (data.role as 'user' | 'admin' | 'analyst') || 'user',
      isActive: Boolean(data.is_active ?? true),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return fallbackProfile;
  }
}
