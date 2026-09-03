import { useState } from 'react';
import { PackagePlus, SlidersHorizontal } from 'lucide-react';
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
      <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-lg">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
            mode === 'add' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setMode('add')}
          type="button"
        >
          <PackagePlus size={15} /> Add Stock
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
            mode === 'adjust' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setMode('adjust')}
          type="button"
        >
          <SlidersHorizontal size={15} /> Adjust
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            {mode === 'add' ? 'Quantity to add' : 'Quantity delta (negative to decrease)'}
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
          <label className="label">Note (optional)</label>
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
