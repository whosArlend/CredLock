-- ============================================================================
-- Migration: 003_username_auth.sql
-- Project: CredLock Security Intelligence Platform v2.0
-- Database: Supabase PostgreSQL
-- Description: Transition authentication identity to Username-Only model:
--              - Adds validated 'username' column to public.profiles.
--              - Comprehensive two-phase backfill: audits ALL rows (null & non-null),
--                preserves valid usernames, resolves duplicates, invalid formats, and
--                reserved keywords with strictly bounded, format-safe surrogates.
--              - Enforces case-insensitive uniqueness index.
--              - Enforces strict character, length, and reserved name constraints.
--              - Enforces strict synthetic identity mapping: <username>@auth.credlock.internal.
--              - Rejects mismatched username/email, missing metadata, and arbitrary domains.
--              - Tightens handle_new_user() with explicit pre-checks (zero exception swallowing).
--              - Hardens ensure_user_profile() recovery function with immutable identity protection.
--              - Implements defense-in-depth trigger protect_profile_privileged_fields() (SECURITY INVOKER).
--              - Removes obsolete email synchronization trigger.
--              - Preserves Phase 1.1 column-level permissions and RLS policies.
-- ============================================================================

BEGIN;

-- 1. Add username column if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Comprehensive Profile Backfill & Normalization
--    Audits ALL profile rows (both NULL and existing non-NULL values):
--    - Preserves existing valid, non-reserved, case-insensitively unique usernames.
--    - Remediates invalid formats, reserved names, duplicates, and NULL entries.
--    - Uses a strictly bounded, format-safe surrogate generation loop with collision resolution.
--    - Guarantees EVERY row satisfies final CHECK and UNIQUE constraints.
DO $$
DECLARE
    r RECORD;
    cand TEXT;
    base_hex TEXT;
    counter INT;
    is_cand_valid BOOLEAN;
BEGIN
    -- Temporary table to track claimed canonical usernames within migration transaction
    CREATE TEMP TABLE temp_assigned_usernames (
        profile_id UUID PRIMARY KEY,
        username TEXT NOT NULL
    ) ON COMMIT DROP;

    -- Phase A: First pass — Audit existing non-NULL usernames.
    -- Preserve existing usernames that are already 100% compliant, non-reserved, and unique.
    -- If duplicate usernames exist, the earliest created profile retains the original handle.
    FOR r IN 
        SELECT p.id, p.username, p.email 
        FROM public.profiles p
        ORDER BY p.created_at ASC, p.id ASC 
    LOOP
        cand := NULL;

        IF r.username IS NOT NULL THEN
            cand := LOWER(TRIM(r.username));
            IF length(cand) >= 3 AND length(cand) <= 24
               AND cand ~ '^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$'
               AND cand !~ '(__|--)'
               AND cand !~ '[@.]'
               AND cand NOT IN (
                   'admin', 'administrator', 'root', 'system', 'credlock',
                   'support', 'security', 'operator', 'operative', 'enclave',
                   'analyst', 'api', 'auth', 'guest', 'anonymous',
                   'moderator', 'superuser', 'master', 'test', 'null', 'undefined'
               )
               AND NOT EXISTS (SELECT 1 FROM temp_assigned_usernames WHERE username = cand)
            THEN
                INSERT INTO temp_assigned_usernames (profile_id, username) VALUES (r.id, cand);
                IF r.username IS DISTINCT FROM cand THEN
                    UPDATE public.profiles SET username = cand WHERE id = r.id;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Phase B: Second pass — Remediate all remaining rows
    -- (NULL usernames, invalid charsets/lengths, reserved handles, and duplicates).
    FOR r IN 
        SELECT p.id, p.username, p.email 
        FROM public.profiles p
        WHERE p.id NOT IN (SELECT profile_id FROM temp_assigned_usernames)
        ORDER BY p.created_at ASC, p.id ASC 
    LOOP
        cand := NULL;

        -- Step 1: Check if profile has a synthetic email whose local-part is valid and unclaimed
        IF r.email IS NOT NULL AND LOWER(r.email) LIKE '%@auth.credlock.internal' THEN
            cand := LOWER(TRIM(split_part(r.email, '@', 1)));
            IF length(cand) >= 3 AND length(cand) <= 24
               AND cand ~ '^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$'
               AND cand !~ '(__|--)'
               AND cand !~ '[@.]'
               AND cand NOT IN (
                   'admin', 'administrator', 'root', 'system', 'credlock',
                   'support', 'security', 'operator', 'operative', 'enclave',
                   'analyst', 'api', 'auth', 'guest', 'anonymous',
                   'moderator', 'superuser', 'master', 'test', 'null', 'undefined'
               )
               AND NOT EXISTS (SELECT 1 FROM temp_assigned_usernames WHERE username = cand)
            THEN
                -- Valid synthetic email handle adopted
                NULL;
            ELSE
                cand := NULL;
            END IF;
        END IF;

        -- Step 2: If still NULL, generate deterministic surrogate with collision resolution loop
        IF cand IS NULL THEN
            base_hex := replace(r.id::text, '-', '');
            cand := 'op_' || substr(base_hex, 1, 12);
            counter := 1;

            -- Bounded, format-safe collision resolution loop
            WHILE EXISTS (SELECT 1 FROM temp_assigned_usernames WHERE username = cand) LOOP
                -- Format: 'op_' (3) + 8 hex chars + '_' (1) + counter (up to 12 digits) <= 24 chars
                cand := 'op_' || substr(base_hex, 1, 8) || '_' || counter::text;
                counter := counter + 1;

                -- Overflow safeguard: if counter grew beyond 12 digits, hash deterministically
                IF length(cand) > 24 THEN
                    cand := 'op_' || substr(md5(base_hex || counter::text), 1, 18);
                END IF;
            END LOOP;

            -- Strict format assertion: candidate must strictly satisfy all username policies
            IF length(cand) < 3 OR length(cand) > 24
               OR cand !~ '^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$'
               OR cand ~ '(__|--)'
               OR cand ~ '[@.]'
               OR cand IN ('admin', 'administrator', 'root', 'system', 'credlock',
                           'support', 'security', 'operator', 'operative', 'enclave',
                           'analyst', 'api', 'auth', 'guest', 'anonymous',
                           'moderator', 'superuser', 'master', 'test', 'null', 'undefined')
            THEN
                RAISE EXCEPTION 'Generated surrogate username "%" violates format policy.', cand USING ERRCODE = '23514';
            END IF;
        END IF;

        -- Record candidate assignment and update row
        INSERT INTO temp_assigned_usernames (profile_id, username) VALUES (r.id, cand);
        UPDATE public.profiles
        SET username = cand
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
--    Strictly validates metadata username, enforces 1:1 match with synthetic email,
--    and performs explicit conflict checks distinguishing legitimate retries from username collisions.
--    NOTE: Contains ZERO broad exception handlers. Unhandled errors bubble up and abort transactionally.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_username TEXT;
    norm_username TEXT;
    expected_synthetic_email TEXT;
    resolved_display_name TEXT;
    existing_profile public.profiles;
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

    -- Pre-check 1: Check if this username is already claimed by another user (id <> NEW.id)
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE LOWER(username) = norm_username AND id <> NEW.id
    ) THEN
        RAISE EXCEPTION 'Operative username "%" is already taken.', norm_username USING ERRCODE = '23505';
    END IF;

    -- Pre-check 2: Check if a profile already exists for this exact user ID (idempotent retry)
    SELECT * INTO existing_profile FROM public.profiles WHERE id = NEW.id;
    IF FOUND THEN
        -- Verify that the existing profile's identity matches the registration request
        IF LOWER(existing_profile.username) = norm_username AND LOWER(existing_profile.email) = expected_synthetic_email THEN
            UPDATE public.profiles
            SET updated_at = TIMEZONE('utc'::TEXT, NOW())
            WHERE id = NEW.id;
            RETURN NEW;
        ELSE
            -- Reject attempt to alter an existing profile's immutable identity during retry
            RAISE EXCEPTION 'Existing profile identity mismatch for user %.', NEW.id USING ERRCODE = '23514';
        END IF;
    END IF;

    -- Insert new profile (any unique collision bubbles up directly and aborts auth.users transaction)
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
    );

    RETURN NEW;
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

-- 9. Update ensure_user_profile() recovery function
--    Hardened to enforce identity consistency and database-level immutability:
--    - Requires authenticated caller (auth.uid())
--    - If profile exists, verifies identity matches JWT; rejects mismatches safely.
--    - If profile is missing, creates it using validated username & synthetic email.
--    - Explicit ON CONFLICT (id) handles concurrent recovery without modifying username or email.
--    - Zero broad exception handling: username collisions fail directly with 23505.
--    - Executes as SECURITY DEFINER with safe search_path to insert missing profile.
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

    -- Extract and validate metadata for identity comparison and recovery
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

    -- Check if profile already exists for this authenticated user
    SELECT * INTO user_profile FROM public.profiles WHERE id = current_user_id;
    IF FOUND THEN
        -- Identity must match; recovery RPC cannot be used to modify identity
        IF LOWER(user_profile.username) = norm_username AND LOWER(user_profile.email) = expected_synthetic_email THEN
            RETURN user_profile;
        ELSE
            RAISE EXCEPTION 'Profile identity mismatch: existing identity cannot be altered via recovery.' USING ERRCODE = '42501';
        END IF;
    END IF;

    resolved_display_name := COALESCE(
        NULLIF(trim(auth.jwt()->'user_metadata'->>'display_name'), ''),
        norm_username
    );

    -- Missing profile recovery: insert safely using explicit ON CONFLICT (id)
    -- NEVER modifies username or email. Any username collision fails with 23505 without broad exception catching.
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
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    RETURNING * INTO user_profile;

    -- Verify that the resulting profile's immutable identity matches the JWT
    IF LOWER(user_profile.username) != norm_username OR LOWER(user_profile.email) != expected_synthetic_email THEN
        RAISE EXCEPTION 'Profile identity mismatch: existing identity cannot be altered via recovery.' USING ERRCODE = '42501';
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
REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM anon, public;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role, postgres;

COMMIT;
