# TOM Analytics Dashboard - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Login and Authentication](#login-and-authentication)
3. [Role Permissions](#role-permissions)
4. [Using the Dashboard](#using-the-dashboard)
5. [Admin Panel](#admin-panel)
6. [Backup and Restore](#backup-and-restore)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is TOM Analytics Dashboard?

TOM Analytics Dashboard is a secure, cloud-based analytics platform for tracking and managing team performance metrics. The system features enterprise-grade authentication, role-based access control, and real-time data synchronization.

### System Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Valid organizational SSO credentials (Microsoft, Google, or Okta)

---

## Login and Authentication

### First-Time Login

1. Navigate to the login page
2. Click on your organization's SSO provider button:
   - **Sign in with Microsoft** - For Azure AD users
   - **Sign in with Google** - For Google Workspace users
   - **Sign in with Okta** - For Okta users
3. Complete the authentication flow with your SSO provider
4. You'll be redirected to the dashboard upon successful login

### Session Management

- **Session Duration**: Your session lasts for 8 hours of activity
- **Session Warning**: You'll receive a warning 30 minutes before your session expires
- **Stay Logged In**: Click "Stay Logged In" to extend your session
- **Automatic Logout**: If you don't respond to the warning, you'll be automatically logged out

### Logging Out

To log out manually:
1. Click your name/email in the top-right corner
2. Select "Logout" from the dropdown menu
3. You'll be redirected to the login page

---

## Role Permissions

The system has three role levels with different permissions:

### Manager (Default Role)

**Permissions:**
- View all dashboard data
- Edit and update table data
- Upload employee records
- Configure table settings
- View personal audit logs

**Restrictions:**
- Cannot access admin panel
- Cannot manage other users
- Cannot view system-wide audit logs

### Admin

**Permissions:**
- All Manager permissions, plus:
- Access admin panel
- View all users
- Block/unblock users
- View system-wide audit logs
- Export audit logs
- View system statistics

**Restrictions:**
- Cannot promote users to Admin
- Cannot demote other Admins
- Cannot modify Super Admin accounts

### Super Admin

**Permissions:**
- All Admin permissions, plus:
- Promote users to Admin
- Demote Admins to Manager
- Configure SSO providers
- Export/import system backups
- Full system configuration access

**Restrictions:**
- Cannot be blocked or demoted
- At least one Super Admin must exist

---

## Using the Dashboard

### Viewing Data

1. **Table Selection**: Use the dropdown to select which table to view
2. **Data Display**: View current and historical performance metrics
3. **Real-Time Updates**: Data updates automatically when other users make changes

### Editing Data

1. Click on any editable cell in the table
2. Enter the new value
3. Press Enter or click outside the cell to save
4. Changes are saved automatically to the database
5. Other users will see your changes in real-time

### Uploading Employee Records

1. Click the "Upload" button
2. Select your CSV or JSON file
3. Confirm the upload
4. Data will be processed and displayed in the table

### Configuring Tables

1. Click the "Configure" button
2. Adjust table settings:
   - Column visibility
   - Sort order
   - Filter criteria
   - Display preferences
3. Click "Save Configuration"
4. Your preferences are saved to the database

### Data Migration

If you have existing data in localStorage:
1. On first login, you'll see a migration prompt
2. Click "Migrate Data" to transfer your local data to the database
3. Wait for the migration to complete
4. Your localStorage data will be preserved as a backup

---

## Admin Panel

*Available to Admin and Super Admin roles only*

### Accessing the Admin Panel

1. Click your name in the top-right corner
2. Select "Admin Panel" from the dropdown
3. The admin panel opens in a new tab

### User Management

**Viewing Users:**
- See all registered users
- View user roles and status
- Check last login times

**Promoting Users:** (Super Admin only)
1. Find the user in the list
2. Click "Promote to Admin"
3. Confirm the action
4. User immediately gains Admin permissions

**Demoting Users:** (Super Admin only)
1. Find the Admin user in the list
2. Click "Demote to Manager"
3. Confirm the action
4. User loses Admin permissions

**Blocking Users:**
1. Find the user in the list
2. Click "Block User"
3. Enter a reason for blocking
4. Confirm the action
5. User's active sessions are terminated
6. User receives a notification email

**Unblocking Users:**
1. Find the blocked user in the list
2. Click "Unblock User"
3. Confirm the action
4. User can log in again

### Audit Logs

**Viewing Audit Logs:**
- See all system actions
- View user, action type, timestamp, and details
- Track data modifications and user management actions

**Filtering Logs:**
1. Select date range
2. Choose user (optional)
3. Select action type (optional)
4. Click "Apply Filters"

**Exporting Logs:**
1. Apply desired filters
2. Click "Export to CSV"
3. Save the file to your computer
4. Open in Excel or other spreadsheet software

### System Statistics

View key metrics:
- Total users by role
- Active vs. blocked users
- Login activity (last 30 days)
- Most active users
- System performance metrics

Statistics refresh automatically every 5 minutes.

### SSO Configuration

*Super Admin only*

**Adding SSO Provider:**
1. Go to SSO Configuration tab
2. Click "Add Provider"
3. Enter provider details:
   - Provider name (Azure, Google, Okta)
   - Client ID
   - Client Secret
   - Redirect URL
4. Click "Save Configuration"
5. Test the configuration

**Enabling/Disabling Providers:**
1. Find the provider in the list
2. Toggle the "Enabled" switch
3. Existing sessions remain active
4. New logins are affected immediately

---

## Backup and Restore

*Super Admin only*

### Creating a Backup

1. Open Admin Panel
2. Go to Backup/Restore tab
3. Click "Export All Data"
4. Save the JSON file to a secure location
5. Backup includes:
   - All users (without passwords)
   - Table data
   - Configurations
   - Employee records
   - Audit logs (last 10,000 entries)

**Backup Best Practices:**
- Create backups weekly
- Store backups in multiple secure locations
- Test restore process periodically
- Keep backups for at least 90 days

### Restoring from Backup

1. Open Admin Panel
2. Go to Backup/Restore tab
3. Click "Import Backup"
4. Select your backup JSON file
5. Review the backup details
6. Click "Confirm Restore"
7. Wait for the import to complete
8. Verify data integrity

**Important Notes:**
- Restore operation cannot be undone
- Existing data may be overwritten
- Create a current backup before restoring
- All users will be logged out during restore

---

## Troubleshooting

### Cannot Log In

**Problem**: SSO login fails or redirects to error page

**Solutions:**
1. Verify you're using the correct SSO provider
2. Check your organization credentials
3. Clear browser cache and cookies
4. Try a different browser
5. Contact your administrator if account is blocked

### Session Expired

**Problem**: "Session expired" message appears

**Solutions:**
1. Click "OK" to return to login page
2. Log in again with your SSO credentials
3. Your data is safe and will be available after login

### Data Not Saving

**Problem**: Changes don't persist or error messages appear

**Solutions:**
1. Check your internet connection
2. Verify you have permission to edit
3. Refresh the page and try again
4. Check if another user is editing the same data
5. Contact administrator if problem persists

### Real-Time Updates Not Working

**Problem**: Don't see changes made by other users

**Solutions:**
1. Check internet connection
2. Refresh the page
3. Check browser console for errors
4. Verify Supabase connection is active
5. Contact administrator for system status

### Cannot Access Admin Panel

**Problem**: Admin Panel option not visible

**Solutions:**
1. Verify you have Admin or Super Admin role
2. Log out and log back in
3. Contact Super Admin to verify your role
4. Check if your account is blocked

### Upload Fails

**Problem**: File upload returns an error

**Solutions:**
1. Verify file format (CSV or JSON)
2. Check file size (must be under 5MB)
3. Ensure file has correct structure
4. Try a different file
5. Check browser console for specific error

### Performance Issues

**Problem**: Dashboard loads slowly or freezes

**Solutions:**
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try a different browser
5. Contact administrator if issue persists

### Forgot Which SSO Provider

**Problem**: Don't remember which SSO provider to use

**Solutions:**
1. Check with your IT department
2. Try the provider your organization uses for email
3. Contact your administrator
4. Check your welcome email

---

## Getting Help

### Contact Support

- **Email**: support@your-organization.com
- **Phone**: 1-800-XXX-XXXX
- **Hours**: Monday-Friday, 9 AM - 5 PM EST

### Administrator Contact

Contact your system administrator for:
- Account access issues
- Role changes
- Feature requests
- Data recovery
- System configuration

### Reporting Issues

When reporting an issue, include:
1. Your email address
2. Date and time of issue
3. What you were trying to do
4. Error messages (screenshot if possible)
5. Browser and operating system
6. Steps to reproduce the issue

---

## Security Best Practices

1. **Never share your credentials** with anyone
2. **Log out** when using shared computers
3. **Report suspicious activity** immediately
4. **Keep your browser updated** for security patches
5. **Use strong passwords** for your SSO account
6. **Enable two-factor authentication** if available
7. **Don't bypass** security warnings
8. **Review your audit logs** periodically

---

## Frequently Asked Questions

**Q: How long does my session last?**
A: Sessions last 8 hours. You'll receive a warning 30 minutes before expiration.

**Q: Can I use the dashboard on mobile?**
A: Yes, the dashboard is responsive and works on tablets and phones.

**Q: What happens to my data if I lose internet connection?**
A: Changes are queued and will sync automatically when connection is restored.

**Q: Can I export my data?**
A: Yes, Admins can export audit logs. Super Admins can export all system data.

**Q: How do I change my role?**
A: Contact a Super Admin to request a role change.

**Q: Is my data backed up?**
A: Yes, Super Admins perform regular backups. Data is also stored redundantly in Supabase.

**Q: Can I undo changes?**
A: No automatic undo, but audit logs track all changes. Contact an administrator for data recovery.

**Q: Why was I blocked?**
A: Contact your administrator. The block reason is visible to admins in the user management panel.

---

*Last Updated: October 2025*
*Version: 1.0*
