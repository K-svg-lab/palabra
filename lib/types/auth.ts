/**
 * Type definitions for authentication
 */

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication session
 */
export interface AuthSession {
  user: UserProfile;
  expires: Date;
  accessToken?: string;
}

/**
 * Authentication status
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

/**
 * OAuth provider
 */
export type OAuthProvider = 'google' | 'github' | 'apple';

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
}

/**
 * Email verification
 */
export interface EmailVerification {
  token: string;
}

/**
 * Authentication error
 */
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  session?: AuthSession;
  error?: AuthError;
}

