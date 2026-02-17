import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Swagger UI to work freely or configure it propertly
    crossOriginEmbedderPolicy: false
})); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
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

// Database connection and server start
const startServer = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
    }

    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`🔗 API available at http://localhost:${PORT}`);
        console.log(`📖 Swagger UI available at http://localhost:${PORT}/api-docs`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();

export default app;
