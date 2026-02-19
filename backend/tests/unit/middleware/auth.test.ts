import { authenticate, authorize } from '../../../src/middleware/auth';
import { mockRequest, mockResponse, createTestUser } from '../../utils/testHelpers';
import User from '../../../src/models/User';

describe('Auth Middleware', () => {
    describe('authenticate', () => {
        it('should call next() if valid token is provided', async () => {
            const { user, token } = await createTestUser();
            const req = {
                headers: {
                    authorization: `Bearer ${token}`
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user._id.toString()).toBe(user._id.toString());
        });

        it('should return 401 if no token is provided', async () => {
            const req = { headers: {} } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'No token provided'
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if invalid token is provided', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer invalid-token'
                }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('authorize', () => {
        it('should call next() if user has required role', () => {
            const req = {
                user: { role: 'admin' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if user does not have required role', () => {
            const req = {
                user: { role: 'guest' }
            } as any;
            const res = mockResponse();
            const next = jest.fn();

            const middleware = authorize('admin');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Access denied'
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });
});
