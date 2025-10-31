-- This script should be run AFTER the first super admin user has logged in via SSO
-- Replace 'YOUR_SUPER_ADMIN_USER_ID' with the actual UUID from auth.users

-- Example: Update the first user to be super admin
-- UPDATE public.users 
-- SET role = 'super_admin' 
-- WHERE email = 'your-email@example.com';

-- Note: The first super admin must be created manually after SSO login
-- This ensures proper authentication flow and security

-- Optional: Insert sample SSO configuration (for testing)
-- INSERT INTO public.sso_config (provider, config, enabled) VALUES
-- ('azure', '{"clientId": "your-client-id", "tenantId": "your-tenant-id"}'::jsonb, true),
-- ('google', '{"clientId": "your-client-id"}'::jsonb, true),
-- ('okta', '{"domain": "your-domain.okta.com", "clientId": "your-client-id"}'::jsonb, false);
