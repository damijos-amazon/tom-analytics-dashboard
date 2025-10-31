# Design Document

## Overview

This feature integrates Supabase authentication with magic link (passwordless) login, restricted to @amazon.com email addresses. The system will migrate existing localStorage data to Supabase and provide seamless data synchronization across devices.

## Architecture

The solution consists of three main components:
1. **Authentication Layer** - Handles login, email validation, and session management
2. **Data Migration Service** - Migrates localStorage data to Supabase on first login
3. **Sync Manager** - Keeps data synchronized between Supabase and local state

## Components and Interfaces

### New Component: AuthManager

**Purpose:** Manages authentication state and Supabase integration

**Methods:**
- `initialize()` - Sets up Supabase client and checks for existing session
- `signIn(email)` - Validates email domain and sends magic link
- `signOut()` - Logs user out and clears session
- `onAuthStateChange(callback)` - Listens for auth state changes
- `getSession()` - Returns current user session
- `isAuthenticated()` - Returns boolean indicating if user is logged in

### New Component: DataMigrationService

**Purpose:** Migrates localStorage data to Supabase

**Methods:**
- `migrateUserData(userId)` - Migrates all localStorage data for a user
- `hasLocalData()` - Checks if localStorage contains data to migrate
- `backupLocalData()` - Creates backup before migration
- `clearLocalData()` - Clears localStorage after successful migration

### New Component: SupabaseSyncManager

**Purpose:** Synchronizes data between Supabase and application state

**Methods:**
- `saveTableData(tableId, data)` - Saves table data to Supabase
- `loadTableData(tableId)` - Loads table data from Supabase
- `saveTableConfig(config)` - Saves table configuration to Supabase
- `loadAllConfigs()` - Loads all table configurations
- `syncEmployeeList(employees)` - Syncs employee list to Supabase

### Modified Component: TOMDashboard

**Changes:**
- Add Supabase sync on data changes
- Load data from Supabase instead of localStorage
- Maintain localStorage as fallback/cache

## Data Models

### Supabase Tables

**users** (managed by Supabase Auth)
- id (uuid, primary key)
- email (text)
- created_at (timestamp)

**table_data**
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- table_id (text)
- data (jsonb)
- updated_at (timestamp)

**table_configs**
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- config (jsonb)
- updated_at (timestamp)

**employee_list**
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- employees (jsonb)
- updated_at (timestamp)

## User Flow

### First Time Login
1. User visits dashboard
2. Sees login screen
3. Enters @amazon.com email
4. Receives magic link email
5. Clicks link → authenticated
6. System migrates localStorage data to Supabase
7. Dashboard loads with their data

### Returning User
1. User visits dashboard
2. Already authenticated (session active)
3. Dashboard loads immediately
4. Data loaded from Supabase

### New Device
1. User visits dashboard on new device
2. Enters @amazon.com email
3. Clicks magic link
4. Dashboard loads with synced data from Supabase

## Error Handling

- Invalid email domain → Show error, don't send link
- Network failure → Use cached localStorage data
- Migration failure → Keep data in localStorage, allow retry
- Session expired → Redirect to login, preserve unsaved changes
- Supabase down → Fallback to localStorage mode

## Security

- Email validation on client and server side
- Supabase Row Level Security (RLS) policies ensure users only access their own data
- Magic links expire after 1 hour
- Sessions expire after 7 days (configurable)
- No passwords stored anywhere

## Testing Strategy

- Test email validation with various domains
- Test magic link flow end-to-end
- Test data migration with existing localStorage data
- Test sync across multiple browser tabs
- Test offline mode and reconnection
- Test session expiration and renewal
