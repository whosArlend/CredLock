-- ============================================================================
-- Migration: 002_auth_profiles.sql
-- Project: CredLock Security Intelligence Platform v2.0
-- Database: Supabase PostgreSQL
-- Description: Creates the public.profiles table linked to auth.users,
--              establishes secure automatic user profile creation trigger,
--              column-level permissions preventing privilege escalation,
--              field-level protection trigger, email synchronization trigger,
--              and strict Row Level Security (RLS) policies.
-- Security Hardening: Phase 1.1 OWASP Authentication & Authorization,
--                     Least Privilege, Column-Level Privilege Separation,
--                     Anti-Tampering Trigger Controls.
-- ============================================================================

BEGIN;

-- 1. Ensure UUID extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: public.profiles
-- Description: Public identity profile metadata referencing auth.users.id.
-- Strictly zero-knowledge: NO passwords, NO hashes, NO sensitive keys.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'analyst')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- ============================================================================
-- Trigger Function: Automatic Timestamp Updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Trigger Function: Automatic Profile Provisioning on User Signup
-- Security Hardening (Phase 1.1):
--  - Atomic failure handling: If profile creation encounters an unhandled fatal error,
--    it raises an exception so user creation does not leave an orphaned account.
--  - Idempotent on_conflict safety: Gracefully handles duplicate triggers or re-syncs.
--  - Sanitized error message: Never exposes internal SQL/database internals to clients.
--  - SECURITY DEFINER with explicit search_path = public to prevent hijacking.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NULLIF(split_part(NEW.email, '@', 1), ''),
            'Operative'
        ),
        'user',
        true,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = TIMEZONE('utc'::TEXT, NOW());

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        UPDATE public.profiles
        SET email = NEW.email,
            updated_at = TIMEZONE('utc'::TEXT, NOW())
        WHERE id = NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'User profile initialization failed during registration.' USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Trigger Function: Verified Email Synchronization
-- Ensures public.profiles.email is strictly synchronized whenever auth.users.email
-- changes through verified Supabase email update workflows. Users cannot mutate
-- profiles.email directly.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public.profiles
        SET email = NEW.email,
            updated_at = TIMEZONE('utc'::TEXT, NOW())
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_email_change();

-- ============================================================================
-- Trigger Function: Privileged Column Protection (Defense-in-Depth)
-- Enforces that 'role', 'is_active', 'email', and 'id' can NEVER be altered
-- by non-administrative users, even if column-level grants were somehow misconfigured.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (CURRENT_USER NOT IN ('service_role', 'postgres', 'supabase_admin')) THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Modifying profile role is prohibited' USING ERRCODE = '42501';
        END IF;
        IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            RAISE EXCEPTION 'Modifying profile active status is prohibited' USING ERRCODE = '42501';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'Modifying profile email directly is prohibited; use auth email workflow' USING ERRCODE = '42501';
        END IF;
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'Modifying profile id is prohibited' USING ERRCODE = '42501';
        END IF;
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            NEW.created_at = OLD.created_at;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trigger_protect_profile_privileged_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- ============================================================================
-- Recovery Function: Safe Idempotent Profile Self-Healing
-- Provides authenticated users with a secure way to initialize an orphaned profile
-- without privilege escalation.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    user_profile public.profiles;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;

    IF NOT FOUND THEN
        current_user_email := auth.jwt()->>'email';

        INSERT INTO public.profiles (
            id,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            current_user_id,
            current_user_email,
            COALESCE(auth.jwt()->'user_metadata'->>'display_name', split_part(current_user_email, '@', 1), 'Operative'),
            'user',
            true,
            TIMEZONE('utc'::TEXT, NOW()),
            TIMEZONE('utc'::TEXT, NOW())
        )
        ON CONFLICT (id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, public.profiles.email),
            updated_at = TIMEZONE('utc'::TEXT, NOW())
        RETURNING * INTO user_profile;
    END IF;

    RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Explicit SQL Privileges (Phase 1.1 Hardened Column-Level Permissions)
-- - Anon / public: NO access whatsoever.
-- - Authenticated:
--     * SELECT on public.profiles (guarded by RLS to own row).
--     * UPDATE ONLY on approved columns: display_name, avatar_url.
--     * NO UPDATE on role, is_active, email, id, created_at, updated_at.
--     * NO INSERT privilege (profiles are created by system trigger only).
--     * NO DELETE privilege.
-- - Service role & postgres: FULL administrative access.
-- ============================================================================

-- 1. Strip all default and previous privileges
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM anon, authenticated, public;

-- 2. Grant SELECT to authenticated
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- 3. Grant COLUMN-LEVEL UPDATE only on non-privileged attributes
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;

-- 4. Grant EXECUTE on recovery function to authenticated
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- 5. Full administrative rights to service_role and postgres
GRANT ALL ON TABLE public.profiles TO service_role, postgres;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- Enforces strict user isolation: a user can NEVER access or mutate another
-- user's profile row.
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;

-- Policy 1: Authenticated users can only read their own profile row
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Authenticated users can only update their own profile row
-- Note: Combined with column-level grant above, only display_name and avatar_url can be updated
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Service role (backend API workers) has full access
CREATE POLICY "Service role full access on profiles"
    ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;
