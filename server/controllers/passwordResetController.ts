import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { emailService } from '../services/emailService';

// Validation rules
export const requestResetValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

export const confirmResetValidation = [
  body('token').isString().notEmpty().withMessage('Token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

/**
 * Request password reset - generates token and sends email
 * POST /api/auth/request-reset
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // SECURITY: Always return success even if user not found (prevent email enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de restablecimiento',
      });
    }

    // Invalidate any existing active tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        used: true,
      },
    });

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email (non-blocking)
    emailService
      .sendPasswordResetEmail(user.name, user.email, resetToken)
      .catch((err) => console.error('Failed to send password reset email:', err));

    res.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace de restablecimiento',
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

/**
 * Confirm password reset - validates token and updates password
 * POST /api/auth/reset-password
 */
export async function confirmPasswordReset(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token expirado. Solicita uno nuevo.' });
    }

    // Check if token was already used
    if (resetToken.used) {
      return res.status(400).json({ error: 'Este token ya fue utilizado' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('Confirm password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * Verify reset token validity (for frontend validation)
 * GET /api/auth/verify-reset-token/:token
 */
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        used: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!resetToken) {
      return res.status(400).json({ valid: false, error: 'Token no encontrado' });
    }

    if (resetToken.used) {
      return res.status(400).json({ valid: false, error: 'Token ya utilizado' });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ valid: false, error: 'Token expirado' });
    }

    res.json({
      valid: true,
      email: resetToken.user.email,
      expiresAt: resetToken.expiresAt,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
}
