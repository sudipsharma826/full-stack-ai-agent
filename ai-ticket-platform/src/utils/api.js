import axios from 'axios';
import useUserStore from '../store/useUserStore';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // To send cookies if needed
});

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = useUserStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --------- Auth API ---------
export const authAPI = {
  signup: (userData) => api.post('/api/user/signup', userData),
  login: (credentials) => api.post('/api/user/login', credentials),
  logout: () => api.post('/api/user/logout'),
};

// --------- User API ---------
export const userAPI = {
  updateUser: (userData) =>
    api.put('/api/user/update', userData, { headers: getAuthHeaders() }),

  getAllUsers: () =>
    api.get('/api/user/users', { headers: getAuthHeaders() }),

  getUserByEmail: (email) =>
    api.get(`/api/user/user/${email}`, { headers: getAuthHeaders() }),
};

// --------- Ticket API ---------
export const ticketAPI = {
  createTicket: (ticketData) =>
    api.post('/api/ticket', ticketData, { headers: getAuthHeaders() }),

  getTicketById: (ticketId) =>
    api.get(`/api/ticket/${ticketId}`, { headers: getAuthHeaders() }),

  getAllTickets: () =>
    api.get('/api/ticket', { headers: getAuthHeaders() }),

  updateTicketStatus: (ticketId, status) =>
    api.put(`/api/ticket/${ticketId}/status`, { status }, { headers: getAuthHeaders() }),

  deleteTicket: (ticketId) =>
    api.delete(`/api/ticket/${ticketId}`, { headers: getAuthHeaders() }),
};

export default api;
