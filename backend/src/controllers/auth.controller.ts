import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthController {
  public async signup(req: Request, res: Response) {
    try {
      const { businessName, category, name, email, password } = req.body;

      if (!businessName || !name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create business and user in a transaction
      const { business, user } = await prisma.$transaction(async (tx: any) => {
        const biz = await tx.business.create({
          data: {
            name: businessName,
            category: category || 'General',
            phone: '',
            address: '',
            chat_limit: 100, // Default plan limit
          },
        });

        const usr = await tx.user.create({
          data: {
            business_id: biz.id,
            name,
            email,
            password_hash: passwordHash,
            role: 'ADMIN',
          },
        });

        return { business: biz, user: usr };
      });

      // Generate JWT Token
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
      const token = jwt.sign(
        { 
          userId: user.id, 
          businessId: business.id, 
          role: user.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({ 
        success: true, 
        businessId: business.id, 
        userId: user.id,
        token,
        role: user.role
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  public async changePassword(req: Request, res: Response) {
    try {
      const { email, currentPassword, newPassword } = req.body;

      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid current password' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password_hash: newPasswordHash },
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error('Change password error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { business: true }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT Token
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
      const token = jwt.sign(
        { 
          userId: user.id, 
          businessId: user.business_id, 
          role: user.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      console.log(`[Auth] User logged in: ${user.email} (Business: ${user.business?.name})`);
      
      res.json({ 
        success: true, 
        businessId: user.business_id,
        token,
        role: user.role
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export const authController = new AuthController();
