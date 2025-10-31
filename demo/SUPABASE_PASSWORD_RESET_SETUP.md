# Supabase Password Reset Configuration Guide

This guide shows you where to configure password reset settings in your Supabase dashboard.

## Step 1: Access Your Supabase Project

1. Go to https://supabase.com
2. Sign in to your account
3. Select your TOM Analytics Dashboard project

## Step 2: Configure Email Templates

### Location:
**Authentication → Email Templates**

### Steps:
1. In the left sidebar, click **Authentication**
2. Click on **Email Templates** tab
3. Find **Reset Password** in the list
4. Click **Edit** on the Reset Password template

### Customize the Email:
You can customize the email that users receive. Here's a recommended template:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You recently requested to reset your password for your TOM Analytics Dashboard account.</p>
<p>Click the button below to reset your password. This link will expire in 60 minutes.</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #FF9900; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks,<br>TOM Analytics Team</p>
```

**Important:** Keep the `{{ .ConfirmationURL }}` variable - this is where Supabase inserts the reset link.

## Step 3: Configure Redirect URLs

### Location:
**Authentication → URL Configuration**

### Steps:
1. In the left sidebar, click **Authentication**
2. Scroll down to **URL Configuration** section
3. Find **Redirect URLs** field

### Add These URLs:

For **Development** (if using Live Server on port 5500):
```
http://localhost:5500/demo/reset-password.html
http://127.0.0.1:5500/demo/reset-password.html
```

For **Production** (replace with your actual domain):
```
https://yourdomain.com/demo/reset-password.html
```

**Note:** Add each URL on a new line in the Redirect URLs field.

## Step 4: Configure Email Settings (Optional)

### Location:
**Project Settings → Authentication**

### Settings to Review:
1. **Enable Email Confirmations** - You can enable/disable this
2. **Secure Email Change** - Recommended to keep enabled
3. **Email Rate Limits** - Default is 3 emails per hour (good for security)

## Step 5: Test Email Delivery

### Using Supabase's Built-in SMTP:
Supabase provides email delivery out of the box. No additional configuration needed for testing.

### For Production (Optional):
You can configure a custom SMTP provider:

1. Go to **Project Settings → Authentication**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your SMTP credentials (Gmail, SendGrid, AWS SES, etc.)

## Step 6: Check Email Provider Settings

### Location:
**Project Settings → Authentication → Email Provider**

### Verify:
- **Enable Email Provider** should be ON (green toggle)
- **Confirm Email** - Set based on your preference
  - ON = Users must confirm email before they can log in
  - OFF = Users can log in immediately after signup

## Common Issues & Solutions

### Issue: Not receiving reset emails
**Solutions:**
1. Check your spam/junk folder
2. Verify the email address is correct
3. Check Supabase logs: **Logs → Auth Logs**
4. Ensure Email Provider is enabled
5. Check rate limits haven't been exceeded

### Issue: Reset link doesn't work
**Solutions:**
1. Verify redirect URL is added to allowed list
2. Check that the link hasn't expired (60 minutes default)
3. Make sure you're using the correct domain (localhost vs production)

### Issue: "Invalid redirect URL" error
**Solutions:**
1. Add the exact URL to Redirect URLs in Authentication settings
2. Include the protocol (http:// or https://)
3. Include the port number if using localhost (e.g., :5500)

## Testing Your Setup

1. Go to `http://localhost:5500/demo/login.html`
2. Click "Forgot Password?"
3. Enter your @amazon.com email
4. Check your email for the reset link
5. Click the link (should redirect to reset-password.html)
6. Enter a new password
7. Verify you can log in with the new password

## Security Notes

- Reset tokens expire after 60 minutes (configurable in Supabase)
- Tokens are single-use only
- Rate limiting prevents abuse (3 requests per hour per email)
- Generic success messages prevent account enumeration
- All tokens are cryptographically secure

## Need Help?

If you're having issues:
1. Check Supabase Auth Logs: **Logs → Auth Logs**
2. Check browser console for errors
3. Verify your Supabase project URL and anon key in `js/supabase-config.js`
4. Check Supabase documentation: https://supabase.com/docs/guides/auth/passwords
