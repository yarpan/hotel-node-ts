import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from './src/models/User';

async function run() {
    console.log('Starting MongoDB Memory Server...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('MongoDB Memory Server started at:', uri);

    console.log('Connecting to mongoose...');
    await mongoose.connect(uri);
    console.log('Connected to mongoose');

    console.log('Creating user...');
    const user = new User({
        email: 'standalone@test.com',
        password: 'password123',
        role: 'guest',
        profile: {
            firstName: 'Standalone',
            lastName: 'Test',
            phone: '1234567890'
        }
    });

    await user.save();
    console.log('User saved:', user._id);

    const foundUser = await User.findOne({ email: 'standalone@test.com' });
    console.log('User found:', foundUser?.email);

    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Finished');
}

run().catch(console.error);
