import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fiq_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const signUp = (data) => api.post('/auth/signup', data);
export const signIn = (data) => api.post('/auth/signin', data);
export const verifyEmail = (token) => api.get(`/auth/verify/${token}`);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

// Workouts
export const logWorkout = (data) => api.post('/workouts', data);
export const getSessions = () => api.get('/workouts/sessions');
export const getExercises = () => api.get('/workouts/exercises');
export const getExerciseHistory = (name) => api.get(`/workouts/history/${encodeURIComponent(name)}`);
export const getEngineStats = () => api.get('/workouts/engine');
export const runAnalysis = () => api.post('/workouts/analyze');
