# Password Reset Setup Guide

This guide explains how to configure the forgot password / password reset feature in the Pandora Booking System.

## Overview

The password reset flow consists of:
1. **Forgot Password Page** (`/auth/forgot-password`) - User requests reset link
2. **Email with Reset Link** - Sent by Supabase with secure token
3. **Reset Password Page** (`/auth/reset-password`) - User sets new password
4. **Auto-redirect to Login** - After successful reset

## Supabase Configuration Required

### 1. Configure Site URL in Supabase Dashboard

**🚨 CRITICAL:** The redirect is going to `/booking` because your Supabase Site URL is misconfigured.

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **URL Configuration**
3. Find **Site URL** (at the top)
4. **Change from:** `https://pandora-booking.vercel.app/booking`
5. **Change to:** `https://pandora-booking.vercel.app`
   - **Remove the `/booking` suffix!**
6. Click **Save**

### 2. Configure Redirect URLs

Add your reset password URL to **Redirect URLs** (same page, below Site URL):

1. Under **Redirect URLs**, click **Add URL**
2. Add these URLs:
   - `https://pandora-booking.vercel.app/auth/reset-password`
   - `https://pandora-booking.vercel.app/**` (wildcard for all routes)
   - `http://localhost:3000/auth/reset-password` (for development)
3. Click **Save**

### 3. Customize Email Template (Optional)

To customize the password reset email appearance:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **"Reset Password"** template
3. Customize the email content while keeping the `{{ .ConfirmationURL }}` variable
4. Example template:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password for Pandora Beauty Salon.</p>
<p>Click the button below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 60 minutes.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

**Important:** The `{{ .ConfirmationURL }}` variable must be included in the template.

### 4. Email Settings

Ensure email delivery is configured:

1. Go to **Authentication** → **Settings** → **Email**
2. Verify **SMTP Settings** or use Supabase's default email service
3. Test email delivery by sending a test reset request

## Error Handling

The reset password page handles these error scenarios:

### Expired Link (`otp_expired`)
- **Error Message:** "This password reset link has expired. Reset links are valid for 60 minutes."
- **Solution:** User must request a new reset link

### Invalid/Used Link (`otp_disabled`)
- **Error Message:** "This password reset link is invalid or has already been used."
- **Solution:** User must request a new reset link

### Other Errors
- Generic error handling with user-friendly messages
- "Request New Reset Link" button always available

## Testing the Flow

### Development Testing

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/login`
3. Click "Forgot password?"
4. Enter your email address
5. Check your email inbox (and spam folder)
6. Click the reset link
7. Enter new password
8. Verify redirect to login page

### Production Testing

1. Deploy to Vercel
2. Ensure redirect URL is added in Supabase dashboard
3. Test the complete flow on production URL

## Troubleshooting

### Error: "Invalid redirect URL"
**Cause:** Redirect URL not whitelisted in Supabase
**Solution:** Add the URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

### Error redirects to wrong page (e.g., `/booking`)
**Cause:** Your Supabase **Site URL** is set to `https://pandora-booking.vercel.app/booking` instead of `https://pandora-booking.vercel.app`

**Solution:**
1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Change **Site URL** from `https://pandora-booking.vercel.app/booking` to `https://pandora-booking.vercel.app`
3. **Remove the `/booking` suffix completely**
4. Click **Save**
5. Test again by requesting a new password reset

**Why this happens:**
- Supabase uses the Site URL as the base for all redirects
- If Site URL includes `/booking`, all auth redirects go there
- The `redirectTo` parameter is ignored if it conflicts with Site URL
- Fix: Site URL should be your domain root without any path

**Additional checks:**
1. Verify **Redirect URLs** includes `https://pandora-booking.vercel.app/auth/reset-password`
2. Check Supabase Dashboard → Authentication → Email Templates → Reset Password
3. Ensure the template uses `{{ .ConfirmationURL }}` (not a hardcoded URL)

### Email not received
**Cause:** Email delivery issues or spam filtering
**Solution:**
1. Check Supabase logs: Dashboard → Logs → Auth Logs
2. Verify SMTP settings in Supabase
3. Check user's spam folder
4. Test with different email providers

### Link expires too quickly
**Cause:** Default Supabase setting is 60 minutes
**Solution:**
1. This is a security feature and cannot be extended
2. Users must request a new link if expired

## Security Features

- **Token Expiry:** Reset links expire after 60 minutes
- **One-time Use:** Reset tokens can only be used once
- **Secure Tokens:** Supabase generates cryptographically secure tokens
- **Password Validation:** Minimum 6 characters required
- **Confirmation Required:** Users must confirm password before submission

## Code Files

| File | Purpose |
|------|---------|
| `app/auth/forgot-password/page.tsx` | Request reset link page |
| `app/auth/reset-password/page.tsx` | Set new password page |
| `app/auth/login/page.tsx` | Contains "Forgot password?" link |

## API Methods Used

```typescript
// Request password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
})

// Update password
await supabase.auth.updateUser({
  password: newPassword
})
```

## User Experience Flow

```
1. User clicks "Forgot password?" on login page
   ↓
2. User enters email on /auth/forgot-password
   ↓
3. System sends reset email via Supabase
   ↓
4. User receives email with reset link
   ↓
5. User clicks link → redirected to /auth/reset-password
   ↓
6. User enters new password (with confirmation)
   ↓
7. Password updated successfully
   ↓
8. Auto-redirect to /auth/login after 3 seconds
   ↓
9. User logs in with new password
```

## Support

If users encounter issues:
1. Verify email is registered in the system
2. Check spam/junk folders for reset email
3. Ensure reset link hasn't expired (60 min limit)
4. Request a new reset link if needed
5. Contact admin if persistent issues occur
