import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUsername,
  normalizeUsername,
  toSyntheticEmail,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
  RESERVED_USERNAMES,
} from '../src/features/auth/utils/validation.ts';
import {
  signUpWithUsername,
  signInWithUsername,
  signOutUser,
  fetchUserProfile,
} from '../src/features/auth/services/authService.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('CredLock v2.0 — Phase 2.1: Username-Only Authentication Test Suite', () => {
  // ==========================================================================
  // 1. Username Format & Character Validation
  // ==========================================================================
  describe('1. Username Format & Character Validation', () => {
    it('accepts standard valid operative usernames', () => {
      assert.strictEqual(validateUsername('cipher_operative').isValid, true);
      assert.strictEqual(validateUsername('agent-007').isValid, true);
      assert.strictEqual(validateUsername('secOps99').isValid, true);
      assert.strictEqual(validateUsername('neo').isValid, true); // exactly 3 chars
      assert.strictEqual(validateUsername('a'.repeat(24)).isValid, true); // exactly 24 chars
    });

    it('rejects empty or whitespace-only usernames', () => {
      const emptyRes = validateUsername('');
      assert.strictEqual(emptyRes.isValid, false);
      assert.strictEqual(emptyRes.error, 'Username is required.');

      const spaceRes = validateUsername('   ');
      assert.strictEqual(spaceRes.isValid, false);
      assert.strictEqual(spaceRes.error, 'Username is required.');
    });

    it('rejects usernames containing whitespace', () => {
      const res = validateUsername('cipher op');
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /cannot contain spaces/i);
    });

    it('rejects usernames under 3 characters', () => {
      const res1 = validateUsername('a');
      assert.strictEqual(res1.isValid, false);
      assert.match(res1.error || '', /at least 3 characters/i);

      const res2 = validateUsername('op');
      assert.strictEqual(res2.isValid, false);
      assert.match(res2.error || '', /at least 3 characters/i);
    });

    it('rejects usernames exceeding 24 characters', () => {
      const longUser = 'a'.repeat(25);
      const res = validateUsername(longUser);
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /cannot exceed 24 characters/i);
    });

    it('rejects usernames with leading or trailing special characters', () => {
      assert.strictEqual(validateUsername('_cipher').isValid, false);
      assert.strictEqual(validateUsername('cipher_').isValid, false);
      assert.strictEqual(validateUsername('-cipher').isValid, false);
      assert.strictEqual(validateUsername('cipher-').isValid, false);
    });

    it('rejects usernames with consecutive special characters (__ or --)', () => {
      const res1 = validateUsername('cipher__op');
      assert.strictEqual(res1.isValid, false);
      assert.match(res1.error || '', /consecutive underscores/i);

      const res2 = validateUsername('cipher--op');
      assert.strictEqual(res2.isValid, false);
      assert.match(res2.error || '', /consecutive hyphens/i);
    });

    it('strictly rejects email characters (@ and .)', () => {
      const res1 = validateUsername('user@domain.com');
      assert.strictEqual(res1.isValid, false);
      assert.match(res1.error || '', /cannot contain email characters/i);

      const res2 = validateUsername('user.name');
      assert.strictEqual(res2.isValid, false);
      assert.match(res2.error || '', /cannot contain email characters/i);
    });

    it('rejects reserved system and role identities', () => {
      for (const reserved of RESERVED_USERNAMES) {
        const res = validateUsername(reserved);
        assert.strictEqual(res.isValid, false, `Expected ${reserved} to be rejected as reserved`);
        assert.match(res.error || '', /reserved/i);
      }
    });

    it('rejects all 21 reserved usernames in mixed-case variations', () => {
      const mixedCaseVariants = [
        'AdMiN',
        'Administrator',
        'ROOT',
        'SyStEm',
        'CredLock',
        'SuPPoRt',
        'SecUrIty',
        'OPERATOR',
        'OpErAtIvE',
        'Enclave',
        'Analyst',
        'API',
        'AUTH',
        'GUEST',
        'Anonymous',
        'Moderator',
        'SuperUser',
        'Master',
        'TEST',
        'NULL',
        'Undefined',
      ];

      for (const variant of mixedCaseVariants) {
        const res = validateUsername(variant);
        assert.strictEqual(res.isValid, false, `Expected mixed-case variant "${variant}" to be rejected`);
        assert.match(res.error || '', /reserved/i);
      }
    });

    it('rejects reserved usernames surrounded by whitespace after trimming', () => {
      const res = validateUsername('   admin   ');
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /reserved/i);
    });

    it('allows valid operative usernames that contain reserved substrings as prefixes/suffixes', () => {
      const validSubstrings = [
        'admin_ops',
        'root_access',
        'security_lead',
        'credlock_agent',
        'tester_01',
        'analyst_99',
        'operator_station',
        'operative_x',
        'api_gateway',
        'guest_user',
        'master_key',
        'superusers',
      ];

      for (const username of validSubstrings) {
        const res = validateUsername(username);
        assert.strictEqual(res.isValid, true, `Expected "${username}" to be valid despite containing reserved substring`);
        assert.strictEqual(res.error, undefined);
      }
    });
  });

  // ==========================================================================
  // 2. Username Normalization & Synthetic Identity Mapping (Approach A)
  // ==========================================================================
  describe('2. Username Normalization & Synthetic Email Mapping', () => {
    it('normalizes usernames by trimming whitespace and lowercasing', () => {
      assert.strictEqual(normalizeUsername('  Cipher_Operative  '), 'cipher_operative');
      assert.strictEqual(normalizeUsername('AGENT-007'), 'agent-007');
      assert.strictEqual(normalizeUsername(''), '');
    });

    it('generates deterministic synthetic email with unroutable .internal domain', () => {
      assert.strictEqual(
        toSyntheticEmail('Cipher_Operative'),
        'cipher_operative@auth.credlock.internal'
      );
      assert.strictEqual(
        toSyntheticEmail('  agent-007  '),
        'agent-007@auth.credlock.internal'
      );
    });

    it('guarantees identical synthetic identities for differently cased inputs', () => {
      const id1 = toSyntheticEmail('OperativeOne');
      const id2 = toSyntheticEmail('operativeone');
      const id3 = toSyntheticEmail('  OPERATIVEONE  ');
      assert.strictEqual(id1, id2);
      assert.strictEqual(id2, id3);
    });
  });

  // ==========================================================================
  // 3. Password Complexity & Requirements Scoring
  // ==========================================================================
  describe('3. Password Requirements Evaluation & Complexity Scoring', () => {
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
  // 4. Password Confirmation Matching
  // ==========================================================================
  describe('4. Password Confirmation Matching', () => {
    it('accepts identical passwords', () => {
      const res = validatePasswordConfirmation('ComplexPass#2026', 'ComplexPass#2026');
      assert.strictEqual(res.isValid, true);
    });

    it('rejects empty confirmation', () => {
      const res = validatePasswordConfirmation('ComplexPass#2026', '');
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Please confirm your master passphrase.');
    });

    it('rejects mismatched passwords with clear error', () => {
      const res = validatePasswordConfirmation('ComplexPass#2026', 'DifferentPass#2026');
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Passphrases do not match.');
    });
  });

  // ==========================================================================
  // 5. Sign Up Service Integration (signUpWithUsername)
  // ==========================================================================
  describe('5. Sign Up Service Integration (signUpWithUsername)', () => {
    it('aborts early on invalid username without calling auth provider', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signUp: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithUsername(
        {
          username: 'inv@lid',
          password: 'ValidPassword123#',
          confirmPassword: 'ValidPassword123#',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_USERNAME');
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

      const result = await signUpWithUsername(
        {
          username: 'valid_user',
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

      const result = await signUpWithUsername(
        {
          username: 'valid_user',
          password: 'ValidPassword123#',
          confirmPassword: 'DifferentPassword123#',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'PASSWORD_MISMATCH');
      assert.strictEqual(called, false);
    });

    it('handles successful registration with immediate session', async () => {
      let passedEmail = '';
      let passedMetadata: Record<string, unknown> = {};

      const mockSupabase = {
        auth: {
          signUp: async ({ email, options }: { email: string; options?: { data?: Record<string, unknown> } }) => {
            passedEmail = email;
            passedMetadata = options?.data || {};
            return {
              data: {
                user: {
                  id: 'usr-operative-uuid',
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

      const result = await signUpWithUsername(
        {
          username: 'Cipher_Agent',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.sessionEstablished, true);
      assert.strictEqual(result.user.id, 'usr-operative-uuid');
      assert.strictEqual(result.user.username, 'cipher_agent');
      assert.strictEqual(passedEmail, 'cipher_agent@auth.credlock.internal');
      assert.strictEqual(passedMetadata.username, 'cipher_agent');
    });

    it('handles duplicate username conflict when Supabase returns 422', async () => {
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

      const result = await signUpWithUsername(
        {
          username: 'existing_user',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'USERNAME_TAKEN');
      assert.strictEqual(result.field, 'username');
      assert.match(result.message, /already taken/i);
    });

    it('handles duplicate username when GoTrue returns user with empty identities', async () => {
      const mockSupabase = {
        auth: {
          signUp: async () => {
            return {
              data: {
                user: {
                  id: 'usr-existing-uuid',
                  email: 'existing_user@auth.credlock.internal',
                  identities: [],
                },
                session: null,
              },
              error: null,
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithUsername(
        {
          username: 'existing_user',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'USERNAME_TAKEN');
      assert.strictEqual(result.field, 'username');
    });

    it('handles rate limiting responses', async () => {
      const mockSupabase = {
        auth: {
          signUp: async () => {
            return {
              data: { user: null, session: null },
              error: {
                message: 'Rate limit exceeded',
                status: 429,
              },
            };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signUpWithUsername(
        {
          username: 'ratelimited_user',
          password: 'Crypt0-Pass#2026',
          confirmPassword: 'Crypt0-Pass#2026',
        },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'RATE_LIMITED');
    });
  });

  // ==========================================================================
  // 6. Sign In Service Integration (signInWithUsername)
  // ==========================================================================
  describe('6. Sign In Service Integration (signInWithUsername)', () => {
    it('rejects empty username before calling Supabase', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithUsername(
        { username: '', password: 'AnyPassword123!' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_USERNAME');
      assert.strictEqual(result.field, 'username');
      assert.strictEqual(called, false);
    });

    it('rejects empty password before calling Supabase', async () => {
      let called = false;
      const mockSupabase = {
        auth: {
          signInWithPassword: async () => {
            called = true;
            return { data: {}, error: null };
          },
        },
      } as unknown as SupabaseClient;

      const result = await signInWithUsername(
        { username: 'operative', password: '   ' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'MISSING_PASSWORD');
      assert.strictEqual(result.field, 'password');
      assert.strictEqual(called, false);
    });

    it('authenticates valid credentials and establishes session', async () => {
      let passedEmail = '';
      const mockSupabase = {
        auth: {
          signInWithPassword: async ({ email }: { email: string }) => {
            passedEmail = email;
            return {
              data: {
                user: {
                  id: 'usr-authenticated-uuid',
                  email,
                  user_metadata: { username: 'lead_analyst', display_name: 'Lead Analyst' },
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

      const result = await signInWithUsername(
        { username: 'Lead_Analyst', password: 'SecPass#2026!' },
        mockSupabase
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.user.id, 'usr-authenticated-uuid');
      assert.strictEqual(result.user.username, 'lead_analyst');
      assert.strictEqual(result.user.displayName, 'Lead Analyst');
      assert.strictEqual(result.session.accessToken, 'valid-jwt-token-12345');
      assert.strictEqual(passedEmail, 'lead_analyst@auth.credlock.internal');
    });

    it('maps wrong password and unknown username to the exact same generic error (defeating enumeration)', async () => {
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

      const result = await signInWithUsername(
        { username: 'nonexistent_or_wrong', password: 'WrongPassword123!' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'INVALID_CREDENTIALS');
      assert.strictEqual(
        result.message,
        'Invalid username or master passphrase. Please verify your credentials.'
      );
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

      const result = await signInWithUsername(
        { username: 'bruteforce_user', password: 'AnyPassword' },
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

      const result = await signInWithUsername(
        { username: 'network_user', password: 'AnyPassword123' },
        mockSupabase
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 'NETWORK_ERROR');
    });
  });

  // ==========================================================================
  // 7. Session Termination & Sign Out
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
  // 8. User Profile Resolution (fetchUserProfile)
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
                    username: 'lead_operative',
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
        { username: 'lead_operative', display_name: 'Metadata Name' },
        mockSupabase
      );

      assert.strictEqual(profile.id, 'usr-profile-uuid');
      assert.strictEqual(profile.username, 'lead_operative');
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
        { username: 'fallback_agent', display_name: 'Fallback Agent' },
        mockSupabase
      );

      assert.strictEqual(profile.id, 'usr-fallback-uuid');
      assert.strictEqual(profile.username, 'fallback_agent');
      assert.strictEqual(profile.displayName, 'Fallback Agent');
      assert.strictEqual(profile.role, 'user');
      assert.strictEqual(profile.isActive, true);
    });
  });
});
