import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const rideAPI = {
  requestRide: (data) => API.post('/rides', data),
  getAvailable: () => API.get('/rides/available'),
  getMyRides: () => API.get('/rides/my'),
  getActiveRide: () => API.get('/rides/active'),
  acceptRide: (id) => API.put(`/rides/${id}/accept`),
  updateStatus: (id, data) => API.put(`/rides/${id}/status`, data),
  cancelRide: (id, data) => API.put(`/rides/${id}/cancel`, data),
  getAnalytics: () => API.get('/rides/analytics'),
};

export const driverAPI = {
  toggleOnline: () => API.put('/drivers/toggle-online'),
  updateLocation: (data) => API.put('/drivers/location', data),
  getOnlineDrivers: () => API.get('/drivers/online'),
  getStats: () => API.get('/drivers/stats'),
};

export const ratingAPI = {
  submit: (data) => API.post('/ratings', data),
  getDriverRatings: (id) => API.get(`/ratings/driver/${id}`),
};

export default API;
