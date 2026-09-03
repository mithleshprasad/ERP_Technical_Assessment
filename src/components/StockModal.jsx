import { useState } from 'react';
import Modal from './Modal';

export default function StockModal({ product, onClose, onAddStock, onAdjust, isSubmitting }) {
  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'add') {
      onAddStock({ productId: product.id, quantity: Number(quantity), note });
    } else {
      onAdjust({ productId: product.id, quantityDelta: Number(quantity), note });
    }
  };

  return (
    <Modal title={`Manage Stock - ${product.name}`} onClose={onClose}>
      <div className="flex gap-2 mb-4">
        <button
          className={mode === 'add' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
          onClick={() => setMode('add')}
          type="button"
        >
          Add Stock
        </button>
        <button
          className={mode === 'adjust' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
          onClick={() => setMode('adjust')}
          type="button"
        >
          Adjust
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {mode === 'add' ? 'Quantity to add' : 'Quantity delta (use a negative number to decrease)'}
          </label>
          <input
            className="input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Note (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
