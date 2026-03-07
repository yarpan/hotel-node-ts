import { asyncHandler } from '../../../src/utils/asyncHandler';
import { Request, Response, NextFunction } from 'express';

describe('AsyncHandler Utility', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });

    it('should call the wrapped async function successfully', async () => {
        const asyncFn = jest.fn().mockResolvedValue('success');
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors and pass them to next middleware', async () => {
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors thrown in async function', async () => {
        const error = new Error('Synchronous error');
        const asyncFn = jest.fn().mockImplementation(async () => {
            throw error;
        });
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should preserve the original function behavior', async () => {
        const mockData = { id: 1, name: 'Test' };
        const asyncFn = jest.fn(async (_req: Request, res: Response) => {
            res.status(200).json(mockData);
            return mockData;
        });
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle custom error objects with status codes', async () => {
        const customError: any = new Error('Not found');
        customError.statusCode = 404;
        
        const asyncFn = jest.fn().mockRejectedValue(customError);
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(customError);
        expect((mockNext as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
    });

    it('should work with controller functions that modify response', async () => {
        const asyncFn = async (_req: Request, res: Response) => {
            res.status(200).json({ message: 'Success' });
        };
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple sequential calls independently', async () => {
        const asyncFn1 = jest.fn().mockResolvedValue('result1');
        const asyncFn2 = jest.fn().mockRejectedValue(new Error('error2'));
        
        const wrappedFn1 = asyncHandler(asyncFn1);
        const wrappedFn2 = asyncHandler(asyncFn2);

        await wrappedFn1(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).not.toHaveBeenCalled();

        mockNext = jest.fn(); // Reset for second call
        await wrappedFn2(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle async functions with no return value', async () => {
        const asyncFn = jest.fn().mockResolvedValue(undefined);
        const wrappedFn = asyncHandler(asyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass all arguments to the wrapped function', async () => {
        const asyncFn = jest.fn().mockResolvedValue('success');
        const wrappedFn = asyncHandler(asyncFn);

        mockReq.params = { id: '123' };
        mockReq.body = { name: 'Test' };

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalledWith(
            expect.objectContaining({
                params: { id: '123' },
                body: { name: 'Test' }
            }),
            mockRes,
            mockNext
        );
    });
});
