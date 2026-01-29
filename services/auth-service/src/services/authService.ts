import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import { passwordResetRepository } from '../repositories/passwordResetRepository';
import { emailVerificationRepository } from '../repositories/emailVerificationRepository';
import { emailService } from '../utils/emailService';
import { logger } from '../../../../shared/utils/logger';
import { UnauthorizedError, NotFoundError, ConflictError, ValidationError } from '../../../../shared/utils/errors';
import { env } from '../config/env';

export interface RegisterInput {
  email: string;
  password: string;
  role?: 'ADMIN' | 'SELLER' | 'CUSTOMER';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

export interface RequestPasswordResetInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

/**
 * Auth Service - Business Logic Layer
 * Handles authentication business logic: password hashing, JWT generation, token management
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check if user already exists
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user in database
    const user = await userRepository.createUser(input.email, passwordHash, input.role || 'CUSTOMER');

    // Generate email verification token
    const verificationToken = this.generateSecureToken();
    const verificationExpiry = new Date(
      Date.now() + (parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '72') * 60 * 60 * 1000)
    );
    await emailVerificationRepository.create(user.id, verificationToken, verificationExpiry);

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role);

    // Store refresh token
    await tokenRepository.createRefreshToken(
      user.id,
      tokens.refreshToken,
      new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 days
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: false
      },
      ...tokens
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResult> {
    // Find user by email
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const match = await bcrypt.compare(input.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role);

    // Store refresh token
    await tokenRepository.createRefreshToken(
      user.id,
      tokens.refreshToken,
      new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 days
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      ...tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResult> {
    // Find stored refresh token
    const stored = await tokenRepository.findRefreshToken(refreshToken);
    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Verify token signature
    try {
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await userRepository.findById(stored.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Delete old refresh token
    await tokenRepository.deleteRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(user.id, user.role);

    // Store new refresh token
    await tokenRepository.createRefreshToken(
      user.id,
      tokens.refreshToken,
      new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 days
    );

    return tokens;
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string, role: string): TokenResult {
    const accessToken = jwt.sign(
      { sub: userId, role },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Introspect token (SSO) – validate access token and return claims for other services
   */
  introspectToken(accessToken: string): { active: boolean; sub?: string; role?: string; exp?: number } {
    if (!accessToken?.trim()) {
      return { active: false };
    }
    try {
      const decoded = jwt.verify(accessToken.trim(), env.JWT_SECRET) as { sub: string; role: string; exp: number };
      return {
        active: true,
        sub: decoded.sub,
        role: decoded.role,
        exp: decoded.exp
      };
    } catch {
      return { active: false };
    }
  }

  /**
   * Logout (SSO) – revoke refresh token so client cannot obtain new access tokens
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken?.trim()) return;
    try {
      jwt.verify(refreshToken.trim(), env.JWT_REFRESH_SECRET);
      await tokenRepository.deleteRefreshToken(refreshToken.trim());
      logger.info('Refresh token revoked (logout)');
    } catch {
      // Invalid or expired – treat as already logged out
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(input: RequestPasswordResetInput): Promise<void> {
    // Find user by email
    const user = await userRepository.findByEmail(input.email);
    
    // Don't reveal if user exists (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return;
    }

    // Delete existing reset tokens for this user
    await passwordResetRepository.deleteByUserId(user.id);

    // Generate reset token
    const resetToken = this.generateSecureToken();
    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '24') * 60 * 60 * 1000)
    );

    // Store reset token
    await passwordResetRepository.create(user.id, resetToken, expiresAt);

    // Send reset email
    const emailResult = await emailService.sendPasswordResetEmail(user.email, resetToken);
    if (!emailResult.success) {
      logger.warn({ 
        email: user.email, 
        error: emailResult.error 
      }, 'Failed to send password reset email');
      // Still return success to prevent email enumeration
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    // Find token
    const resetToken = await passwordResetRepository.findByToken(input.token);
    if (!resetToken) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Check if token is used
    if (resetToken.used) {
      throw new UnauthorizedError('Reset token has already been used');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Reset token has expired');
    }

    // Validate new password
    if (!input.newPassword || input.newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    // Update user password
    await userRepository.updatePassword(resetToken.userId, passwordHash);

    // Mark token as used
    await passwordResetRepository.markAsUsed(input.token);

    // Delete all refresh tokens for security
    // (Optional: force user to login again)
  }

  /**
   * Verify email address
   */
  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    // Find token
    const verificationToken = await emailVerificationRepository.findByToken(input.token);
    if (!verificationToken) {
      throw new UnauthorizedError('Invalid or expired verification token');
    }

    // Check if token is used
    if (verificationToken.used) {
      throw new UnauthorizedError('Verification token has already been used');
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Verification token has expired');
    }

    // Mark email as verified
    await userRepository.verifyEmail(verificationToken.userId);

    // Mark token as used
    await emailVerificationRepository.markAsUsed(input.token);
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    if (user.emailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Delete existing verification tokens
    await emailVerificationRepository.deleteByUserId(user.id);

    // Generate new verification token
    const verificationToken = this.generateSecureToken();
    const verificationExpiry = new Date(
      Date.now() + (parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '72') * 60 * 60 * 1000)
    );
    await emailVerificationRepository.create(user.id, verificationToken, verificationExpiry);

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(user.email, verificationToken);
    if (!emailResult.success) {
      logger.warn({ 
        email: user.email, 
        error: emailResult.error 
      }, 'Failed to send verification email');
      // Still return success to prevent email enumeration
    }
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const authService = new AuthService();
