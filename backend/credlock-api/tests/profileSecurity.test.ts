import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load backend environment configuration
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('CredLock v2.0 — Phase 1.1 Security Hardening: Profile RLS & Column Privileges', () => {
  const migrationPath = path.resolve(__dirname, '../database/migrations/002_auth_profiles.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // ==========================================================================
  // 1. Column-Level Permission Security Verification
  // ==========================================================================
  describe('1. Column-Level Privilege Separation (Anti-Privilege Escalation)', () => {
    it('revokes all table-level privileges from anon, authenticated, and public roles', () => {
      expect(migrationSql).toMatch(/REVOKE ALL ON TABLE public\.profiles FROM anon, authenticated, public;/i);
    });

    it('strictly confines UPDATE privileges to approved non-privileged columns (display_name, avatar_url)', () => {
      // Must explicitly grant UPDATE on (display_name, avatar_url)
      const columnGrantRegex = /GRANT UPDATE \(([^)]+)\) ON TABLE public\.profiles TO authenticated;/i;
      const match = migrationSql.match(columnGrantRegex);
      expect(match).not.toBeNull();

      if (match) {
        const columns = match[1].split(',').map((c) => c.trim().toLowerCase());
        expect(columns).toContain('display_name');
        expect(columns).toContain('avatar_url');

        // MUST NOT contain privileged or immutable fields
        expect(columns).not.toContain('role');
        expect(columns).not.toContain('is_active');
        expect(columns).not.toContain('email');
        expect(columns).not.toContain('id');
        expect(columns).not.toContain('created_at');
        expect(columns).not.toContain('updated_at');
      }
    });

    it('does NOT grant table-wide UPDATE privilege to authenticated users', () => {
      // Strip SQL comments first to only inspect executable SQL statements
      const executableSql = migrationSql.replace(/--.*$/gm, '');

      // Check that a raw "GRANT UPDATE ON TABLE public.profiles TO authenticated;" does NOT exist
      const unsafeTableUpdateRegex = /GRANT\s+UPDATE\s+ON\s+TABLE\s+public\.profiles\s+TO\s+authenticated/i;
      expect(executableSql).not.toMatch(unsafeTableUpdateRegex);

      // Verify that every GRANT mentioning UPDATE and authenticated explicitly specifies column list
      const grantUpdateStatements = executableSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => /GRANT\s+UPDATE/i.test(s) && /authenticated/i.test(s));

      expect(grantUpdateStatements.length).toBeGreaterThan(0);
      for (const stmt of grantUpdateStatements) {
        expect(stmt).toMatch(/GRANT UPDATE \([^)]+\) ON/i);
      }
    });

    it('does NOT grant INSERT or DELETE privileges to authenticated users', () => {
      expect(migrationSql).not.toMatch(/GRANT\s+INSERT\s+ON\s+TABLE\s+public\.profiles\s+TO\s+authenticated/i);
      expect(migrationSql).not.toMatch(/GRANT\s+DELETE\s+ON\s+TABLE\s+public\.profiles\s+TO\s+authenticated/i);
      expect(migrationSql).not.toMatch(/GRANT\s+ALL\s+ON\s+TABLE\s+public\.profiles\s+TO\s+authenticated/i);
    });
  });

  // ==========================================================================
  // 2. Row Level Security (RLS) Policy Structure
  // ==========================================================================
  describe('2. Row Level Security (RLS) Verification', () => {
    it('explicitly enables Row Level Security on public.profiles', () => {
      expect(migrationSql).toMatch(/ALTER TABLE public\.profiles ENABLE ROW LEVEL SECURITY;/i);
    });

    it('enforces owner-only restriction on SELECT policy (auth.uid() = id)', () => {
      const selectPolicyRegex = /CREATE POLICY "Users can view own profile"\s+ON public\.profiles\s+FOR SELECT\s+TO authenticated\s+USING \(auth\.uid\(\) = id\);/i;
      expect(migrationSql).toMatch(selectPolicyRegex);
    });

    it('enforces owner-only restriction on UPDATE policy (auth.uid() = id)', () => {
      const updatePolicyRegex = /CREATE POLICY "Users can update own profile"\s+ON public\.profiles\s+FOR UPDATE\s+TO authenticated\s+USING \(auth\.uid\(\) = id\)\s+WITH CHECK \(auth\.uid\(\) = id\);/i;
      expect(migrationSql).toMatch(updatePolicyRegex);
    });

    it('does NOT declare permissive INSERT or DELETE policies for authenticated users', () => {
      // Authenticated users must not have direct INSERT/DELETE policies
      expect(migrationSql).not.toMatch(/CREATE POLICY "[^"]+"\s+ON public\.profiles\s+FOR INSERT\s+TO authenticated/i);
      expect(migrationSql).not.toMatch(/CREATE POLICY "[^"]+"\s+ON public\.profiles\s+FOR DELETE\s+TO authenticated/i);
    });

    it('restricts administrative access to service_role and postgres', () => {
      expect(migrationSql).toMatch(/CREATE POLICY "Service role full access on profiles"\s+ON public\.profiles\s+FOR ALL\s+TO service_role/i);
      expect(migrationSql).toMatch(/GRANT ALL ON TABLE public\.profiles TO service_role, postgres;/i);
    });
  });

  // ==========================================================================
  // 3. Trigger Function Security & Reliability
  // ==========================================================================
  describe('3. Trigger Function & Anti-Tampering Defenses', () => {
    it('implements handle_new_user() with SECURITY DEFINER and explicit search_path', () => {
      expect(migrationSql).toMatch(/CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)/i);
      expect(migrationSql).toMatch(/SECURITY DEFINER/i);
      expect(migrationSql).toMatch(/SET search_path = public/i);
    });

    it('does NOT swallow fatal profile creation exceptions silently', () => {
      // Must not catch all exceptions and return NEW without raising error
      expect(migrationSql).not.toMatch(/WHEN OTHERS THEN\s+RAISE WARNING[^;]+;\s+RETURN NEW;/i);
      // Must raise exception on unhandled errors
      expect(migrationSql).toMatch(/WHEN OTHERS THEN\s+RAISE EXCEPTION/i);
    });

    it('implements defense-in-depth trigger protect_profile_privileged_fields()', () => {
      expect(migrationSql).toMatch(/CREATE OR REPLACE FUNCTION public\.protect_profile_privileged_fields\(\)/i);
      expect(migrationSql).toMatch(/NEW\.role IS DISTINCT FROM OLD\.role/i);
      expect(migrationSql).toMatch(/NEW\.is_active IS DISTINCT FROM OLD\.is_active/i);
      expect(migrationSql).toMatch(/NEW\.email IS DISTINCT FROM OLD\.email/i);
      expect(migrationSql).toMatch(/NEW\.id IS DISTINCT FROM OLD\.id/i);
      expect(migrationSql).toMatch(/CREATE TRIGGER trigger_protect_profile_privileged_fields/i);
    });

    it('implements email synchronization trigger on auth.users', () => {
      expect(migrationSql).toMatch(/CREATE OR REPLACE FUNCTION public\.handle_user_email_change\(\)/i);
      expect(migrationSql).toMatch(/CREATE TRIGGER on_auth_user_email_updated\s+AFTER UPDATE OF email ON auth\.users/i);
    });

    it('provides secure idempotent self-healing function ensure_user_profile()', () => {
      expect(migrationSql).toMatch(/CREATE OR REPLACE FUNCTION public\.ensure_user_profile\(\)/i);
      expect(migrationSql).toMatch(/current_user_id := auth\.uid\(\);/i);
      expect(migrationSql).toMatch(/'user',\s+true,/i); // Always hardcodes role='user', is_active=true
      expect(migrationSql).toMatch(/GRANT EXECUTE ON FUNCTION public\.ensure_user_profile\(\) TO authenticated;/i);
    });
  });

  // ==========================================================================
  // 4. Live Supabase Connection & Schema Cache State Verification
  // ==========================================================================
  describe('4. Supabase PostgreSQL Live Environment Verification', () => {
    it('verifies connection to configured Supabase instance and checks schema cache status', async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SECRET_KEY;

      expect(url).toBeDefined();
      expect(key).toBeDefined();

      if (!url || !key) return;

      const client = createClient(url, key, {
        auth: { persistSession: false },
      });

      // Verify general database liveness on breaches table
      const { data: breachData, error: breachError } = await client
        .from('breaches')
        .select('id')
        .limit(1);

      expect(breachError).toBeNull();
      expect(Array.isArray(breachData)).toBe(true);

      // Verify status of profiles table on the live Supabase instance
      const { error: profileError } = await client
        .from('profiles')
        .select('id')
        .limit(1);

      // Document actual live status:
      // If table exists: profileError is null
      // If migration has not yet been applied in Supabase dashboard: code is PGRST205
      if (profileError) {
        expect(['PGRST205', '42P01']).toContain(profileError.code);
      } else {
        expect(profileError).toBeNull();
      }
    });
  });

  // ==========================================================================
  // 5. CredLock v2.0 Phase 2.1 — Username Authentication Migration (003)
  // ==========================================================================
  describe('5. Migration 003_username_auth.sql Verification', () => {
    const migration003Path = path.resolve(__dirname, '../database/migrations/003_username_auth.sql');
    const migration003Sql = fs.readFileSync(migration003Path, 'utf8');

    it('adds username column with NOT NULL and format validation', () => {
      expect(migration003Sql).toMatch(/ALTER TABLE public\.profiles ADD COLUMN IF NOT EXISTS username TEXT;/i);
      expect(migration003Sql).toMatch(/ALTER TABLE public\.profiles ALTER COLUMN username SET NOT NULL;/i);
      expect(migration003Sql).toMatch(/CONSTRAINT chk_profiles_username_format CHECK/i);
      expect(migration003Sql).toMatch(/length\(username\) >= 3 AND length\(username\) <= 24/i);
      expect(migration003Sql).toMatch(/username ~ '\^\[a-zA-Z0-9\]\[a-zA-Z0-9_-\]\{1,22\}\[a-zA-Z0-9\]\$'/i);
    });

    it('enforces case-insensitive lowercase uniqueness index', () => {
      expect(migration003Sql).toMatch(/CREATE UNIQUE INDEX idx_profiles_username_lower ON public\.profiles \(LOWER\(username\)\);/i);
    });

    it('enforces database-level username immutability in protect_profile_privileged_fields()', () => {
      expect(migration003Sql).toMatch(/NEW\.username IS DISTINCT FROM OLD\.username/i);
      expect(migration003Sql).toMatch(/Modifying profile username is prohibited/i);
    });

    it('extracts username from user metadata in handle_new_user()', () => {
      expect(migration003Sql).toMatch(/raw_username := NEW\.raw_user_meta_data->>'username';/i);
      expect(migration003Sql).toMatch(/INSERT INTO public\.profiles/i);
    });

    it('drops obsolete email synchronization trigger on auth.users', () => {
      expect(migration003Sql).toMatch(/DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth\.users;/i);
      expect(migration003Sql).toMatch(/DROP FUNCTION IF EXISTS public\.handle_user_email_change\(\);/i);
    });

    it('enforces database-level reserved username list in CHECK constraint (Finding 1)', () => {
      const reservedList = [
        'admin', 'administrator', 'root', 'system', 'credlock',
        'support', 'security', 'operator', 'operative', 'enclave',
        'analyst', 'api', 'auth', 'guest', 'anonymous',
        'moderator', 'superuser', 'master', 'test', 'null', 'undefined',
      ];

      // Verify constraint definition checks LOWER(username) NOT IN (...)
      expect(migration003Sql).toMatch(/LOWER\(username\)\s+NOT\s+IN/i);

      for (const word of reservedList) {
        const pattern = new RegExp(`'${word}'`, 'i');
        expect(migration003Sql).toMatch(pattern);
      }
    });

    it('enforces database-level reserved username check inside handle_new_user() (Finding 1)', () => {
      expect(migration003Sql).toMatch(/IF LOWER\(resolved_username\) IN \(/i);
      expect(migration003Sql).toMatch(/RAISE EXCEPTION 'Operative username "%" is reserved by system policy\.'/i);
      expect(migration003Sql).toMatch(/USING ERRCODE = '23514'/i);
    });

    it('handles unique_violation safely by failing on username collision to prevent orphaned auth records (Finding 2)', () => {
      // Must check if user ID already exists (idempotent profile recovery)
      expect(migration003Sql).toMatch(/IF EXISTS \(SELECT 1 FROM public\.profiles WHERE id = NEW\.id\) THEN/i);
      // For username uniqueness collision, MUST re-raise 23505 exception to abort auth.users transaction
      expect(migration003Sql).toMatch(/RAISE EXCEPTION 'Operative username "%" is already taken\.', resolved_username USING ERRCODE = '23505';/i);
    });

    it('omits SECURITY DEFINER from protect_profile_privileged_fields() so CURRENT_USER evaluates to caller (Finding 3)', () => {
      // Find the protect_profile_privileged_fields function definition in migration 003
      const fnMatch = migration003Sql.match(/CREATE OR REPLACE FUNCTION public\.protect_profile_privileged_fields\(\)[\s\S]+?\$\$ LANGUAGE plpgsql([^;]+);/i);
      expect(fnMatch).not.toBeNull();
      if (fnMatch) {
        const functionTrailer = fnMatch[1];
        // Must NOT contain SECURITY DEFINER
        expect(functionTrailer).not.toMatch(/SECURITY DEFINER/i);
        // Must maintain secure search_path
        expect(functionTrailer).toMatch(/SET search_path = public/i);
      }
    });

    it('re-enforces least privilege column grants without username update permissions', () => {
      const grantRegex = /GRANT UPDATE \(([^)]+)\) ON TABLE public\.profiles TO authenticated;/i;
      const match = migration003Sql.match(grantRegex);
      expect(match).not.toBeNull();
      if (match) {
        const columns = match[1].split(',').map((c) => c.trim().toLowerCase());
        expect(columns).toContain('display_name');
        expect(columns).toContain('avatar_url');
        expect(columns).not.toContain('username');
        expect(columns).not.toContain('role');
        expect(columns).not.toContain('is_active');
      }
    });
  });
});
