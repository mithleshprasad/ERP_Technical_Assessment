import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenCheck } from 'lucide-react';
import { fetchOrder } from '../api/orderApi';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function OrderDetailPage() {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
  });

  if (isLoading) return <Spinner />;
  if (!order) return null;

  const lines = order.journalEntry?.lines || [];
  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

  return (
    <div className="max-w-2xl">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={15} /> Back to orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="card p-5 mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label !mb-1">Customer</p>
          <p className="font-medium text-slate-700">{order.customerId}</p>
        </div>
        <div>
          <p className="label !mb-1">Placed</p>
          <p className="font-medium text-slate-700">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto mb-4">
        <table className="table-base">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-slate-700">{item.product?.name}</td>
                <td className="font-mono text-xs text-slate-500">{item.product?.sku}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td className="font-medium text-slate-700">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right text-slate-500">
                Total
              </td>
              <td className="font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpenCheck size={16} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900 text-sm">Journal Entry</h2>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-slate-400">
            No journal entry was recorded for this order (it likely didn't reach COMPLETED).
          </p>
        ) : (
          <>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="font-medium text-slate-700">{line.account}</td>
                    <td className="text-right">{Number(line.debit) > 0 ? formatCurrency(line.debit) : '—'}</td>
                    <td className="text-right">{Number(line.credit) > 0 ? formatCurrency(line.credit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-3">
              Total debit {formatCurrency(totalDebit)} = total credit {formatCurrency(totalCredit)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
