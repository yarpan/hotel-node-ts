import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from './src/models/User';
import Room from './src/models/Room';
import Booking from './src/models/Booking';

async function run() {
    console.log('Starting MongoDB...');
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Create dependencies
    const user = await User.create({
        email: 'booking-test@example.com',
        password: 'password123',
        role: 'guest',
        profile: { firstName: 'Test', lastName: 'User', phone: '123' }
    });

    const room = await Room.create({
        roomNumber: '101',
        type: 'single',
        capacity: 2,
        pricePerNight: 100,
        status: 'available',
        description: 'Test Room',
        amenities: []
    });

    try {
        console.log('Test 1: Create valid booking');
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 3);

        const booking = await Booking.create({
            guestId: user._id,
            roomId: room._id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfGuests: 2,
            totalPrice: 200,
            status: 'confirmed'
        });
        console.log('✅ Booking created:', booking._id);
    } catch (error) {
        console.error('❌ Test 1 failed:', error);
    }

    try {
        console.log('Test 2: Invalid dates (Check-out before Check-in)');
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 5);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 2);

        await Booking.create({
            guestId: user._id,
            roomId: room._id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfGuests: 2,
            totalPrice: 200
        });
        console.error('❌ Test 2 failed: Should have thrown error');
    } catch (error: any) {
        console.log('✅ Test 2 passed (Error caught):', error.message);
    }

    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Finished');
}

run().catch(console.error);
