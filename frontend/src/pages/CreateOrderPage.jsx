import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchProducts } from '../api/productApi';
import { createOrder } from '../api/orderApi';

function emptyItem() {
  return { key: crypto.randomUUID(), productId: '', quantity: 1 };
}

export default function CreateOrderPage() {
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [lastOrder, setLastOrder] = useState(null);

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
      <h1 className="text-2xl font-bold mb-4">New Sales Order</h1>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer ID</label>
          <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                <select
                  className="input"
                  value={item.productId}
                  onChange={(e) => updateItem(item.key, 'productId', e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - ${Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                  required
                />
              </div>
              <button type="button" className="btn-secondary" onClick={() => removeRow(item.key)} disabled={items.length === 1}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn-secondary" onClick={addRow}>
          + Add line item
        </button>

        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-slate-500">Estimated total</span>
          <span className="text-lg font-semibold">${total.toFixed(2)}</span>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Placing order...' : 'Place Order'}
        </button>
      </form>

      {lastOrder && (
        <div className="card p-5 mt-4 border-green-200 bg-green-50">
          <h2 className="font-semibold text-green-700 mb-1">Order confirmed</h2>
          <p className="text-sm text-slate-600">
            Order <span className="font-mono">{lastOrder.id}</span> - total ${Number(lastOrder.totalAmount).toFixed(2)} - status{' '}
            {lastOrder.status}
          </p>
        </div>
      )}
    </div>
  );
}
