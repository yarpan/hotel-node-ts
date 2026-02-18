import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hotel Management API',
            version: '1.0.0',
            description: 'API documentation for the Hotel Management System',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['guest', 'staff', 'admin'] },
                        profile: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                            },
                        },
                    },
                },
                Room: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        roomNumber: { type: 'string' },
                        type: { type: 'string', enum: ['single', 'double', 'suite', 'deluxe'] },
                        pricePerNight: { type: 'number' },
                        capacity: { type: 'number' },
                        status: { type: 'string', enum: ['available', 'booked', 'maintenance'] },
                    },
                },
                Booking: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        guestId: { type: 'string' },
                        roomId: { type: 'string' },
                        checkInDate: { type: 'string', format: 'date-time' },
                        checkOutDate: { type: 'string', format: 'date-time' },
                        totalPrice: { type: 'number' },
                        status: { type: 'string', enum: ['confirmed', 'checked-in', 'checked-out', 'cancelled'] },
                    },
                },
            },
        },
    },
    // Use absolute path so it works regardless of CWD
    apis: [path.join(__dirname, '..', 'routes', '*.ts')],
};

export const specs = swaggerJsdoc(options);
