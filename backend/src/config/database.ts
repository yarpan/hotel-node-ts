import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Set a short timeout so the server doesn't hang waiting for MongoDB
    const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000, // Fail fast (5s instead of default 30s)
        socketTimeoutMS: 10000,
        bufferCommands: false, // Disable buffering so operations fail if not connected
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
};

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('📪 MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
    }
});
