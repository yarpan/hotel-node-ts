import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(mongoURI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        // Do not exit process, let the caller handle it
        throw error;
    }
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
