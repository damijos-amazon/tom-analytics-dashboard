# Supabase Setup Guide for TOM Analytics Dashboard

This guide walks you through setting up Supabase for the TOM Analytics Dashboard authentication and database system.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Basic understanding of SQL and database concepts
- Access to configure SSO providers (Azure AD, Google, or Okta)

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Project Name**: `tom-analytics-dashboard`
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Select appropriate plan (Free tier works for development)
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy and save these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (this is safe to use in client-side code)
   - **service_role** key (keep this secret, only use server-side)

## Step 3: Run Database Schema Scripts

Execute the SQL scripts in order to set up your database:

### 3.1 Create Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `sql/01-create-tables.sql`
4. Paste into the editor and click "Run"
5. Verify all tables were created successfully

### 3.2 Create Indexes

1. Create a new query in SQL Editor
2. Copy the contents of `sql/02-create-indexes.sql`
3. Paste and run
4. Verify indexes were created

### 3.3 Configure Row-Level Security

1. Create a new query in SQL Editor
2. Copy the contents of `sql/03-row-level-security.sql`
3. Paste and run
4. Verify RLS policies were created

### 3.4 Create Functions and Triggers

1. Create a new query in SQL Editor
2. Copy the contents of `sql/04-functions-and-triggers.sql`
3. Paste and run
4. Verify functions and triggers were created

### 3.5 (Optional) Seed Data

1. Create a new query in SQL Editor
2. Copy the contents of `sql/05-seed-data.sql`
3. Update the placeholder values with your actual SSO configuration
4. Paste and run

## Step 4: Configure Authentication Providers

### 4.1 Enable Email Authentication (Optional)

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if desired

### 4.2 Configure Microsoft Azure AD (Azure)

1. In Azure Portal, register a new application:
   - Go to Azure Active Directory > App registrations
   - Click "New registration"
   - Name: `TOM Analytics Dashboard`
   - Redirect URI: `https://YOUR_PROJECT_URL.supabase.co/auth/v1/callback`
   - Click "Register"

2. Configure the application:
   - Copy the **Application (client) ID**
   - Copy the **Directory (tenant) ID**
   - Go to "Certificates & secrets"
   - Create a new client secret and copy it

3. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Azure** provider
   - Enter your Azure AD credentials:
     - Client ID
     - Client Secret
     - Azure Tenant ID
   - Click "Save"

### 4.3 Configure Google OAuth

1. In Google Cloud Console:
   - Create a new project or select existing
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `https://YOUR_PROJECT_URL.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret

2. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Google** provider
   - Enter Client ID and Client Secret
   - Click "Save"

### 4.4 Configure Okta

1. In Okta Admin Console:
   - Go to Applications > Create App Integration
   - Sign-in method: "OIDC - OpenID Connect"
   - Application type: "Web Application"
   - Grant type: "Authorization Code"
   - Sign-in redirect URIs: `https://YOUR_PROJECT_URL.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret

2. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Okta** provider (if available) or use generic OIDC
   - Enter Okta domain, Client ID, and Client Secret
   - Click "Save"

## Step 5: Configure Application Settings

### 5.1 Update Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5.2 Update Application Code

Update the Supabase client initialization in your JavaScript files:

```javascript
// In demo/js/auth-service.js or wherever you initialize Supabase
const supabase = supabase.createClient(
    'https://YOUR_PROJECT_ID.supabase.co',
    'YOUR_ANON_KEY'
);
```

## Step 6: Create First Super Admin User

Since the first user needs to be a super admin, follow these steps:

### Option A: Manual Database Update (Recommended for first user)

1. Have the first user sign up through your application's SSO flow
2. In Supabase Dashboard, go to **Table Editor** > **users**
3. Find the newly created user record
4. Edit the record and change `role` from `manager` to `super_admin`
5. Click "Save"

### Option B: SQL Query

1. Have the first user sign up through SSO
2. In SQL Editor, run:

```sql
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'admin@yourcompany.com';
```

## Step 7: Verify Setup

### 7.1 Test Authentication

1. Open your application's login page
2. Try signing in with each configured SSO provider
3. Verify successful authentication and redirect to dashboard

### 7.2 Test Database Operations

1. Log in as the super admin user
2. Try creating some test data in the dashboard
3. Verify data is saved to Supabase (check Table Editor)

### 7.3 Test Row-Level Security

1. Create a second test user with manager role
2. Log in as the manager
3. Verify they can access data but not admin functions
4. Try accessing admin panel - should be denied

### 7.4 Test Real-time Subscriptions

1. Open the dashboard in two browser windows
2. Log in as different users in each window
3. Make a change in one window
4. Verify the change appears in the other window in real-time

## Step 8: Configure Production Settings

### 8.1 Security Settings

1. Go to **Project Settings** > **API**
2. Review and configure:
   - JWT expiry time (default: 3600 seconds / 1 hour)
   - Refresh token rotation
   - Rate limiting

### 8.2 Email Templates

1. Go to **Authentication** > **Email Templates**
2. Customize templates for:
   - Confirmation email
   - Password reset
   - Magic link
   - Email change

### 8.3 Database Backups

1. Go to **Project Settings** > **Database**
2. Enable automatic backups
3. Configure backup schedule
4. Test backup restoration process

### 8.4 Performance Optimization

1. Monitor query performance in **Database** > **Query Performance**
2. Add additional indexes if needed based on slow queries
3. Consider enabling connection pooling for high traffic

## Step 9: Monitoring and Maintenance

### 9.1 Set Up Monitoring

1. Go to **Project Settings** > **Integrations**
2. Configure monitoring tools (e.g., Sentry, LogRocket)
3. Set up alerts for:
   - High error rates
   - Slow queries
   - Authentication failures

### 9.2 Regular Maintenance Tasks

Schedule these maintenance tasks:

- **Weekly**: Review audit logs for suspicious activity
- **Monthly**: Clean up old audit logs (run cleanup function)
- **Quarterly**: Review and optimize database indexes
- **Annually**: Review and update SSO configurations

### 9.3 Audit Log Cleanup

To clean up old audit logs (keeps last 365 days):

```sql
SELECT public.cleanup_old_audit_logs(365);
```

## Troubleshooting

### Issue: "relation does not exist" errors

**Solution**: Ensure all SQL scripts were run in order. Re-run the schema creation scripts.

### Issue: Authentication redirects not working

**Solution**: 
- Verify redirect URIs match exactly in SSO provider configuration
- Check that Site URL is set correctly in Supabase Auth settings
- Ensure HTTPS is used in production

### Issue: RLS policies blocking legitimate access

**Solution**:
- Check user's role and status in users table
- Verify RLS policies are correctly configured
- Use SQL Editor to test policies with specific user IDs

### Issue: Real-time subscriptions not working

**Solution**:
- Verify Realtime is enabled for the table
- Check that RLS policies allow SELECT access
- Ensure client is properly authenticated

### Issue: Performance issues with large datasets

**Solution**:
- Review query performance in Database dashboard
- Add indexes for frequently queried columns
- Implement pagination for large result sets
- Consider using database views for complex queries

## Security Best Practices

1. **Never commit credentials**: Keep `.env` files out of version control
2. **Use environment variables**: Store all sensitive configuration in environment variables
3. **Rotate secrets regularly**: Update SSO client secrets periodically
4. **Monitor audit logs**: Regularly review for suspicious activity
5. **Limit super admin accounts**: Only create super admin accounts when absolutely necessary
6. **Enable MFA**: Require multi-factor authentication for admin accounts
7. **Use HTTPS only**: Never use HTTP in production
8. **Keep Supabase updated**: Monitor for security updates and apply them promptly

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

If you encounter issues:

1. Check the [Supabase Community Forum](https://github.com/supabase/supabase/discussions)
2. Review the [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Contact your system administrator or development team
