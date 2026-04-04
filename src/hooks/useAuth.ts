/**
 * Auth Hook - Re-export from AuthContext
 * Provides easy access to authentication state and methods
 */

export { useAuth } from '../context/AuthContext';
export type { AuthResult, SignUpData, SignInData, AuthProvider } from '../services/auth/SupabaseAuthService';
