-- ============================================================================
-- Migration: 002_auth_profiles.sql
-- Project: CredLock Security Intelligence Platform v2.0
-- Database: Supabase PostgreSQL
-- Description: Creates the public.profiles table linked to auth.users,
--              establishes secure automatic user profile creation trigger,
--              explicit SQL role privileges, and Row Level Security (RLS) policies.
-- Security Standards: OWASP Authentication & Authorization, Defense-in-Depth,
--                     Least Privilege, Zero-Knowledge Credential Isolation.
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
-- Triggers for Automatic Timestamp Updates
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function & Trigger: Automatic Profile Provisioning on User Signup
-- Security Considerations:
--  - SECURITY DEFINER: Runs with database owner privileges to write to public.profiles.
--  - SET search_path = public: Prevents malicious search_path injection/hijacking.
--  - EXCEPTION block: Catches unexpected errors and logs warnings, ensuring
--    the auth transaction does not produce unhandled panics or privilege leaks.
--  - ON CONFLICT DO NOTHING: Provides idempotent safety against duplicate signals.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
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
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = TIMEZONE('utc'::TEXT, NOW());

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user failed for auth.user id %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Explicit SQL Role Privileges (Defense-in-Depth)
-- Anon users cannot query profiles. Authenticated users can only interact
-- through RLS filters. Service role and postgres have administrative access.
-- ============================================================================
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, public;

-- Grant authenticated users access to read and update
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Grant service_role full administrative permissions
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
