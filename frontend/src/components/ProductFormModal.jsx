import { useState } from 'react';
import Modal from './Modal';

export default function ProductFormModal({ initial, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    sku: initial?.sku || '',
    price: initial?.price ?? '',
  });

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, price: Number(form.price) });
  };

  return (
    <Modal title={initial ? 'Edit Product' : 'New Product'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="input" value={form.name} onChange={handleChange('name')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input className="input" value={form.sku} onChange={handleChange('sku')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={handleChange('price')}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
