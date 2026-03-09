import { register, login, getCurrentUser } from '../../../src/controllers/auth.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse } from '../../utils/testHelpers';
import bcrypt from 'bcryptjs';

describe('Auth Controller - Edge Cases', () => {
    describe('register - Edge Cases', () => {
        it('should successfully register with email containing whitespace', async () => {
            const userData = {
                email: '  whitespace@example.com  ',
                password: 'password123',
                profile: {
                    firstName: 'White',
                    lastName: 'Space',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should successfully register with uppercase email', async () => {
            const userData = {
                email: 'UPPERCASE@EXAMPLE.COM',
                password: 'password123',
                profile: {
                    firstName: 'Upper',
                    lastName: 'Case',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should successfully register with any email format (validation at Prisma level)', async () => {
            const userData = {
                email: 'anyformat@example.com',
                password: 'password123',
                profile: {
                    firstName: 'Any',
                    lastName: 'Format',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should successfully register with any password length (validation at Prisma level)', async () => {
            const userData = {
                email: 'anypass@example.com',
                password: '12345',
                profile: {
                    firstName: 'Any',
                    lastName: 'Pass',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should hash password before storing', async () => {
            const password = 'password123';
            const userData = {
                email: 'hash@example.com',
                password,
                profile: {
                    firstName: 'Hash',
                    lastName: 'Test',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);

            const user = await prisma.user.findUnique({ where: { email: 'hash@example.com' } });
            expect(user?.password).not.toBe(password);
            expect(user?.password.length).toBeGreaterThan(password.length);
        });

        it('should not include password in response', async () => {
            const userData = {
                email: 'nopass@example.com',
                password: 'password123',
                profile: {
                    firstName: 'No',
                    lastName: 'Pass',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.password).toBeUndefined();
        });

        it('should return JWT token on successful registration', async () => {
            const userData = {
                email: 'token@example.com',
                password: 'password123',
                profile: {
                    firstName: 'Token',
                    lastName: 'Test',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.token).toBeDefined();
            expect(typeof call.data.token).toBe('string');
            expect(call.data.token.length).toBeGreaterThan(0);
        });

        it('should default role to guest', async () => {
            const userData = {
                email: 'defaultrole@example.com',
                password: 'password123',
                profile: {
                    firstName: 'Default',
                    lastName: 'Role',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.role).toBe('guest');
        });

        it('should return 500 for missing profile fields', async () => {
            const userData = {
                email: 'missing@example.com',
                password: 'password123',
                profile: {}
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle special characters in name', async () => {
            const userData = {
                email: 'special@example.com',
                password: 'password123',
                profile: {
                    firstName: "O'Brien",
                    lastName: 'Smith-Jones',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.profile.firstName).toBe("O'Brien");
            expect(call.data.user.profile.lastName).toBe('Smith-Jones');
        });
    });

    describe('login - Edge Cases', () => {
        it('should fail login with different case email (case-sensitive)', async () => {
            const password = 'password123';
            await prisma.user.create({
                data: {
                    email: 'case@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'guest',
                    firstName: 'Case',
                    lastName: 'Test',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: 'CASE@EXAMPLE.COM', password });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should fail login with whitespace in email', async () => {
            const password = 'password123';
            await prisma.user.create({
                data: {
                    email: 'trim@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'guest',
                    firstName: 'Trim',
                    lastName: 'Test',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: '  trim@example.com  ', password });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 for empty email', async () => {
            const req = mockRequest({ email: '', password: 'password123' });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for empty password', async () => {
            const req = mockRequest({ email: 'test@example.com', password: '' });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for missing email', async () => {
            const req = mockRequest({ password: 'password123' });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for missing password', async () => {
            const req = mockRequest({ email: 'test@example.com' });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should not reveal whether email exists', async () => {
            const req1 = mockRequest({ email: 'nonexistent@example.com', password: 'password123' });
            const res1 = mockResponse();
            await login(req1, res1);

            const password = 'password123';
            await prisma.user.create({
                data: {
                    email: 'exists@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'guest',
                    firstName: 'Exists',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const req2 = mockRequest({ email: 'exists@example.com', password: 'wrongpassword' });
            const res2 = mockResponse();
            await login(req2, res2);

            expect(res1.status).toHaveBeenCalledWith(401);
            expect(res2.status).toHaveBeenCalledWith(401);

            const call1 = (res1.json as jest.Mock).mock.calls[0][0];
            const call2 = (res2.json as jest.Mock).mock.calls[0][0];
            expect(call1.message).toBe(call2.message);
        });

        it('should return valid JWT token on successful login', async () => {
            const password = 'password123';
            const user = await prisma.user.create({
                data: {
                    email: 'jwt@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'guest',
                    firstName: 'JWT',
                    lastName: 'Test',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: user.email, password });
            const res = mockResponse();

            await login(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.token).toBeDefined();
            expect(typeof call.data.token).toBe('string');
        });

        it('should not include password in login response', async () => {
            const password = 'password123';
            const user = await prisma.user.create({
                data: {
                    email: 'nopassresponse@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'guest',
                    firstName: 'No',
                    lastName: 'Pass',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: user.email, password });
            const res = mockResponse();

            await login(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.password).toBeUndefined();
        });

        it('should allow admin login', async () => {
            const password = 'adminpass';
            const admin = await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'admin',
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: admin.email, password });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.role).toBe('admin');
        });

        it('should allow staff login', async () => {
            const password = 'staffpass';
            const staff = await prisma.user.create({
                data: {
                    email: 'staff@example.com',
                    password: await bcrypt.hash(password, 10),
                    role: 'staff',
                    firstName: 'Staff',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: staff.email, password });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.role).toBe('staff');
        });
    });

    describe('getCurrentUser - Edge Cases', () => {
        it('should return complete user profile', async () => {
            const user = await prisma.user.create({
                data: {
                    email: 'complete@example.com',
                    password: 'password123',
                    role: 'guest',
                    firstName: 'Complete',
                    lastName: 'User',
                    phone: '1234567890',
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    country: 'USA',
                    zipCode: '10001'
                }
            });

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getCurrentUser(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.email).toBe('complete@example.com');
            expect(call.data.user.profile.firstName).toBe('Complete');
            expect(call.data.user.profile.lastName).toBe('User');
            expect(call.data.user.profile.phone).toBe('1234567890');
            expect(call.data.user.profile.address.street).toBe('123 Main St');
            expect(call.data.user.profile.address.city).toBe('New York');
            expect(call.data.user.profile.address.state).toBe('NY');
            expect(call.data.user.profile.address.country).toBe('USA');
            expect(call.data.user.profile.address.zipCode).toBe('10001');
        });

        it('should not include password in response', async () => {
            const user = await prisma.user.create({
                data: {
                    email: 'secureuser@example.com',
                    password: 'password123',
                    role: 'guest',
                    firstName: 'Secure',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getCurrentUser(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.password).toBeUndefined();
        });

        it('should return 401 when user object is null', async () => {
            const req = mockRequest({}, {}, null);
            const res = mockResponse();

            await getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 when user object is undefined', async () => {
            const req = mockRequest({}, {}, undefined);
            const res = mockResponse();

            await getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should handle user with partial address information', async () => {
            const user = await prisma.user.create({
                data: {
                    email: 'partial@example.com',
                    password: 'password123',
                    role: 'guest',
                    firstName: 'Partial',
                    lastName: 'Address',
                    phone: '1234567890',
                    city: 'Boston'
                }
            });

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getCurrentUser(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.profile.address.city).toBe('Boston');
            expect(call.data.user.profile.address.street).toBeNull();
        });

        it('should return user with admin role', async () => {
            const user = await prisma.user.create({
                data: {
                    email: 'adminuser@example.com',
                    password: 'password123',
                    role: 'admin',
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getCurrentUser(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.user.role).toBe('admin');
        });
    });
});
