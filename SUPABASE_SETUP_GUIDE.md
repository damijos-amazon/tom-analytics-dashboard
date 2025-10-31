# Supabase Setup Guide

This guide walks you through setting up the Supabase project and database for the TOM Analytics Dashboard authentication and database system.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to configure SSO providers (Azure AD, Google Workspace, or Okta)

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Name**: TOM Analytics Dashboard
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Configure Authentication Providers

### Enable Email Provider (Required for initial setup)

1. In your Supabase project, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if desired

### Configure SSO Providers

#### Azure AD (Microsoft)

1. Go to **Authentication** > **Providers**
2. Enable **Azure** provider
3. Configure with your Azure AD credentials:
   - **Client ID**: From Azure App Registration
   - **Client Secret**: From Azure App Registration
   - **Tenant ID**: Your Azure AD tenant ID
4. Set the redirect URL in Azure: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

#### Google Workspace

1. Go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Configure with your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set the redirect URL in Google: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

#### Okta

1. Go to **Authentication** > **Providers**
2. Enable **Okta** provider (if available) or use generic OAuth
3. Configure with your Okta credentials:
   - **Domain**: Your Okta domain
   - **Client ID**: From Okta application
   - **Client Secret**: From Okta application

## Step 3: Run Database Setup Scripts

### Execute SQL Scripts in Order

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste each SQL file in the following order:

#### Script 1: Create Tables
```sql
-- Copy contents from demo/sql/01-create-tables.sql
```

Click **Run** to execute.

#### Script 2: Create Indexes
```sql
-- Copy contents from demo/sql/02-create-indexes.sql
```

Click **Run** to execute.

#### Script 3: Row Level Security
```sql
-- Copy contents from demo/sql/03-row-level-security.sql
```

Click **Run** to execute.

#### Script 4: Functions and Triggers
```sql
-- Copy contents from demo/sql/05-functions.sql
```

Click **Run** to execute.

### Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see the following tables:
   - `users`
   - `table_data`
   - `table_configurations`
   - `audit_logs`
   - `employee_records`
   - `sso_config`

## Step 4: Create First Super Admin

### Option A: Via SQL (Recommended)

1. First, log in to your application using SSO
2. This will create your user record automatically
3. Go to **SQL Editor** in Supabase
4. Run this query to promote yourself to super admin:

```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

### Option B: Via Table Editor

1. Log in to your application using SSO
2. Go to **Table Editor** > **users** in Supabase
3. Find your user record
4. Edit the `role` field to `super_admin`
5. Save changes

## Step 5: Configure Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```env
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

To find these values:
1. Go to **Settings** > **API** in Supabase
2. Copy the **Project URL** (SUPABASE_URL)
3. Copy the **anon public** key (SUPABASE_ANON_KEY)

## Step 6: Update Application Configuration

Update your application's Supabase client initialization:

```javascript
// In your main application file
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Step 7: Test Database Connection

1. Open your browser's developer console
2. Navigate to your application
3. Try to log in with SSO
4. Check the console for any errors
5. Verify that your user record was created in the `users` table

## Step 8: Verify Row Level Security

Test that RLS policies are working correctly:

1. Log in as a regular user (manager role)
2. Try to access admin functions - should be denied
3. Log in as super admin
4. Verify you can access all admin functions

## Database Schema Overview

### Tables

- **users**: User accounts with roles and status
- **table_data**: Dashboard table data storage
- **table_configurations**: Table configuration versions
- **audit_logs**: System audit trail
- **employee_records**: Employee data storage
- **sso_config**: SSO provider configurations

### Roles

- **super_admin**: Full system access, can manage admins
- **admin**: Can manage users, view audit logs
- **manager**: Standard user access

### Indexes

Performance indexes are created on:
- User email, role, status, last_login
- Table data table_id, employee_name
- Audit logs user_id, action, created_at
- All timestamp fields for sorting

## Troubleshooting

### Issue: Tables not created

**Solution**: Ensure you ran all SQL scripts in order. Check the SQL Editor for error messages.

### Issue: RLS policies blocking legitimate access

**Solution**: Verify your user's role in the `users` table. Ensure the user is authenticated.

### Issue: SSO login fails

**Solution**: 
- Verify SSO provider configuration in Supabase
- Check redirect URLs match exactly
- Ensure provider credentials are correct

### Issue: User record not created on first login

**Solution**: 
- Verify the `handle_new_user()` function and trigger exist
- Check SQL Editor logs for errors
- Manually insert user record if needed

### Issue: Cannot promote user to super admin

**Solution**: 
- Ensure you're running the UPDATE query as a Supabase admin
- Check that the user exists in the `users` table
- Verify the email matches exactly

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] SSO providers configured with correct credentials
- [ ] First super admin account created
- [ ] Environment variables secured (not committed to git)
- [ ] Database password stored securely
- [ ] Redirect URLs configured correctly in SSO providers
- [ ] Test user blocking functionality
- [ ] Verify audit logging is working

## Next Steps

After completing this setup:

1. Proceed to Task 2: Implement Authentication Service
2. Create the login page UI
3. Test SSO authentication flow
4. Configure additional SSO providers as needed

## Support

For issues with:
- **Supabase**: Check https://supabase.com/docs or https://github.com/supabase/supabase/discussions
- **SSO Configuration**: Refer to your identity provider's documentation
- **Application Integration**: Review the design document at `.kiro/specs/authentication-database-system/design.md`
