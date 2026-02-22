import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prismaClient';
import { AuthRequest } from '../middleware/auth';

// Generate JWT token
const generateToken = (userId: number): string => {
    const jwtSecret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign({ userId }, jwtSecret, { expiresIn } as any);
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📝 Registration attempt:', req.body.email);
        const { email, password, profile } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({
                status: 'error',
                message: 'User with this email already exists',
            });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                street: profile.address?.street,
                city: profile.address?.city,
                state: profile.address?.state,
                country: profile.address?.country,
                zipCode: profile.address?.zipCode,
                role: 'guest',
            },
        });

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    profile: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        address: {
                            street: user.street,
                            city: user.city,
                            state: user.state,
                            country: user.country,
                            zipCode: user.zipCode,
                        }
                    },
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to register user',
        });
    }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                status: 'error',
                message: 'Please provide email and password',
            });
            return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
            return;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
            return;
        }

        // Generate token
        const token = generateToken(user.id);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    profile: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        address: {
                            street: user.street,
                            city: user.city,
                            state: user.state,
                            country: user.country,
                            zipCode: user.zipCode,
                        }
                    },
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to login',
        });
    }
};

// Get current user
export const getCurrentUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Not authenticated',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role,
                    profile: {
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        phone: req.user.phone,
                        address: {
                            street: req.user.street,
                            city: req.user.city,
                            state: req.user.state,
                            country: req.user.country,
                            zipCode: req.user.zipCode,
                        }
                    },
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get user',
        });
    }
};
