import axiosClient from './axiosClient';

export const login = (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data.data);
export const register = (payload) => axiosClient.post('/auth/register', payload).then((r) => r.data.data);
