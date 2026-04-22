import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const errorResponse = {
    description: '',
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
        },
    },
};

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
            { url: 'http://localhost:5000', description: 'Development' },
            { url: 'https://api.example.com', description: 'Production (placeholder)' },
        ],
        tags: [
            { name: 'Auth',     description: 'Registration, login, current user' },
            { name: 'Rooms',    description: 'Room catalog and admin CRUD' },
            { name: 'Bookings', description: 'Booking lifecycle' },
            { name: 'Guests',   description: 'Guest management (admin/staff)' },
            { name: 'Ops',      description: 'Operational endpoints (health, etc.)' },
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
                Error: {
                    type: 'object',
                    properties: {
                        status:  { type: 'string', example: 'error' },
                        message: { type: 'string' },
                    },
                },
                SuccessEnvelope: {
                    type: 'object',
                    properties: {
                        status:  { type: 'string', example: 'success' },
                        message: { type: 'string' },
                        data:    { type: 'object' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id:    { type: 'integer', example: 1 },
                        email: { type: 'string', format: 'email' },
                        role:  { type: 'string', enum: ['guest', 'staff', 'admin'] },
                        profile: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string' },
                                lastName:  { type: 'string' },
                                phone:     { type: 'string' },
                                address: {
                                    type: 'object',
                                    properties: {
                                        street:  { type: 'string', nullable: true },
                                        city:    { type: 'string', nullable: true },
                                        state:   { type: 'string', nullable: true },
                                        country: { type: 'string', nullable: true },
                                        zipCode: { type: 'string', nullable: true },
                                    },
                                },
                            },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Room: {
                    type: 'object',
                    properties: {
                        id:            { type: 'integer' },
                        roomNumber:    { type: 'string' },
                        type:          { type: 'string', enum: ['single', 'double', 'suite', 'deluxe', 'presidential'] },
                        capacity:      { type: 'integer' },
                        pricePerNight: { type: 'number', format: 'float' },
                        amenities:     { type: 'array', items: { type: 'string' } },
                        photos:        { type: 'array', items: { type: 'string' } },
                        description:   { type: 'string' },
                        status:        { type: 'string', enum: ['available', 'occupied', 'maintenance'] },
                        createdAt:     { type: 'string', format: 'date-time' },
                        updatedAt:     { type: 'string', format: 'date-time' },
                    },
                },
                Booking: {
                    type: 'object',
                    properties: {
                        id:              { type: 'integer' },
                        guestId:         { type: 'integer' },
                        roomId:          { type: 'integer' },
                        checkInDate:     { type: 'string', format: 'date-time' },
                        checkOutDate:    { type: 'string', format: 'date-time' },
                        numberOfGuests:  { type: 'integer' },
                        totalPrice:      { type: 'number', format: 'float' },
                        status:          { type: 'string', enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] },
                        specialRequests: { type: 'string', nullable: true },
                        paymentStatus:   { type: 'string', enum: ['pending', 'paid', 'refunded'] },
                        createdAt:       { type: 'string', format: 'date-time' },
                        updatedAt:       { type: 'string', format: 'date-time' },
                    },
                },
            },
            responses: {
                Unauthorized:     { ...errorResponse, description: 'Missing or invalid authentication token' },
                Forbidden:        { ...errorResponse, description: 'Authenticated but not allowed to access this resource' },
                NotFound:         { ...errorResponse, description: 'Resource not found' },
                Conflict:         { ...errorResponse, description: 'Resource conflict (e.g. duplicate or overlap)' },
                ValidationError:  { ...errorResponse, description: 'Invalid request body or query parameters' },
                ServerError:      { ...errorResponse, description: 'Internal server error' },
            },
        },
    },
    apis: [path.join(__dirname, '..', 'routes', '*.ts'), path.join(__dirname, '..', 'server.ts')],
};

export const specs = swaggerJsdoc(options);
