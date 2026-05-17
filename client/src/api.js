import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const logWorkout = (data) => api.post('/workouts', data);
export const getSessions = () => api.get('/workouts/sessions');
export const getExercises = () => api.get('/workouts/exercises');
export const getExerciseHistory = (name) => api.get(`/workouts/history/${encodeURIComponent(name)}`);
export const getEngineStats = () => api.get('/workouts/engine');
export const runAnalysis = () => api.post('/workouts/analyze');
