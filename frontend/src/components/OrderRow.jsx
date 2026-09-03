import { memo } from 'react';
import StatusBadge from './StatusBadge';

function OrderRow({ order }) {
  return (
    <tr>
      <td className="font-mono text-xs text-slate-500">{order.id.slice(0, 8)}</td>
      <td>{order.customerId}</td>
      <td>{order.items?.length ?? 0} item(s)</td>
      <td>${Number(order.totalAmount).toFixed(2)}</td>
      <td>
        <StatusBadge status={order.status} />
      </td>
      <td className="text-slate-400 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
    </tr>
  );
}

export default memo(OrderRow);
