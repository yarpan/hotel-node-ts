// ── User & Auth ──────────────────────────────────────────────

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  address?: UserAddress;
}

export type UserRole = 'guest' | 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

// ── Room ─────────────────────────────────────────────────────

export type RoomType = 'single' | 'double' | 'suite' | 'deluxe' | 'presidential';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Room {
  _id: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  photos: string[];
  description: string;
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomSearchParams {
  checkIn?: string;
  checkOut?: string;
  type?: RoomType;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
}

// ── Booking ──────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Booking {
  _id: string;
  guestId: string;
  roomId: string | Room;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingData {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
}

// ── API Response ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: unknown;
}
