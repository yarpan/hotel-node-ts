import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, AuthRequest } from '../../../src/middleware/auth';
import User from '../../../src/models/User';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/models/User');

describe('Auth Middleware', () => {
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'test-secret';
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should return 401 if no token provided', async () => {
            await authenticate(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'No token provided. Please authenticate.'
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token format is invalid (no Bearer)', async () => {
            req.headers = { authorization: 'InvalidToken' };

            await authenticate(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'No token provided. Please authenticate.'
            }));
        });

        it('should call next if token is valid and user exists', async () => {
            req.headers = { authorization: 'Bearer valid-token' };
            const mockUser = { _id: 'user123', role: 'guest' };

            (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
            (User.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            await authenticate(req as AuthRequest, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if user not found', async () => {
            req.headers = { authorization: 'Bearer valid-token' };

            (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
            (User.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await authenticate(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid token. User not found.'
            }));
        });

        it('should return 401 if token is expired', async () => {
            req.headers = { authorization: 'Bearer expired-token' };

            const error = new Error('jwt expired');
            error.name = 'TokenExpiredError';
            (jwt.verify as jest.Mock).mockImplementation(() => { throw error; });

            await authenticate(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Token has expired.'
            }));
        });

        it('should return 401 if token is invalid', async () => {
            req.headers = { authorization: 'Bearer invalid-token' };

            const error = new Error('invalid token');
            error.name = 'JsonWebTokenError';
            (jwt.verify as jest.Mock).mockImplementation(() => { throw error; });

            await authenticate(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid token.'
            }));
        });
    });

    describe('authorize', () => {
        it('should call next if user has required role', () => {
            req.user = { role: 'admin' } as any;
            const middleware = authorize('admin');

            middleware(req as AuthRequest, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should call next if user has one of allowed roles', () => {
            req.user = { role: 'staff' } as any;
            const middleware = authorize('admin', 'staff');

            middleware(req as AuthRequest, res as Response, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if user does not have required role', () => {
            req.user = { role: 'guest' } as any;
            const middleware = authorize('admin', 'staff');

            middleware(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'You do not have permission to access this resource.'
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not attached to request', () => {
            req.user = undefined;
            const middleware = authorize('admin');

            middleware(req as AuthRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Authentication required.'
            }));
        });
    });
});
