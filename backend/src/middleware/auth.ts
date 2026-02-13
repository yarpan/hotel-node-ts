import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
    user?: IUser;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'error',
                message: 'No token provided. Please authenticate.',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: string };

        // Find user
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid token. User not found.',
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                status: 'error',
                message: 'Invalid token.',
            });
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                status: 'error',
                message: 'Token has expired.',
            });
            return;
        }

        res.status(500).json({
            status: 'error',
            message: 'Authentication failed.',
        });
    }
};

// Authorization middleware for role-based access
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required.',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                status: 'error',
                message: 'You do not have permission to access this resource.',
            });
            return;
        }

        next();
    };
};
