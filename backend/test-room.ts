import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Room from './src/models/Room';

async function run() {
    console.log('Starting MongoDB Memory Server...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
    console.log('Connected to mongoose');

    try {
        console.log('Test 1: Create valid room');
        const room = await Room.create({
            roomNumber: '101',
            type: 'single',
            capacity: 2,
            pricePerNight: 100,
            amenities: ['WiFi', 'TV', 'AC'],
            description: 'Cozy single room with city view',
            status: 'available'
        });
        console.log('✅ Room created:', room.roomNumber);
    } catch (error) {
        console.error('❌ Test 1 failed:', error);
    }

    try {
        console.log('Test 2: Create duplicate room');
        await Room.create({
            roomNumber: '202',
            type: 'single',
            capacity: 2,
            pricePerNight: 100,
            description: 'First room'
        });

        await Room.create({
            roomNumber: '202', // Duplicate
            type: 'double',
            capacity: 4,
            pricePerNight: 150,
            description: 'Second room'
        });
        console.error('❌ Test 2 failed: Duplicate room should have thrown error');
    } catch (error: any) {
        if (error.code === 11000) {
            console.log('✅ Test 2 passed: Duplicate room threw error 11000');
        } else {
            console.error('❌ Test 2 failed with unexpected error:', error);
        }
    }

    try {
        console.log('Test 3: Invalid status');
        await Room.create({
            roomNumber: '210',
            type: 'single',
            capacity: 2,
            pricePerNight: 100,
            description: 'Test room',
            status: 'invalid-status' as any
        });
        console.error('❌ Test 3 failed: Invalid status should have thrown error');
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            console.log('✅ Test 3 passed: Invalid status threw ValidationError');
        } else {
            console.error('❌ Test 3 failed with unexpected error:', error);
        }
    }

    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Finished');
}

run().catch(console.error);
