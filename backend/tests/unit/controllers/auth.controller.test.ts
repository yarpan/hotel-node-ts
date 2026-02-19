import { register, login, getCurrentUser } from '../../../src/controllers/auth.controller';
import User from '../../../src/models/User';
import { mockRequest, mockResponse } from '../../utils/testHelpers';

describe('Auth Controller', () => {
    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'password123',
                profile: {
                    firstName: 'New',
                    lastName: 'User',
                    phone: '1234567890'
                }
            };

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                message: 'User registered successfully',
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        email: userData.email,
                        role: 'guest'
                    }),
                    token: expect.any(String)
                })
            }));

            // Verify user was actually created in DB
            const userInDb = await User.findOne({ email: userData.email });
            expect(userInDb).toBeDefined();
            expect(userInDb?.profile.firstName).toBe(userData.profile.firstName);
        });

        it('should return 409 if user already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                profile: {
                    firstName: 'Existing',
                    lastName: 'User',
                    phone: '1234567890'
                }
            };

            // Pre-create user
            await User.create({
                ...userData,
                role: 'guest'
            });

            const req = mockRequest(userData);
            const res = mockResponse();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'User with this email already exists'
            }));
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            const password = 'password123';
            const user = await User.create({
                email: 'login@example.com',
                password,
                role: 'guest',
                profile: {
                    firstName: 'Login',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: user.email, password });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    token: expect.any(String)
                })
            }));
        });

        it('should return 401 for invalid password', async () => {
            const user = await User.create({
                email: 'wrongpass@example.com',
                password: 'correctpassword',
                role: 'guest',
                profile: {
                    firstName: 'Wrong',
                    lastName: 'Pass',
                    phone: '1234567890'
                }
            });

            const req = mockRequest({ email: user.email, password: 'wrongpassword' });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Invalid email or password'
            }));
        });

        it('should return 401 for non-existent user', async () => {
            const req = mockRequest({ email: 'nonexistent@example.com', password: 'password123' });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('getCurrentUser', () => {
        it('should return user data if authenticated', async () => {
            const user = await User.create({
                email: 'me@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Me',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            // Mocking AuthRequest behavior where req.user is populated by middleware
            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        email: user.email
                    })
                })
            }));
        });

        it('should return 401 if req.user is missing', async () => {
            const req = mockRequest({}, {}, null);
            const res = mockResponse();

            await getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});
