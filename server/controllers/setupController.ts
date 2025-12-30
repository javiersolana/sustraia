import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { UserRole } from '@prisma/client';

/**
 * TEMPORARY SETUP ENDPOINT
 * This endpoint creates the initial admin user
 * Should be removed or disabled after first admin is created
 */
export async function createInitialAdmin(req: Request, res: Response) {
  try {
    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      return res.status(403).json({
        error: 'Admin user already exists. This endpoint is disabled.',
        message: 'Please use the admin panel to create additional users.',
      });
    }

    // Create the first admin
    const hashedPassword = await hashPassword('admin123');

    const admin = await prisma.user.create({
      data: {
        email: 'admin@sustraia.com',
        password: hashedPassword,
        name: 'Admin',
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    res.status(201).json({
      message: 'Initial admin user created successfully',
      user: admin,
      token,
      credentials: {
        email: 'admin@sustraia.com',
        password: 'admin123',
        warning: 'Please change this password immediately!',
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);

    // Handle duplicate email error
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Admin user already exists',
        message: 'Please login with admin@sustraia.com',
      });
    }

    res.status(500).json({
      error: 'Failed to create admin user',
      message: error.message,
    });
  }
}
