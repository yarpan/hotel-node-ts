import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
    statusCode?: number;
    errors?: any;
}

export const errorHandler = (
    err: CustomError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (!err) {
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        return;
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // Prisma Unique constraint failed (e.g., Duplicate email/roomNumber)
    if ((err as any).code === 'P2002') {
        const target = (err as any).meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : 'Field';
        res.status(409).json({
            status: 'error',
            message: `${field} already exists`,
        });
        return;
    }

    // Prisma Record not found (e.g., Updating/Deleting non-existent ID)
    if ((err as any).code === 'P2025') {
        res.status(404).json({
            status: 'error',
            message: 'Resource not found',
        });
        return;
    }

    // Generic error response
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
