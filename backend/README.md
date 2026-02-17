# Hotel Management Backend

Node.js + TypeScript + Express backend for the Hotel Management System.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (database, etc.)
│   ├── models/         # Mongoose models
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript type definitions
│   └── server.ts       # Entry point
├── .env                # Environment variables
├── tsconfig.json       # TypeScript configuration
├── jest.config.js      # Jest configuration
└── package.json
```

## Features

- ✅ Authentication & Authorization (JWT)
- ✅ User Management (Guests, Admin, Staff)
- ✅ Room Management
- ✅ Booking System with availability checking
- ✅ Role-based access control
- ✅ MongoDB with Mongoose ODM
- ✅ TypeScript for type safety
- ✅ Error handling middleware

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your database connection string
   - Update `JWT_SECRET` with a secure secret key

3. Start development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new guest
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/search` - Search available rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room (admin only)
- `PUT /api/rooms/:id` - Update room (admin only)
- `DELETE /api/rooms/:id` - Delete room (admin only)

### Bookings
- `GET /api/bookings` - List bookings (own bookings for guests, all for admin)
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/check-in` - Check in guest (admin only)
- `POST /api/bookings/:id/check-out` - Check out guest (admin only)

### Guests (Admin only)
- `GET /api/guests` - List all guests
- `GET /api/guests/:id` - Get guest details
- `PUT /api/guests/:id` - Update guest
- `GET /api/guests/:id/bookings` - Get guest booking history

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Technologies

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- ✅ Validation: express-validator
- ✅ Security: helmet, cors, express-rate-limit
- ✅ API Documentation: Swagger UI
- ✅ Testing: Jest, Supertest

## Documentation

API documentation is available via Swagger UI when the server is running.

- **URL**: `http://localhost:5000/api-docs`
- **Features**: Interactive testing of all API endpoints, detailed schema definitions.

Note: The server is configured to serve documentation even if MongoDB is not connected (though endpoints will return errors).

## License

ISC
