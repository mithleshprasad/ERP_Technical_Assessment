import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Package, Plus, Search } from 'lucide-react';
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import ProductRow from '../components/ProductRow';
import ProductFormModal from '../components/ProductFormModal';
import EmptyState from '../components/EmptyState';

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.pagination?.total ?? 0} total products</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      <div className="mb-4 relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
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
        ) : rows.length === 0 ? (
          <EmptyState icon={Package} title="No products found" description="Try a different search, or create a new product." />
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
            <tbody className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
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
