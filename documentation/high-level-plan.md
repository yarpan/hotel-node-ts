# Hotel Management System - High-Level Plan

## Project Overview

A comprehensive hotel management system with separate interfaces for guests and administrators, built with modern web technologies.

### Technology Stack

- **Backend**: Node.js + TypeScript
- **Frontend**: React + TypeScript
- **Database**: MongoDB
- **Unit Testing**: Jest
- **API & E2E Testing**: Playwright

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                           │
├──────────────┬──────────────────┬─────────────────────────┤
│  Landing     │  Guest Cabinet   │   Admin Cabinet          │
│  (Public)    │  (Authenticated) │   (Authenticated+Role)   │
└──────────────┴──────────────────┴──────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / REST API                   │
│              (Express.js + TypeScript)                       │
├─────────────────────────────────────────────────────────────┤
│  Auth  │  Rooms  │  Bookings  │  Guests  │  Admin  │  etc  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│         (Services, Controllers, Middleware)                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│              (MongoDB + Mongoose ODM)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
hotel-node-ts/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files (DB, env, etc.)
│   │   ├── models/           # MongoDB models (User, Room, Booking, etc.)
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Helper functions
│   │   ├── types/            # TypeScript type definitions
│   │   └── server.ts         # Entry point
│   ├── tests/
│   │   ├── unit/             # Jest unit tests
│   │   ├── integration/      # Jest integration tests
│   │   └── fixtures/         # Test data
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── common/       # Shared components
│   │   │   ├── guest/        # Guest-specific components
│   │   │   └── admin/        # Admin-specific components
│   │   ├── pages/
│   │   │   ├── Landing/      # Public landing page
│   │   │   ├── GuestCabinet/ # Guest dashboard & features
│   │   │   └── AdminCabinet/ # Admin dashboard & features
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API calls
│   │   ├── context/          # React Context (Auth, Theme, etc.)
│   │   ├── utils/            # Helper functions
│   │   ├── types/            # TypeScript interfaces
│   │   ├── styles/           # Global styles
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── tests/
│   ├── e2e/                  # Playwright E2E tests
│   │   ├── guest-flows/      # Guest user journeys
│   │   ├── admin-flows/      # Admin user journeys
│   │   └── landing/          # Landing page tests
│   ├── api/                  # Playwright API tests
│   └── playwright.config.ts
│
├── documentation/
│   ├── high-level-plan.md    # This file
│   ├── api-specification.md  # API endpoints documentation
│   ├── database-schema.md    # MongoDB collections & relationships
│   ├── user-stories.md       # Feature requirements
│   └── deployment.md         # Deployment instructions
│
├── .env.example
├── .gitignore
├── package.json              # Root workspace config
└── README.md
```

---

## Core Features

### 1. Landing Page (Public)

**Purpose**: Marketing website for the hotel

**Features**:
- Overview of hotel amenities and services
- Photo gallery
- Room types showcase with pricing
- Contact information
- Quick booking search (redirects to guest area)
- Responsive design
- SEO optimized

### 2. Guest Cabinet (Authenticated)

**Purpose**: Guest self-service portal

**Features**:

#### Authentication & Profile
- Guest registration/login
- Profile management (personal info, contact details)
- Password reset functionality

#### Booking Management
- Search for available rooms (by dates, room type, capacity)
- View room details, photos, amenities
- Make new bookings
- View current and past bookings
- Cancel/modify bookings (within policy limits)
- Download booking confirmations

#### Services
- Request additional services (room service, late checkout, etc.)
- View invoices and payment history
- Leave reviews for completed stays

### 3. Admin Cabinet (Authenticated + Admin Role)

**Purpose**: Hotel staff management interface

**Features**:

#### Dashboard
- Overview of current occupancy
- Upcoming check-ins/check-outs
- Revenue statistics
- Key metrics and KPIs

#### Room Management
- Add/edit/delete rooms
- Set room availability
- Manage room types, pricing
- Upload room photos
- Set amenities per room

#### Booking Management
- View all bookings (current, upcoming, past)
- Manual booking creation
- Modify/cancel bookings
- Check-in/check-out guests
- Handle booking conflicts

#### Guest Management
- View all registered guests
- Search and filter guests
- View guest history
- Manage guest profiles

#### Reporting
- Revenue reports
- Occupancy reports
- Guest analytics
- Export data (CSV, PDF)

#### Settings
- Hotel information
- Pricing rules
- Policies (cancellation, etc.)
- User/staff management
- System configuration

---

## Data Models

### User
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  role: 'guest' | 'admin' | 'staff',
  profile: {
    firstName: string,
    lastName: string,
    phone: string,
    address: object
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Room
```typescript
{
  _id: ObjectId,
  roomNumber: string (unique),
  type: string (e.g., 'single', 'double', 'suite'),
  capacity: number,
  pricePerNight: number,
  amenities: string[],
  photos: string[],
  description: string,
  status: 'available' | 'occupied' | 'maintenance',
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```typescript
{
  _id: ObjectId,
  guestId: ObjectId (ref: User),
  roomId: ObjectId (ref: Room),
  checkInDate: Date,
  checkOutDate: Date,
  numberOfGuests: number,
  totalPrice: number,
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled',
  specialRequests: string,
  paymentStatus: 'pending' | 'paid' | 'refunded',
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```typescript
{
  _id: ObjectId,
  guestId: ObjectId (ref: User),
  roomId: ObjectId (ref: Room),
  bookingId: ObjectId (ref: Booking),
  rating: number (1-5),
  comment: string,
  createdAt: Date
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new guest
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Rooms
- `GET /api/rooms` - List all rooms (with filters)
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms/search` - Search available rooms
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:id` - Update room (admin)
- `DELETE /api/rooms/:id` - Delete room (admin)

### Bookings
- `GET /api/bookings` - List bookings (guest: own, admin: all)
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/check-in` - Check in (admin)
- `POST /api/bookings/:id/check-out` - Check out (admin)

### Guests (Admin only)
- `GET /api/guests` - List all guests
- `GET /api/guests/:id` - Get guest details
- `PUT /api/guests/:id` - Update guest
- `GET /api/guests/:id/bookings` - Get guest booking history

### Reviews
- `GET /api/reviews` - List reviews
- `GET /api/reviews/room/:roomId` - Get reviews for a room
- `POST /api/reviews` - Create review
- `DELETE /api/reviews/:id` - Delete review (admin)

### Admin/Reports
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/reports/revenue` - Revenue report
- `GET /api/admin/reports/occupancy` - Occupancy report

---

## Testing Strategy

### Unit Tests (Jest)

**Coverage Areas**:
- Service layer business logic
- Utility functions
- Model validation
- Middleware functions
- Data transformations

**Example Tests**:
- `auth.service.test.ts` - User authentication logic
- `booking.service.test.ts` - Booking calculations, availability checks
- `validators.test.ts` - Input validation functions

### Integration Tests (Jest + Supertest)

**Coverage Areas**:
- API endpoints
- Database operations
- Authentication flow
- Authorization middleware

**Example Tests**:
- `auth.integration.test.ts` - Complete auth flow
- `booking.integration.test.ts` - Booking CRUD operations
- `room.integration.test.ts` - Room management

### API Tests (Playwright)

**Coverage Areas**:
- API contract testing
- Response validation
- Error handling
- Edge cases

**Example Tests**:
- API response schemas
- Rate limiting
- Authentication/authorization
- Pagination

### E2E Tests (Playwright)

**Coverage Areas**:
- User workflows
- UI interactions
- Cross-browser testing

**Example Scenarios**:
- **Guest Flow**: Register → Search rooms → Book → View booking → Cancel
- **Admin Flow**: Login → View dashboard → Create room → Manage booking
- **Landing Flow**: Browse → View rooms → Navigate to registration

---

## Development Phases

### Phase 1: Foundation & Setup (Week 1)
- [ ] Project structure setup
- [ ] Development environment configuration
- [ ] Database setup and connection
- [ ] Base TypeScript configurations
- [ ] Basic Express server
- [ ] Authentication system (JWT)
- [ ] Basic testing setup

### Phase 2: Backend Core (Week 2-3)
- [ ] User model and authentication APIs
- [ ] Room model and CRUD APIs
- [ ] Booking model and CRUD APIs
- [ ] Validation middleware
- [ ] Error handling middleware
- [ ] Unit tests for services
- [ ] Integration tests for APIs

### Phase 3: Frontend Foundation (Week 4)
- [ ] React project setup with Vite
- [ ] Routing setup (React Router)
- [ ] Authentication context and hooks
- [ ] API service layer
- [ ] Common UI components
- [ ] Theme and styling setup

### Phase 4: Landing Page (Week 5)
- [ ] Homepage design and implementation
- [ ] Room showcase
- [ ] Contact section
- [ ] Responsive design
- [ ] SEO optimization

### Phase 5: Guest Cabinet (Week 6-7)
- [ ] Login/registration pages
- [ ] Profile management
- [ ] Room search and browsing
- [ ] Booking flow
- [ ] Booking management
- [ ] E2E tests for guest flows

### Phase 6: Admin Cabinet (Week 8-9)
- [ ] Admin dashboard
- [ ] Room management interface
- [ ] Booking management interface
- [ ] Guest management interface
- [ ] Reports and analytics
- [ ] E2E tests for admin flows

### Phase 7: Testing & Polish (Week 10)
- [ ] Comprehensive test coverage
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation completion
- [ ] Bug fixes

### Phase 8: Deployment (Week 11)
- [ ] Production environment setup
- [ ] CI/CD pipeline
- [ ] Deployment to hosting
- [ ] Monitoring setup

---

## Technology Decisions

### Backend

**Framework**: Express.js
- Industry standard for Node.js APIs
- Extensive middleware ecosystem
- TypeScript support

**Database**: MongoDB + Mongoose
- Flexible schema for varying room types
- Good performance for read-heavy operations
- Easy to scale

**Authentication**: JWT + bcrypt
- Stateless authentication
- Secure password hashing
- Refresh token support

**Validation**: Joi or Zod
- Schema-based validation
- TypeScript integration
- Clear error messages

### Frontend

**Framework**: React
- Component-based architecture
- Large ecosystem
- Excellent TypeScript support

**Build Tool**: Vite
- Fast development server
- Optimized production builds
- Modern tooling

**Routing**: React Router v6
- Standard routing solution
- Type-safe routes
- Nested routing support

**State Management**: React Context + Hooks
- Built-in solution
- No additional dependencies for simple state
- (Consider Redux Toolkit if complexity grows)

**UI Framework**: Material-UI or custom CSS
- Professional components
- Accessibility built-in
- Customizable theming

**API Client**: Axios
- Interceptors for auth tokens
- Better error handling
- TypeScript support

### Testing

**Unit/Integration**: Jest + Supertest
- Standard testing framework
- Great TypeScript support
- Built-in mocking

**E2E/API**: Playwright
- Modern testing tool
- Cross-browser support
- API testing capabilities
- Excellent documentation

---

## Security Considerations

- [ ] Password hashing (bcrypt)
- [ ] JWT token management with refresh tokens
- [ ] Input validation and sanitization
- [ ] SQL/NoSQL injection prevention
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Helmet.js for HTTP headers
- [ ] Environment variable protection
- [ ] Role-based access control (RBAC)
- [ ] Secure session management
- [ ] HTTPS enforcement in production
- [ ] Data encryption at rest

---

## Performance Considerations

- [ ] Database indexing (email, roomNumber, dates)
- [ ] Query optimization
- [ ] Caching strategy (Redis for sessions/frequently accessed data)
- [ ] Image optimization and CDN for photos
- [ ] API response pagination
- [ ] Lazy loading for frontend
- [ ] Code splitting
- [ ] Bundle size optimization

---

## Deployment Strategy

### Development (Local)
- Local MongoDB instance (or MongoDB Atlas free tier)
- Local Node.js server
- Vite dev server

### Production (Free Hosting)

**Database**: MongoDB Atlas Free Tier
- 512MB storage
- Shared cluster
- Automatic backups included
- Free forever

**Backend**: Render Free Tier
- Automatic deploys from Git
- HTTPS included
- Environment variables support
- Sleeps after 15 min of inactivity (acceptable for demo/portfolio)
- Alternative: Railway free tier

**Frontend**: Vercel Free Tier
- Automatic deploys from Git
- Global CDN included
- HTTPS included
- Custom domain support
- Unlimited bandwidth for personal projects
- Alternative: Netlify free tier

**Total Cost**: $0/month

> [!NOTE]
> Free tier limitations:
> - Backend may sleep after inactivity (first request takes ~30s to wake)
> - MongoDB limited to 512MB storage (~10,000 bookings)
> - Suitable for portfolio, demo, and small-scale use

---

## Next Steps

1. **Review and approve this high-level plan**
2. **Create detailed API specification**
3. **Define database schema with relationships**
4. **Write user stories for each feature**
5. **Set up project repositories and structure**
6. **Begin Phase 1 implementation**

---

## Success Metrics

- [ ] All core features implemented and working
- [ ] 80%+ test coverage (unit + integration)
- [ ] All critical user flows covered by E2E tests
- [ ] API response time < 200ms (95th percentile)
- [ ] Zero critical security vulnerabilities
- [ ] Responsive design works on all device sizes
- [ ] Accessibility standards met (WCAG 2.1 Level AA)
