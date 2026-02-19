import api from './api';
import type { ApiResponse, Room, RoomSearchParams } from '../types';

const roomService = {
  async getRooms() {
    const { data } = await api.get<ApiResponse<{ rooms: Room[] }>>('/rooms');
    return data;
  },

  async getRoomById(id: string) {
    const { data } = await api.get<ApiResponse<{ room: Room }>>(`/rooms/${id}`);
    return data;
  },

  async searchRooms(params: RoomSearchParams) {
    const { data } = await api.get<ApiResponse<{ rooms: Room[] }>>('/rooms/search', { params });
    return data;
  },
};

export default roomService;
