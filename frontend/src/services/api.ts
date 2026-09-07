import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resqroute_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Graceful Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'Network error. Backend service may be offline.',
      status: error.response?.status || 500,
    };
    console.warn('⚡ [API Interceptor] Gracefully caught API error:', customError);
    return Promise.reject(customError);
  }
);

// API Service Contracts
export const emergencyApi = {
  triggerSOS: (data: {
    latitude: number;
    longitude: number;
    address?: string;
    emergencyType?: string;
    priority?: string;
    patientName?: string;
    patientPhone?: string;
  }) => api.post('/emergency/sos', data),

  getDetails: (id: string) => api.get(`/emergency/${id}`),
  getActive: () => api.get('/emergency/active'),
  updateStatus: (id: string, status: string) => api.patch(`/emergency/${id}/status`, { status }),
};

export const ambulanceApi = {
  getAll: () => api.get('/ambulances'),
  updateLocation: (id: string, latitude: number, longitude: number, status?: string) =>
    api.patch(`/ambulances/${id}/location`, { latitude, longitude, status }),
};

export const hospitalApi = {
  getAll: () => api.get('/hospitals'),
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/hospitals/alerts/${alertId}`, { status, notes }),
};

export const trafficApi = {
  getSignals: () => api.get('/traffic/signals'),
  updateSignal: (id: string, status: string) => api.patch(`/traffic/signals/${id}`, { status }),
};

export const simulationApi = {
  triggerAccident: (data?: any) => api.post('/simulation/trigger-accident', data || {}),
  reset: () => api.post('/simulation/reset'),
};
