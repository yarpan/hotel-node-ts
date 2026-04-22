import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import bookingRoutes from './routes/booking.routes';
import guestRoutes from './routes/guest.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0'; // Explicitly bind to all interfaces

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP so Swagger UI inline scripts work
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     tags: [Ops]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:    { type: string, example: success }
 *                 message:   { type: string }
 *                 timestamp: { type: string, format: date-time }
 */
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Hotel Management API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/guests', guestRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

import prisma from './utils/prismaClient';

// --- Server startup ---
const startServer = async () => {
    // 1. Try connecting to PostgreSQL via Prisma
    try {
        await prisma.$connect();
        console.log('🐘 Connected to PostgreSQL via Prisma');
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error);
        console.warn('⚠️  Server will start, but database operations may fail.');
    }

    // 2. Start the HTTP server
    const server = app.listen(PORT, HOST, () => {
        console.log('');
        console.log(`✅ Server is running on http://${HOST}:${PORT}`);
        console.log(`🔗 API:         http://localhost:${PORT}`);
        console.log(`📖 Swagger UI:  http://localhost:${PORT}/api-docs`);
        console.log(`❤️  Health:      http://localhost:${PORT}/health`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('');
    });

    // 3. Handle port-in-use and other server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`\n❌ Port ${PORT} is already in use.`);
            console.error('   Fix: Close the other process or change PORT in .env\n');
        } else {
            console.error('❌ Server error:', error);
        }
        process.exit(1);
    });
};

// --- Global error safety nets ---
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

startServer();

export default app;
