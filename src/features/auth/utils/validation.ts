import type { PasswordEvaluation, PasswordRequirement } from '../types/index.ts';

// RFC 5322 compliant simplified email format check
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email formatting.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email address exceeds maximum length (254 characters).' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@domain.com).' };
  }
  return { isValid: true };
}

/**
 * Evaluates password against CredLock core cybersecurity requirements.
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
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }
  return { isValid: true };
}
