import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
} from '../src/features/auth/utils/validation.ts';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  fetchUserProfile,
} from '../src/features/auth/services/authService.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('CredLock v2.0 — Authentication Foundation Test Suite (Phases 1 & 2)', () => {
  // ==========================================================================
  // 1. Email Format Validation
  // ==========================================================================
  describe('1. Email Format Validation (RFC 5322 & OWASP)', () => {
    it('accepts standard valid email addresses', () => {
      assert.strictEqual(validateEmail('operative@credlock.io').isValid, true);
      assert.strictEqual(validateEmail('agent.007@domain.co.uk').isValid, true);
      assert.strictEqual(validateEmail('sec-ops+analyst@sub.enterprise.org').isValid, true);
    });

    it('rejects empty or whitespace-only email', () => {
      const emptyRes = validateEmail('');
      assert.strictEqual(emptyRes.isValid, false);
      assert.strictEqual(emptyRes.error, 'Email address is required.');

      const spaceRes = validateEmail('   ');
      assert.strictEqual(spaceRes.isValid, false);
      assert.strictEqual(spaceRes.error, 'Email address is required.');
    });

    it('rejects invalid email formats without @ or domain', () => {
      assert.strictEqual(validateEmail('plainaddress').isValid, false);
      assert.strictEqual(validateEmail('@missinguser.com').isValid, false);
      assert.strictEqual(validateEmail('user@.com').isValid, false);
      assert.strictEqual(validateEmail('user@domain').isValid, false);
      assert.strictEqual(validateEmail('user@domain..com').isValid, false);
    });

    it('rejects emails exceeding maximum 254 RFC character limit', () => {
      const longEmail = 'a'.repeat(250) + '@domain.com';
      const res = validateEmail(longEmail);
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /exceeds maximum length/i);
    });
  });

  // ==========================================================================
  // 2. Password Requirements & Cryptographic Scoring
  // ==========================================================================
  describe('2. Password Requirements Evaluation & Complexity Scoring', () => {
    it('evaluates empty password as awaiting input with score 0', () => {
      const evalResult = evaluatePasswordRequirements('');
      assert.strictEqual(evalResult.score, 0);
      assert.strictEqual(evalResult.isAllMet, false);
      assert.strictEqual(evalResult.requirements.every((r) => !r.met), true);
    });

    it('flags missing character classes accurately', () => {
      const res1 = evaluatePasswordRequirements('lowercaseonly');
      assert.strictEqual(res1.isAllMet, false);
      assert.strictEqual(res1.requirements.find((r) => r.id === 'lowercase')?.met, true);
      assert.strictEqual(res1.requirements.find((r) => r.id === 'uppercase')?.met, false);
      assert.strictEqual(res1.requirements.find((r) => r.id === 'digit')?.met, false);
      assert.strictEqual(res1.requirements.find((r) => r.id === 'symbol')?.met, false);

      const res2 = evaluatePasswordRequirements('Password12345');
      assert.strictEqual(res2.requirements.find((r) => r.id === 'length')?.met, true);
      assert.strictEqual(res2.requirements.find((r) => r.id === 'lowercase')?.met, true);
      assert.strictEqual(res2.requirements.find((r) => r.id === 'uppercase')?.met, true);
      assert.strictEqual(res2.requirements.find((r) => r.id === 'digit')?.met, true);
      assert.strictEqual(res2.requirements.find((r) => r.id === 'symbol')?.met, false);
      assert.strictEqual(res2.isAllMet, false);
    });

    it('rejects passwords under 10 characters even if all classes exist', () => {
      const res = evaluatePasswordRequirements('Aa1!Bb2');
      assert.strictEqual(res.requirements.find((r) => r.id === 'length')?.met, false);
      assert.strictEqual(res.isAllMet, false);
      assert.strictEqual(res.score <= 1, true);
    });

    it('passes and scores high when all 5 requirements are satisfied', () => {
      const res = evaluatePasswordRequirements('Crypt0-Lock#Sec2026!');
      assert.strictEqual(res.isAllMet, true);
      assert.strictEqual(res.requirements.every((r) => r.met), true);
      assert.strictEqual(res.score, 4);
      assert.strictEqual(res.scoreLabel, 'Cryptographically Robust');
    });
  });

  // ==========================================================================
  // 3. Password Confirmation Matching
  // ==========================================================================
  describe('3. Password Confirmation Matching', () => {
    it('accepts identical passwords', () => {
      const res = validatePasswordConfirmation('ComplexPass#2026', 'ComplexPass#2026');
      assert.strictEqual(res.isValid, true);
    });

    it('rejects empty confirmation', () => {
      const res = validatePasswordConfirmation('ComplexPass#2026', '');
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Please confirm your password.');
    });

    it('rejects mismatched passwords with clear error', () => {
      const res = validatePasswordConfirmation('ComplexPass#2026', 'DifferentPass#2026');
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Passwords do not match.');
    });
  });

  // ==========================================================================
  // 4. Supabase Sign Up Service Integration
  // ==========================================================================
  describe('4. Sign Up Service Logic & Error Handling', () => {
    it('aborts early on invalid email without calling auth provider', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signUp: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'invalid-email',
          password: 'ValidPassword123#',
          confirmPassword: 'ValidPassword123#',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_EMAIL');
      assert.strictEqual(called, false);
    });

    it('aborts early on weak password without calling auth provider', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signUp: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'valid@credlock.io',
          password: 'short',
          confirmPassword: 'short',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'WEAK_PASSWORD');
      assert.strictEqual(called, false);
    });

    it('aborts early on password mismatch without calling auth provider', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signUp: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'valid@credlock.io',
          password: 'ValidPassword123#',
          confirmPassword: 'DifferentPassword123#',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'PASSWORD_MISMATCH');
      assert.strictEqual(called, false);
    });

    it('handles successful registration with email verification pending (session null)', async () => {
      const mockSupabase = {
        auth: {
          signUp: async ({ email }: { email: string }) => {
            return {
              data: {
                user: {
                  id: 'usr-12345-uuid',
                  email,
                  identities: [{ id: 'identity-1' }],
                },
                session: null,
              },
              error: null,
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'operative@credlock.io',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.requiresEmailVerification, true);
      assert.strictEqual(result.sessionEstablished, false);
      assert.strictEqual(result.user.id, 'usr-12345-uuid');
      assert.strictEqual(result.user.email, 'operative@credlock.io');
    });

    it('handles successful registration with immediate session', async () => {
      const mockSupabase = {
        auth: {
          signUp: async ({ email }: { email: string }) => {
            return {
              data: {
                user: {
                  id: 'usr-67890-uuid',
                  email,
                  identities: [{ id: 'identity-1' }],
                },
                session: { access_token: 'jwt-token-xyz' },
              },
              error: null,
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'active@credlock.io',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.requiresEmailVerification, false);
      assert.strictEqual(result.sessionEstablished, true);
    });

    it('mitigates user enumeration when Supabase returns user with empty identities', async () => {
      const mockSupabase = {
        auth: {
          signUp: async () => {
            return {
              data: {
                user: {
                  id: 'usr-existing-uuid',
                  email: 'existing@credlock.io',
                  identities: [],
                },
                session: null,
              },
              error: null,
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'existing@credlock.io',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'USER_ALREADY_EXISTS');
      assert.strictEqual(result.field, 'email');
    });

    it('handles explicit duplicate user registration error', async () => {
      const mockSupabase = {
        auth: {
          signUp: async () => {
            return {
              data: { user: null, session: null },
              error: {
                message: 'User already registered',
                status: 422,
              },
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'existing@credlock.io',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'USER_ALREADY_EXISTS');
    });

    it('handles rate limiting responses', async () => {
      const mockSupabase = {
        auth: {
          signUp: async () => {
            return {
              data: { user: null, session: null },
              error: {
                message: 'Email rate limit exceeded',
                status: 429,
              },
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'ratelimited@credlock.io',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'RATE_LIMITED');
    });

    it('handles unexpected exceptions safely without crashing', async () => {
      const mockSupabase = {
        auth: {
          signUp: async () => {
            throw new Error('Connection refused / ECONNREFUSED');
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithEmail(
        {
          email: 'networkerror@credlock.io',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'NETWORK_ERROR');
      assert.strictEqual(result.message, 'Connection refused / ECONNREFUSED');
    });
  });

  // ==========================================================================
  // 5. Sign In Validation & Error Pre-checks (Phase 2)
  // ==========================================================================
  describe('5. Sign In Validation Pre-Checks', () => {
    it('rejects invalid email address before calling Supabase', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'not-an-email', password: 'AnyPassword123!' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_EMAIL');
      assert.strictEqual(result.field, 'email');
      assert.strictEqual(called, false);
    });

    it('rejects empty or whitespace password before calling Supabase', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'operative@credlock.io', password: '   ' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'MISSING_PASSWORD');
      assert.strictEqual(result.field, 'password');
      assert.strictEqual(called, false);
    });
  });

  // ==========================================================================
  // 6. Sign In Service Authentication (Phase 2)
  // ==========================================================================
  describe('6. Sign In Service Authentication (signInWithEmail)', () => {
    it('authenticates valid credentials and establishes session', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: async ({ email }: { email: string }) => {
            return {
              data: {
                user: {
                  id: 'usr-authenticated-uuid',
                  email,
                  user_metadata: { display_name: 'Lead Analyst' },
                },
                session: {
                  access_token: 'valid-jwt-token-12345',
                  expires_at: 1795000000,
                },
              },
              error: null,
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'analyst@credlock.io', password: 'SecPass#2026!' },
        mockSupabase
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.user.id, 'usr-authenticated-uuid');
      assert.strictEqual(result.user.email, 'analyst@credlock.io');
      assert.strictEqual(result.user.displayName, 'Lead Analyst');
      assert.strictEqual(result.session.accessToken, 'valid-jwt-token-12345');
    });

    it('maps invalid credentials to unified OWASP-compliant error', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            return {
              data: { user: null, session: null },
              error: {
                message: 'Invalid login credentials',
                status: 400,
              },
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'wrong@credlock.io', password: 'WrongPassword123!' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_CREDENTIALS');
      assert.match(result.message, /invalid email address or master password/i);
    });

    it('handles unconfirmed email with actionable instructions', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            return {
              data: { user: null, session: null },
              error: {
                message: 'Email not confirmed',
                status: 400,
              },
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'unconfirmed@credlock.io', password: 'ValidPass#123' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'EMAIL_NOT_CONFIRMED');
      assert.strictEqual(result.field, 'email');
      assert.match(result.message, /has not been confirmed yet/i);
    });

    it('maps rate limits appropriately during brute force attempts', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            return {
              data: { user: null, session: null },
              error: {
                message: 'Too many requests',
                status: 429,
              },
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'bruteforce@credlock.io', password: 'AnyPassword' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'RATE_LIMITED');
    });

    it('handles network / connection failures gracefully', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            throw new Error('Failed to fetch / network offline');
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithEmail(
        { email: 'network@credlock.io', password: 'AnyPassword123' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'NETWORK_ERROR');
    });
  });

  // ==========================================================================
  // 7. Session Termination & Sign Out (Phase 2)
  // ==========================================================================
  describe('7. Sign Out Service Logic (signOutUser)', () => {
    it('terminates active session cleanly when Supabase succeeds', async () => {
      let signedOut = false;
      const mockSupabase = {
        auth: {
          signOut: async () => {
            signedOut = true;
            return { error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signOutUser(mockSupabase);
      assert.strictEqual(result.success, true);
      assert.strictEqual(signedOut, true);
    });

    it('handles sign out failure without crashing', async () => {
      const mockSupabase = {
        auth: {
          signOut: async () => {
            return { error: { message: 'Session token already expired' } };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signOutUser(mockSupabase);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Session token already expired');
    });
  });

  // ==========================================================================
  // 8. User Profile Resolution (Phase 2)
  // ==========================================================================
  describe('8. User Profile Resolution (fetchUserProfile)', () => {
    it('returns public profile when database query succeeds', async () => {
      const mockSupabase = {
        from: (table: string) => {
          assert.strictEqual(table, 'profiles');
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'usr-profile-uuid',
                    email: 'lead@credlock.io',
                    display_name: 'Lead Operative',
                    avatar_url: 'https://avatar.url/img.png',
                    role: 'analyst',
                    is_active: true,
                    created_at: '2026-11-20T00:00:00Z',
                    updated_at: '2026-11-25T00:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        },
      } as unknown as SupabaseClient;

      const profile = await fetchUserProfile(
        'usr-profile-uuid',
        { display_name: 'Metadata Name' },
        'lead@credlock.io',
        mockSupabase
      );

      assert.strictEqual(profile.id, 'usr-profile-uuid');
      assert.strictEqual(profile.displayName, 'Lead Operative');
      assert.strictEqual(profile.role, 'analyst');
      assert.strictEqual(profile.isActive, true);
    });

    it('falls back to user metadata when profile query returns null or error', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: { message: 'Table profiles does not exist' },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const profile = await fetchUserProfile(
        'usr-fallback-uuid',
        { display_name: 'Fallback Agent' },
        'fallback@credlock.io',
        mockSupabase
      );

      assert.strictEqual(profile.id, 'usr-fallback-uuid');
      assert.strictEqual(profile.displayName, 'Fallback Agent');
      assert.strictEqual(profile.role, 'user');
      assert.strictEqual(profile.isActive, true);
    });
  });
});
