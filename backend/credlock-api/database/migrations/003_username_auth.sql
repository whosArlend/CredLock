-- ============================================================================
-- Migration: 003_username_auth.sql
-- Project: CredLock Security Intelligence Platform v2.0
-- Database: Supabase PostgreSQL
-- Description: Transition authentication identity to Username-Only model:
--              - Adds validated 'username' column to public.profiles.
--              - Enforces case-insensitive uniqueness index.
--              - Enforces strict character and length constraints.
--              - Implements database-level username immutability.
--              - Updates handle_new_user() to populate username from user metadata.
--              - Updates ensure_user_profile() self-healing function.
--              - Removes obsolete email synchronization trigger.
--              - Preserves Phase 1.1 column-level permissions and RLS policies.
-- ============================================================================

BEGIN;

-- 1. Add username column if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Backfill existing profile rows safely (if any exist)
UPDATE public.profiles
SET username = COALESCE(
    NULLIF(split_part(email, '@', 1), ''),
    'user_' || substr(id::text, 1, 8)
)
WHERE username IS NULL;

-- 3. Enforce NOT NULL constraint on username
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

-- 4. Enforce strict username format constraint:
--    - Length between 3 and 24 characters
--    - Allowed: ASCII letters, digits, underscores, hyphens
--    - Must begin and end with alphanumeric character
--    - No consecutive underscores (__) or consecutive hyphens (--)
--    - No '@' or '.' characters
--    - Excludes reserved administrative/system keywords (case-insensitive)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_username_format CHECK (
    length(username) >= 3 AND length(username) <= 24 AND
    username ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,22}[a-zA-Z0-9]$' AND
    username !~ '(__|--)' AND
    username !~ '[@.]' AND
    LOWER(username) NOT IN (
        'admin', 'administrator', 'root', 'system', 'credlock',
        'support', 'security', 'operator', 'operative', 'enclave',
        'analyst', 'api', 'auth', 'guest', 'anonymous',
        'moderator', 'superuser', 'master', 'test', 'null', 'undefined'
    )
);

-- 5. Case-insensitive unique index
DROP INDEX IF EXISTS idx_profiles_username_lower;
CREATE UNIQUE INDEX idx_profiles_username_lower ON public.profiles (LOWER(username));

-- 6. Remove obsolete email synchronization trigger and function
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_email_change();

-- 7. Update handle_new_user() trigger function to extract username from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_username TEXT;
    resolved_username TEXT;
    resolved_display_name TEXT;
BEGIN
    -- Extract username from metadata passed during supabase.auth.signUp()
    raw_username := NEW.raw_user_meta_data->>'username';

    -- Fallback to local part of synthetic email if metadata is omitted
    IF raw_username IS NULL OR trim(raw_username) = '' THEN
        raw_username := split_part(NEW.email, '@', 1);
    END IF;

    resolved_username := trim(raw_username);
    resolved_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        resolved_username,
        'Operative'
    );

    -- Enforce database-level check against reserved usernames
    IF LOWER(resolved_username) IN (
        'admin', 'administrator', 'root', 'system', 'credlock',
        'support', 'security', 'operator', 'operative', 'enclave',
        'analyst', 'api', 'auth', 'guest', 'anonymous',
        'moderator', 'superuser', 'master', 'test', 'null', 'undefined'
    ) THEN
        RAISE EXCEPTION 'Operative username "%" is reserved by system policy.' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.profiles (
        id,
        username,
        email,
        display_name,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        resolved_username,
        NEW.email,
        resolved_display_name,
        'user',
        true,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        username = COALESCE(public.profiles.username, EXCLUDED.username),
        email = EXCLUDED.email,
        updated_at = TIMEZONE('utc'::TEXT, NOW());

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If profile already exists by id (idempotent retry/self-healing), update timestamp and succeed
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
            UPDATE public.profiles
            SET updated_at = TIMEZONE('utc'::TEXT, NOW())
            WHERE id = NEW.id;
            RETURN NEW;
        ELSE
            -- The uniqueness violation is on the username (idx_profiles_username_lower).
            -- Fail transactionally so Supabase Auth rolls back auth.users insertion.
            RAISE EXCEPTION 'Operative username "%" is already taken.', resolved_username USING ERRCODE = '23505';
        END IF;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'User profile initialization failed during registration: %', SQLERRM USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Update protect_profile_privileged_fields() trigger function
--    Strictly enforces immutability of: username, role, is_active, id, created_at.
--    NOTE: Omits SECURITY DEFINER so that CURRENT_USER evaluates to the invoking role
--    (e.g., 'authenticated') rather than the function owner ('postgres'/'supabase_admin').
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        CURRENT_USER NOT IN ('service_role', 'postgres', 'supabase_admin')
        OR COALESCE(current_setting('request.jwt.claim.role', true), '') NOT IN ('service_role', 'supabase_admin', '')
    ) THEN
        IF (CURRENT_USER IN ('service_role', 'postgres', 'supabase_admin') AND COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role') THEN
            RETURN NEW;
        END IF;

        IF NEW.username IS DISTINCT FROM OLD.username THEN
            RAISE EXCEPTION 'Modifying profile username is prohibited' USING ERRCODE = '42501';
        END IF;
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Modifying profile role is prohibited' USING ERRCODE = '42501';
        END IF;
        IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            RAISE EXCEPTION 'Modifying profile active status is prohibited' USING ERRCODE = '42501';
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
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trigger_protect_profile_privileged_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 9. Update ensure_user_profile() recovery function to populate username
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    extracted_username TEXT;
    user_profile public.profiles;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;

    IF NOT FOUND THEN
        current_user_email := auth.jwt()->>'email';
        extracted_username := COALESCE(
            auth.jwt()->'user_metadata'->>'username',
            split_part(current_user_email, '@', 1),
            'user_' || substr(current_user_id::text, 1, 8)
        );

        INSERT INTO public.profiles (
            id,
            username,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            current_user_id,
            extracted_username,
            current_user_email,
            COALESCE(auth.jwt()->'user_metadata'->>'display_name', extracted_username, 'Operative'),
            'user',
            true,
            TIMEZONE('utc'::TEXT, NOW()),
            TIMEZONE('utc'::TEXT, NOW())
        )
        ON CONFLICT (id) DO UPDATE SET
            username = COALESCE(public.profiles.username, EXCLUDED.username),
            updated_at = TIMEZONE('utc'::TEXT, NOW())
        RETURNING * INTO user_profile;
    END IF;

    RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Re-verify explicit column-level permissions (Phase 1.1 Least Privilege):
--     - Authenticated users can SELECT their own profile (guarded by RLS).
--     - Authenticated users can UPDATE ONLY display_name and avatar_url.
--     - Authenticated users CANNOT update username, role, is_active, email, id.
--     - Authenticated users CANNOT insert or delete profiles directly.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, public;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role, postgres;

COMMIT;
