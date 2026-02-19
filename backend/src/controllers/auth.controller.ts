import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Generate JWT token
const generateToken = (userId: string): string => {
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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                status: 'error',
                message: 'User with this email already exists',
            });
            return;
        }

        // Create new user
        const user = await User.create({
            email,
            password,
            profile,
            role: 'guest', // Default role
        });

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
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

        // Find user by email (include password)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
            return;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
            return;
        }

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
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
                    id: req.user._id,
                    email: req.user.email,
                    role: req.user.role,
                    profile: req.user.profile,
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
