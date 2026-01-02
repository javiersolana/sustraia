import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ATLETA' | 'COACH' | 'ADMIN';
  coachId?: string;
  weeklyGoalKm?: number;
  birthDate?: string;
  maxHeartRate?: number;
  restingHR?: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    await AsyncStorage.setItem('auth_token', response.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    return response.data;
  },

  register: async (email: string, password: string, name: string, role: 'ATLETA' | 'COACH'): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', { email, password, name, role });
    await AsyncStorage.setItem('auth_token', response.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('auth_token');
  },
};
