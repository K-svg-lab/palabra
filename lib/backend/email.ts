/**
 * Email Service
 * Handles sending transactional emails (verification, password reset, etc.)
 * Uses Resend API (can be swapped for SendGrid, AWS SES, etc.)
 */

import { Resend } from 'resend';

// Initialize email client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@palabra.app';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Palabra';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Email types
 */
export type EmailType = 
  | 'verification'
  | 'password-reset'
  | 'welcome'
  | 'password-changed';

/**
 * Email data for verification
 */
export interface VerificationEmailData {
  email: string;
  name?: string;
  verificationUrl: string;
}

/**
 * Email data for password reset
 */
export interface PasswordResetEmailData {
  email: string;
  name?: string;
  resetUrl: string;
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  data: VerificationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error('[Email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data: response, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.email,
      subject: 'Verify your Palabra account',
      html: getVerificationEmailHTML(data),
      text: getVerificationEmailText(data),
    });

    if (error) {
      console.error('[Email] Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Verification email sent:', response?.id);
    return { success: true };
  } catch (error) {
    console.error('[Email] Exception sending verification email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error('[Email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data: response, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.email,
      subject: 'Reset your Palabra password',
      html: getPasswordResetEmailHTML(data),
      text: getPasswordResetEmailText(data),
    });

    if (error) {
      console.error('[Email] Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Password reset email sent:', response?.id);
    return { success: true };
  } catch (error) {
    console.error('[Email] Exception sending password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  email: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error('[Email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data: response, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your Palabra password was changed',
      html: getPasswordChangedEmailHTML(name),
      text: getPasswordChangedEmailText(name),
    });

    if (error) {
      console.error('[Email] Failed to send password changed email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Password changed email sent:', response?.id);
    return { success: true };
  } catch (error) {
    console.error('[Email] Exception sending password changed email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================================================
// EMAIL TEMPLATES (HTML)
// ============================================================================

function getVerificationEmailHTML(data: VerificationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 40px 0 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #007AFF; }
    .content { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 24px; margin: 0 0 20px; color: #1d1d1f; }
    p { margin: 0 0 20px; color: #6e6e73; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #86868b; font-size: 14px; }
    .footer a { color: #007AFF; text-decoration: none; }
    .code-box { background: #f5f5f7; padding: 16px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 600; letter-spacing: 2px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Palabra</div>
    </div>
    <div class="content">
      <h1>Verify your email address</h1>
      <p>Hi${data.name ? ` ${data.name}` : ''},</p>
      <p>Thanks for signing up for Palabra! To complete your registration and start learning Spanish, please verify your email address.</p>
      <div style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p style="font-size: 14px; color: #86868b;">Or copy and paste this link into your browser:</p>
      <div class="code-box">${data.verificationUrl}</div>
      <p style="font-size: 14px; color: #86868b;">This link will expire in 24 hours.</p>
      <p style="font-size: 14px; color: #86868b;">If you didn't create a Palabra account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2026 Palabra. All rights reserved.</p>
      <p><a href="${BASE_URL}/privacy">Privacy Policy</a> · <a href="${BASE_URL}/terms">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

function getPasswordResetEmailHTML(data: PasswordResetEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 40px 0 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #007AFF; }
    .content { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 24px; margin: 0 0 20px; color: #1d1d1f; }
    p { margin: 0 0 20px; color: #6e6e73; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #86868b; font-size: 14px; }
    .footer a { color: #007AFF; text-decoration: none; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Palabra</div>
    </div>
    <div class="content">
      <h1>Reset your password</h1>
      <p>Hi${data.name ? ` ${data.name}` : ''},</p>
      <p>We received a request to reset your Palabra password. Click the button below to choose a new password:</p>
      <div style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      <div class="warning">
        <p style="margin: 0; font-size: 14px;"><strong>⚠️ Security Notice:</strong> This link will expire in 30 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
      <p style="font-size: 14px; color: #86868b;">Or copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #86868b; word-break: break-all;">${data.resetUrl}</p>
    </div>
    <div class="footer">
      <p>© 2026 Palabra. All rights reserved.</p>
      <p><a href="${BASE_URL}/privacy">Privacy Policy</a> · <a href="${BASE_URL}/terms">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

function getPasswordChangedEmailHTML(name?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password changed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 40px 0 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #007AFF; }
    .content { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 24px; margin: 0 0 20px; color: #1d1d1f; }
    p { margin: 0 0 20px; color: #6e6e73; }
    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #86868b; font-size: 14px; }
    .footer a { color: #007AFF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Palabra</div>
    </div>
    <div class="content">
      <h1>Password changed successfully</h1>
      <p>Hi${name ? ` ${name}` : ''},</p>
      <div class="success">
        <p style="margin: 0; font-size: 14px;"><strong>✓ Your password has been changed</strong></p>
      </div>
      <p>This email confirms that your Palabra password was successfully changed. You can now sign in with your new password.</p>
      <p style="font-size: 14px; color: #86868b;"><strong>Didn't make this change?</strong> If you didn't change your password, please contact our support team immediately at <a href="mailto:support@palabra.app">support@palabra.app</a>.</p>
    </div>
    <div class="footer">
      <p>© 2026 Palabra. All rights reserved.</p>
      <p><a href="${BASE_URL}/privacy">Privacy Policy</a> · <a href="${BASE_URL}/terms">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// EMAIL TEMPLATES (PLAIN TEXT)
// ============================================================================

function getVerificationEmailText(data: VerificationEmailData): string {
  return `
Verify your email address

Hi${data.name ? ` ${data.name}` : ''},

Thanks for signing up for Palabra! To complete your registration and start learning Spanish, please verify your email address.

Click or copy this link to verify your email:
${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create a Palabra account, you can safely ignore this email.

---
© 2026 Palabra. All rights reserved.
Privacy Policy: ${BASE_URL}/privacy
Terms of Service: ${BASE_URL}/terms
  `;
}

function getPasswordResetEmailText(data: PasswordResetEmailData): string {
  return `
Reset your password

Hi${data.name ? ` ${data.name}` : ''},

We received a request to reset your Palabra password. Click the link below to choose a new password:

${data.resetUrl}

⚠️ SECURITY NOTICE: This link will expire in 30 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.

---
© 2026 Palabra. All rights reserved.
Privacy Policy: ${BASE_URL}/privacy
Terms of Service: ${BASE_URL}/terms
  `;
}

function getPasswordChangedEmailText(name?: string): string {
  return `
Password changed successfully

Hi${name ? ` ${name}` : ''},

✓ Your password has been changed

This email confirms that your Palabra password was successfully changed. You can now sign in with your new password.

Didn't make this change? If you didn't change your password, please contact our support team immediately at support@palabra.app.

---
© 2026 Palabra. All rights reserved.
Privacy Policy: ${BASE_URL}/privacy
Terms of Service: ${BASE_URL}/terms
  `;
}
