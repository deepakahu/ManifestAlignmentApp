/**
 * Supabase Authentication Service
 * Handles all authentication operations for the mobile app
 */

import { AuthError, Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase, isSupabaseConfigured } from '../supabase/SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete auth session for OAuth
WebBrowser.maybeCompleteAuthSession();

// Types
export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: AuthError | Error | null;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export type AuthProvider = 'google' | 'apple';

/**
 * Supabase Authentication Service
 */
export class SupabaseAuthService {
  private static redirectUrl = AuthSession.makeRedirectUri({
    scheme: 'manifestexpo',
    path: 'auth-callback',
  });

  /**
   * Sign up with email and password
   */
  static async signUp({ email, password, name }: SignUpData): Promise<AuthResult> {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          error: new Error('Supabase is not configured'),
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name ?? email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Sign up failed'),
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn({ email, password }: SignInData): Promise<AuthResult> {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          error: new Error('Supabase is not configured'),
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      };
    }
  }

  /**
   * Sign in with OAuth provider (Google or Apple)
   */
  static async signInWithOAuth(provider: AuthProvider): Promise<AuthResult> {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          error: new Error('Supabase is not configured'),
        };
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: this.redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { success: false, error };
      }

      if (data.url) {
        // Open OAuth URL in browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          this.redirectUrl
        );

        if (result.type === 'success') {
          // Extract tokens from URL
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session manually
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              return { success: false, error: sessionError };
            }

            return {
              success: true,
              user: sessionData.user,
              session: sessionData.session,
            };
          }
        }

        return {
          success: false,
          error: new Error('OAuth authentication was cancelled or failed'),
        };
      }

      return {
        success: false,
        error: new Error('Failed to get OAuth URL'),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('OAuth sign in failed'),
      };
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<AuthResult> {
    return this.signInWithOAuth('google');
  }

  /**
   * Sign in with Apple
   */
  static async signInWithApple(): Promise<AuthResult> {
    return this.signInWithOAuth('apple');
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Sign out failed'),
      };
    }
  }

  /**
   * Get the current session
   */
  static async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get the current user
   */
  static async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Refresh the current session
   */
  static async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Session refresh failed'),
      };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.redirectUrl}?type=recovery`,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Password reset failed'),
      };
    }
  }

  /**
   * Update password (when user is authenticated)
   */
  static async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Password update failed'),
      };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }

  /**
   * Delete account (requires user to be authenticated)
   */
  static async deleteAccount(): Promise<AuthResult> {
    try {
      // Note: This requires a Supabase Edge Function or server-side logic
      // For now, we'll just sign out the user
      // In production, implement proper account deletion
      console.warn('Account deletion requires server-side implementation');
      return await this.signOut();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Account deletion failed'),
      };
    }
  }
}

export default SupabaseAuthService;
