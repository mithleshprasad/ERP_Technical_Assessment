import { memo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

  return (
    <tr>
      <td className="font-medium text-slate-700">{product.name}</td>
      <td className="text-slate-500">{product.sku}</td>
      <td>
        {isLoading ? (
          <span className="text-slate-400">...</span>
        ) : (
          <span className={data?.totalAvailable > 0 ? 'text-slate-700' : 'text-red-600 font-semibold'}>
            {data?.totalAvailable ?? 0}
          </span>
        )}
      </td>
      <td>{data?.totalReserved ?? 0}</td>
      <td className="text-right">
        {canManage && (
          <button className="btn-secondary" onClick={() => onManage(product)}>
            Manage Stock
          </button>
        )}
      </td>
    </tr>
  );
}

export default memo(InventoryRow);
