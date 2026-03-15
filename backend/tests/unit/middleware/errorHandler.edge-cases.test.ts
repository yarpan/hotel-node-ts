import { errorHandler } from '../../../src/middleware/errorHandler';
import { mockRequest, mockResponse } from '../../utils/testHelpers';

describe('Error Handler Middleware - Edge Cases', () => {
    it('should handle errors with custom status codes', () => {
        const statusCodes = [400, 401, 403, 404, 409, 422, 500, 503];

        statusCodes.forEach(statusCode => {
            const err: any = new Error(`Error with status ${statusCode}`);
            err.statusCode = statusCode;
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(statusCode);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: `Error with status ${statusCode}`
            }));
        });
    });

    it('should handle errors without message property', () => {
        const err: any = { statusCode: 500 }; // No message
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalled();
    });

    it('should handle null error object', () => {
        const err: any = null;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle undefined error object', () => {
        const err: any = undefined;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors with additional properties', () => {
        const err: any = new Error('Validation error');
        err.statusCode = 400;
        err.errors = [
            { field: 'email', message: 'Invalid email' },
            { field: 'password', message: 'Too short' }
        ];
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 'error',
            message: 'Validation error'
        }));
    });

    it('should handle string errors', () => {
        const err: any = 'String error message';
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors with stack trace', () => {
        const err = new Error('Error with stack');
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(err.stack).toBeDefined();
    });

    it('should handle database errors (Prisma P2002 - unique constraint)', () => {
        const err: any = new Error('Unique constraint failed');
        err.code = 'P2002';
        err.statusCode = 409;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should handle database errors (Prisma P2025 - record not found)', () => {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        err.statusCode = 404;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle JWT errors', () => {
        const err: any = new Error('JsonWebTokenError');
        err.name = 'JsonWebTokenError';
        err.statusCode = 401;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle token expired errors', () => {
        const err: any = new Error('TokenExpiredError');
        err.name = 'TokenExpiredError';
        err.statusCode = 401;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should not call next() after handling error', () => {
        const err = new Error('Test error');
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors with very long messages', () => {
        const longMessage = 'A'.repeat(1000);
        const err = new Error(longMessage);
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: longMessage
        }));
    });

    it('should handle errors with special characters in message', () => {
        const specialMessage = 'Error: <script>alert("xss")</script>';
        const err = new Error(specialMessage);
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: specialMessage
        }));
    });
});
