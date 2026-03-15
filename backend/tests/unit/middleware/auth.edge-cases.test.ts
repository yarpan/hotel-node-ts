import { authenticate, authorize } from '../../../src/middleware/auth';
import { mockResponse, createTestUser } from '../../utils/testHelpers';
import jwt from 'jsonwebtoken';

describe('Auth Middleware - Edge Cases', () => {
    describe('authenticate - Edge Cases', () => {
        it('should return 401 if authorization header is malformed (no Bearer prefix)', async () => {
            const { token } = await createTestUser();
            const req = {
                headers: {
                    authorization: token // Missing "Bearer " prefix
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is expired', async () => {
            const { user } = await createTestUser();
            
            // Create an expired token
            const expiredToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: '-1h' } // Expired 1 hour ago
            );

            const req = {
                headers: {
                    authorization: `Bearer ${expiredToken}`
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token has invalid signature', async () => {
            const { user } = await createTestUser();
            
            // Create a token with wrong secret
            const invalidToken = jwt.sign(
                { userId: user.id, role: user.role },
                'wrong-secret',
                { expiresIn: '1h' }
            );

            const req = {
                headers: {
                    authorization: `Bearer ${invalidToken}`
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header is empty string', async () => {
            const req = {
                headers: {
                    authorization: ''
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 500 if token payload is missing userId', async () => {
            // Create a token without userId
            const invalidToken = jwt.sign(
                { role: 'guest' }, // Missing userId
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );

            const req = {
                headers: {
                    authorization: `Bearer ${invalidToken}`
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle Bearer token with extra spaces', async () => {
            const { token } = await createTestUser();
            const req = {
                headers: {
                    authorization: `Bearer  ${token}` // Extra space
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            // Should still fail because of malformed format
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user in token does not exist in database', async () => {
            // Create a token for a non-existent user
            const fakeToken = jwt.sign(
                { userId: 999999, role: 'guest' },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );

            const req = {
                headers: {
                    authorization: `Bearer ${fakeToken}`
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });





    });

    describe('authorize - Edge Cases', () => {
        it('should return 401 if req.user is undefined', () => {
            const req = {} as any; // No user property
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if req.user is null', () => {
            const req = { user: null } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 if user role is undefined', () => {
            const req = {
                user: { id: 1 } // No role property
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow staff role when required', () => {
            const req = {
                user: { role: 'staff' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('staff');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject when staff tries to access admin-only route', () => {
            const req = {
                user: { role: 'staff' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow guest role when required', () => {
            const req = {
                user: { role: 'guest' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('guest');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should handle case-sensitive role comparison', () => {
            const req = {
                user: { role: 'Admin' } // Different case
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow access when user role matches one of multiple allowed roles', () => {
            const req = { user: { role: 'staff' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin', 'staff');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 403 when user role matches none of multiple allowed roles', () => {
            const req = { user: { role: 'guest' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin', 'staff');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow admin when admin role is required', () => {
            const req = { user: { role: 'admin' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });


    });
});
