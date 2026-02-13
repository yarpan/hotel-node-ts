import User from '../../../src/models/User';

describe('User Model', () => {
    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'plainPassword123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            await user.save();

            // Password should not be stored in plain text
            expect(user.password).not.toBe('plainPassword123');
            // Password should be a bcrypt hash (starts with $2)
            expect(user.password).toMatch(/^\$2[aby]\$/);
        });

        it('should compare passwords correctly', async () => {
            const user = await User.create({
                email: 'test2@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            // Correct password should match
            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);

            // Wrong password should not match
            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });

        it('should not hash password again if not modified', async () => {
            const user = await User.create({
                email: 'test3@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const originalPassword = user.password;

            // Update non-password field
            user.profile.firstName = 'Updated';
            await user.save();

            // Password hash should remain the same
            expect(user.password).toBe(originalPassword);
        });
    });

    describe('Validation', () => {
        it('should require email', async () => {
            const user = new User({
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require password', async () => {
            const user = new User({
                email: 'test@example.com',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require unique email', async () => {
            await User.create({
                email: 'duplicate@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'First',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const duplicateUser = new User({
                email: 'duplicate@example.com',
                password: 'password456',
                role: 'guest',
                profile: {
                    firstName: 'Second',
                    lastName: 'User',
                    phone: '0987654321'
                }
            });

            await expect(duplicateUser.save()).rejects.toThrow();
        });

        it('should require valid role', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'invalid-role' as any,
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should accept valid roles', async () => {
            const roles: Array<'guest' | 'admin' | 'staff'> = ['guest', 'admin', 'staff'];

            for (const role of roles) {
                const user = await User.create({
                    email: `${role}@example.com`,
                    password: 'password123',
                    role,
                    profile: {
                        firstName: 'Test',
                        lastName: role,
                        phone: '1234567890'
                    }
                });

                expect(user.role).toBe(role);
            }
        });

        it('should require profile firstName', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    lastName: 'User',
                    phone: '1234567890'
                } as any
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require profile lastName', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    phone: '1234567890'
                } as any
            });

            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Timestamps', () => {
        it('should have createdAt and updatedAt timestamps', async () => {
            const user = await User.create({
                email: 'timestamp@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt on modification', async () => {
            const user = await User.create({
                email: 'update@example.com',
                password: 'password123',
                role: 'guest',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '1234567890'
                }
            });

            const originalUpdatedAt = user.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 100));

            user.profile.firstName = 'Updated';
            await user.save();

            expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
});
