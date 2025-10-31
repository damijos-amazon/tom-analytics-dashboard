# Supabase Setup Checklist

Use this checklist to ensure all steps are completed for the TOM Analytics Dashboard Supabase setup.

## Pre-Setup

- [ ] Supabase account created
- [ ] Project requirements reviewed
- [ ] SSO provider credentials available (Azure AD, Google, or Okta)
- [ ] Team members identified for super admin role

## Project Creation

- [ ] New Supabase project created
- [ ] Project name: `tom-analytics-dashboard`
- [ ] Strong database password set and saved securely
- [ ] Appropriate region selected
- [ ] Project provisioning completed

## Credentials Collection

- [ ] Project URL copied and saved
- [ ] `anon` public key copied and saved
- [ ] `service_role` key copied and saved securely
- [ ] Database connection string noted (if needed)

## Database Schema Setup

- [ ] SQL Editor accessed in Supabase Dashboard
- [ ] `01-create-tables.sql` executed successfully
- [ ] `02-create-indexes.sql` executed successfully
- [ ] `03-row-level-security.sql` executed successfully
- [ ] `04-functions-and-triggers.sql` executed successfully
- [ ] `05-seed-data.sql` executed (optional, for development)
- [ ] All tables verified in Table Editor
- [ ] All indexes verified
- [ ] All RLS policies verified
- [ ] All functions verified

## Authentication Configuration

### Email Provider (Optional)
- [ ] Email provider enabled
- [ ] Email templates customized
- [ ] SMTP settings configured (if using custom SMTP)

### Microsoft Azure AD
- [ ] Azure AD application registered
- [ ] Application (client) ID obtained
- [ ] Directory (tenant) ID obtained
- [ ] Client secret created and saved
- [ ] Redirect URI configured: `https://[PROJECT_URL].supabase.co/auth/v1/callback`
- [ ] Azure provider enabled in Supabase
- [ ] Credentials entered in Supabase
- [ ] Configuration saved

### Google OAuth
- [ ] Google Cloud project created/selected
- [ ] OAuth client ID created
- [ ] Client ID and secret obtained
- [ ] Authorized redirect URI configured
- [ ] Google provider enabled in Supabase
- [ ] Credentials entered in Supabase
- [ ] Configuration saved

### Okta
- [ ] Okta application created
- [ ] Client ID and secret obtained
- [ ] Redirect URI configured
- [ ] Okta provider enabled in Supabase
- [ ] Credentials entered in Supabase
- [ ] Configuration saved

## Application Configuration

- [ ] `.env` file created in project root
- [ ] `VITE_SUPABASE_URL` set in `.env`
- [ ] `VITE_SUPABASE_ANON_KEY` set in `.env`
- [ ] `.env` added to `.gitignore`
- [ ] Supabase client initialization updated in code
- [ ] Environment variables verified in application

## First User Setup

- [ ] First user signed up through SSO
- [ ] User record created in `public.users` table
- [ ] User promoted to `super_admin` role via SQL or Table Editor
- [ ] Super admin login verified
- [ ] Admin panel access verified

## Security Configuration

- [ ] JWT expiry time reviewed and configured
- [ ] Refresh token rotation enabled
- [ ] Rate limiting configured
- [ ] Site URL set correctly in Auth settings
- [ ] Redirect URLs configured
- [ ] CORS settings reviewed

## Testing

### Authentication Testing
- [ ] SSO login tested for each provider
- [ ] Successful authentication and redirect verified
- [ ] Session persistence tested
- [ ] Logout functionality tested
- [ ] Session timeout tested

### Database Operations Testing
- [ ] Create operation tested (save data)
- [ ] Read operation tested (load data)
- [ ] Update operation tested (modify data)
- [ ] Delete operation tested (remove data)
- [ ] Data visible in Supabase Table Editor

### Role-Based Access Testing
- [ ] Super admin can access admin panel
- [ ] Super admin can promote/demote users
- [ ] Admin can block/unblock users
- [ ] Manager cannot access admin functions
- [ ] Blocked user cannot access system

### Real-time Testing
- [ ] Real-time subscriptions working
- [ ] Changes sync across multiple browser windows
- [ ] Real-time updates appear without refresh

### Audit Logging Testing
- [ ] Login events logged
- [ ] Data modifications logged
- [ ] Role changes logged
- [ ] Audit logs visible in admin panel
- [ ] Audit log filtering working

## Production Configuration

- [ ] Automatic backups enabled
- [ ] Backup schedule configured
- [ ] Backup restoration tested
- [ ] Connection pooling configured (if needed)
- [ ] Performance monitoring enabled
- [ ] Error tracking integrated (Sentry, etc.)
- [ ] Alerts configured for critical issues

## Documentation

- [ ] Setup guide reviewed by team
- [ ] Credentials documented in secure location
- [ ] Runbook created for common operations
- [ ] Troubleshooting guide accessible
- [ ] Team members trained on admin panel

## Monitoring Setup

- [ ] Database performance monitoring enabled
- [ ] Query performance reviewed
- [ ] Slow query alerts configured
- [ ] Authentication failure alerts configured
- [ ] Error rate monitoring enabled

## Maintenance Planning

- [ ] Weekly audit log review scheduled
- [ ] Monthly audit log cleanup scheduled
- [ ] Quarterly index optimization scheduled
- [ ] Annual SSO credential rotation scheduled
- [ ] Backup restoration drill scheduled

## Final Verification

- [ ] All team members can log in
- [ ] All features working as expected
- [ ] No console errors in browser
- [ ] No database errors in Supabase logs
- [ ] Performance acceptable under load
- [ ] Security scan completed (if applicable)
- [ ] Penetration testing completed (if applicable)

## Go-Live Checklist

- [ ] All testing completed successfully
- [ ] Production credentials secured
- [ ] Team trained on system usage
- [ ] Support process established
- [ ] Rollback plan documented
- [ ] Monitoring dashboards configured
- [ ] On-call rotation established (if applicable)
- [ ] Stakeholders notified of go-live

## Post-Launch

- [ ] Monitor system for first 24 hours
- [ ] Review error logs daily for first week
- [ ] Collect user feedback
- [ ] Address any issues promptly
- [ ] Document lessons learned
- [ ] Plan for future enhancements

## Notes

Use this section to track any issues, decisions, or important information during setup:

```
Date: ___________
Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

## Sign-Off

Setup completed by: _____________________________ Date: __________

Reviewed by: ____________________________________ Date: __________

Approved for production: ________________________ Date: __________
