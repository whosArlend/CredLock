import type { PasswordEvaluation, PasswordRequirement } from '../types/index.ts';

/**
 * Reserved administrative, protocol, and role identities.
 * These cannot be registered by standard operatives.
 */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'credlock',
  'support',
  'security',
  'operator',
  'operative',
  'enclave',
  'analyst',
  'api',
  'auth',
  'guest',
  'anonymous',
  'moderator',
  'superuser',
  'master',
  'test',
  'null',
  'undefined',
]);

/**
 * Internal unroutable synthetic domain used exclusively for Supabase Auth identity mapping.
 * Conforms to RFC 6761 / ICANN special-use domain recommendations.
 */
export const SYNTHETIC_AUTH_DOMAIN = 'auth.credlock.internal';

/**
 * Normalizes a username into its canonical identity form:
 * Trims surrounding whitespace and converts to lowercase.
 */
export function normalizeUsername(username: string): string {
  if (!username) return '';
  return username.trim().toLowerCase();
}

/**
 * Converts a normalized operative username into the internal deterministic
 * synthetic email identifier required by Supabase Auth GoTrue.
 */
export function toSyntheticEmail(username: string): string {
  const normalized = normalizeUsername(username);
  return `${normalized}@${SYNTHETIC_AUTH_DOMAIN}`;
}

/**
 * Validates an operative username against CredLock cybersecurity rules.
 *
 * Requirements:
 * - Length: 3 to 24 characters
 * - Characters: ASCII letters (a-z, A-Z), numbers (0-9), underscores (_), hyphens (-)
 * - Must begin and end with an alphanumeric character
 * - No spaces
 * - No consecutive underscores (__) or consecutive hyphens (--)
 * - No email characters (@, .)
 * - Not in reserved usernames list
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required.' };
  }

  const trimmed = username.trim();

  // Check for spaces
  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Username cannot contain spaces.' };
  }

  // Check for email characters
  if (trimmed.includes('@') || trimmed.includes('.')) {
    return {
      isValid: false,
      error: 'Username cannot contain email characters (@ or .). Enter a handle only.',
    };
  }

  // Length limits
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (trimmed.length > 24) {
    return { isValid: false, error: 'Username cannot exceed 24 characters.' };
  }

  // Alphanumeric start and end
  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Username must begin with a letter or number.' };
  }
  if (!/[a-zA-Z0-9]$/.test(trimmed)) {
    return { isValid: false, error: 'Username must end with a letter or number.' };
  }

  // No consecutive special characters
  if (/__/.test(trimmed)) {
    return { isValid: false, error: 'Username cannot contain consecutive underscores (__).' };
  }
  if (/--/.test(trimmed)) {
    return { isValid: false, error: 'Username cannot contain consecutive hyphens (--).' };
  }

  // Allowed character set check
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens.',
    };
  }

  // Reserved names check
  const normalized = trimmed.toLowerCase();
  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      isValid: false,
      error: 'This username is reserved by the security system. Please choose another.',
    };
  }

  return { isValid: true };
}

/**
 * Evaluates master passphrase against CredLock core cybersecurity requirements.
 * Requirements:
 * - Minimum 10 characters (OWASP recommended baseline)
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special symbol (!@#$%^&*...)
 */
export function evaluatePasswordRequirements(password: string): PasswordEvaluation {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: 'Minimum 10 characters',
      met: password.length >= 10,
    },
    {
      id: 'lowercase',
      label: 'Lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'Uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'digit',
      label: 'Numeric digit (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      id: 'symbol',
      label: 'Special character (!@#$%^&*)',
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const isAllMet = metCount === requirements.length;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let scoreLabel = 'Vulnerable';

  if (password.length === 0) {
    score = 0;
    scoreLabel = 'Awaiting Input';
  } else if (metCount <= 2 || password.length < 8) {
    score = 1;
    scoreLabel = 'Weak';
  } else if (metCount === 3 || metCount === 4) {
    score = 2;
    scoreLabel = 'Moderate';
  } else if (metCount === 5 && password.length < 14) {
    score = 3;
    scoreLabel = 'Strong';
  } else if (metCount === 5 && password.length >= 14) {
    score = 4;
    scoreLabel = 'Cryptographically Robust';
  }

  return {
    score,
    scoreLabel,
    requirements,
    isAllMet,
  };
}

/**
 * Validates password and confirm password agreement.
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your master passphrase.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passphrases do not match.' };
  }
  return { isValid: true };
}
