/**
 * Authentication & Registration Types for CredLock v2.0
 */

export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
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
