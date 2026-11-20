-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Project: CredLock Security Intelligence API
-- Database: Supabase PostgreSQL
-- Description: Creates core tables (breaches, recommendations, articles),
--              indexes, updated_at trigger, explicit SQL privileges, and
--              Row Level Security (RLS) policies.
-- Safe Execution: Does NOT touch Sales-API tables (categories, products, customers, transactions).
-- Idempotency: Uses IF NOT EXISTS, DROP IF EXISTS, and wraps in a transaction.
-- ============================================================================

BEGIN;

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Trigger Function for Automatic Timestamp Updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Table: breaches
-- Description: Historical and verified cybersecurity breach intelligence.
-- ============================================================================
CREATE TABLE IF NOT EXISTS breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    slug TEXT NOT NULL UNIQUE CHECK (length(trim(slug)) > 0),
    domain TEXT,
    organization TEXT,
    breach_date DATE,
    added_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pwn_count BIGINT CHECK (pwn_count >= 0),
    description TEXT NOT NULL CHECK (length(trim(description)) > 0),
    data_classes TEXT[] NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    source_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================================
-- Table: recommendations
-- Description: Curated security advice, hygiene best practices, and emergency playbooks.
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    slug TEXT NOT NULL UNIQUE CHECK (length(trim(slug)) > 0),
    category TEXT NOT NULL CHECK (category IN ('password', 'auth', 'device', 'network', 'incident_response')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    summary TEXT NOT NULL CHECK (length(trim(summary)) > 0),
    action_steps JSONB NOT NULL DEFAULT '[]'::JSONB,
    target_audience TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================================
-- Table: articles
-- Description: Educational cybersecurity guides, technical explainers, and analyses.
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    slug TEXT NOT NULL UNIQUE CHECK (length(trim(slug)) > 0),
    category TEXT NOT NULL CHECK (category IN ('guide', 'analysis', 'news', 'explainer')),
    summary TEXT NOT NULL CHECK (length(trim(summary)) > 0),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    author_name TEXT NOT NULL CHECK (length(trim(author_name)) > 0),
    read_time_minutes INTEGER NOT NULL CHECK (read_time_minutes > 0),
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================================================
-- Indexes for Performance & Query Optimization
-- ============================================================================

-- breaches indexes
CREATE INDEX IF NOT EXISTS idx_breaches_slug ON breaches (slug);
CREATE INDEX IF NOT EXISTS idx_breaches_published_verified ON breaches (is_published, is_verified);
CREATE INDEX IF NOT EXISTS idx_breaches_severity ON breaches (severity);
CREATE INDEX IF NOT EXISTS idx_breaches_breach_date ON breaches (breach_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_breaches_domain ON breaches (domain);

-- recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_slug ON recommendations (slug);
CREATE INDEX IF NOT EXISTS idx_recommendations_published_priority ON recommendations (is_published, priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations (category);

-- articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (is_published);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC NULLS LAST);

-- ============================================================================
-- Triggers for Automatic Updated At
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_breaches_updated_at ON breaches;
CREATE TRIGGER trigger_breaches_updated_at
    BEFORE UPDATE ON breaches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_recommendations_updated_at ON recommendations;
CREATE TRIGGER trigger_recommendations_updated_at
    BEFORE UPDATE ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_articles_updated_at ON articles;
CREATE TRIGGER trigger_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Explicit SQL Privileges (Defense-in-Depth)
-- Separate control from RLS: public cannot perform INSERT/UPDATE/DELETE at
-- the SQL privilege layer regardless of RLS state.
-- ============================================================================

-- Revoke all privileges from public/untrusted roles first
REVOKE ALL ON TABLE breaches, recommendations, articles FROM anon, authenticated, public;

-- Grant SELECT only to anon and authenticated
GRANT SELECT ON TABLE breaches, recommendations, articles TO anon, authenticated;

-- Grant full administrative permissions to service_role and postgres
GRANT ALL ON TABLE breaches, recommendations, articles TO service_role, postgres;

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- ============================================================================

-- Enable RLS on all CredLock tables
ALTER TABLE breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing CredLock policies if re-running migration
DROP POLICY IF EXISTS "Public read-only verified breaches" ON breaches;
DROP POLICY IF EXISTS "Public read-only published recommendations" ON recommendations;
DROP POLICY IF EXISTS "Public read-only published articles" ON articles;

-- Policy 1: breaches - Public can only SELECT records that are BOTH published AND verified
CREATE POLICY "Public read-only verified breaches"
    ON breaches
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true AND is_verified = true);

-- Policy 2: recommendations - Public can only SELECT published recommendations
CREATE POLICY "Public read-only published recommendations"
    ON recommendations
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- Policy 3: articles - Public can only SELECT published articles
CREATE POLICY "Public read-only published articles"
    ON articles
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

COMMIT;
