import axiosClient from './axiosClient';

export const fetchInventory = (productId) =>
  axiosClient.get(`/inventory/${productId}`).then((r) => r.data.data);

export const addStock = (payload) => axiosClient.post('/inventory/add-stock', payload).then((r) => r.data.data);

export const adjustStock = (payload) => axiosClient.post('/inventory/adjust', payload).then((r) => r.data.data);
