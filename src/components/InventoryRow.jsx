import { memo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { fetchInventory } from '../api/inventoryApi';
import { useInventoryUpdates } from '../hooks/useSocket';

function InventoryRow({ product, canManage, onManage }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', product.id],
    queryFn: () => fetchInventory(product.id),
    staleTime: 15_000,
  });

  // Patches this row's cached quantity directly from the WebSocket push -
  // no refetch needed, so a live update costs zero extra network calls.
  const handleUpdate = useCallback(
    (payload) => {
      if (payload.productId !== product.id) return;
      queryClient.setQueryData(['inventory', product.id], (old) =>
        old ? { ...old, totalAvailable: payload.availableQuantity } : old
      );
    },
    [product.id, queryClient]
  );
  useInventoryUpdates(handleUpdate);

  const qty = data?.totalAvailable ?? 0;
  const isLow = qty > 0 && qty <= 5;
  const isOut = qty === 0;

  return (
    <tr>
      <td className="font-medium text-slate-800">{product.name}</td>
      <td>
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{product.sku}</span>
      </td>
      <td>
        {isLoading ? (
          <span className="text-slate-400">...</span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
            <span className={`font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
              {qty}
            </span>
            {isLow && !isOut && <span className="badge bg-amber-50 text-amber-700">Low</span>}
            {isOut && <span className="badge bg-red-50 text-red-700">Out of stock</span>}
          </span>
        )}
      </td>
      <td className="text-slate-500">{data?.totalReserved ?? 0}</td>
      <td className="text-right">
        {canManage && (
          <button className="btn-secondary" onClick={() => onManage(product)}>
            <SlidersHorizontal size={14} /> Manage
          </button>
        )}
      </td>
    </tr>
  );
}

export default memo(InventoryRow);
