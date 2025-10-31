# Database Integration Quick Start Guide

## 🚀 Getting Started with Database Features

This guide will help you set up and use the new database integration features in the TOM Analytics Dashboard.

## Prerequisites

Before you begin, you need:
1. A Supabase account (free tier works fine)
2. A Supabase project with the required database tables
3. Your Supabase project URL and anon key

## Step 1: Set Up Supabase Project

### Create Database Tables

Run the following SQL scripts in your Supabase SQL Editor (Settings → SQL Editor):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('super_admin', 'admin', 'manager')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES public.users(id),
    block_reason TEXT
);

-- Table data storage
CREATE TABLE public.table_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_id, employee_name)
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for table_data (all authenticated users can access)
CREATE POLICY "Authenticated users can read table data"
ON public.table_data FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert table data"
ON public.table_data FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update table data"
ON public.table_data FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete table data"
ON public.table_data FOR DELETE
USING (auth.role() = 'authenticated');

-- RLS Policies for users
CREATE POLICY "Users can view own record"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- RLS Policies for audit logs (admins only)
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Create indexes for performance
CREATE INDEX idx_table_data_table_id ON public.table_data(table_id);
CREATE INDEX idx_table_data_employee_name ON public.table_data(employee_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
```

### Enable Authentication

1. Go to Authentication → Providers in your Supabase dashboard
2. Enable the authentication providers you want to use:
   - Email/Password
   - Google OAuth
   - Microsoft Azure AD
   - Okta (if needed)

### Create Your First User

1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and password
4. After creating, go to SQL Editor and run:

```sql
-- Make yourself a super admin
INSERT INTO public.users (id, email, role, status)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
    'your-email@example.com',
    'super_admin',
    'active'
);
```

## Step 2: Configure the Dashboard

1. Open the TOM Analytics Dashboard
2. Click on "🔧 Database Configuration" in the navigation menu
3. Enter your Supabase credentials:
   - **Project URL**: Found in Settings → API → Project URL
   - **Anon Key**: Found in Settings → API → Project API keys → anon public
4. Click "Test Connection" to verify
5. Click "Save Configuration"

## Step 3: Sign In

1. Navigate to the login page (or click "Sign In" when prompted)
2. Sign in with your credentials
3. You'll be redirected to the dashboard
4. Your email and role will appear in the top-right corner

## Step 4: Start Using Database Features

### Automatic Data Sync

- All data operations now automatically sync to the database
- Upload files as usual - data is saved to both localStorage and database
- Changes are persisted across sessions and devices

### Real-Time Collaboration

- When another user makes changes, you'll see a notification
- The dashboard automatically refreshes with the latest data
- No need to manually refresh the page

### Role-Based Access

- **Manager**: Can view and edit data
- **Admin**: Can manage users and access admin panel
- **Super Admin**: Full system access

## Testing Your Setup

1. Open `demo/test-database-integration.html`
2. Click "Run All Tests"
3. Verify all tests pass (should see green "PASS" status)
4. Check the log output for any errors

## Troubleshooting

### "User not authenticated" Error

**Solution**: Make sure you've created a user in Supabase and signed in through the login page.

### "Connection failed" Error

**Solution**: 
- Verify your Supabase URL and key are correct
- Check that your Supabase project is active
- Ensure you have internet connectivity

### "Query failed" Error

**Solution**:
- Make sure you've run all the SQL scripts to create tables
- Verify Row Level Security policies are set up correctly
- Check that your user exists in the `public.users` table

### Data Not Syncing

**Solution**:
- Open browser console (F12) and check for errors
- Verify you're authenticated (check top-right corner)
- Try logging out and back in
- Clear browser cache and reload

### Real-Time Updates Not Working

**Solution**:
- Ensure Realtime is enabled in Supabase (Settings → API → Realtime)
- Check browser console for subscription errors
- Verify your database policies allow SELECT operations

## Advanced Configuration

### Offline Mode

The dashboard works offline using localStorage as a fallback:
- If database is unavailable, data is saved locally
- When connection is restored, you can manually sync
- No data loss during offline periods

### Multiple Environments

You can configure different Supabase projects for dev/prod:
- Use the configuration page to switch between projects
- Each environment maintains separate data
- Useful for testing without affecting production

### Custom Roles

To add custom roles, modify the users table:

```sql
ALTER TABLE public.users 
DROP CONSTRAINT users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer', 'your_custom_role'));
```

## Security Best Practices

1. **Never commit credentials**: Don't hardcode Supabase keys in your code
2. **Use environment variables**: Store credentials securely
3. **Enable RLS**: Always use Row Level Security policies
4. **Rotate keys**: Periodically rotate your Supabase keys
5. **Monitor access**: Check audit logs regularly
6. **Limit permissions**: Give users minimum required access

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review the test suite results
3. Verify your Supabase configuration
4. Check the implementation summary document

## Next Features

Coming soon:
- Data migration from localStorage to database
- Enhanced error handling and retry logic
- Performance optimizations
- Comprehensive documentation
- Admin panel for user management

---

**Need Help?** Check the `TASK_7_IMPLEMENTATION_SUMMARY.md` for technical details or run the test suite at `test-database-integration.html`.
