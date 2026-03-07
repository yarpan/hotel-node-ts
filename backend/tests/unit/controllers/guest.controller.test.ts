import { getAllGuests, getGuestById, updateGuest, getGuestBookings } from '../../../src/controllers/guest.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse, createTestUser, createTestRoom, createTestBooking } from '../../utils/testHelpers';

describe('Guest Controller', () => {
    describe('getAllGuests', () => {
        it('should return all guests successfully', async () => {
            await createTestUser('guest');
            await createTestUser('guest');
            await createTestUser('admin'); // Should not be included

            const req = mockRequest();
            const res = mockResponse();

            await getAllGuests(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: expect.any(Number),
                data: expect.objectContaining({
                    guests: expect.any(Array)
                })
            }));

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.results).toBeGreaterThanOrEqual(2);
            call.data.guests.forEach((guest: any) => {
                expect(guest.role).toBe('guest');
                expect(guest.password).toBeUndefined(); // Password should not be included
            });
        });

        it('should return empty array when no guests exist', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await getAllGuests(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: expect.any(Number),
                data: expect.objectContaining({
                    guests: expect.any(Array)
                })
            }));
        });

        it('should include all required guest fields', async () => {
            await createTestUser('guest');

            const req = mockRequest();
            const res = mockResponse();

            await getAllGuests(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const guest = call.data.guests[0];

            expect(guest).toHaveProperty('id');
            expect(guest).toHaveProperty('email');
            expect(guest).toHaveProperty('role');
            expect(guest).toHaveProperty('firstName');
            expect(guest).toHaveProperty('lastName');
            expect(guest).toHaveProperty('phone');
            expect(guest).toHaveProperty('createdAt');
        });
    });

    describe('getGuestById', () => {
        it('should return a guest by ID successfully', async () => {
            const { user } = await createTestUser('guest');

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    guest: expect.objectContaining({
                        id: user.id,
                        email: user.email,
                        role: 'guest'
                    })
                })
            }));
        });

        it('should return 404 when guest does not exist', async () => {
            const req = mockRequest({}, { id: 999999 });
            const res = mockResponse();

            await getGuestById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Guest not found'
            }));
        });

        it('should return 404 when user exists but is not a guest', async () => {
            const { user } = await createTestUser('admin');

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Guest not found'
            }));
        });

        it('should not include password in response', async () => {
            const { user } = await createTestUser('guest');

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestById(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.guest.password).toBeUndefined();
        });
    });

    describe('updateGuest', () => {
        it('should update guest profile successfully', async () => {
            const { user } = await createTestUser('guest');

            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                phone: '9876543210',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    country: 'USA',
                    zipCode: '10001'
                }
            };

            const req = mockRequest(updateData, { id: user.id });
            const res = mockResponse();

            await updateGuest(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                message: 'Guest updated successfully',
                data: expect.objectContaining({
                    guest: expect.objectContaining({
                        id: user.id,
                        firstName: 'Updated',
                        lastName: 'Name',
                        phone: '9876543210',
                        street: '123 Main St',
                        city: 'New York',
                        state: 'NY',
                        country: 'USA',
                        zipCode: '10001'
                    })
                })
            }));

            // Verify the update persisted in the database
            const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
            expect(updatedUser?.firstName).toBe('Updated');
            expect(updatedUser?.lastName).toBe('Name');
            expect(updatedUser?.city).toBe('New York');
        });

        it('should update guest with partial data', async () => {
            const { user } = await createTestUser('guest');

            const updateData = {
                firstName: 'PartialUpdate'
            };

            const req = mockRequest(updateData, { id: user.id });
            const res = mockResponse();

            await updateGuest(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    guest: expect.objectContaining({
                        firstName: 'PartialUpdate'
                    })
                })
            }));
        });

        it('should return 404 when updating non-existent guest', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            const req = mockRequest(updateData, { id: 999999 });
            const res = mockResponse();

            await updateGuest(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                message: 'Guest not found'
            }));
        });

        it('should handle address updates correctly', async () => {
            const { user } = await createTestUser('guest');

            const updateData = {
                firstName: 'Test',
                lastName: 'User',
                phone: '1234567890',
                address: {
                    street: '456 Oak Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    country: 'USA',
                    zipCode: '90001'
                }
            };

            const req = mockRequest(updateData, { id: user.id });
            const res = mockResponse();

            await updateGuest(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.guest.street).toBe('456 Oak Ave');
            expect(call.data.guest.city).toBe('Los Angeles');
            expect(call.data.guest.state).toBe('CA');
        });
    });

    describe('getGuestBookings', () => {
        it('should return all bookings for a guest', async () => {
            const { user } = await createTestUser('guest');
            const room1 = await createTestRoom();
            const room2 = await createTestRoom();

            await createTestBooking(user.id, room1.id);
            await createTestBooking(user.id, room2.id);

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: 2,
                data: expect.objectContaining({
                    bookings: expect.any(Array)
                })
            }));

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.bookings).toHaveLength(2);
        });

        it('should include room details in booking response', async () => {
            const { user } = await createTestUser('guest');
            const room = await createTestRoom({ roomNumber: '101', type: 'suite', pricePerNight: 250 });

            await createTestBooking(user.id, room.id);

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestBookings(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const booking = call.data.bookings[0];

            expect(booking.room).toBeDefined();
            expect(booking.room.roomNumber).toBe('101');
            expect(booking.room.type).toBe('suite');
            expect(booking.room.pricePerNight).toBe(250);
        });

        it('should return empty array when guest has no bookings', async () => {
            const { user } = await createTestUser('guest');

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: 0,
                data: expect.objectContaining({
                    bookings: []
                })
            }));
        });

        it('should return bookings in descending order by creation date', async () => {
            const { user } = await createTestUser('guest');
            const room = await createTestRoom();

            await createTestBooking(user.id, room.id);
            await new Promise(resolve => setTimeout(resolve, 100)); // Ensure different timestamps
            await createTestBooking(user.id, room.id);

            const req = mockRequest({}, { id: user.id });
            const res = mockResponse();

            await getGuestBookings(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const bookings = call.data.bookings;

            expect(bookings.length).toBeGreaterThanOrEqual(2);
            // Most recent booking should be first
            expect(new Date(bookings[0].createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(bookings[1].createdAt).getTime()
            );
        });

        it('should only return bookings for the specified guest', async () => {
            const { user: guest1 } = await createTestUser('guest');
            const { user: guest2 } = await createTestUser('guest');
            const room = await createTestRoom();

            await createTestBooking(guest1.id, room.id);
            await createTestBooking(guest2.id, room.id);

            const req = mockRequest({}, { id: guest1.id });
            const res = mockResponse();

            await getGuestBookings(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.bookings).toHaveLength(1);
            expect(call.data.bookings[0].guestId).toBe(guest1.id);
        });
    });
});
