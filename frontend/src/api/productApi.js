import axiosClient from './axiosClient';

export const fetchProducts = ({ page = 1, limit = 20, search = '' }) =>
  axiosClient.get('/products', { params: { page, limit, search } }).then((r) => r.data);

export const fetchProduct = (id) => axiosClient.get(`/products/${id}`).then((r) => r.data.data);

export const createProduct = (payload) => axiosClient.post('/products', payload).then((r) => r.data.data);

export const updateProduct = ({ id, ...payload }) =>
  axiosClient.put(`/products/${id}`, payload).then((r) => r.data.data);

export const deleteProduct = (id) => axiosClient.delete(`/products/${id}`);

export const importProducts = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosClient
    .post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.data);
};
