/**
 * Auth Configuration
 *
 * Centralized configuration for all Supabase authentication flows
 * Ensures consistent redirect URLs across login, signup, OTP, and password reset
 */

/**
 * Get the auth redirect URL for email verification and OAuth callbacks
 */
export function getAuthRedirectUrl(): string {
  return process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL || 'https://manifestationalarm.com/auth/callback';
}

/**
 * Get the auth redirect URL with a custom next path
 * @param nextPath - Path to redirect to after authentication (e.g., '/reset-password')
 */
export function getAuthRedirectUrlWithNext(nextPath: string): string {
  const baseUrl = getAuthRedirectUrl();
  return `${baseUrl}?next=${nextPath}`;
}

/**
 * Standard auth options for Supabase signUp
 */
export const signUpOptions = {
  emailRedirectTo: getAuthRedirectUrl(),
};

/**
 * Standard auth options for Supabase signInWithOtp
 * Use this for magic link / passwordless authentication
 */
export const otpOptions = {
  emailRedirectTo: getAuthRedirectUrl(),
};

/**
 * Standard auth options for Supabase OAuth
 */
export const oauthOptions = {
  redirectTo: getAuthRedirectUrl(),
};

/**
 * Standard auth options for password reset
 */
export const passwordResetOptions = {
  redirectTo: getAuthRedirectUrlWithNext('/reset-password'),
};

/**
 * Example usage:
 *
 * // Sign up
 * await supabase.auth.signUp({
 *   email,
 *   password,
 *   options: signUpOptions
 * })
 *
 * // OTP / Magic Link
 * await supabase.auth.signInWithOtp({
 *   email,
 *   options: otpOptions
 * })
 *
 * // OAuth
 * await supabase.auth.signInWithOAuth({
 *   provider: 'google',
 *   options: oauthOptions
 * })
 *
 * // Password Reset
 * await supabase.auth.resetPasswordForEmail(email, passwordResetOptions)
 */
