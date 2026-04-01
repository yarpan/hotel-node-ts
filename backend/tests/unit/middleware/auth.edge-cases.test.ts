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

        it('should respond with "No token provided. Please authenticate." body for an empty string authorization header', async () => {
            const req = {
                headers: { authorization: '' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'No token provided. Please authenticate.',
            }));
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

        it('should return 401 if authorization header is completely absent', async () => {
            const req = { headers: {} } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'No token provided. Please authenticate.',
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if Bearer prefix is present but token part is empty', async () => {
            const req = {
                headers: { authorization: 'Bearer ' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is a garbage non-JWT string', async () => {
            const req = {
                headers: { authorization: 'Bearer not.a.jwt' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 500 if JWT_SECRET is not defined', async () => {
            const original = process.env.JWT_SECRET;
            delete process.env.JWT_SECRET;

            const req = {
                headers: { authorization: 'Bearer sometoken' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(next).not.toHaveBeenCalled();

            process.env.JWT_SECRET = original;
        });

        it('should attach user to request and call next() on valid token', async () => {
            const { user, token } = await createTestUser('guest');
            const req = {
                headers: { authorization: `Bearer ${token}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.id).toBe(user.id);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should authenticate an admin user and preserve their role on req.user', async () => {
            const { token } = await createTestUser('admin');
            const req = {
                headers: { authorization: `Bearer ${token}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user.role).toBe('admin');
        });

        it('should authenticate a staff user and preserve their role on req.user', async () => {
            const { token } = await createTestUser('staff');
            const req = {
                headers: { authorization: `Bearer ${token}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user.role).toBe('staff');
        });

        it('should return 401 if "bearer" prefix is lowercase', async () => {
            const { token } = await createTestUser();
            const req = {
                headers: { authorization: `bearer ${token}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should respond with "Token has expired." message for expired tokens', async () => {
            const { user } = await createTestUser();
            const expiredToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: '-1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${expiredToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Token has expired.',
            }));
        });

        it('should respond with "Invalid token." message for tampered token signature', async () => {
            const { user } = await createTestUser();
            const invalidToken = jwt.sign(
                { userId: user.id, role: user.role },
                'wrong-secret',
                { expiresIn: '1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${invalidToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Invalid token.',
            }));
        });

        it('should respond with "Invalid token. User not found." when userId in token has no matching DB record', async () => {
            const fakeToken = jwt.sign(
                { userId: 999999, role: 'guest' },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${fakeToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Invalid token. User not found.',
            }));
        });

        it('should return 401 and not set req.user when token contains userId: 0', async () => {
            const zeroIdToken = jwt.sign(
                { userId: 0, role: 'guest' },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${zeroIdToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(req.user).toBeUndefined();
            expect(next).not.toHaveBeenCalled();
        });

        it('should not set req.user when authentication fails due to invalid token', async () => {
            const req = {
                headers: { authorization: 'Bearer not.a.valid.jwt' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(req.user).toBeUndefined();
        });

        it('should return 401 if header uses a tab instead of a space after Bearer', async () => {
            const { token } = await createTestUser();
            const req = {
                headers: { authorization: `Bearer\t${token}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 500 for a not-yet-valid (nbf) token', async () => {
            const { user } = await createTestUser();
            const futureToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET!,
                { notBefore: '1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${futureToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            // NotBeforeError is not handled explicitly, so it falls through to 500
            expect(res.status).toHaveBeenCalledWith(500);
            expect(next).not.toHaveBeenCalled();
        });

        it('should respond with "Authentication failed." body on the generic 500 path', async () => {
            const { user } = await createTestUser();
            const futureToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET!,
                { notBefore: '1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${futureToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Authentication failed.',
            }));
        });

        it('should respond with "Invalid token." body when Bearer is present but the token part is an empty string', async () => {
            const req = {
                headers: { authorization: 'Bearer ' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Invalid token.',
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 for a token containing a negative userId', async () => {
            const negativeIdToken = jwt.sign(
                { userId: -1, role: 'guest' },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );
            const req = {
                headers: { authorization: `Bearer ${negativeIdToken}` }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(req.user).toBeUndefined();
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

        it('should return 403 for any role when empty roles array is provided', () => {
            const req = { user: { role: 'admin' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize(); // No roles specified
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should respond with correct error body on 403', () => {
            const req = { user: { role: 'guest' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'You do not have permission to access this resource.',
            }));
        });

        it('should return 401 with correct body when req.user is missing', () => {
            const req = {} as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Authentication required.',
            }));
        });

        it('should return 403 for a user with an empty string role', () => {
            const req = { user: { role: '' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin', 'staff', 'guest');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next() with no arguments on successful authorization', () => {
            const req = { user: { role: 'admin' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('should allow all three roles when all three are listed', () => {
            const roles = ['guest', 'staff', 'admin'] as const;

            roles.forEach(role => {
                const req = { user: { role } } as any;
                const res = mockResponse();
                const next = jest.fn();

                const middleware = authorize('guest', 'staff', 'admin');
                middleware(req, res, next);

                expect(next).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
            });
        });

        it('should grant access when the allowed list contains duplicate roles', () => {
            const req = { user: { role: 'admin' } } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin', 'admin');
            middleware(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should be stateless — calling the returned middleware twice on different requests works independently', () => {
            const middleware = authorize('staff');

            const allowedReq = { user: { role: 'staff' } } as any;
            const allowedRes = mockResponse();
            const allowedNext = jest.fn();
            middleware(allowedReq, allowedRes, allowedNext);
            expect(allowedNext).toHaveBeenCalled();

            const deniedReq = { user: { role: 'guest' } } as any;
            const deniedRes = mockResponse();
            const deniedNext = jest.fn();
            middleware(deniedReq, deniedRes, deniedNext);
            expect(deniedRes.status).toHaveBeenCalledWith(403);
            expect(deniedNext).not.toHaveBeenCalled();
        });
    });
});
