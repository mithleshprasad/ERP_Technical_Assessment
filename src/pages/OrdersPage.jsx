import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../api/orderApi';
import useDebounce from '../hooks/useDebounce';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import OrderRow from '../components/OrderRow';

const LIMIT = 10;
const STATUSES = ['', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debouncedCustomerId = useDebounce(customerId);

  const filters = useMemo(
    () => ({ page, limit: LIMIT, status: status || undefined, customerId: debouncedCustomerId || undefined, startDate: startDate || undefined, endDate: endDate || undefined }),
    [page, status, debouncedCustomerId, startDate, endDate]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    placeholderData: (prev) => prev,
  });

  const rows = data?.data || [];

  const updateAndResetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select className="input" value={status} onChange={(e) => updateAndResetPage(setStatus)(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || 'All'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Customer ID</label>
          <input className="input" value={customerId} onChange={(e) => updateAndResetPage(setCustomerId)(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input type="date" className="input" value={startDate} onChange={(e) => updateAndResetPage(setStartDate)(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input type="date" className="input" value={endDate} onChange={(e) => updateAndResetPage(setEndDate)(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 ${isFetching ? 'opacity-60' : ''}`}>
              {rows.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">
                    No orders found
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
    </div>
  );
}
