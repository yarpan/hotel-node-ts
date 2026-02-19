import api from './api';
import type { ApiResponse, Booking, CreateBookingData } from '../types';

const bookingService = {
  async getBookings() {
    const { data } = await api.get<ApiResponse<{ bookings: Booking[] }>>('/bookings');
    return data;
  },

  async getBookingById(id: string) {
    const { data } = await api.get<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`);
    return data;
  },

  async createBooking(bookingData: CreateBookingData) {
    const { data } = await api.post<ApiResponse<{ booking: Booking }>>('/bookings', bookingData);
    return data;
  },

  async updateBooking(id: string, bookingData: Partial<CreateBookingData>) {
    const { data } = await api.put<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`, bookingData);
    return data;
  },

  async cancelBooking(id: string) {
    const { data } = await api.delete<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`);
    return data;
  },
};

export default bookingService;
