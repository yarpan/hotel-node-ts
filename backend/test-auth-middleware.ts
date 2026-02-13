import { authenticate, authorize } from './src/middleware/auth';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './src/models/User';

// Mock Response
const mockRes = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.body = data;
        return res;
    };
    return res;
};

// Main test function
async function run() {
    console.log('Testing Auth Middleware...');

    // Set up env
    process.env.JWT_SECRET = 'test-secret';

    // 1. Test No Token
    console.log('Test 1: No Token');
    let req: any = { headers: {} };
    let res = mockRes();
    let next = () => console.log('NEXT CALLED');

    await authenticate(req, res, next);
    if (res.statusCode === 401 && res.body.message.includes('No token')) {
        console.log('✅ Passed: No token returned 401');
    } else {
        console.error('❌ Failed: No token', res.statusCode, res.body);
    }

    // 2. Test Invalid Token Format
    console.log('Test 2: Invalid Format');
    req = { headers: { authorization: 'InvalidFormat' } };
    res = mockRes();
    await authenticate(req, res, next);
    if (res.statusCode === 401) {
        console.log('✅ Passed: Invalid format returned 401');
    } else {
        console.error('❌ Failed: Invalid format', res.statusCode);
    }

    // 3. Test Valid Token
    console.log('Test 3: Valid Token (Mocking)');
    // We need to actually have a user in DB or mock User.findById
    // Since this script runs with ts-node, we can't easily mock User.findById without a library or overriding.
    // Instead, we can use valid JWT and assume DB connection fails or we can connect to DB.

    // Let's rely on unit tests for DB interaction logic, here just check basic flow logic if possible.
    // Or we can stub User.findById if we change how we import it? No.

    // Actually, integration tests are better for this.
    // Unit tests with Jest are best.

    console.log('Skipping DB tests in standalone script. Relying on Jest for those.');

    // 4. Test Authorize
    console.log('Test 4: Authorize Role');
    const authMiddleware = authorize('admin');
    req = { user: { role: 'admin' } };
    let nextCalled = false;
    next = () => { nextCalled = true; };

    authMiddleware(req, res, next);
    if (nextCalled) {
        console.log('✅ Passed: Admin role allowed');
    } else {
        console.error('❌ Failed: Admin role should be allowed');
    }

    console.log('Test 5: Authorize Invalid Role');
    req = { user: { role: 'guest' } };
    res = mockRes();
    nextCalled = false;
    next = () => { nextCalled = true; };

    authMiddleware(req, res, next);
    if (!nextCalled && res.statusCode === 403) {
        console.log('✅ Passed: Guest role denied');
    } else {
        console.error('❌ Failed: Guest role should be denied', res.statusCode);
    }
}

run().catch(console.error);
