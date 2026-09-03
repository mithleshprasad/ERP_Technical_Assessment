import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import ProductRow from '../components/ProductRow';
import ProductFormModal from '../components/ProductFormModal';

const LIMIT = 10;

export default function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | product (edit)
  const debouncedSearch = useDebounce(search);

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canDelete = user.role === 'ADMIN';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', page, debouncedSearch],
    queryFn: () => fetchProducts({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: (prev) => prev, // keep showing old page while the next one loads
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success('Product created');
      invalidate();
      setEditing(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      toast.success('Product updated');
      invalidate();
      setEditing(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete product'),
  });

  const handleEdit = useCallback((product) => setEditing(product), []);
  const handleDelete = useCallback(
    (product) => {
      if (window.confirm(`Delete "${product.name}"?`)) deleteMutation.mutate(product.id);
    },
    [deleteMutation]
  );

  const rows = useMemo(() => data?.data || [], [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setEditing({})}>
            + New Product
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 ${isFetching ? 'opacity-60' : ''}`}>
              {rows.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  canManage={canManage}
                  canDelete={canDelete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data?.pagination && (
        <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
      )}

      {editing !== null && (
        <ProductFormModal
          initial={editing.id ? editing : null}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(payload) =>
            editing.id ? updateMutation.mutate({ id: editing.id, ...payload }) : createMutation.mutate(payload)
          }
        />
      )}
    </div>
  );
}
