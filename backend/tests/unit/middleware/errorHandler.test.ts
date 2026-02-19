import { errorHandler } from '../../../src/middleware/errorHandler';
import { mockRequest, mockResponse } from '../../utils/testHelpers';

describe('Error Handler Middleware', () => {
    it('should handle general errors and return 500', () => {
        const err = new Error('Something went wrong');
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 'error',
            message: 'Something went wrong'
        }));
    });

    it('should handle specific status codes if provided in error', () => {
        const err: any = new Error('Not Found');
        err.statusCode = 404;
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Not Found'
        }));
    });
});
