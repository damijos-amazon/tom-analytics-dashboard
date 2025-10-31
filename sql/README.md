# SQL Scripts for TOM Analytics Dashboard

This directory contains all SQL scripts needed to set up the Supabase database for the TOM Analytics Dashboard authentication and database system.

## Script Execution Order

**IMPORTANT**: Execute these scripts in the exact order listed below.

### 1. `01-create-tables.sql`
Creates all database tables and their relationships.

**Tables created:**
- `users` - User accounts with roles and status
- `table_data` - Dashboard table data storage
- `table_configurations` - Table configuration history
- `audit_logs` - System audit trail
- `employee_records` - Employee data storage
- `sso_config` - SSO provider configurations

**Also creates:**
- UUID extension
- Updated_at trigger function
- Automatic timestamp triggers for all tables

### 2. `02-create-indexes.sql`
Creates database indexes for query performance optimization.

**Indexes created:**
- Single-column indexes for frequently queried fields
- Composite indexes for common query patterns
- Descending indexes for time-based queries

**Performance impact:**
- Speeds up user lookups by email, role, and status
- Optimizes table data queries by table_id and employee_name
- Accelerates audit log filtering and sorting

### 3. `03-row-level-security.sql`
Configures Row-Level Security (RLS) policies for data access control.

**Security policies:**
- Users can view their own record
- Admins can view all users
- Super admins can modify user roles
- All authenticated users can access table data
- Only admins can view audit logs
- Only super admins can manage SSO configuration

**Key features:**
- Prevents blocked users from accessing data
- Protects super admin accounts from modification
- Enforces role-based access at database level

### 4. `04-functions-and-triggers.sql`
Creates database functions and triggers for automation.

**Functions created:**
- `handle_new_user()` - Auto-creates user record on signup
- `increment_config_version()` - Auto-increments configuration versions
- `validate_role_change()` - Prevents invalid role changes
- `cleanup_old_audit_logs()` - Maintenance function for audit logs
- `get_user_statistics()` - Returns user count statistics
- `get_recent_activity()` - Returns recent audit log activity

**Triggers created:**
- Auto-create user record when auth.users record is created
- Auto-increment version on new table configuration
- Validate role changes before update

### 5. `05-seed-data.sql` (Optional)
Provides sample SSO configuration templates.

**Use cases:**
- Development and testing
- Initial SSO provider setup templates
- Reference for configuration structure

**Note**: Update placeholder values before running in production.

## Quick Start

### Using Supabase Dashboard

1. Log in to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of each script in order
5. Click **Run** for each script
6. Verify success messages

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

### Using psql (Direct Connection)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run each script
\i sql/01-create-tables.sql
\i sql/02-create-indexes.sql
\i sql/03-row-level-security.sql
\i sql/04-functions-and-triggers.sql
\i sql/05-seed-data.sql
```

## Verification

After running all scripts, verify the setup:

### Check Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- audit_logs
- employee_records
- sso_config
- table_configurations
- table_data
- users

### Check Indexes

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Functions

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Expected functions:
- cleanup_old_audit_logs
- get_recent_activity
- get_user_statistics
- handle_new_user
- increment_config_version
- update_updated_at_column
- validate_role_change

## Common Issues

### Issue: Permission Denied

**Cause**: Insufficient database privileges

**Solution**: Ensure you're connected as the postgres user or have SUPERUSER privileges

### Issue: Relation Already Exists

**Cause**: Scripts have been run before

**Solution**: Either:
- Drop existing tables first (⚠️ destroys data)
- Use `CREATE TABLE IF NOT EXISTS` (already in scripts)
- Skip to next script

### Issue: Function Does Not Exist

**Cause**: Scripts run out of order

**Solution**: Run scripts in the correct order (1 → 2 → 3 → 4 → 5)

### Issue: RLS Policies Not Working

**Cause**: RLS not enabled on table

**Solution**: Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`

## Maintenance Scripts

### Clean Up Old Audit Logs

```sql
-- Keep last 365 days
SELECT public.cleanup_old_audit_logs(365);

-- Keep last 90 days
SELECT public.cleanup_old_audit_logs(90);
```

### Get User Statistics

```sql
SELECT * FROM public.get_user_statistics();
```

### Get Recent Activity

```sql
-- Last 30 days, limit 100 records
SELECT * FROM public.get_recent_activity(30, 100);

-- Last 7 days, limit 50 records
SELECT * FROM public.get_recent_activity(7, 50);
```

### Manually Create Super Admin

```sql
-- Replace with actual email
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'admin@example.com';
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Rollback

To completely remove all tables and start over:

⚠️ **WARNING**: This will delete ALL data!

```sql
-- Drop all tables (cascades to dependent objects)
DROP TABLE IF EXISTS public.sso_config CASCADE;
DROP TABLE IF EXISTS public.employee_records CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.table_configurations CASCADE;
DROP TABLE IF EXISTS public.table_data CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_config_version() CASCADE;
DROP FUNCTION IF EXISTS public.validate_role_change() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_statistics() CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_activity(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
```

## Schema Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
└────────┬────────┘
         │
         │ (1:1)
         ▼
┌─────────────────┐
│  public.users   │
│  - id (PK)      │
│  - email        │
│  - role         │
│  - status       │
└────────┬────────┘
         │
         │ (1:N)
         ├──────────────────┬──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  table_data  │  │ audit_logs   │  │table_configs │  │employee_recs │
│  - id (PK)   │  │  - id (PK)   │  │  - id (PK)   │  │  - id (PK)   │
│  - table_id  │  │  - user_id   │  │  - config    │  │  - emp_data  │
│  - emp_name  │  │  - action    │  │  - version   │  │  - created_by│
│  - data      │  │  - resource  │  │  - created_by│  │  - updated_by│
│  - created_by│  │  - details   │  └──────────────┘  └──────────────┘
│  - updated_by│  └──────────────┘
└──────────────┘

┌──────────────┐
│  sso_config  │
│  - id (PK)   │
│  - provider  │
│  - config    │
│  - enabled   │
└──────────────┘
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
