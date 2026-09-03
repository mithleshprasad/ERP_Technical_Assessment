import axiosClient from './axiosClient';

export const fetchOrders = ({ page = 1, limit = 20, status, customerId, startDate, endDate }) =>
  axiosClient
    .get('/orders', { params: { page, limit, status, customerId, startDate, endDate } })
    .then((r) => r.data);

export const fetchOrder = (id) => axiosClient.get(`/orders/${id}`).then((r) => r.data.data);

export const createOrder = (payload) => axiosClient.post('/orders', payload).then((r) => r.data.data);
