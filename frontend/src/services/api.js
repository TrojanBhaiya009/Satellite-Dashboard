import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile')
}

export const datasetAPI = {
  create: (data) => api.post('/datasets', data),
  list: () => api.get('/datasets'),
  get: (id) => api.get(`/datasets/${id}`),
  update: (id, data) => api.put(`/datasets/${id}`, data),
  delete: (id) => api.delete(`/datasets/${id}`),
  search: (params) => api.get('/datasets/search', { params })
}

export const analysisAPI = {
  create: (data) => api.post('/analysis', data),
  list: () => api.get('/analysis'),
  get: (id) => api.get(`/analysis/${id}`),
  delete: (id) => api.delete(`/analysis/${id}`),
  getByDataset: (datasetId) => api.get(`/analysis/dataset/${datasetId}`)
}

export default api
