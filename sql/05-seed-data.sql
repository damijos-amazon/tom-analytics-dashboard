-- TOM Analytics Dashboard - Seed Data (Optional)
-- This script provides sample data for testing and development

-- NOTE: This is for development/testing only
-- In production, the first user should be created through the authentication flow
-- and manually promoted to super_admin via direct database access

-- ============================================================================
-- SAMPLE SSO CONFIGURATIONS (disabled by default)
-- ============================================================================

-- Microsoft Azure AD configuration template
INSERT INTO public.sso_config (provider, config, enabled)
VALUES (
    'azure',
    '{
        "clientId": "YOUR_AZURE_CLIENT_ID",
        "tenantId": "YOUR_AZURE_TENANT_ID",
        "redirectUri": "YOUR_REDIRECT_URI"
    }'::JSONB,
    false
)
ON CONFLICT (provider) DO NOTHING;

-- Google OAuth configuration template
INSERT INTO public.sso_config (provider, config, enabled)
VALUES (
    'google',
    '{
        "clientId": "YOUR_GOOGLE_CLIENT_ID",
        "redirectUri": "YOUR_REDIRECT_URI"
    }'::JSONB,
    false
)
ON CONFLICT (provider) DO NOTHING;

-- Okta configuration template
INSERT INTO public.sso_config (provider, config, enabled)
VALUES (
    'okta',
    '{
        "domain": "YOUR_OKTA_DOMAIN",
        "clientId": "YOUR_OKTA_CLIENT_ID",
        "redirectUri": "YOUR_REDIRECT_URI"
    }'::JSONB,
    false
)
ON CONFLICT (provider) DO NOTHING;

-- ============================================================================
-- NOTES FOR PRODUCTION SETUP
-- ============================================================================

-- To create the first super admin user:
-- 1. Have the user sign up through the normal authentication flow
-- 2. Find their user ID in the auth.users table
-- 3. Run this query to promote them to super admin:
--
-- UPDATE public.users
-- SET role = 'super_admin'
-- WHERE email = 'admin@example.com';
--
-- 4. The super admin can then promote other users through the admin panel
