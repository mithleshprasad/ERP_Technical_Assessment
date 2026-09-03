import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Plus, Trash2, User } from 'lucide-react';
import { fetchProducts } from '../api/productApi';
import { createOrder } from '../api/orderApi';
import { formatCurrency } from '../utils/format';

function emptyItem() {
  return { key: crypto.randomUUID(), productId: '', quantity: 1 };
}

const RECENT_CUSTOMERS_KEY = 'erp_recent_customers';

function loadRecentCustomers() {
  try {
    const raw = localStorage.getItem(RECENT_CUSTOMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentCustomer(customerId) {
  try {
    const existing = loadRecentCustomers().filter((c) => c !== customerId);
    const next = [customerId, ...existing].slice(0, 8);
    localStorage.setItem(RECENT_CUSTOMERS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadRecentCustomers();
  }
}

export default function CreateOrderPage() {
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [lastOrder, setLastOrder] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState(loadRecentCustomers);

  // Cached for 5 minutes: the product picker doesn't need to refetch on
  // every keystroke elsewhere in the app.
  const { data: productData } = useQuery({
    queryKey: ['products', 1, '', 'picker'],
    queryFn: () => fetchProducts({ page: 1, limit: 100 }),
    staleTime: 5 * 60_000,
  });
  const products = useMemo(() => productData?.data || [], [productData]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      toast.success('Order placed successfully');
      setLastOrder(order);
      setRecentCustomers(saveRecentCustomer(order.customerId));
      setCustomerId('');
      setItems([emptyItem()]);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Order failed');
    },
  });

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (key) => setItems((prev) => prev.filter((it) => it.key !== key));

  const total = items.reduce((sum, it) => {
    const product = productMap.get(it.productId);
    return sum + (product ? Number(product.price) * Number(it.quantity || 0) : 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      customerId,
      items: items
        .filter((it) => it.productId && Number(it.quantity) > 0)
        .map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
    };
    if (payload.items.length === 0) {
      toast.error('Add at least one valid line item');
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">New Sales Order</h1>
      <p className="text-sm text-slate-500 mb-6">Reserve stock and create an order in one step.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Customer</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g. Rahul Kumar, a phone number, or a code like CUST-1001"
              list="recent-customers"
              required
            />
            <datalist id="recent-customers">
              {recentCustomers.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            There's no customer registration here - type anything that identifies this customer;
            it's just stored on the order.
          </p>
          {recentCustomers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {recentCustomers.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCustomerId(c)}
                  className="badge bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="label !mb-0">Line items</label>
          {items.map((item) => (
            <div key={item.key} className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <select
                className="input flex-1"
                value={item.productId}
                onChange={(e) => updateItem(item.key, 'productId', e.target.value)}
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - {formatCurrency(p.price)}
                  </option>
                ))}
              </select>
              <input
                className="input w-20 text-center"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                required
              />
              <button
                type="button"
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                onClick={() => removeRow(item.key)}
                disabled={items.length === 1}
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn-secondary" onClick={addRow}>
          <Plus size={15} /> Add line item
        </button>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-sm text-slate-500">Estimated total</span>
          <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>

        <button type="submit" className="btn-primary w-full !py-2.5" disabled={mutation.isPending}>
          {mutation.isPending ? 'Placing order...' : 'Place Order'}
        </button>
      </form>

      {lastOrder && (
        <div className="card p-5 mt-4 border-emerald-200 bg-emerald-50/60 flex gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-emerald-800 mb-1">Order confirmed</h2>
            <p className="text-sm text-emerald-900/80">
              Order <span className="font-mono">{lastOrder.id}</span> - total{' '}
              <span className="font-semibold">{formatCurrency(lastOrder.totalAmount)}</span> - status{' '}
              {lastOrder.status}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
