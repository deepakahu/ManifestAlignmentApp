/**
 * Mailgun Email Service
 * Handles sending emails for notifications, invitations, and account management
 */

// Email configuration from environment variables
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Validate required environment variables
if (!MAILGUN_API_KEY) {
  console.warn('MAILGUN_API_KEY is not set. Email sending will fail.');
}
if (!MAILGUN_DOMAIN) {
  console.warn('MAILGUN_DOMAIN is not set. Email sending will fail.');
}
if (!MAILGUN_FROM_EMAIL) {
  console.warn('MAILGUN_FROM_EMAIL is not set. Email sending will fail.');
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Mailgun API
 */
export async function sendEmail({ to, subject, html, text }: EmailParams): Promise<boolean> {
  try {
    // Validate required environment variables
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) {
      console.error('Missing required Mailgun environment variables');
      return false;
    }

    const formData = new URLSearchParams();
    formData.append('from', MAILGUN_FROM_EMAIL);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);
    if (text) {
      formData.append('text', text);
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailgun error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>We received a request to reset your password for your Manifestation account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The Manifestation Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Manifestation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Reset Your Password

Hi there,

We received a request to reset your password for your Manifestation account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Manifestation Team
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Manifestation Password',
    html,
    text,
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerification(email: string, verificationLink: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Welcome to Manifestation!</p>
            <p>Thanks for signing up. Please verify your email address to get started with transforming your dreams into reality.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${verificationLink}</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Best regards,<br>The Manifestation Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Manifestation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Verify Your Email

Welcome to Manifestation!

Thanks for signing up. Please verify your email address to get started with transforming your dreams into reality.

Click the link below to verify your email:
${verificationLink}

If you didn't create an account, you can safely ignore this email.

Best regards,
The Manifestation Team
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Manifestation Account',
    html,
    text,
  });
}

/**
 * Send notification to accountability partner when activity is logged
 */
export async function sendActivityLoggedNotification(
  partnerEmail: string,
  partnerName: string,
  userName: string,
  challengeTitle: string,
  activityTitle: string,
  challengeId: string
): Promise<boolean> {
  const approvalLink = `${APP_URL}/discipline/challenges/${challengeId}/approvals`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .activity-box { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Activity Pending Approval</h1>
          </div>
          <div class="content">
            <p>Hi ${partnerName},</p>
            <p><strong>${userName}</strong> has logged an activity that needs your approval as their accountability partner.</p>

            <div class="activity-box">
              <p><strong>Challenge:</strong> ${challengeTitle}</p>
              <p><strong>Activity:</strong> ${activityTitle}</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b;">⏳ Pending Approval</span></p>
            </div>

            <p>Your role as an accountability partner is crucial to ${userName}'s success. Please review and approve or reject this activity completion.</p>

            <p style="text-align: center;">
              <a href="${approvalLink}" class="button">Review & Approve Activity</a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              💡 <strong>Tip:</strong> Review the activity details carefully to ensure ${userName} is staying committed to their goals.
            </p>

            <p>Best regards,<br>The Manifestation Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Manifestation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Activity Pending Approval

Hi ${partnerName},

${userName} has logged an activity that needs your approval as their accountability partner.

Challenge: ${challengeTitle}
Activity: ${activityTitle}
Status: Pending Approval

Your role as an accountability partner is crucial to ${userName}'s success. Please review and approve or reject this activity completion.

Review & Approve: ${approvalLink}

Best regards,
The Manifestation Team
  `;

  return sendEmail({
    to: partnerEmail,
    subject: `${userName} logged an activity - Approval needed`,
    html,
    text,
  });
}

/**
 * Send challenge invitation email
 */
export async function sendChallengeInvitation(
  inviteeEmail: string,
  inviteeName: string,
  inviterName: string,
  challengeTitle: string,
  challengeDescription: string,
  challengeId: string,
  role: 'participant' | 'accountability_partner'
): Promise<boolean> {
  const acceptLink = `${APP_URL}/discipline/challenges/${challengeId}?invite=accept`;

  const roleText = role === 'accountability_partner'
    ? 'accountability partner'
    : 'participant';

  const roleDescription = role === 'accountability_partner'
    ? 'As an accountability partner, you\'ll help verify activity completions and support your partner in achieving their goals.'
    : 'As a participant, you\'ll work alongside others to complete activities and achieve your goals together.';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .challenge-box { background: white; border: 2px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 10px; }
          .badge { display: inline-block; background: #4f46e5; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 You're Invited to a Challenge!</h1>
          </div>
          <div class="content">
            <p>Hi ${inviteeName || 'there'},</p>
            <p><strong>${inviterName}</strong> has invited you to join a challenge as ${roleText}.</p>

            <div class="challenge-box">
              <span class="badge">${role === 'accountability_partner' ? '🤝 ACCOUNTABILITY PARTNER' : '👥 PARTICIPANT'}</span>
              <h2 style="margin: 10px 0; color: #1f2937;">${challengeTitle}</h2>
              ${challengeDescription ? `<p style="color: #6b7280;">${challengeDescription}</p>` : ''}
            </div>

            <p>${roleDescription}</p>

            <p style="text-align: center;">
              <a href="${acceptLink}" class="button">Accept Invitation</a>
            </p>

            <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>💡 Why join?</strong><br>
              Challenges with accountability partners have a <strong>3x higher success rate</strong>. By joining, you're helping ${inviterName} achieve their goals while building discipline together!
            </p>

            <p>Don't have an account yet? Clicking the invitation link will let you sign up and join the challenge.</p>

            <p>Best regards,<br>The Manifestation Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Manifestation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You're Invited to a Challenge!

Hi ${inviteeName || 'there'},

${inviterName} has invited you to join a challenge as ${roleText}.

Challenge: ${challengeTitle}
${challengeDescription ? `Description: ${challengeDescription}` : ''}

${roleDescription}

Accept Invitation: ${acceptLink}

Why join? Challenges with accountability partners have a 3x higher success rate. By joining, you're helping ${inviterName} achieve their goals while building discipline together!

Don't have an account yet? Clicking the invitation link will let you sign up and join the challenge.

Best regards,
The Manifestation Team
  `;

  return sendEmail({
    to: inviteeEmail,
    subject: `${inviterName} invited you to join "${challengeTitle}"`,
    html,
    text,
  });
}

/**
 * Send daily summary to accountability partner
 */
export async function sendDailySummaryToPartner(
  partnerEmail: string,
  partnerName: string,
  userName: string,
  challengeTitle: string,
  activitiesLogged: number,
  totalActivities: number,
  challengeId: string
): Promise<boolean> {
  const viewLink = `${APP_URL}/discipline/challenges/${challengeId}`;
  const completionRate = totalActivities > 0 ? Math.round((activitiesLogged / totalActivities) * 100) : 0;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats-box { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
          .stat { display: inline-block; margin: 0 20px; }
          .stat-value { font-size: 36px; font-weight: bold; color: #10b981; }
          .stat-label { font-size: 14px; color: #6b7280; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Progress Report</h1>
          </div>
          <div class="content">
            <p>Hi ${partnerName},</p>
            <p>Here's today's progress update for <strong>${userName}</strong> in the challenge "${challengeTitle}".</p>

            <div class="stats-box">
              <div class="stat">
                <div class="stat-value">${activitiesLogged}/${totalActivities}</div>
                <div class="stat-label">Activities Logged</div>
              </div>
              <div class="stat">
                <div class="stat-value">${completionRate}%</div>
                <div class="stat-label">Completion Rate</div>
              </div>
            </div>

            ${activitiesLogged === totalActivities
              ? `<p style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px;">
                  ✅ <strong>Amazing!</strong> ${userName} completed all activities today!
                </p>`
              : `<p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px;">
                  ⚠️ ${userName} has ${totalActivities - activitiesLogged} pending activity${totalActivities - activitiesLogged > 1 ? 'ies' : 'y'} today.
                </p>`
            }

            <p style="text-align: center;">
              <a href="${viewLink}" class="button">View Full Progress</a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              Your support as an accountability partner makes a huge difference in ${userName}'s journey!
            </p>

            <p>Best regards,<br>The Manifestation Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Manifestation. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Daily Progress Report

Hi ${partnerName},

Here's today's progress update for ${userName} in the challenge "${challengeTitle}".

Activities Logged: ${activitiesLogged}/${totalActivities}
Completion Rate: ${completionRate}%

${activitiesLogged === totalActivities
  ? `Amazing! ${userName} completed all activities today!`
  : `${userName} has ${totalActivities - activitiesLogged} pending activity${totalActivities - activitiesLogged > 1 ? 'ies' : 'y'} today.`
}

View Full Progress: ${viewLink}

Your support as an accountability partner makes a huge difference in ${userName}'s journey!

Best regards,
The Manifestation Team
  `;

  return sendEmail({
    to: partnerEmail,
    subject: `Daily Update: ${userName}'s progress in "${challengeTitle}"`,
    html,
    text,
  });
}
