import type { User, Session } from '@supabase/supabase-js';

/**
 * Authentication & Registration Types for CredLock v2.0
 */

export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface PasswordRequirement {
  id: 'length' | 'uppercase' | 'lowercase' | 'digit' | 'symbol';
  label: string;
  met: boolean;
}

export interface PasswordEvaluation {
  score: 0 | 1 | 2 | 3 | 4; // 0=Dangerous, 1=Weak, 2=Moderate, 3=Strong, 4=Very Strong
  scoreLabel: string;
  requirements: PasswordRequirement[];
  isAllMet: boolean;
}

export interface AuthSuccessResult {
  success: true;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
  sessionEstablished: boolean;
  requiresEmailVerification: boolean;
  message: string;
}

export interface AuthErrorResult {
  success: false;
  code:
    | 'INVALID_EMAIL'
    | 'WEAK_PASSWORD'
    | 'PASSWORD_MISMATCH'
    | 'USER_ALREADY_EXISTS'
    | 'SUPABASE_NOT_CONFIGURED'
    | 'RATE_LIMITED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  field?: 'email' | 'password' | 'confirmPassword';
}

export type SignUpResult = AuthSuccessResult | AuthErrorResult;

export interface SignInSuccessResult {
  success: true;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
  session: {
    accessToken: string;
    expiresAt?: number;
  };
  message: string;
}

export interface SignInErrorResult {
  success: false;
  code:
    | 'INVALID_EMAIL'
    | 'MISSING_PASSWORD'
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_NOT_CONFIRMED'
    | 'SUPABASE_NOT_CONFIGURED'
    | 'RATE_LIMITED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  field?: 'email' | 'password';
}

export type SignInResult = SignInSuccessResult | SignInErrorResult;

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'analyst';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<SignInResult>;
  signUp: (credentials: SignUpCredentials) => Promise<SignUpResult>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}
