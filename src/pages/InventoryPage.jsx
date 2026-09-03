import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchProducts } from '../api/productApi';
import { addStock, adjustStock } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import InventoryRow from '../components/InventoryRow';
import StockModal from '../components/StockModal';

const LIMIT = 10;

export default function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [managing, setManaging] = useState(null);
  const debouncedSearch = useDebounce(search);

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, debouncedSearch],
    queryFn: () => fetchProducts({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: (prev) => prev,
  });

  const invalidateInventory = (productId) =>
    queryClient.invalidateQueries({ queryKey: ['inventory', productId] });

  const addStockMutation = useMutation({
    mutationFn: addStock,
    onSuccess: (_, variables) => {
      toast.success('Stock added');
      invalidateInventory(variables.productId);
      setManaging(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add stock'),
  });

  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: (_, variables) => {
      toast.success('Stock adjusted');
      invalidateInventory(variables.productId);
      setManaging(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to adjust stock'),
  });

  const handleManage = useCallback((product) => setManaging(product), []);
  const rows = useMemo(() => data?.data || [], [data]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      <p className="text-sm text-slate-500 mb-4">
        Quantities update live via WebSocket as orders and stock adjustments happen elsewhere.
      </p>

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
                <th>Available</th>
                <th>Reserved</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((product) => (
                <InventoryRow key={product.id} product={product} canManage={canManage} onManage={handleManage} />
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

      {managing && (
        <StockModal
          product={managing}
          isSubmitting={addStockMutation.isPending || adjustMutation.isPending}
          onClose={() => setManaging(null)}
          onAddStock={(payload) => addStockMutation.mutate(payload)}
          onAdjust={(payload) => adjustMutation.mutate(payload)}
        />
      )}
    </div>
  );
}
