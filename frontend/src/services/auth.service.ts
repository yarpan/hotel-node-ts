import api from './api';
import type { ApiResponse, AuthResponse, LoginCredentials, RegisterData, User } from '../types';

const authService = {
  async login(credentials: LoginCredentials) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return data;
  },

  async register(registerData: RegisterData) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', registerData);
    return data;
  },

  async getMe() {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return data;
  },
};

export default authService;
