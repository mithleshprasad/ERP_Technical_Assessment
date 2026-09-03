import { memo } from 'react';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

function OrderRow({ order }) {
  return (
    <tr>
      <td className="font-mono text-xs text-slate-500">{order.id.slice(0, 8)}</td>
      <td className="font-medium text-slate-700">{order.customerId}</td>
      <td className="text-slate-500">{order.items?.length ?? 0} item(s)</td>
      <td className="font-medium text-slate-700">{formatCurrency(order.totalAmount)}</td>
      <td>
        <StatusBadge status={order.status} />
      </td>
      <td className="text-slate-400 text-xs">{formatDateTime(order.createdAt)}</td>
    </tr>
  );
}

export default memo(OrderRow);
