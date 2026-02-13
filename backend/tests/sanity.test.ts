import mongoose from 'mongoose';
import User from '../src/models/User';

describe('Sanity Check', () => {
    it('should be able to connect and write to DB', async () => {
        const user = new User({
            email: 'sanity@test.com',
            password: 'password123',
            role: 'guest',
            profile: {
                firstName: 'Sanity',
                lastName: 'Check',
                phone: '1234567890'
            }
        });

        await user.save();

        const savedUser = await User.findOne({ email: 'sanity@test.com' });
        expect(savedUser).toBeDefined();
        expect(savedUser?.email).toBe('sanity@test.com');
    });
});
