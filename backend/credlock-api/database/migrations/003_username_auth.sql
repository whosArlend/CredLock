-- ============================================================================
-- Migration: 003_username_auth.sql
-- Project: CredLock Security Intelligence Platform v2.0
-- Database: Supabase PostgreSQL
-- Description: Transition authentication identity to Username-Only model:
--              - Adds validated 'username' column to public.profiles.
--              - Safe deterministic backfill handling legacy/synthetic identities.
--              - Enforces case-insensitive uniqueness index.
--              - Enforces strict character, length, and reserved name constraints.
--              - Enforces strict synthetic identity mapping: <username>@auth.credlock.internal.
--              - Rejects mismatched username/email, missing metadata, and arbitrary domains.
--              - Hardens ensure_user_profile() recovery function with identical validation.
--              - Implements defense-in-depth trigger protect_profile_privileged_fields() (SECURITY INVOKER).
--              - Removes obsolete email synchronization trigger.
--              - Preserves Phase 1.1 column-level permissions and RLS policies.
-- ============================================================================

BEGIN;

-- 1. Add username column if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Backfill existing profile rows safely (if any exist)
--    Guarantees every row receives a username satisfying:
--    length [3..24], valid charset, non-reserved, and unique.
DO $$
DECLARE
    r RECORD;
    candidate TEXT;
BEGIN
    FOR r IN SELECT id, email, username FROM public.profiles WHERE username IS NULL LOOP
        candidate := NULL;
        
        -- If email is in our internal synthetic domain, test its local part
        IF r.email IS NOT NULL AND LOWER(r.email) LIKE '%@auth.credlock.internal' THEN
            candidate := LOWER(split_part(r.email, '@', 1));
            
            -- Validate format and reserved words
            IF length(candidate) < 3 OR length(candidate) > 24
               OR candidate !~ '^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$'
               OR candidate ~ '(__|--)'
               OR candidate ~ '[@.]'
               OR candidate IN ('admin', 'administrator', 'root', 'system', 'credlock',
                                'support', 'security', 'operator', 'operative', 'enclave',
                                'analyst', 'api', 'auth', 'guest', 'anonymous',
                                'moderator', 'superuser', 'master', 'test', 'null', 'undefined')
               OR EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = candidate AND id <> r.id)
            THEN
                candidate := NULL;
            END IF;
        END IF;

        -- If candidate is invalid, null, reserved, or collides, assign guaranteed-safe unique surrogate
        -- 'op_' (3 chars) + 12 hex digits = 15 chars (valid length, valid charset, non-reserved, unique)
        IF candidate IS NULL THEN
            candidate := 'op_' || substr(replace(r.id::text, '-', ''), 1, 12);
        END IF;

        UPDATE public.profiles
        SET username = candidate
        WHERE id = r.id;
    END LOOP;
END $$;

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

-- 7. Update handle_new_user() trigger function
--    Strictly validates metadata username and enforces 1:1 match with synthetic email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_username TEXT;
    norm_username TEXT;
    expected_synthetic_email TEXT;
    resolved_display_name TEXT;
BEGIN
    -- Username metadata is strictly required for username-only authentication
    raw_username := NEW.raw_user_meta_data->>'username';
    IF raw_username IS NULL OR trim(raw_username) = '' THEN
        RAISE EXCEPTION 'Operative registration requires username in user metadata.' USING ERRCODE = '23514';
    END IF;

    -- Consistent lowercase and trimmed normalization
    norm_username := LOWER(trim(raw_username));

    -- Length validation: 3 to 24 characters
    IF length(norm_username) < 3 OR length(norm_username) > 24 THEN
        RAISE EXCEPTION 'Username must be between 3 and 24 characters.' USING ERRCODE = '23514';
    END IF;

    -- Character and boundary validation
    IF norm_username !~ '^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$' THEN
        RAISE EXCEPTION 'Username contains invalid characters or invalid boundary characters.' USING ERRCODE = '23514';
    END IF;

    -- Consecutive separator prohibition
    IF norm_username ~ '(__|--)' THEN
        RAISE EXCEPTION 'Username cannot contain consecutive underscores or hyphens.' USING ERRCODE = '23514';
    END IF;

    -- Prohibit email delimiters (@ and .)
    IF norm_username ~ '[@.]' THEN
        RAISE EXCEPTION 'Username cannot contain email characters.' USING ERRCODE = '23514';
    END IF;

    -- Enforce database-level check against reserved usernames
    IF norm_username IN (
        'admin', 'administrator', 'root', 'system', 'credlock',
        'support', 'security', 'operator', 'operative', 'enclave',
        'analyst', 'api', 'auth', 'guest', 'anonymous',
        'moderator', 'superuser', 'master', 'test', 'null', 'undefined'
    ) THEN
        RAISE EXCEPTION 'Operative username "%" is reserved by system policy.', norm_username USING ERRCODE = '23514';
    END IF;

    -- Strict synthetic identity consistency check:
    -- Synthetic email MUST be exactly <norm_username>@auth.credlock.internal
    expected_synthetic_email := norm_username || '@auth.credlock.internal';

    IF NEW.email IS NULL OR LOWER(trim(NEW.email)) != expected_synthetic_email THEN
        RAISE EXCEPTION 'Synthetic identity mismatch: email must be exactly <username>@auth.credlock.internal.' USING ERRCODE = '23514';
    END IF;

    resolved_display_name := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
        norm_username
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
        NEW.id,
        norm_username,
        expected_synthetic_email,
        resolved_display_name,
        'user',
        true,
        TIMEZONE('utc'::TEXT, NOW()),
        TIMEZONE('utc'::TEXT, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
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
            RAISE EXCEPTION 'Operative username "%" is already taken.', norm_username USING ERRCODE = '23505';
        END IF;
    WHEN check_violation THEN
        RAISE;
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Update protect_profile_privileged_fields() trigger function
--    Strictly enforces immutability of: username, role, is_active, email, id, created_at.
--    Authoritative protection is provided by PostgreSQL Column ACLs:
--      GRANT UPDATE (display_name, avatar_url) TO authenticated;
--    This trigger acts as a defense-in-depth barrier if table-wide UPDATE is ever granted.
--    NOTE: Omits SECURITY DEFINER (runs as SECURITY INVOKER) so that CURRENT_USER evaluates
--    to the invoking role ('authenticated', 'service_role', 'postgres') rather than function owner.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    jwt_role := COALESCE(current_setting('request.jwt.claim.role', true), '');

    -- Allow administrative updates:
    -- Direct Postgres superuser or service_role in JWT / database role
    IF CURRENT_USER IN ('service_role', 'postgres', 'supabase_admin') AND jwt_role IN ('service_role', 'supabase_admin', '') THEN
        RETURN NEW;
    END IF;

    -- For ordinary authenticated / anon users or any non-administrative context:
    IF NEW.username IS DISTINCT FROM OLD.username THEN
        RAISE EXCEPTION 'Modifying profile username is prohibited' USING ERRCODE = '42501';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Modifying profile role is prohibited' USING ERRCODE = '42501';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        RAISE EXCEPTION 'Modifying profile active status is prohibited' USING ERRCODE = '42501';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Modifying profile email is prohibited' USING ERRCODE = '42501';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Modifying profile id is prohibited' USING ERRCODE = '42501';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        NEW.created_at = OLD.created_at;
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
--    Hardened to enforce the exact same identity consistency rules as handle_new_user():
--    - Requires authenticated caller (auth.uid())
--    - Requires valid username in JWT metadata
--    - Normalizes username (lowercase, trim)
--    - Enforces format (3-24 chars, valid charset, no consecutive __ or --)
--    - Enforces reserved username rejection
--    - Enforces exact match against synthetic email: <username>@auth.credlock.internal
--    - Executes as SECURITY DEFINER with safe search_path to insert missing profile
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles AS $$
DECLARE
    current_user_id UUID;
    jwt_email TEXT;
    raw_username TEXT;
    norm_username TEXT;
    expected_synthetic_email TEXT;
    resolved_display_name TEXT;
    user_profile public.profiles;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Return existing profile if already present
    SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;
    IF FOUND THEN
        RETURN user_profile;
    END IF;

    -- Extract and validate metadata for missing profile recovery
    raw_username := auth.jwt()->'user_metadata'->>'username';
    IF raw_username IS NULL OR trim(raw_username) = '' THEN
        RAISE EXCEPTION 'Operative recovery requires username in user metadata.' USING ERRCODE = '23514';
    END IF;

    norm_username := LOWER(trim(raw_username));

    -- Format validation
    IF length(norm_username) < 3 OR length(norm_username) > 24 THEN
        RAISE EXCEPTION 'Username must be between 3 and 24 characters.' USING ERRCODE = '23514';
    END IF;

    IF norm_username !~ '^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$' THEN
        RAISE EXCEPTION 'Username contains invalid characters or invalid boundary characters.' USING ERRCODE = '23514';
    END IF;

    IF norm_username ~ '(__|--)' THEN
        RAISE EXCEPTION 'Username cannot contain consecutive underscores or hyphens.' USING ERRCODE = '23514';
    END IF;

    IF norm_username ~ '[@.]' THEN
        RAISE EXCEPTION 'Username cannot contain email characters.' USING ERRCODE = '23514';
    END IF;

    -- Reserved keywords check
    IF norm_username IN (
        'admin', 'administrator', 'root', 'system', 'credlock',
        'support', 'security', 'operator', 'operative', 'enclave',
        'analyst', 'api', 'auth', 'guest', 'anonymous',
        'moderator', 'superuser', 'master', 'test', 'null', 'undefined'
    ) THEN
        RAISE EXCEPTION 'Operative username "%" is reserved by system policy.', norm_username USING ERRCODE = '23514';
    END IF;

    -- Identity mapping consistency: verify email matches <username>@auth.credlock.internal
    jwt_email := auth.jwt()->>'email';
    expected_synthetic_email := norm_username || '@auth.credlock.internal';

    IF jwt_email IS NULL OR LOWER(trim(jwt_email)) != expected_synthetic_email THEN
        RAISE EXCEPTION 'Synthetic identity mismatch: JWT email must be exactly <username>@auth.credlock.internal.' USING ERRCODE = '23514';
    END IF;

    resolved_display_name := COALESCE(
        NULLIF(trim(auth.jwt()->'user_metadata'->>'display_name'), ''),
        norm_username
    );

    BEGIN
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
            norm_username,
            expected_synthetic_email,
            resolved_display_name,
            'user',
            true,
            TIMEZONE('utc'::TEXT, NOW()),
            TIMEZONE('utc'::TEXT, NOW())
        )
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            updated_at = TIMEZONE('utc'::TEXT, NOW())
        RETURNING * INTO user_profile;

        RETURN user_profile;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Operative username "%" is already claimed by another operative.', norm_username USING ERRCODE = '23505';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Re-verify explicit column-level permissions (Phase 1.1 Least Privilege):
--     - Authenticated users can SELECT their own profile (guarded by RLS).
--     - Authenticated users can UPDATE ONLY display_name and avatar_url.
--     - Authenticated users CANNOT update username, role, is_active, email, id.
--     - Authenticated users CANNOT insert or delete profiles directly.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM anon, public;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role, postgres;

COMMIT;
