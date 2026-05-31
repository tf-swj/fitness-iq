import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fiq_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const signUp = (data) => api.post('/auth/signup', data);
export const signIn = (data) => api.post('/auth/signin', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

// Workouts
export const logWorkout = (data) => api.post('/workouts', data);
export const getSessions = () => api.get('/workouts/sessions');
export const getExercises = () => api.get('/workouts/exercises');
export const getExerciseHistory = (name) => api.get(`/workouts/history/${encodeURIComponent(name)}`);
export const getEngineStats = () => api.get('/workouts/engine');
export const getDailyBrief = () => api.get('/workouts/daily-brief');
export const runAnalysis = () => api.post('/workouts/analyze');

// Schedule
export const getSchedule = () => api.get('/schedule');
export const saveScheduleDay = (dayIndex, data) => api.put(`/schedule/${dayIndex}`, data);
export const deleteScheduleDay = (dayIndex) => api.delete(`/schedule/${dayIndex}`);

// Streaming chat — returns a ReadableStream
export async function sendChatMessage(messages) {
  const token = localStorage.getItem('fiq_token');
  const res = await fetch('/api/workouts/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });
  return res;
}
