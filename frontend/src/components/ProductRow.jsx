import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

function ProductRow({ product, canManage, canDelete, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        <div className="font-medium text-slate-800">{product.name}</div>
      </td>
      <td>
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{product.sku}</span>
      </td>
      <td className="font-medium text-slate-700">{formatCurrency(product.price)}</td>
      <td className="text-slate-400 text-xs">{formatDate(product.createdAt)}</td>
      <td className="text-right">
        <div className="flex justify-end gap-1.5">
          {canManage && (
            <button className="btn-ghost !px-2" title="Edit" onClick={() => onEdit(product)}>
              <Pencil size={15} />
            </button>
          )}
          {canDelete && (
            <button className="btn-ghost !px-2 hover:!bg-red-50 hover:!text-red-600" title="Delete" onClick={() => onDelete(product)}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Re-renders only when this specific product's data or the permission
// flags change - editing one row no longer re-renders the whole table body.
export default memo(ProductRow);
