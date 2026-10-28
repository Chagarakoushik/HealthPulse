import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    if (error.response) {
      if (error.response.data) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.errors)) {
          message = error.response.data.errors.join(' | ');
        } else if (error.response.data.message) {
          message = error.response.data.message;
        }
      }
    } else if (error.request) {
      message = 'Unable to connect to the backend server. Is FastAPI running on port 8000?';
    } else {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // System Health
  getHealth: () => apiClient.get('/health'),

  // Aggregate Metrics
  getStats: () => apiClient.get('/stats'),

  // Patients CRUD
  getPatients: (params = {}) => apiClient.get('/patients', { params }),
  getPatient: (id) => apiClient.get(`/patients/${id}`),
  createPatient: (data) => apiClient.post('/patients', data),
  updatePatient: (id, data) => apiClient.put(`/patients/${id}`, data),
  deletePatient: (id) => apiClient.delete(`/patients/${id}`),

  // Groq AI Regeneration
  regenerateRemarks: (id) => apiClient.post(`/patients/${id}/regenerate-remarks`),

  // Seeding
  seedPatients: (reset = true) => apiClient.post(`/patients/seed`, null, { params: { reset } }),
};

export default api;
