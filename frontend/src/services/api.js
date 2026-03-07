import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Using a mock auth token since auth pages aren't the primary focus of the spec
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer test-token-123`;
  return config;
});

export const ReportService = {
  predictHazard: async (formData) => {
    // formData contains: image (File), latitude, longitude
    const response = await api.post('/predict-hazard', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  reportHazard: async (payload) => {
    // payload is JSON containing image_url, hazard_type, severity_score, latitude, longitude, etc.
    const response = await api.post('/report-hazard', payload);
    return response.data;
  },

  getHazards: async (lat, lng, radius = 5000) => {
    const response = await api.get('/hazards', {
      params: { latitude: lat, longitude: lng, radius },
    });
    return response.data;
  },

  getUnverifiedHazards: async (lat, lng, radius = 5000) => {
    const response = await api.get('/hazards', {
      params: { latitude: lat, longitude: lng, radius, status: 'resolved_unverified' },
    });
    return response.data;
  },

  confirmRepair: async (hazardId) => {
    const response = await api.post('/confirm-repair', { hazard_id: hazardId });
    return response.data;
  },

  getHotspots: async () => {
    const response = await api.get('/hazard-hotspots');
    return response.data;
  },

  getLeaderboard: async (city) => {
    const response = await api.get('/leaderboard', {
      params: { city },
    });
    return response.data;
  },
  
  getDashboardSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getWardPerformance: async () => {
    const response = await api.get('/dashboard/ward-performance');
    return response.data;
  }
};

export default api;
