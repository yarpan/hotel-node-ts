import { getAllRooms, getRoomById } from '../../../src/controllers/room.controller';
import Room from '../../../src/models/Room';
import { mockRequest, mockResponse, createTestRoom } from '../../utils/testHelpers';

describe('Room Controller', () => {
    describe('getAllRooms', () => {
        it('should return all available rooms by default', async () => {
            await createTestRoom({ status: 'available' });
            await createTestRoom({ status: 'occupied' });

            const req = mockRequest({}, { status: 'available' });
            const res = mockResponse();

            await getAllRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: expect.any(Number)
            }));
        });
    });

    describe('getRoomById', () => {
        it('should return a room if ID is valid', async () => {
            const room = await createTestRoom();
            const req = mockRequest({}, { id: room._id });
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    room: expect.objectContaining({
                        roomNumber: room.roomNumber
                    })
                })
            }));
        });

        it('should return 404 if room is not found', async () => {
            const req = mockRequest({}, { id: '507f1f77bcf86cd799439011' }); // Random BSON ID
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
