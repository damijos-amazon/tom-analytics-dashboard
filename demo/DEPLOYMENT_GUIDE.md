# TOM Analytics Dashboard - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Initialization](#database-initialization)
4. [SSO Configuration](#sso-configuration)
5. [Application Configuration](#application-configuration)
6. [Deployment](#deployment)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
- **SSO Provider Account**: At least one of:
  - Microsoft Azure AD
  - Google Workspace
  - Okta

### Required Tools

- Git (for cloning repository)
- Node.js 16+ (if using build tools)
- Text editor (VS Code recommended)
- Modern web browser

### Required Knowledge

- Basic SQL
- JavaScript/HTML
- SSO/OAuth concepts
- Command line basics

---

## Supabase Project Setup

### Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `tom-analytics-dashboard`
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate plan
4. Click "Create new project"
5. Wait 2-3 minutes for project provisioning

### Step 2: Get Project Credentials

1. Go to Project Settings → API
2. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string)
   - **Service Role Key**: `eyJhbGc...` (keep this secret!)

### Step 3: Configure Authentication Providers

1. Go to Authentication → Providers
2. Enable desired SSO providers (see SSO Configuration section)
3. Configure redirect URLs
4. Save provider settings

---

## Database Initialization

### Step 1: Access SQL Editor

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"

### Step 2: Run SQL Scripts

Execute the following scripts in order. Each script is located in the `sql/` directory.

#### Script 1: Create Tables

```sql
-- File: sql/01-create-tables.sql
-- Run this first to create all database tables
```

**What it does:**
- Creates `users` table (extends auth.users)
- Creates `table_data` table (stores dashboard data)
- Creates `table_configurations` table (stores table configs)
- Creates `audit_logs` table (tracks all actions)
- Creates `employee_records` table (stores employee data)
- Creates `sso_config` table (stores SSO settings)

**To run:**
1. Copy contents of `sql/01-create-tables.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify "Success" message

#### Script 2: Create Indexes

```sql
-- File: sql/02-create-indexes.sql
-- Run this second to optimize query performance
```

**What it does:**
- Creates indexes on frequently queried columns
- Improves query performance
- Optimizes real-time subscriptions

**To run:**
1. Copy contents of `sql/02-create-indexes.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify all indexes created

#### Script 3: Row-Level Security

```sql
-- File: sql/03-row-level-security.sql
-- Run this third to enable security policies
```

**What it does:**
- Enables RLS on all tables
- Creates policies for user access
- Implements role-based permissions
- Protects sensitive data

**To run:**
1. Copy contents of `sql/03-row-level-security.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify all policies created

#### Script 4: Functions and Triggers

```sql
-- File: sql/04-functions-and-triggers.sql
-- Run this fourth to add automation
```

**What it does:**
- Creates helper functions
- Sets up automatic timestamp updates
- Implements data validation
- Adds audit logging triggers

**To run:**
1. Copy contents of `sql/04-functions-and-triggers.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify all functions created

#### Script 5: Seed Data

```sql
-- File: sql/05-seed-data.sql
-- Run this last to add initial data
```

**What it does:**
- Creates first Super Admin user
- Adds sample configurations
- Sets up default SSO providers

**Important:** Edit this script before running:
- Replace `your-email@company.com` with your email
- Update SSO provider details
- Adjust sample data as needed

**To run:**
1. Copy contents of `sql/05-seed-data.sql`
2. **Edit the file** with your details
3. Paste into SQL Editor
4. Click "Run"
5. Verify data inserted

### Step 3: Verify Database Setup

Run this verification query:

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output:**
- audit_logs
- employee_records
- sso_config
- table_configurations
- table_data
- users

---

## SSO Configuration

### Microsoft Azure AD

#### Step 1: Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory → App registrations
3. Click "New registration"
4. Fill in details:
   - **Name**: TOM Analytics Dashboard
   - **Supported account types**: Single tenant
   - **Redirect URI**: `https://xxxxx.supabase.co/auth/v1/callback`
5. Click "Register"

#### Step 2: Configure Application

1. Go to Certificates & secrets
2. Click "New client secret"
3. Add description and expiry
4. Copy the secret value (save it securely)
5. Go to API permissions
6. Add Microsoft Graph permissions:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`
7. Grant admin consent

#### Step 3: Configure in Supabase

1. Go to Supabase → Authentication → Providers
2. Enable "Azure"
3. Enter:
   - **Client ID**: From Azure app registration
   - **Client Secret**: From step 2
   - **Tenant ID**: Your Azure AD tenant ID
4. Save configuration

### Google Workspace

#### Step 1: Create OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth client ID
5. Configure consent screen:
   - **Application name**: TOM Analytics Dashboard
   - **Authorized domains**: Your domain
   - **Scopes**: email, profile, openid
6. Create OAuth client ID:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://xxxxx.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret

#### Step 2: Configure in Supabase

1. Go to Supabase → Authentication → Providers
2. Enable "Google"
3. Enter:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Save configuration

### Okta

#### Step 1: Create Application

1. Go to Okta Admin Console
2. Applications → Create App Integration
3. Select "OIDC - OpenID Connect"
4. Select "Web Application"
5. Configure:
   - **App integration name**: TOM Analytics Dashboard
   - **Grant type**: Authorization Code
   - **Sign-in redirect URIs**: `https://xxxxx.supabase.co/auth/v1/callback`
   - **Sign-out redirect URIs**: `https://your-domain.com/login`
6. Save and copy Client ID and Client Secret

#### Step 2: Configure in Supabase

1. Go to Supabase → Authentication → Providers
2. Enable "Okta"
3. Enter:
   - **Client ID**: From Okta application
   - **Client Secret**: From Okta application
   - **Domain**: Your Okta domain (e.g., `dev-12345.okta.com`)
4. Save configuration

---

## Application Configuration

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/tom-analytics-dashboard.git
cd tom-analytics-dashboard
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Application Configuration
VITE_APP_NAME=TOM Analytics Dashboard
VITE_APP_VERSION=1.0.0

# Optional: Analytics
VITE_ANALYTICS_ID=UA-XXXXX-X
```

**Security Notes:**
- Never commit `.env` to version control
- Add `.env` to `.gitignore`
- Use different keys for dev/staging/production
- Rotate keys periodically

### Step 3: Update Configuration Files

#### Update `demo/js/config.js`:

```javascript
// Supabase configuration
const SUPABASE_CONFIG = {
    url: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'
};

// Application configuration
const APP_CONFIG = {
    name: 'TOM Analytics Dashboard',
    version: '1.0.0',
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    sessionWarning: 30 * 60 * 1000, // 30 minutes
    autoSaveInterval: 30000 // 30 seconds
};

export { SUPABASE_CONFIG, APP_CONFIG };
```

### Step 4: Update HTML Files

Update all HTML files to use the configuration:

```html
<!-- Replace hardcoded values with config -->
<script type="module">
    import { SUPABASE_CONFIG } from './js/config.js';
    
    const supabase = supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
    );
</script>
```

---

## Deployment

### Option 1: Static Hosting (Recommended)

#### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build the application:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod
```

4. Configure custom domain (optional):
```bash
netlify domains:add your-domain.com
```

#### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard

#### Deploy to AWS S3 + CloudFront

1. Create S3 bucket:
```bash
aws s3 mb s3://tom-analytics-dashboard
```

2. Enable static website hosting:
```bash
aws s3 website s3://tom-analytics-dashboard \
    --index-document index.html \
    --error-document error.html
```

3. Upload files:
```bash
aws s3 sync ./demo s3://tom-analytics-dashboard
```

4. Create CloudFront distribution:
```bash
aws cloudfront create-distribution \
    --origin-domain-name tom-analytics-dashboard.s3.amazonaws.com
```

### Option 2: Traditional Web Server

#### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName analytics.your-domain.com
    DocumentRoot /var/www/tom-analytics
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    <Directory /var/www/tom-analytics>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Security headers
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</VirtualHost>
```

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name analytics.your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/tom-analytics;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

---

## Post-Deployment

### Step 1: Create First Super Admin

1. Log in with your SSO credentials
2. Run this SQL in Supabase:

```sql
-- Promote your user to Super Admin
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'your-email@company.com';
```

### Step 2: Verify Functionality

Test each feature:

- [ ] SSO login works
- [ ] Session timeout functions
- [ ] Role-based access control works
- [ ] Data save/load operations work
- [ ] Real-time sync functions
- [ ] Admin panel accessible
- [ ] User management works
- [ ] Audit logging captures events
- [ ] Backup/restore functions

### Step 3: Configure Monitoring

#### Supabase Monitoring

1. Go to Supabase → Database → Logs
2. Enable log retention
3. Set up alerts for:
   - High error rates
   - Slow queries
   - Connection issues

#### Application Monitoring

Add error tracking (optional):

```javascript
// Add to main application file
window.addEventListener('error', (event) => {
    // Log to monitoring service
    console.error('Application error:', event.error);
    
    // Send to error tracking service
    // e.g., Sentry, Rollbar, etc.
});
```

### Step 4: Set Up Backups

#### Automated Supabase Backups

Supabase automatically backs up your database. Configure:

1. Go to Project Settings → Database
2. Set backup retention period
3. Enable point-in-time recovery (paid plans)

#### Application-Level Backups

Create a scheduled task to export data:

```javascript
// backup-script.js
async function createBackup() {
    const adminService = new AdminPanelService(supabase, authService);
    const backup = await adminService.exportAllData();
    
    // Save to secure storage
    await saveToS3(backup);
    
    console.log('Backup created:', new Date());
}

// Run daily at 2 AM
cron.schedule('0 2 * * *', createBackup);
```

### Step 5: Security Hardening

#### Enable Additional Security Features

1. **Content Security Policy**:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' https://*.supabase.co;">
```

2. **Rate Limiting** (in Supabase):
```sql
-- Limit login attempts
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Implement rate limiting logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

3. **IP Whitelisting** (optional):
   - Configure in Supabase Project Settings
   - Add allowed IP ranges
   - Enable for production only

### Step 6: User Onboarding

1. Create user accounts in SSO provider
2. Users log in for first time
3. Assign appropriate roles:
```sql
-- Promote to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@company.com';
```

4. Send welcome email with:
   - Login URL
   - SSO provider to use
   - Link to user guide
   - Support contact info

---

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to Supabase

**Solutions:**
1. Verify project URL and anon key
2. Check Supabase project status
3. Verify network connectivity
4. Check browser console for CORS errors
5. Ensure RLS policies are correct

**Debug query:**
```sql
-- Check if tables exist
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Authentication Failures

**Problem**: SSO login fails

**Solutions:**
1. Verify SSO provider configuration
2. Check redirect URLs match exactly
3. Verify client ID and secret
4. Check SSO provider status
5. Review Supabase auth logs

**Debug steps:**
```javascript
// Enable auth debug logging
const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
        redirectTo: window.location.origin,
        scopes: 'email profile openid'
    }
});

console.log('Auth response:', { data, error });
```

### RLS Policy Issues

**Problem**: Users cannot access data

**Solutions:**
1. Verify user is authenticated
2. Check user role in database
3. Review RLS policies
4. Test with service role key (temporarily)

**Debug query:**
```sql
-- Check user role
SELECT id, email, role, status 
FROM public.users 
WHERE email = 'user@company.com';

-- Test RLS policy
SET ROLE authenticated;
SELECT * FROM public.table_data;
```

### Performance Issues

**Problem**: Slow queries or page loads

**Solutions:**
1. Check database indexes
2. Review query complexity
3. Enable query caching
4. Optimize real-time subscriptions
5. Check network latency

**Debug query:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Real-Time Sync Issues

**Problem**: Real-time updates not working

**Solutions:**
1. Verify Supabase Realtime is enabled
2. Check subscription setup
3. Review RLS policies for realtime
4. Check browser console for errors
5. Verify network connection

**Debug code:**
```javascript
// Test realtime connection
const channel = supabase.channel('test')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'table_data' },
        (payload) => console.log('Change received:', payload)
    )
    .subscribe((status) => {
        console.log('Subscription status:', status);
    });
```

### Migration Issues

**Problem**: Data migration fails

**Solutions:**
1. Check localStorage data format
2. Verify user permissions
3. Review migration logs
4. Test with small dataset first
5. Check for data validation errors

**Debug code:**
```javascript
// Test migration with logging
async function debugMigration() {
    const data = localStorage.getItem('tableData');
    console.log('LocalStorage data:', data);
    
    try {
        const result = await migrateData(JSON.parse(data));
        console.log('Migration result:', result);
    } catch (error) {
        console.error('Migration error:', error);
    }
}
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system performance
- Review failed login attempts

**Weekly:**
- Review audit logs
- Check backup integrity
- Update user roles as needed
- Review system statistics

**Monthly:**
- Update dependencies
- Review security policies
- Rotate API keys
- Test disaster recovery
- Review and archive old audit logs

**Quarterly:**
- Security audit
- Performance optimization
- User access review
- Update documentation

### Updating the Application

1. **Test in staging first**
2. **Create backup**
3. **Deploy updates**
4. **Verify functionality**
5. **Monitor for issues**

```bash
# Update process
git pull origin main
npm install
npm run build
npm run deploy
```

### Database Migrations

When schema changes are needed:

1. Create migration script
2. Test in development
3. Backup production database
4. Run migration
5. Verify data integrity

```sql
-- Example migration
BEGIN;

-- Add new column
ALTER TABLE public.users 
ADD COLUMN department TEXT;

-- Update existing data
UPDATE public.users 
SET department = 'General' 
WHERE department IS NULL;

COMMIT;
```

---

## Support and Resources

### Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [User Guide](./USER_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

### Community

- GitHub Issues: Report bugs and request features
- Slack Channel: Real-time support
- Email: support@your-organization.com

### Emergency Contacts

- **Database Issues**: dba@your-organization.com
- **Security Issues**: security@your-organization.com
- **General Support**: support@your-organization.com

---

## Appendix

### A. Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes | `eyJhbGc...` |
| `VITE_APP_NAME` | Application name | No | `TOM Analytics` |
| `VITE_APP_VERSION` | Application version | No | `1.0.0` |

### B. SQL Scripts Checklist

- [ ] 01-create-tables.sql
- [ ] 02-create-indexes.sql
- [ ] 03-row-level-security.sql
- [ ] 04-functions-and-triggers.sql
- [ ] 05-seed-data.sql

### C. Deployment Checklist

- [ ] Supabase project created
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] SSO providers configured
- [ ] Environment variables set
- [ ] Application deployed
- [ ] HTTPS enabled
- [ ] First super admin created
- [ ] Functionality tested
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation updated
- [ ] Users notified

---

*Last Updated: October 2025*
*Version: 1.0*
