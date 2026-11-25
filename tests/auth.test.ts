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
  // 9. Synthetic Identity Mapping & Server Verification Simulation
  // ==========================================================================
  describe('9. Synthetic Identity Mapping & Server Verification Simulation (Real Unit Tests)', () => {
    // Pure function simulating the database-level verification logic in handle_new_user()
    function verifyDatabaseIdentityMapping(
      email: string | null | undefined,
      metadataUsername: string | null | undefined
    ): { valid: boolean; errorCode?: string; reason?: string } {
      if (!metadataUsername || metadataUsername.trim() === '') {
        return { valid: false, errorCode: '23514', reason: 'Missing username in metadata' };
      }

      const normalized = normalizeUsername(metadataUsername);

      const usernameCheck = validateUsername(normalized);
      if (!usernameCheck.isValid) {
        return { valid: false, errorCode: '23514', reason: usernameCheck.error };
      }

      const expectedSyntheticEmail = `${normalized}@auth.credlock.internal`;
      if (!email || email.trim().toLowerCase() !== expectedSyntheticEmail) {
        return { valid: false, errorCode: '23514', reason: 'Synthetic identity mismatch' };
      }

      return { valid: true };
    }

    it('accepts exact matching lowercase username and synthetic email', () => {
      const res = verifyDatabaseIdentityMapping('alice@auth.credlock.internal', 'alice');
      assert.strictEqual(res.valid, true);
    });

    it('normalizes uppercase and mixed-case inputs consistently and accepts matching identity', () => {
      const res = verifyDatabaseIdentityMapping('Alice@auth.credlock.internal', 'Alice');
      assert.strictEqual(res.valid, true);
    });

    it('normalizes whitespace around username and email before validation', () => {
      const res = verifyDatabaseIdentityMapping('  agent-007@auth.credlock.internal  ', '  agent-007  ');
      assert.strictEqual(res.valid, true);
    });

    it('rejects mismatched username/email pairs transactionally', () => {
      const res = verifyDatabaseIdentityMapping('alice@auth.credlock.internal', 'bob');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorCode, '23514');
      assert.match(res.reason || '', /mismatch/i);
    });

    it('rejects reserved usernames even if email matches synthetically', () => {
      const res = verifyDatabaseIdentityMapping('admin@auth.credlock.internal', 'admin');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorCode, '23514');
      assert.match(res.reason || '', /reserved/i);
    });

    it('rejects arbitrary real email domains (e.g. gmail.com)', () => {
      const res = verifyDatabaseIdentityMapping('alice@gmail.com', 'alice');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorCode, '23514');
      assert.match(res.reason || '', /mismatch/i);
    });

    it('rejects missing or empty metadata username without falling back', () => {
      const resNull = verifyDatabaseIdentityMapping('alice@auth.credlock.internal', null);
      assert.strictEqual(resNull.valid, false);
      assert.strictEqual(resNull.errorCode, '23514');

      const resEmpty = verifyDatabaseIdentityMapping('alice@auth.credlock.internal', '   ');
      assert.strictEqual(resEmpty.valid, false);
      assert.strictEqual(resEmpty.errorCode, '23514');
    });

    it('rejects malformed synthetic emails', () => {
      const res1 = verifyDatabaseIdentityMapping('alice', 'alice');
      assert.strictEqual(res1.valid, false);

      const res2 = verifyDatabaseIdentityMapping('alice@auth', 'alice');
      assert.strictEqual(res2.valid, false);

      const res3 = verifyDatabaseIdentityMapping('alice@other.credlock.internal', 'alice');
      assert.strictEqual(res3.valid, false);
    });
  });

  // ==========================================================================
  // 10. Migration Backfill Simulation (Real Unit Tests)
  // ==========================================================================
  describe('10. Migration Backfill Algorithm Simulation (Real Unit Tests)', () => {
    interface ProfileRecord {
      id: string;
      email: string | null;
      username: string | null;
      createdAt: string;
    }

    // Pure function simulating the two-phase SQL backfill logic in 003_username_auth.sql
    function simulateBackfill(profiles: ProfileRecord[]): Map<string, string> {
      const tempAssigned = new Map<string, string>(); // profileId -> canonical username
      const claimedUsernames = new Set<string>();

      function isValidCandidate(candidate: string): boolean {
        const lower = candidate.toLowerCase();
        if (lower.length < 3 || lower.length > 24) return false;
        if (!/^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$/.test(lower)) return false;
        if (/(__|--)/.test(lower)) return false;
        if (/[@.]/.test(lower)) return false;
        if (RESERVED_USERNAMES.has(lower)) return false;
        return true;
      }

      // Sort profiles by createdAt ASC, id ASC
      const sorted = [...profiles].sort((a, b) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
      });

      // Phase A: First pass — audit existing non-null usernames
      for (const p of sorted) {
        if (p.username) {
          const cand = p.username.trim().toLowerCase();
          if (isValidCandidate(cand) && !claimedUsernames.has(cand)) {
            claimedUsernames.add(cand);
            tempAssigned.set(p.id, cand);
          }
        }
      }

      // Phase B: Second pass — remediate remaining profiles
      for (const p of sorted) {
        if (tempAssigned.has(p.id)) continue;

        let cand: string | null = null;

        // Step 1: Check synthetic email local-part
        if (p.email && p.email.toLowerCase().endsWith('@auth.credlock.internal')) {
          const localPart = p.email.split('@')[0].trim().toLowerCase();
          if (isValidCandidate(localPart) && !claimedUsernames.has(localPart)) {
            cand = localPart;
          }
        }

        // Step 2: Surrogate generation loop with collision resolution
        if (!cand) {
          const baseHex = p.id.replace(/-/g, '').toLowerCase();
          cand = `op_${baseHex.slice(0, 12)}`;
          let counter = 1;

          while (claimedUsernames.has(cand)) {
            cand = `op_${baseHex.slice(0, 10)}_${counter}`;
            counter++;
          }
        }

        claimedUsernames.add(cand);
        tempAssigned.set(p.id, cand);
      }

      return tempAssigned;
    }

    it('preserves existing valid, non-reserved, unique usernames', () => {
      const records: ProfileRecord[] = [
        { id: '11111111-1111-1111-1111-111111111111', email: 'neo@auth.credlock.internal', username: 'neo', createdAt: '2026-01-01' },
        { id: '22222222-2222-2222-2222-222222222222', email: 'trinity@auth.credlock.internal', username: 'trinity', createdAt: '2026-01-02' },
      ];

      const result = simulateBackfill(records);
      assert.strictEqual(result.get(records[0].id), 'neo');
      assert.strictEqual(result.get(records[1].id), 'trinity');
    });

    it('remediates NULL usernames with valid deterministic surrogate handles', () => {
      const records: ProfileRecord[] = [
        { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'user@company.com', username: null, createdAt: '2026-01-01' },
      ];

      const result = simulateBackfill(records);
      const assigned = result.get(records[0].id);
      assert.ok(assigned);
      assert.strictEqual(assigned?.startsWith('op_'), true);
      assert.strictEqual(assigned?.length, 15);
      assert.strictEqual(validateUsername(assigned!).isValid, true);
    });

    it('remediates invalid existing usernames (dots, consecutive delimiters, out-of-range length)', () => {
      const records: ProfileRecord[] = [
        { id: '11111111-1111-1111-1111-111111111111', email: 'john.doe@test.com', username: 'john.doe', createdAt: '2026-01-01' }, // dot
        { id: '22222222-2222-2222-2222-222222222222', email: 'bad@test.com', username: 'bad__delim', createdAt: '2026-01-02' }, // __
        { id: '33333333-3333-3333-3333-333333333333', email: 'short@test.com', username: 'a', createdAt: '2026-01-03' }, // < 3 chars
      ];

      const result = simulateBackfill(records);
      for (const r of records) {
        const username = result.get(r.id)!;
        assert.notStrictEqual(username, r.username);
        assert.strictEqual(validateUsername(username).isValid, true);
      }
    });

    it('remediates reserved existing usernames safely', () => {
      const records: ProfileRecord[] = [
        { id: '11111111-1111-1111-1111-111111111111', email: 'admin@auth.credlock.internal', username: 'admin', createdAt: '2026-01-01' },
        { id: '22222222-2222-2222-2222-222222222222', email: 'root@company.com', username: 'root', createdAt: '2026-01-02' },
      ];

      const result = simulateBackfill(records);
      for (const r of records) {
        const username = result.get(r.id)!;
        assert.notStrictEqual(username, r.username);
        assert.strictEqual(validateUsername(username).isValid, true);
        assert.strictEqual(RESERVED_USERNAMES.has(username), false);
      }
    });

    it('resolves duplicate usernames deterministically in favor of earliest created profile', () => {
      const records: ProfileRecord[] = [
        { id: '11111111-1111-1111-1111-111111111111', email: 'first@auth.credlock.internal', username: 'agent_smith', createdAt: '2026-01-01' },
        { id: '22222222-2222-2222-2222-222222222222', email: 'second@auth.credlock.internal', username: 'AGENT_SMITH', createdAt: '2026-01-02' },
      ];

      const result = simulateBackfill(records);
      assert.strictEqual(result.get(records[0].id), 'agent_smith'); // Earliest preserved
      assert.notStrictEqual(result.get(records[1].id), 'agent_smith'); // Later remediated
      assert.strictEqual(validateUsername(result.get(records[1].id)!).isValid, true);
    });

    it('resolves surrogate collisions using deterministic counter loop', () => {
      // Simulate two records with identical first 12 hex characters in ID
      const records: ProfileRecord[] = [
        { id: 'abcdef01-2345-0000-0000-000000000001', email: null, username: null, createdAt: '2026-01-01' },
        { id: 'abcdef01-2345-9999-9999-999999999999', email: null, username: null, createdAt: '2026-01-02' },
      ];

      const result = simulateBackfill(records);
      const user1 = result.get(records[0].id)!;
      const user2 = result.get(records[1].id)!;

      assert.strictEqual(user1, 'op_abcdef012345');
      assert.strictEqual(user2, 'op_abcdef0123_1');
      assert.notStrictEqual(user1, user2);
      assert.strictEqual(validateUsername(user1).isValid, true);
      assert.strictEqual(validateUsername(user2).isValid, true);
    });
  });

  // ==========================================================================
  // 11. Registration Trigger Simulation: Conflict & Retry Handling
  // ==========================================================================
  describe('11. Registration Trigger Simulation (Real Unit Tests)', () => {
    interface MockProfile {
      id: string;
      username: string;
      email: string;
    }

    function simulateHandleNewUser(
      existingProfiles: MockProfile[],
      newUser: { id: string; email: string; metadata?: { username?: string } }
    ): { success: boolean; errorCode?: string; profile?: MockProfile } {
      const rawUser = newUser.metadata?.username;
      if (!rawUser || rawUser.trim() === '') {
        return { success: false, errorCode: '23514' }; // missing metadata
      }

      const normUser = rawUser.trim().toLowerCase();
      const userCheck = validateUsername(normUser);
      if (!userCheck.isValid) {
        return { success: false, errorCode: '23514' };
      }

      const expectedSynthetic = `${normUser}@auth.credlock.internal`;
      if (newUser.email.trim().toLowerCase() !== expectedSynthetic) {
        return { success: false, errorCode: '23514' }; // email mismatch
      }

      // Pre-check 1: Check username taken by another user (id <> NEW.id)
      const usernameOwner = existingProfiles.find(
        (p) => p.username.toLowerCase() === normUser && p.id !== newUser.id
      );
      if (usernameOwner) {
        return { success: false, errorCode: '23505' }; // username collision
      }

      // Pre-check 2: Check same-ID retry
      const sameIdProfile = existingProfiles.find((p) => p.id === newUser.id);
      if (sameIdProfile) {
        if (
          sameIdProfile.username.toLowerCase() === normUser &&
          sameIdProfile.email.toLowerCase() === expectedSynthetic
        ) {
          return { success: true, profile: sameIdProfile }; // Idempotent success
        } else {
          return { success: false, errorCode: '23514' }; // Identity alteration attempt rejected
        }
      }

      const created: MockProfile = {
        id: newUser.id,
        username: normUser,
        email: expectedSynthetic,
      };
      return { success: true, profile: created };
    }

    it('succeeds for valid registration with matching synthetic email', () => {
      const res = simulateHandleNewUser([], {
        id: 'usr-1',
        email: 'operative_alpha@auth.credlock.internal',
        metadata: { username: 'operative_alpha' },
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.profile?.username, 'operative_alpha');
    });

    it('rejects registration when username is already taken by another operative (23505)', () => {
      const existing: MockProfile[] = [
        { id: 'usr-owner', username: 'cipher_boss', email: 'cipher_boss@auth.credlock.internal' },
      ];

      const res = simulateHandleNewUser(existing, {
        id: 'usr-new-attacker',
        email: 'cipher_boss@auth.credlock.internal',
        metadata: { username: 'cipher_boss' },
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, '23505');
    });

    it('allows legitimate idempotent retry for the same user ID and identity', () => {
      const existing: MockProfile[] = [
        { id: 'usr-same-id', username: 'lead_operator', email: 'lead_operator@auth.credlock.internal' },
      ];

      const res = simulateHandleNewUser(existing, {
        id: 'usr-same-id',
        email: 'lead_operator@auth.credlock.internal',
        metadata: { username: 'lead_operator' },
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.profile?.username, 'lead_operator');
    });

    it('rejects attempt to alter existing identity during same-ID retry (23514)', () => {
      const existing: MockProfile[] = [
        { id: 'usr-same-id', username: 'original_user', email: 'original_user@auth.credlock.internal' },
      ];

      const res = simulateHandleNewUser(existing, {
        id: 'usr-same-id',
        email: 'altered_user@auth.credlock.internal',
        metadata: { username: 'altered_user' },
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, '23514');
    });
  });

  // ==========================================================================
  // 12. Profile Recovery RPC Simulation: Identity Immutability
  // ==========================================================================
  describe('12. Profile Recovery RPC Simulation (Real Unit Tests)', () => {
    interface MockProfile {
      id: string;
      username: string;
      email: string;
    }

    function simulateEnsureUserProfile(
      existingProfiles: MockProfile[],
      currentUserId: string,
      jwt: { email?: string; metadata?: { username?: string } }
    ): { success: boolean; errorCode?: string; profile?: MockProfile } {
      const rawUser = jwt.metadata?.username;
      if (!rawUser || rawUser.trim() === '') {
        return { success: false, errorCode: '23514' };
      }

      const normUser = rawUser.trim().toLowerCase();
      if (!validateUsername(normUser).isValid) {
        return { success: false, errorCode: '23514' };
      }

      const expectedSynthetic = `${normUser}@auth.credlock.internal`;
      if (!jwt.email || jwt.email.trim().toLowerCase() !== expectedSynthetic) {
        return { success: false, errorCode: '23514' };
      }

      // If profile already exists, verify identity match
      const existing = existingProfiles.find((p) => p.id === currentUserId);
      if (existing) {
        if (
          existing.username.toLowerCase() === normUser &&
          existing.email.toLowerCase() === expectedSynthetic
        ) {
          return { success: true, profile: existing };
        } else {
          return { success: false, errorCode: '42501' }; // Prohibited alteration via recovery
        }
      }

      // If missing profile, check username collision with other users
      const collision = existingProfiles.find(
        (p) => p.username.toLowerCase() === normUser && p.id !== currentUserId
      );
      if (collision) {
        return { success: false, errorCode: '23505' };
      }

      const recovered: MockProfile = {
        id: currentUserId,
        username: normUser,
        email: expectedSynthetic,
      };
      return { success: true, profile: recovered };
    }

    it('recovers missing profile using authenticated JWT identity', () => {
      const res = simulateEnsureUserProfile([], 'usr-missing-profile', {
        email: 'field_agent@auth.credlock.internal',
        metadata: { username: 'field_agent' },
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.profile?.username, 'field_agent');
    });

    it('returns existing matching profile without modifying identity', () => {
      const existing: MockProfile[] = [
        { id: 'usr-1', username: 'field_agent', email: 'field_agent@auth.credlock.internal' },
      ];

      const res = simulateEnsureUserProfile(existing, 'usr-1', {
        email: 'field_agent@auth.credlock.internal',
        metadata: { username: 'field_agent' },
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.profile?.username, 'field_agent');
    });

    it('fails safely with 42501 when existing profile identity does not match JWT', () => {
      const existing: MockProfile[] = [
        { id: 'usr-1', username: 'legitimate_user', email: 'legitimate_user@auth.credlock.internal' },
      ];

      const res = simulateEnsureUserProfile(existing, 'usr-1', {
        email: 'hijacked_user@auth.credlock.internal',
        metadata: { username: 'hijacked_user' },
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, '42501');
    });

    it('fails with 23505 if recovering a profile whose username was taken by another user', () => {
      const existing: MockProfile[] = [
        { id: 'usr-other', username: 'contested_handle', email: 'contested_handle@auth.credlock.internal' },
      ];

      const res = simulateEnsureUserProfile(existing, 'usr-new', {
        email: 'contested_handle@auth.credlock.internal',
        metadata: { username: 'contested_handle' },
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, '23505');
    });
  });
});
