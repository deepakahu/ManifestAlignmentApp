/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import {
  SupabaseAuthService,
  AuthResult,
  SignUpData,
  SignInData,
  AuthProvider,
} from '../services/auth/SupabaseAuthService';
import { isSupabaseConfigured } from '../services/supabase/SupabaseClient';

// Types
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (data: SignUpData) => Promise<AuthResult>;
  signIn: (data: SignInData) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  refreshSession: () => Promise<AuthResult>;
}

// Default context value
const defaultContextValue: AuthContextValue = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isConfigured: false,
  signUp: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  signIn: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  signInWithGoogle: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  signInWithApple: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  signOut: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  resetPassword: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  updatePassword: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  refreshSession: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
};

// Create context
const AuthContext = createContext<AuthContextValue>(defaultContextValue);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isConfigured: isSupabaseConfigured(),
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isConfigured: false,
            }));
          }
          return;
        }

        const session = await SupabaseAuthService.getSession();
        const user = await SupabaseAuthService.getUser();

        if (mounted) {
          setState({
            user,
            session,
            isLoading: false,
            isAuthenticated: session !== null,
            isConfigured: true,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const unsubscribe = SupabaseAuthService.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          setState(prev => ({
            ...prev,
            session,
            user: session?.user ?? null,
            isAuthenticated: session !== null,
          }));

          // Handle specific auth events
          switch (event) {
            case 'SIGNED_IN':
              console.log('User signed in');
              break;
            case 'SIGNED_OUT':
              console.log('User signed out');
              break;
            case 'TOKEN_REFRESHED':
              console.log('Token refreshed');
              break;
            case 'USER_UPDATED':
              console.log('User updated');
              break;
            case 'PASSWORD_RECOVERY':
              console.log('Password recovery initiated');
              break;
          }
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Auth methods
  const signUp = useCallback(async (data: SignUpData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await SupabaseAuthService.signUp(data);
    setState(prev => ({
      ...prev,
      isLoading: false,
      user: result.user ?? null,
      session: result.session ?? null,
      isAuthenticated: result.success && result.session !== null,
    }));
    return result;
  }, []);

  const signIn = useCallback(async (data: SignInData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await SupabaseAuthService.signIn(data);
    setState(prev => ({
      ...prev,
      isLoading: false,
      user: result.user ?? null,
      session: result.session ?? null,
      isAuthenticated: result.success && result.session !== null,
    }));
    return result;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await SupabaseAuthService.signInWithGoogle();
    setState(prev => ({
      ...prev,
      isLoading: false,
      user: result.user ?? null,
      session: result.session ?? null,
      isAuthenticated: result.success && result.session !== null,
    }));
    return result;
  }, []);

  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await SupabaseAuthService.signInWithApple();
    setState(prev => ({
      ...prev,
      isLoading: false,
      user: result.user ?? null,
      session: result.session ?? null,
      isAuthenticated: result.success && result.session !== null,
    }));
    return result;
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await SupabaseAuthService.signOut();
    setState(prev => ({
      ...prev,
      isLoading: false,
      user: null,
      session: null,
      isAuthenticated: false,
    }));
    return result;
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    return SupabaseAuthService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    return SupabaseAuthService.updatePassword(newPassword);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    const result = await SupabaseAuthService.refreshSession();
    if (result.success) {
      setState(prev => ({
        ...prev,
        user: result.user ?? null,
        session: result.session ?? null,
        isAuthenticated: result.session !== null,
      }));
    }
    return result;
  }, []);

  // Context value
  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
