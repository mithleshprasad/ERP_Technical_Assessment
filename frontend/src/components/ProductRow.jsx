import { memo } from 'react';

function ProductRow({ product, canManage, canDelete, onEdit, onDelete }) {
  return (
    <tr>
      <td className="font-medium text-slate-700">{product.name}</td>
      <td className="text-slate-500">{product.sku}</td>
      <td>${Number(product.price).toFixed(2)}</td>
      <td className="text-slate-400 text-xs">{new Date(product.createdAt).toLocaleDateString()}</td>
      <td className="text-right space-x-2">
        {canManage && (
          <button className="btn-secondary" onClick={() => onEdit(product)}>
            Edit
          </button>
        )}
        {canDelete && (
          <button className="btn-danger" onClick={() => onDelete(product)}>
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

// Re-renders only when this specific product's data or the permission
// flags change - editing one row no longer re-renders the whole table body.
export default memo(ProductRow);
